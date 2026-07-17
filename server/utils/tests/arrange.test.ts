import { describe, expect, it } from "vitest";
import { MAX_DAILY_SONG_DURATION } from "~~/constants";
import { type ArrangeSong, scheduleSongs } from "../arrange";

function song(
  id: number,
  duration: number,
  options: { expectedDate?: string; createdAt?: Date } = {},
): ArrangeSong {
  return {
    id,
    duration,
    expectedPlayDate: options.expectedDate ?? null,
    createdAt: options.createdAt ?? new Date("2026-01-01T00:00:00Z"),
  };
}

describe("scheduleSongs", () => {
  it("未填写期望日期的歌曲按投稿时间自由分配", () => {
    const songs = [
      song(1, 180, { createdAt: new Date("2026-01-01T00:00:00Z") }),
      song(2, 180, { createdAt: new Date("2026-01-02T00:00:00Z") }),
    ];
    const result = scheduleSongs(songs, "2026-01-05", "2026-01-05");
    expect(result.assignments["2026-01-05"]).toStrictEqual([1, 2]);
    expect(result.dropped.length).toBe(0);
    expect(result.conflicts.length).toBe(0);
  });

  it("期望日期在排歌区间内的歌曲优先安排到对应日期", () => {
    const songs = [
      song(1, 180, { createdAt: new Date("2026-01-01T00:00:00Z") }),
      song(2, 180, { expectedDate: "2026-01-06", createdAt: new Date("2026-01-02T00:00:00Z") }),
    ];
    const result = scheduleSongs(songs, "2026-01-05", "2026-01-07");
    expect(result.assignments["2026-01-06"]).toStrictEqual([2]);
    expect(result.assignments["2026-01-05"]?.includes(1)).toBeTruthy();
    expect(result.dropped.length).toBe(0);
  });

  it("期望日期早于开始日期时按自由分配处理", () => {
    const songs = [
      song(1, 180, { expectedDate: "2026-01-01", createdAt: new Date("2026-01-01T00:00:00Z") }),
    ];
    const result = scheduleSongs(songs, "2026-01-05", "2026-01-05");
    expect(result.assignments["2026-01-05"]).toStrictEqual([1]);
    expect(result.conflicts.length).toBe(0);
  });

  it("每日播放总时长不超过 45 分钟", () => {
    const longSong = song(1, 30 * 60);
    const songs: ArrangeSong[] = [];
    for (let i = 0; i < 5; i++) {
      songs.push({ ...longSong, id: i + 1, createdAt: new Date(`2026-01-01T0${i}:00:00Z`) });
    }
    const result = scheduleSongs(songs, "2026-01-05", "2026-01-05");
    const daySongs = result.assignments["2026-01-05"] ?? [];
    const total = daySongs.reduce((sum, id) => sum + songs[id - 1]!.duration, 0);
    expect(total).toBeLessThanOrEqual(MAX_DAILY_SONG_DURATION);
    expect(result.dropped.length).toBe(4);
  });

  it("期望日期排满时自动调整到最近的可用日期并返回建议", () => {
    const songs = [
      song(3, 180, { expectedDate: "2026-01-05", createdAt: new Date("2026-01-03T00:00:00Z") }),
    ];
    const result = scheduleSongs(songs, "2026-01-05", "2026-01-06", {
      existingAssignments: { "2026-01-05": [99] },
      existingSongs: [{ id: 99, duration: MAX_DAILY_SONG_DURATION, expectedPlayDate: null, createdAt: new Date() }],
    });
    const day5 = result.assignments["2026-01-05"] ?? [];
    const day6 = result.assignments["2026-01-06"] ?? [];
    expect(day5.includes(3)).toBeFalsy();
    expect(day6.includes(3)).toBeTruthy();
    const conflict = result.conflicts.find(c => c.songId === 3);
    expect(conflict).toBeDefined();
    expect(conflict!.suggestedDate).toBe("2026-01-06");
  });

  it("不可用的期望日期会自动调整到最近的可用日期", () => {
    const songs = [
      song(1, 180, { expectedDate: "2026-01-05", createdAt: new Date("2026-01-01T00:00:00Z") }),
    ];
    const result = scheduleSongs(songs, "2026-01-05", "2026-01-07", {
      unavailableDates: ["2026-01-05"],
    });
    expect(result.assignments["2026-01-06"]).toStrictEqual([1]);
    expect(result.dropped.length).toBe(0);
  });

  it("同时存在期望日期和自由分配歌曲时，期望日期优先占用容量", () => {
    const songs = [
      song(1, 20 * 60, { createdAt: new Date("2026-01-01T00:00:00Z") }),
      song(2, 20 * 60, { expectedDate: "2026-01-05", createdAt: new Date("2026-01-02T00:00:00Z") }),
      song(3, 20 * 60, { createdAt: new Date("2026-01-03T00:00:00Z") }),
    ];
    const result = scheduleSongs(songs, "2026-01-05", "2026-01-05");
    const day = result.assignments["2026-01-05"] ?? [];
    expect(day.includes(2)).toBeTruthy();
    expect(day.length).toBe(2);
    expect(result.dropped.length).toBe(1);
  });

  it("遵守每日最大歌曲数量限制", () => {
    const songs = Array.from({ length: 5 }, (_, i) =>
      song(i + 1, 60, { createdAt: new Date(`2026-01-01T0${i}:00:00Z`) }));
    const result = scheduleSongs(songs, "2026-01-05", "2026-01-05", { maxSongsPerDay: 2 });
    const day = result.assignments["2026-01-05"] ?? [];
    expect(day.length).toBe(2);
    expect(result.dropped.length).toBe(3);
  });

  it("会考虑已有的排歌记录计算剩余容量", () => {
    const songs = [
      song(1, 25 * 60),
      song(2, 15 * 60),
    ];
    const result = scheduleSongs(songs, "2026-01-05", "2026-01-05", {
      existingAssignments: { "2026-01-05": [99] },
      existingSongs: [{ id: 99, duration: 25 * 60, expectedPlayDate: null, createdAt: new Date() }],
    });
    const day = result.assignments["2026-01-05"] ?? [];
    expect(day).toStrictEqual([99, 2]);
    expect(result.dropped.length).toBe(1);
  });
});
