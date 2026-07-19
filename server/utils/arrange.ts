/**
 * 歌曲排期核心算法
 *
 * 规则：
 * - 每日播放总时长不超过 maxDailyDuration 秒（默认 45 分钟 = 2700 秒）
 * - 优先级：期望日期 > 投稿时间（早投稿优先）
 * - 期望日期在排歌区间内的歌曲优先安排到对应日期
 * - 期望日期已满或不可用时，自动调整到最近的可用日期
 * - 仍无法安排的歌曲作为冲突返回
 */
// by Kimi-K2.7-Coder
import { MAX_DAILY_SONG_DURATION } from "~~/constants";

export interface ArrangeSong {
  id: number;
  duration: number;
  expectedPlayDate: string | null;
  createdAt: Date;
}

export interface ScheduleConflict {
  songId: number;
  expectedDate: string;
  reason: "full" | "unavailable";
  suggestedDate?: string;
}

export interface ScheduleResult {
  assignments: Record<string, number[]>;
  conflicts: ScheduleConflict[];
  dropped: number[];
}

export interface ScheduleOptions {
  maxDailyDuration?: number;
  unavailableDates?: string[];
  maxSongsPerDay?: number;
  existingAssignments?: Record<string, number[]>;
  existingSongs?: ArrangeSong[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRange(startStr: string, endStr: string): string[] {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + DAY_MS)) {
    dates.push(formatDate(d));
  }
  return dates;
}

function sortByCreatedAt(a: ArrangeSong, b: ArrangeSong): number {
  return a.createdAt.getTime() - b.createdAt.getTime();
}

interface DaySlot {
  date: string;
  duration: number;
  songIds: number[];
  unavailable: boolean;
}

export function scheduleSongs(
  songs: ArrangeSong[],
  startDate: string,
  endDate: string,
  options: ScheduleOptions = {},
): ScheduleResult {
  const maxDailyDuration = options.maxDailyDuration ?? MAX_DAILY_SONG_DURATION;
  const unavailableDateSet = new Set(options.unavailableDates ?? []);
  const maxSongsPerDay = options.maxSongsPerDay ?? 0;
  const existingAssignments = options.existingAssignments ?? {};

  const rangeDates = getDateRange(startDate, endDate);
  if (rangeDates.length === 0) {
    return { assignments: {}, conflicts: [], dropped: songs.map(s => s.id) };
  }

  const allSongsMap = new Map<number, ArrangeSong>(
    [...songs, ...(options.existingSongs ?? [])].map(s => [s.id, s]),
  );

  const days: DaySlot[] = rangeDates.map((date) => {
    const existingIds = existingAssignments[date] ?? [];
    const existingDuration = existingIds.reduce(
      (sum, id) => sum + (allSongsMap.get(id)?.duration ?? 0),
      0,
    );
    return {
      date,
      duration: existingDuration,
      songIds: [...existingIds],
      unavailable: unavailableDateSet.has(date),
    };
  });

  const dayIndex = new Map<string, number>(days.map((d, i) => [d.date, i]));

  const expectedSongs = songs
    .filter(s => s.expectedPlayDate && dayIndex.has(s.expectedPlayDate))
    .sort(sortByCreatedAt);

  const freeSongs = songs
    .filter(s => !s.expectedPlayDate || !dayIndex.has(s.expectedPlayDate))
    .sort(sortByCreatedAt);

  const assignments: Record<string, number[]> = {};
  for (const [date, ids] of Object.entries(existingAssignments)) {
    if (ids.length > 0)
      assignments[date] = [...ids];
  }

  const conflicts: ScheduleConflict[] = [];
  const dropped: number[] = [];
  const placedSongIds = new Set<number>();

  function canFitDay(day: DaySlot, duration: number): boolean {
    if (day.unavailable)
      return false;
    if (day.duration + duration > maxDailyDuration)
      return false;
    if (maxSongsPerDay > 0 && day.songIds.length + 1 > maxSongsPerDay)
      return false;
    return true;
  }

  function placeSong(day: DaySlot, song: ArrangeSong) {
    day.duration += song.duration;
    day.songIds.push(song.id);
    placedSongIds.add(song.id);
    if (!assignments[day.date])
      assignments[day.date] = [];
    assignments[day.date]!.push(song.id);
  }

  function findNearestAvailableDay(
    targetDateStr: string,
    duration: number,
    excludeSet?: Set<number>,
  ): DaySlot | undefined {
    const targetIndex = dayIndex.get(targetDateStr);
    if (targetIndex === undefined)
      return undefined;

    for (let offset = 0; offset < days.length; offset++) {
      const leftIndex = targetIndex - offset;
      if (leftIndex >= 0) {
        const day = days[leftIndex]!;
        if (!day.unavailable && canFitDay(day, duration) && (!excludeSet || !excludeSet.has(leftIndex))) {
          return day;
        }
      }

      const rightIndex = targetIndex + offset;
      if (offset > 0 && rightIndex < days.length) {
        const day = days[rightIndex]!;
        if (!day.unavailable && canFitDay(day, duration) && (!excludeSet || !excludeSet.has(rightIndex))) {
          return day;
        }
      }
    }

    return undefined;
  }

  // 第一步：处理有期望日期的歌曲，优先安排到对应日期
  for (const song of expectedSongs) {
    const expectedDateStr = song.expectedPlayDate!;
    const targetDay = days[dayIndex.get(expectedDateStr)!]!;

    if (targetDay.unavailable) {
      const nearest = findNearestAvailableDay(expectedDateStr, song.duration);
      if (nearest) {
        placeSong(nearest, song);
      } else {
        conflicts.push({
          songId: song.id,
          expectedDate: expectedDateStr,
          reason: "unavailable",
        });
        dropped.push(song.id);
      }
      continue;
    }

    if (canFitDay(targetDay, song.duration)) {
      placeSong(targetDay, song);
    } else {
      const nearest = findNearestAvailableDay(expectedDateStr, song.duration);
      if (nearest) {
        placeSong(nearest, song);
        conflicts.push({
          songId: song.id,
          expectedDate: expectedDateStr,
          reason: "full",
          suggestedDate: nearest.date,
        });
      } else {
        conflicts.push({
          songId: song.id,
          expectedDate: expectedDateStr,
          reason: "full",
        });
        dropped.push(song.id);
      }
    }
  }

  // 第二步：用自由分配歌曲填充剩余容量
  for (const song of freeSongs) {
    if (placedSongIds.has(song.id))
      continue;

    let placed = false;
    for (const day of days) {
      if (canFitDay(day, song.duration)) {
        placeSong(day, song);
        placed = true;
        break;
      }
    }

    if (!placed)
      dropped.push(song.id);
  }

  return { assignments, conflicts, dropped };
}

export function getDayDuration(songIds: number[], songMap: Map<number, ArrangeSong>): number {
  return songIds.reduce((sum, id) => sum + (songMap.get(id)?.duration ?? 0), 0);
}
