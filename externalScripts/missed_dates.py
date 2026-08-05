#!/usr/bin/env python3
"""检查并补报上次打开程序到本次打开之间漏跑的排歌日期。

工作流逻辑：
1. 本地缓存上次拉取到的排歌日期与歌曲 id；
2. 每次打开程序时只增量获取 last_cached_date 之后到昨天之间的排歌；
3. 对区间内服务器有排歌、status 为 pending、且本地没有对应日期 CSV 的日期，
   视为本地未运行下载；
4. 调用 arrangements.hasPlayed(hasPlayed=false)，将这些日期上报为未播放，
   使服务器把这些歌曲标记为 missed 状态并保留在下一次排歌候选池。
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from has_played import (
    fetch_arrangements_cache_range,
    get_access_token,
    upload_has_played_song_ids,
)


@dataclass
class MissedDate:
    """一个需要补报未播放的排歌日期。"""

    date: str
    song_ids: List[int]


def load_arrangement_cache(cache_path: Union[str, Path]) -> Dict[str, Any]:
    """加载本地排歌缓存；文件不存在或损坏时返回空缓存。"""
    path = Path(cache_path)
    empty: Dict[str, Any] = {
        "last_cached_date": None,
        "arrangements": {},
    }
    if not path.exists():
        return empty
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return empty
        raw_arrangements = data.get("arrangements")
        arrangements: Dict[str, Dict[str, Any]] = {}
        if isinstance(raw_arrangements, dict):
            for date_str, value in raw_arrangements.items():
                if isinstance(value, list):
                    arrangements[str(date_str)] = {
                        "song_ids": value,
                        "unplayed_songs": 0,
                        "status": "pending",
                    }
                elif isinstance(value, dict):
                    arrangements[str(date_str)] = {
                        "song_ids": list(value.get("song_ids") or []),
                        "unplayed_songs": int(value.get("unplayed_songs") or 0),
                        "status": str(value.get("status") or "pending"),
                    }
        last_cached_date = data.get("last_cached_date")
        if last_cached_date:
            try:
                date.fromisoformat(last_cached_date)
            except ValueError:
                last_cached_date = None
        return {
            "last_cached_date": last_cached_date,
            "arrangements": arrangements,
        }
    except (OSError, ValueError, json.JSONDecodeError):
        return empty


def save_arrangement_cache(
    cache_path: Union[str, Path],
    last_cached_date: Optional[str],
    arrangements: Dict[str, Dict[str, Any]],
) -> None:
    """保存本地排歌缓存。"""
    path = Path(cache_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "last_cached_date": last_cached_date,
        "arrangements": arrangements,
    }
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def merge_arrangements(
    base: Dict[str, Dict[str, Any]],
    updates: Dict[str, Dict[str, Any]],
) -> Dict[str, Dict[str, Any]]:
    """合并排歌缓存，updates 中的日期覆盖 base。"""
    merged = dict(base)
    merged.update(updates)
    return merged


def local_arrangement_csv_path(
    csv_output_dir: Union[str, Path], date_str: str
) -> Path:
    """返回某日排歌 CSV 的本地路径。"""
    return Path(csv_output_dir) / "arrangements" / f"songs_{date_str}.csv"


def has_local_arrangement_csv(
    csv_output_dir: Union[str, Path], date_str: str
) -> bool:
    """判断本地是否已经获取过某日排歌。"""
    path = local_arrangement_csv_path(csv_output_dir, date_str)
    return path.is_file() and path.stat().st_size > 0


def iter_date_range(start_date: date, end_date: date) -> List[date]:
    """返回闭区间 [start_date, end_date] 内的日期列表。"""
    dates: List[date] = []
    current = start_date
    while current <= end_date:
        dates.append(current)
        current += timedelta(days=1)
    return dates


def find_missed_dates(
    csv_output_dir: Union[str, Path],
    server_cache_by_date: Dict[str, Dict[str, Any]],
    start_date: date,
    end_date: date,
) -> List[MissedDate]:
    """找出服务器有排歌但本地没有运行下载的日期。"""
    missed: List[MissedDate] = []

    for current in iter_date_range(start_date, end_date):
        date_str = current.isoformat()
        arrangement = server_cache_by_date.get(date_str)
        if not arrangement:
            continue
        song_ids = arrangement.get("song_ids") or []
        if not song_ids:
            continue
        status = str(arrangement.get("status") or "pending")
        if status != "pending":
            continue
        if has_local_arrangement_csv(csv_output_dir, date_str):
            continue
        missed.append(MissedDate(date=date_str, song_ids=list(song_ids)))

    return missed


def upload_missed_dates(
    missed_dates: List[MissedDate],
    *,
    base_url: str,
    user_id: str,
    password: str,
    timeout: float = 30.0,
) -> Dict[str, Any]:
    """将漏跑日期逐日上报为未播放。"""
    results: Dict[str, Any] = {"reported": [], "failed": []}

    for missed in missed_dates:
        try:
            result = upload_has_played_song_ids(
                missed.song_ids,
                base_url=base_url,
                user_id=user_id,
                password=password,
                date=missed.date,
                has_played=False,
                timeout=timeout,
            )
            results["reported"].append({"date": missed.date, "result": result})
        except Exception as exc:
            results["failed"].append({"date": missed.date, "error": str(exc)})

    return results


def parse_args() -> argparse.Namespace:
    default_end = (datetime.now().date() - timedelta(days=1)).isoformat()
    parser = argparse.ArgumentParser(
        description="检查并补报上次打开程序到本次打开之间漏跑的排歌日期。",
    )
    parser.add_argument("--base-url", required=True, help="站点根地址")
    parser.add_argument("--user-id", required=True, help="用户 id")
    parser.add_argument("--password", required=True, help="用户密码")
    parser.add_argument(
        "--csv-dir",
        required=True,
        help="排歌 CSV 输出目录（应包含 arrangements/songs_YYYY-MM-DD.csv）",
    )
    parser.add_argument(
        "--start",
        required=True,
        help="开始日期 YYYY-MM-DD（上次打开时间，漏跑检查窗口起点）",
    )
    parser.add_argument("--end", default=default_end, help="结束日期 YYYY-MM-DD")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="只列出漏跑日期，不调用服务器上报接口",
    )
    parser.add_argument("--timeout", type=float, default=30.0, help="请求超时秒数")
    parser.add_argument(
        "--cache-path",
        default=None,
        help="本地排歌缓存文件路径；提供后只增量拉取并保存缓存",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    start_date = date.fromisoformat(args.start)
    end_date = date.fromisoformat(args.end)

    access_token: Optional[str] = None
    if args.cache_path:
        cache = load_arrangement_cache(args.cache_path)
        server_songs = cache["arrangements"]
        last_cached = cache["last_cached_date"]
        fetch_start = start_date
        if last_cached:
            fetch_start = max(
                start_date,
                date.fromisoformat(last_cached) + timedelta(days=1),
            )

        if fetch_start <= end_date:
            access_token = get_access_token(
                args.base_url, args.user_id, args.password
            )
            fetched = fetch_arrangements_cache_range(
                args.base_url,
                access_token,
                fetch_start.isoformat(),
                end_date.isoformat(),
                timeout=args.timeout,
            )
            server_songs = merge_arrangements(server_songs, fetched)
    else:
        # 无本地缓存时，读取上次打开时间（--start）到结束日期（--end，默认昨天），
        # 使用 listRange 接口获取区间排歌数据，而不是整段拉取近 90 天缓存
        if start_date <= end_date:
            access_token = get_access_token(
                args.base_url, args.user_id, args.password
            )
            server_songs = fetch_arrangements_cache_range(
                args.base_url,
                access_token,
                start_date.isoformat(),
                end_date.isoformat(),
                timeout=args.timeout,
            )
        else:
            server_songs = {}

    missed_dates = find_missed_dates(
        args.csv_dir, server_songs, start_date, end_date
    )

    if not missed_dates:
        print("未发现需要补报的漏跑日期")
        if args.cache_path:
            save_arrangement_cache(args.cache_path, end_date.isoformat(), server_songs)
        return 0

    print(f"发现 {len(missed_dates)} 个漏跑日期")
    for missed in missed_dates:
        print(f"{missed.date}: {len(missed.song_ids)} 首歌曲")

    if args.dry_run:
        return 0

    results = upload_missed_dates(
        missed_dates,
        base_url=args.base_url,
        user_id=args.user_id,
        password=args.password,
        timeout=args.timeout,
    )
    print(f"上报成功 {len(results['reported'])} 个日期")
    if args.cache_path and not results["failed"]:
        for item in results["reported"]:
            server_songs.pop(item["date"], None)
        save_arrangement_cache(args.cache_path, end_date.isoformat(), server_songs)
    for item in results["failed"]:
        print(f"上报失败 {item['date']}: {item['error']}", file=sys.stderr)
    return 0 if not results["failed"] else 1


if __name__ == "__main__":
    sys.exit(main())
