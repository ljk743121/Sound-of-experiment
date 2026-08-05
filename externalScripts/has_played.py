#!/usr/bin/env python3
"""
读取 CSV 歌曲列表，登录后调用 arrangements.hasPlayed API 上报歌曲。

CSV 格式：id,name,creator,source,songID
依赖：pip install requests
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests


logger = logging.getLogger(__name__)


# 内存中的 accessToken 缓存：{user_id: accessToken}
_token_cache: Dict[str, str] = {}


def _get_token_cache_path() -> Path:
    """返回本地 accessToken 缓存文件路径。"""
    cache_dir = Path.home() / ".sound_of_experiment"
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir / "access_token.json"


def _load_cached_token(base_url: str) -> Optional[str]:
    """从本地缓存读取指定站点的 accessToken（不校验有效性）。"""
    cache_path = _get_token_cache_path()
    if not cache_path.exists():
        return None
    try:
        data = json.loads(cache_path.read_text(encoding="utf-8"))
        if data.get("base_url") == base_url and data.get("access_token"):
            return str(data["access_token"])
    except (OSError, json.JSONDecodeError, AttributeError) as exc:
        logger.warning(f"读取本地 token 缓存失败: {exc}")
    return None


def _save_cached_token(base_url: str, access_token: str) -> None:
    """将 accessToken 持久化到本地缓存。"""
    cache_path = _get_token_cache_path()
    try:
        data = {
            "base_url": base_url,
            "access_token": access_token,
            "cached_at": datetime.now(timezone.utc).isoformat(),
        }
        cache_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    except OSError as exc:
        logger.warning(f"保存本地 token 缓存失败: {exc}")


def _trpc_batch_url(base_url: str, procedure: str) -> str:
    """构造 httpBatchLink 风格的 trpc 请求地址。"""
    return f"{base_url.rstrip('/')}/api/trpc/{procedure}?batch=1"


def _parse_trpc_response(response: requests.Response) -> Any:
    """解析 trpc batch 响应，返回 result.data。"""
    response.raise_for_status()
    body = response.json()

    if not isinstance(body, list) or len(body) == 0:
        raise RuntimeError(f"API 返回格式异常: {body}")

    first = body[0]
    if "error" in first:
        error = first["error"]
        message = error.get("message") or error.get("code") or json.dumps(error)
        raise RuntimeError(f"API 返回错误: {message}")

    data = first["result"]["data"]
    if isinstance(data, dict) and "json" in data:
        return data["json"]
    return data


def login(base_url: str, user_id: str, password: str) -> str:
    """
    调用 user.login 接口获取 accessToken。

    Args:
        base_url: 站点根地址。
        user_id: 用户 id（学号/工号）。
        password: 用户密码。

    Returns:
        accessToken 字符串。
    """
    url = _trpc_batch_url(base_url, "user.login")
    response = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        json={"0": {"json": {"id": user_id, "password": password}}},
        timeout=30,
    )
    data = _parse_trpc_response(response)
    access_token = data.get("accessToken") if isinstance(data, dict) else None
    if not access_token:
        raise RuntimeError("登录成功但未返回 accessToken")
    return access_token


def is_token_valid(base_url: str, access_token: str) -> bool:
    """
    调用 user.tokenValidity 校验 accessToken 是否有效。

    trpc-nuxt 查询接口使用 GET batch 格式：?batch=1&input={"0":{"json":{}}}。

    Returns:
        True 表示 token 有效；False 表示已过期或无效。
    """
    url = _trpc_batch_url(base_url, "user.tokenValidity")
    try:
        response = requests.get(
            url,
            headers={"Authorization": access_token},
            params={
                "batch": "1",
                "input": json.dumps({"0": {"json": {}}}),
            },
            timeout=30,
        )
        _parse_trpc_response(response)
        return True
    except requests.HTTPError as exc:
        if exc.response is not None and exc.response.status_code in (401, 403):
            return False
        raise
    except RuntimeError as exc:
        message = str(exc).lower()
        if "unauthorized" in message or "登录" in message or "token" in message:
            return False
        raise


def get_access_token(
    base_url: str,
    user_id: str,
    password: str,
) -> str:
    """
    获取有效的 accessToken。

    优先使用本地缓存与内存缓存；若缓存不存在或已过期，则重新登录并更新缓存。
    """
    # 1. 内存缓存
    cached = _token_cache.get(user_id)
    if cached and is_token_valid(base_url, cached):
        logger.info("使用内存缓存的 accessToken")
        return cached

    # 2. 本地文件缓存
    cached = _load_cached_token(base_url)
    if cached and is_token_valid(base_url, cached):
        logger.info("使用本地缓存的 accessToken")
        _token_cache[user_id] = cached
        return cached

    # 3. 重新登录
    logger.info("本地 accessToken 不存在或已过期，重新登录")
    access_token = login(base_url, user_id, password)
    _token_cache[user_id] = access_token
    _save_cached_token(base_url, access_token)
    return access_token


def _arrangements_to_cache_map(data: Any) -> Dict[str, Dict[str, Any]]:
    """将排歌列表转换为 {日期: {song_ids, unplayed_songs, status}}。"""
    if not isinstance(data, list):
        raise RuntimeError(f"排歌列表返回格式异常: {data}")

    result: Dict[str, Dict[str, Any]] = {}
    for arrangement in data:
        if not isinstance(arrangement, dict):
            continue
        date_str = arrangement.get("date")
        if not date_str:
            continue

        song_ids: List[int] = []
        for song in arrangement.get("songs") or []:
            if not isinstance(song, dict):
                continue
            raw_id = song.get("id")
            if raw_id is None:
                continue
            try:
                song_ids.append(int(raw_id))
            except (TypeError, ValueError):
                continue

        try:
            unplayed_songs = int(arrangement.get("unplayedSongs") or 0)
        except (TypeError, ValueError):
            unplayed_songs = 0

        status = arrangement.get("status")
        if not isinstance(status, str):
            status = "pending"

        result[str(date_str)] = {
            "song_ids": song_ids,
            "unplayed_songs": unplayed_songs,
            "status": status,
        }

    return result

def fetch_arrangements_cache_range(
    base_url: str,
    access_token: str,
    start: str,
    end: str,
    *,
    timeout: float = 30.0,
) -> Dict[str, Dict[str, Any]]:
    """
    调用 arrangements.listRange 接口获取指定日期范围的排歌缓存数据。

    Returns:
        以排歌日期为键的 {song_ids, unplayed_songs, status} 字典。
    """
    url = _trpc_batch_url(base_url, "arrangements.listRange")
    response = requests.get(
        url,
        headers={"Authorization": access_token},
        params={
            "batch": "1",
            "input": json.dumps({
                "0": {
                    "json": {
                        "start": start,
                        "end": end,
                    },
                },
            }),
        },
        timeout=timeout,
    )
    return _arrangements_to_cache_map(_parse_trpc_response(response))

def upload_has_played_song_ids(
    song_ids: List[int],
    *,
    base_url: str,
    user_id: str,
    password: str,
    date: Optional[str] = None,
    has_played: bool = True,
    timeout: float = 30.0,
) -> Dict[str, Any]:
    """
    登录后按歌曲 id 调用 arrangements.hasPlayed 接口。

    Args:
        song_ids: 排歌歌曲 id 列表。
        base_url: 站点根地址。
        user_id: 用户 id。
        password: 用户密码。
        date: 排歌日期（YYYY-MM-DD）。
        has_played: True 标记为已播放；False 将整日排歌移除并放回候选池。
        timeout: 请求超时时间（秒）。

    Returns:
        API 返回的 result.data 内容。
    """
    if not song_ids:
        raise ValueError("歌曲 id 列表不能为空")
    if date is None:
        raise ValueError("必须指定排歌日期 date")

    access_token = get_access_token(base_url, user_id, password)
    payload = {
        "date": date,
        "songs": song_ids,
        "hasPlayed": has_played,
    }

    url = _trpc_batch_url(base_url, "arrangements.hasPlayed")
    response = requests.post(
        url,
        headers={
            "Content-Type": "application/json",
            "Authorization": access_token,
        },
        json={"0": {"json": payload}},
        timeout=timeout,
    )
    return _parse_trpc_response(response)


def finish_arrangement(
    date: str,
    *,
    base_url: str,
    user_id: str,
    password: str,
    timeout: float = 30.0,
) -> Dict[str, Any]:
    """
    调用 arrangements.finish 将指定日期标记为全部播放完成（status=success）。

    Args:
        date: 排歌日期（YYYY-MM-DD）。
        base_url: 站点根地址。
        user_id: 用户 id。
        password: 用户密码。
        timeout: 请求超时时间（秒）。

    Returns:
        API 返回的 result.data 内容。
    """
    access_token = get_access_token(base_url, user_id, password)
    url = _trpc_batch_url(base_url, "arrangements.finish")
    response = requests.post(
        url,
        headers={
            "Content-Type": "application/json",
            "Authorization": access_token,
        },
        json={"0": {"json": {"date": date}}},
        timeout=timeout,
    )
    return _parse_trpc_response(response)


def recover_has_played(
    song_ids: List[int],
    *,
    base_url: str,
    user_id: str,
    password: str,
    date: str,
    timeout: float = 30.0,
) -> Dict[str, Any]:
    """
    登录后调用 arrangements.recover，将重试后重新下载成功的歌曲恢复回当天列表。

    Args:
        song_ids: 此前上报失败、本次重试下载成功的歌曲 id 列表。
        base_url: 站点根地址。
        user_id: 用户 id。
        password: 用户密码。
        date: 排歌日期（YYYY-MM-DD）。
        timeout: 请求超时时间（秒）。

    Returns:
        API 返回的 result.data 内容。
    """
    if not song_ids:
        raise ValueError("歌曲 id 列表不能为空")
    if not date:
        raise ValueError("必须指定排歌日期 date")

    access_token = get_access_token(base_url, user_id, password)
    payload = {"date": date, "songIds": song_ids}

    url = _trpc_batch_url(base_url, "arrangements.recover")
    response = requests.post(
        url,
        headers={
            "Content-Type": "application/json",
            "Authorization": access_token,
        },
        json={"0": {"json": payload}},
        timeout=timeout,
    )
    return _parse_trpc_response(response)


def parse_date_from_csv_path(csv_path: str) -> Optional[str]:
    """从文件名（如 songs_2025-01-01.csv）中解析 YYYY-MM-DD 日期。"""
    basename = os.path.basename(csv_path)
    match = re.search(r"(\d{4}-\d{2}-\d{2})", basename)
    return match.group(1) if match else None


def read_song_ids_from_csv(csv_path: str) -> List[int]:
    """读取 CSV 文件并返回歌曲 id 列表。"""
    song_ids: List[int] = []

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            raise ValueError("CSV 文件为空或没有表头")

        # 去除可能存在的 BOM 前缀
        fieldnames = {name.lstrip("\ufeff") for name in reader.fieldnames}
        required = {"id", "name", "creator", "source", "songID"}
        if not required.issubset(fieldnames):
            raise ValueError(f"CSV 表头必须包含 {required}，实际为 {fieldnames}")

        for row in reader:
            raw_id = row.get("id") or ""
            if raw_id is None or raw_id.strip() == "":
                continue
            song_ids.append(int(raw_id.strip()))

    return song_ids


def upload_has_played(
    csv_path: str,
    *,
    base_url: str,
    user_id: str,
    password: str,
    date: Optional[str] = None,
    has_played: bool = True,
) -> Dict[str, Any]:
    """
    读取 CSV 并通过 accessToken 认证后调用 arrangements.hasPlayed 接口。

    Args:
        csv_path: CSV 文件路径，格式为 id,name,creator,source,songID。
        base_url: 站点根地址，例如 http://localhost:3000 或 https://example.com。
        user_id: 用户 id。
        password: 用户密码。
        date: 排歌日期（YYYY-MM-DD）。未提供时尝试从文件名解析。
        has_played: 是否标记为已播放，默认 True；False 会删除该日期的排歌记录。

    Returns:
        API 返回的 result.data 内容。
    """
    if date is None:
        date = parse_date_from_csv_path(csv_path)
        if date is None:
            raise ValueError(
                "无法从 CSV 文件名解析日期，请通过 --date 参数显式指定，"
                "或将文件名命名为 songs_YYYY-MM-DD.csv 格式。"
            )

    song_ids = read_song_ids_from_csv(csv_path)
    return upload_has_played_song_ids(
        song_ids,
        base_url=base_url,
        user_id=user_id,
        password=password,
        date=date,
        has_played=has_played,
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="读取 CSV 歌曲列表，登录后批量上报 arrangements.hasPlayed。"
    )
    parser.add_argument("csv_path", help="CSV 文件路径")
    parser.add_argument("--base-url", required=True, help="站点根地址，例如 http://localhost:3000")
    parser.add_argument("--user-id", required=True, help="用户 id")
    parser.add_argument("--password", required=True, help="用户密码")
    parser.add_argument("--date", default=None, help="排歌日期 YYYY-MM-DD，默认从文件名解析")
    parser.add_argument(
        "--delete",
        action="store_true",
        help="传入 --delete 时调用 hasPlayed=false，删除该日期排歌记录",
    )
    parser.add_argument(
        "--clear-cache",
        action="store_true",
        help="清除本地 accessToken 缓存并重新登录",
    )

    args = parser.parse_args()

    if args.clear_cache:
        cache_path = _get_token_cache_path()
        if cache_path.exists():
            try:
                cache_path.unlink()
                print(f"已清除本地 token 缓存: {cache_path}")
            except OSError as exc:
                print(f"清除缓存失败: {exc}", file=sys.stderr)
                return 1
        else:
            print("本地无 token 缓存")

    try:
        result = upload_has_played(
            args.csv_path,
            base_url=args.base_url,
            user_id=args.user_id,
            password=args.password,
            date=args.date,
            has_played=not args.delete,
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except Exception as e:
        print(f"错误：{e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
