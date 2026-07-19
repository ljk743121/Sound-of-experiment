#!/usr/bin/env python3
"""
调用 arrangements.today 接口获取当天排歌信息，并导出为 CSV。

CSV 格式：id,name,creator,source,songID
依赖：pip install requests
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import requests


CSV_COLUMNS = ["id", "name", "creator", "source", "songID"]


def fetch_today_arrangements(
    base_url: str, timeout: float = 30.0
) -> Optional[Dict[str, Any]]:
    """
    调用 arrangements.today 接口，返回当天排歌数据。

    Args:
        base_url: 站点根地址，例如 http://localhost:3000 或 https://voszsy.penacony.cn。
        timeout: 请求超时时间（秒）。

    Returns:
        排歌对象，包含 date 和 songs 字段；若当天无排歌则返回 None。
    """
    endpoint = f"{base_url.rstrip('/')}/api/trpc/arrangements.today"
    # batch=1 与 input 参数与项目内 trpc-nuxt 的 httpBatchLink 保持一致
    params = {
        "batch": "1",
        "input": json.dumps({"0": {"json": {}}}),
    }

    response = requests.get(endpoint, params=params, timeout=timeout)
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


def arrangement_to_records(
    arrangement: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    将排歌对象转换为可供其他模块使用的记录列表。

    Args:
        arrangement: arrangements.today 返回的排歌对象。

    Returns:
        每条记录包含 id、name、creator、source、songID。
    """
    if arrangement is None:
        return []

    songs = arrangement.get("songs") or []
    records: List[Dict[str, Any]] = []

    for song in songs:
        record = {
            "id": song.get("id"),
            "name": song.get("name"),
            "creator": song.get("creator"),
            "source": song.get("source"),
            "songID": song.get("songId"),
        }
        records.append(record)

    return records


def save_to_csv(
    records: List[Dict[str, Any]],
    csv_path: Union[str, os.PathLike[str]],
) -> Path:
    """
    将记录列表保存为 CSV 文件。

    Args:
        records: 由 arrangement_to_records 生成的记录列表。
        csv_path: 输出 CSV 文件路径。

    Returns:
        保存后的文件路径。
    """
    path = Path(csv_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(records)

    return path


def get_today_csv(
    base_url: str,
    output_path: Optional[Union[str, os.PathLike[str]]] = None,
    *,
    timeout: float = 30.0,
) -> Tuple[Path, List[Dict[str, Any]]]:
    """
    获取当天排歌信息并保存为 CSV。

    Args:
        base_url: 站点根地址。
        output_path: CSV 输出路径。未提供时默认保存为 songs_YYYY-MM-DD.csv。
        timeout: 请求超时时间（秒）。

    Returns:
        (csv_path, records) 元组。
    """
    arrangement = fetch_today_arrangements(base_url, timeout=timeout)
    records = arrangement_to_records(arrangement)

    if output_path is None:
        date_str = (
            arrangement.get("date")
            if arrangement
            else datetime.now().strftime("%Y-%m-%d")
        )
        output_path = Path(__file__).with_name(f"songs_{date_str}.csv")

    csv_path = save_to_csv(records, output_path)
    return csv_path, records


def main() -> int:
    default_base_url = os.environ.get("VOSZSY_BASE_URL", "http://localhost:3000")

    parser = argparse.ArgumentParser(
        description="获取当天排歌信息并导出为 CSV。",
    )
    parser.add_argument(
        "--base-url",
        default=default_base_url,
        help="站点根地址，例如 http://localhost:3000。默认读取环境变量 VOSZSY_BASE_URL。",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="CSV 输出路径。默认保存为 externalScripts/songs_YYYY-MM-DD.csv。",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30.0,
        help="请求超时时间（秒），默认 30。",
    )

    args = parser.parse_args()

    try:
        csv_path, records = get_today_csv(
            base_url=args.base_url,
            output_path=args.output,
            timeout=args.timeout,
        )
        print(f"已保存 {len(records)} 首歌曲到 {csv_path}")
        return 0
    except Exception as e:
        print(f"错误：{e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
