<template>
  <div class="overflow-x-auto md:w-[calc(100vw-16rem)]">
    <div class="flex w-max">
      <div class="sticky left-0 z-50 flex h-[calc(100svh-4rem)] w-min flex-col justify-between border-r bg-sidebar p-4">
        <div>
          <div class="justify-center text-center text-sm text-muted-foreground">
            排歌选取
          </div>
          <RangeCalendar
            v-model="calendarValue"
            :is-date-unavailable="isDateUnavailable"
            locale="zh"
            class="p-0"
          />
          <div v-if="calendarValue.start && calendarValue.end" class="mt-4 flex items-center justify-between">
            <Badge variant="outline">
              {{ calendarValue.start }}
            </Badge>
            <Icon name="lucide:arrow-right" size="14" />
            <Badge variant="outline">
              {{ calendarValue.end }}
            </Badge>
          </div>
        </div>
        <div>
          <div class="justify-center text-center text-sm text-muted-foreground">
            选择下载CSV数据区段
          </div>
          <RangeCalendar
            v-model="copyValue"
            :is-date-unavailable="isDateAvailable"
            locale="zh"
            class="p-0"
          />
          <div v-if="copyValue.start && copyValue.end" class="mt-4 flex items-center justify-between">
            <Badge variant="outline">
              {{ copyValue.start }}
            </Badge>
            <Icon name="lucide:arrow-right" size="14" />
            <Badge variant="outline">
              {{ copyValue.end }}
            </Badge>
          </div>
        </div>
        <div class="grid gap-3 rounded-lg border bg-background p-4">
          <div class="grid gap-1">
            <div v-for="requirement in requirementList" :key="requirement.label" class="flex items-center gap-2">
              <Icon v-if="requirement.value" name="lucide:check" class="text-green-500" />
              <Icon v-else name="lucide:x" class="text-red-500" />
              <span class="text-sm font-medium">
                {{ requirement.label }}
              </span>
            </div>
          </div>

          <NumberField id="songCount" v-model="songCount" :default-value="0" :min="0">
            <Label for="songCount" class="text-xs font-medium">每日歌曲数目：</Label>
            <NumberFieldContent class="bg-background">
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>

          <Button
            :disabled="!canArrange || isPending"
            class="transition-all" @click="arrange({
              start: calendarValue.start!.toString(),
              end: calendarValue.end!.toString(),
              songCount,
            })"
          >
            <Icon v-if="isPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
            <Icon name="lucide:play" class="mr-2" />
            {{ songCount ? "手动排歌" : "自动排歌" }}
          </Button>
          <Button
            class="transition-all" @click="copyAllSongs(arrangementList)"
          >
            <Icon name="lucide:clipboard" class="mr-2" />
            下载选定区域全部歌曲CSV数据
          </Button>
        </div>
      </div>
      <div
        v-for="day in arrangementList"
        :key="day.date"
        class="w-[400px] flex-shrink-0 border-r"
      >
        <ScrollArea class="h-[calc(100svh-4rem)]">
          <div class="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4">
            <span class="text-sm font-semibold">{{ day.date }}</span>
            <Button variant="outline" size="sm" @click="copySongInfo(day)">
              <Icon name="lucide:clipboard" class="mr-1" />
              下载CSV文件
            </Button>
          </div>
          <ul class="flex flex-col gap-3 p-4">
            <li v-for="song in day.songs" :key="song.id">
              <SongCard :song is-arrangement type="review"/>
            </li>
          </ul>
        </ScrollArea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DateRange } from 'radix-vue';
import type { RouterOutput } from '~~/types';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { type DateValue, getLocalTimeZone, startOfWeek, today } from '@internationalized/date';

definePageMeta({
  layout: 'admin',
});

const { $trpc } = useNuxtApp();
const { data: arrangementList, suspense } = useQuery({
  queryFn: () => $trpc.arrangements.list.query(),
  queryKey: ['arrangements.list'],
});
await suspense();

const { data: reviewAll, suspense: reviewAllSuspense } = useQuery({
  queryFn: () => $trpc.arrangements.reviewAll.query(),
  queryKey: ['arrangements.reviewAll'],
});
await reviewAllSuspense();

const { data: timeCurrently, suspense: timeSuspense } = useQuery({
  queryFn: () => $trpc.time.currently.query(),
  queryKey: ['time.currently'],
});
await timeSuspense();

function downloadCsv(csvContent: string,){
  try {
    const today = new Date();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `songs_${today.toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url); // 清理内存
    toast.success('正在下载csv文件...');
  } catch (e: any) {
    if (e.message)
      toast.error(e.message);
    else
      toast.error(e.toString());
  }
}

// const { copy: useCopy } = useClipboard({ legacy: true });
async function copySongInfo(day: RouterOutput['arrangements']['list'][0]) {
  if (!day.songs.length) {
    toast.error('排歌表为空');
    return;
  }

  const csvHeader = "name,creator,source,songID\n";
  let csvContent = csvHeader;
  for (const song of day.songs) {
    csvContent += `"${song.name}","${song.creator}","${song.source}","${song.songId}"\n`;
  }
  downloadCsv(csvContent);
}

const _start = startOfWeek(today(getLocalTimeZone()).add({ weeks: 1 }), 'zh-CN');
const _end = _start.add({ days: 4 });

const calendarValue = ref({
  start: _start,
  end: _end,
}) as Ref<DateRange>;

const copyValue = ref({
  start: _start,
  end: _end,
}) as Ref<DateRange>;

async function copyAllSongs(list: RouterOutput['arrangements']['list'] | undefined) {
  if (!list) {
    toast.error('排歌表为空');
    return;
  }
  const dateRange = copyValue.value;
  if ( !dateRange || !dateRange.start || !dateRange.end) {
    toast.error('请选择有效的时间段');
    return;
  }
  const selectedDays = arrangementList.value?.filter((day) => {
    const dayDate = new Date(day.date);
    const startDate = dateRange.start!.toDate(getLocalTimeZone());
    const endDate = dateRange.end!.toDate(getLocalTimeZone());
    return dayDate >= startDate && dayDate <= endDate;
  });
  if (!selectedDays || selectedDays.length === 0) {
    toast.error('所选时间段内没有歌曲');
    return;
  }
  const csvHeader = "name,creator,source,songID\n";
  let csvContent = csvHeader;

  for (const day of selectedDays) {
    for (const song of day.songs) {
      csvContent += `"${song.name}","${song.creator}","${song.source}","${song.songId}"\n`;
    }
  }
  downloadCsv(csvContent);
}

const requirementList = computed<{
  label: string;
  value: boolean;
}[]>(() => {
  return [
    {
      label: '选择时间段',
      value: calendarValue.value.start !== undefined && calendarValue.value.end !== undefined,
    },
    {
      label: '审核全部歌曲',
      value: reviewAll.value ?? true,
    },
    {
      label: '投稿截止',
      value: !(timeCurrently.value ?? false),
    },
  ];
});

const canArrange = computed(() => requirementList.value.every(x => x.value));

const songCount = ref(0);

function isDateUnavailable(date: DateValue) {
  return arrangementList.value?.some(x => x.date === date.toString()) ?? false;
}

function isDateAvailable(date: DateValue) {
  return !(arrangementList.value?.some(x => x.date === date.toString()));
}

const queryClient = useQueryClient();
const { mutate: arrange, isPending } = useMutation({
  mutationFn: $trpc.arrangements.arrange.mutate,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['arrangements.list'] });
    toast.success('排歌成功！');
  },
  onError: err => useErrorHandler(err),
});
</script>
