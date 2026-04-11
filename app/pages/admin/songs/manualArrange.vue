<template>
  <div class="overflow-x-auto md:w-[calc(100vw-16rem)]">
    <div class="flex w-max">
      <div
        class="sticky left-0 z-50 flex h-[calc(100svh-4rem)] w-[300px] flex-col justify-between border-r bg-sidebar p-4"
      >
        <div class="grid gap-3 rounded-lg border bg-background p-4">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" class="w-full font-normal">
                <Icon name="lucide:calendar" class="mr-2 h-4 w-4" />
                {{ pickedDate ? pickedDate.toString() : "选择要添加的日期" }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar v-model="pickedDate" initial-focus />
            </PopoverContent>
          </Popover>
          <Button variant="secondary" class="w-full font-normal" :disabled="!pickedDate" @click="addDate">
            <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
            添加日期
          </Button>
        </div>
        <div class="grid gap-3 rounded-lg border bg-background p-4">
          <Button class="transition-all" :disabled="!hasChanges || isSaving" @click="resetChanges">
            <Icon v-if="isSaving" name="lucide:loader-circle" class="mr-2 animate-spin" />
            <Icon name="lucide:rotate-ccw" class="mr-2 h-4 w-4" />
            重置更改
          </Button>
          <Button class="transition-all" :disabled="!hasChanges || isSaving" @click="saveChanges">
            <Icon v-if="isSaving" name="lucide:loader-circle" class="mr-2 animate-spin" />
            <Icon name="lucide:save" class="mr-2" />
            保存更改
          </Button>
          <div v-if="hasChanges" class="text-sm text-yellow-500">
            有未保存的更改
          </div>
          <p class="text-sm text-muted-foreground">
            已通过的歌曲但未排歌的歌曲
          </p>
          <ScrollArea class="h-[calc(100svh-4rem)]">
            <VueDraggable v-model="editableApprovedSongs" group="song" :sort="false" @end="onDragEnd">
              <div v-for="song in editableApprovedSongs" :key="song.id" class="p-2 mb-2">
                <SongCard :song is-arrangement type="review" />
              </div>
            </VueDraggable>
          </ScrollArea>
        </div>
      </div>
      <div v-for="day in editableArrangementList" :key="day.date" class="w-[400px] flex-shrink-0 border-r">
        <ScrollArea class="h-[calc(100svh-4rem)]">
          <div class="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4">
            <span class="text-sm font-semibold">{{ day.date }}</span>
          </div>
          <VueDraggable v-model="day.songs" group="song" @end="onDragEnd">
            <div v-for="song in day.songs" :key="song.id" class="p-2 mb-2">
              <SongCard :song is-arrangement type="review" />
            </div>
          </VueDraggable>
        </ScrollArea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DateValue } from "@internationalized/date";
import type { RouterOutput } from "~~/types";
import { VueDraggable } from "vue-draggable-plus";
import { deepCopy } from "~~/app/lib/utils";

definePageMeta({
  layout: "admin",
});

const { $trpc } = useNuxtApp();
const queryClient = useQueryClient();
const { data: arrangementList } = useQuery({
  queryFn: () => $trpc.arrangements.list.query(),
  queryKey: ["arrangements.list"],
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
});
const { data: approvedSongs } = useQuery({
  queryFn: () => $trpc.arrangements.listApproved.query(),
  queryKey: ["arrangements.listApproved"],
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
});

const pickedDate = ref<DateValue>();
const editableArrangementList = ref<RouterOutput["arrangements"]["list"]>([]);
const editableApprovedSongs = ref<RouterOutput["arrangements"]["listApproved"]>([]);
const hasChanges = ref(false);

const { mutate: updateOrder, isPending: isSaving } = useMutation({
  mutationFn: $trpc.arrangements.updateOrder.mutate,
  mutationKey: ["arrangements.updateOrder"],
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["arrangements.list"] });
    queryClient.invalidateQueries({ queryKey: ["arrangements.listApproved"] });
    toast.success("排歌成功");
  },
  onError: (err) => {
    hasChanges.value = true;
    useErrorHandler(err);
  },
});

function addDate() {
  if (!pickedDate.value) {
    toast.error("请选择要添加的日期");
    return;
  }
  const date = pickedDate.value.toString();
  if (editableArrangementList.value.find(day => day.date === date)) {
    toast.error("该日期已存在");
    return;
  }
  const insertIndex = editableArrangementList.value.findIndex(day => day.date < date);
  if (insertIndex === -1) {
    editableArrangementList.value.push({ date, songs: [] });
  } else {
    editableArrangementList.value.splice(insertIndex, 0, { date, songs: [] });
  }
  pickedDate.value = undefined;
  onDragEnd();
}

watch(
  [() => arrangementList.value, () => approvedSongs.value],
  ([arrangementNewVal, pendingNewVal]) => {
    if (arrangementNewVal) {
      editableArrangementList.value = deepCopy(arrangementNewVal);
    }
    if (pendingNewVal) {
      editableApprovedSongs.value = deepCopy(pendingNewVal);
    }
    hasChanges.value = false;
  },
  { immediate: true, deep: true },
);

function onDragEnd() {
  hasChanges.value = checkForChanges();
}

function checkForChanges(): boolean {
  if (!editableArrangementList.value || !arrangementList.value) {
    return false;
  }

  if (approvedSongs.value && editableApprovedSongs.value) {
    if (approvedSongs.value.length !== editableApprovedSongs.value.length)
      return true;
  }

  if (editableArrangementList.value.length !== arrangementList.value.length)
    return true;

  // each day's order
  for (const currentDay of editableArrangementList.value) {
    const originalDay = arrangementList.value.find(
      day => day.date === currentDay.date,
    );
    if (!originalDay) {
      return true;
    }
    if (currentDay.songs.length !== originalDay.songs.length) {
      return true;
    }
    // order
    for (let j = 0; j < currentDay.songs.length; j++) {
      if (currentDay.songs[j]?.id !== originalDay.songs[j]?.id)
        return true;
    }
  }
  return false;
}

function calculateChanges() {
  const changes: { date: string; songOrder: number[] }[] = [];

  if (!editableArrangementList.value || !arrangementList.value) {
    return changes;
  }

  const changedApprovedSong = editableApprovedSongs.value.filter(
    song => !approvedSongs.value || song.id !== approvedSongs.value.find(s => s.id === song.id)?.id,
  );

  if (changedApprovedSong) {
    changes.push({ date: "approved", songOrder: changedApprovedSong.map(song => song.id) });
  }

  for (const day of editableArrangementList.value) {
    const originalDay = arrangementList.value.find(
      d => d.date === day.date,
    );

    if (originalDay) {
      const currentOrder = day.songs.map(song => song.id);
      const originalOrder = originalDay.songs.map(song => song.id);
      const orderChanged = !currentOrder.every((id, index) => id === originalOrder[index]);
      const lengthChanged = currentOrder.length !== originalOrder.length;

      if (orderChanged || lengthChanged) {
        changes.push({ date: day.date, songOrder: currentOrder });
      }
    } else {
      // 如果是新的日期（虽然这种情况不太可能发生），也添加到变化中
      changes.push({ date: day.date, songOrder: day.songs.map(song => song.id) });
    }
  }
  return changes;
}

async function saveChanges() {
  if (!hasChanges.value || isSaving.value) {
    return;
  }
  const changes = calculateChanges();
  updateOrder(changes);
  hasChanges.value = false;
}

function resetChanges() {
  if (!hasChanges.value || isSaving.value) {
    return;
  }
  editableArrangementList.value = arrangementList.value ? deepCopy(arrangementList.value) : [];
  editableApprovedSongs.value = approvedSongs.value ? deepCopy(approvedSongs.value) : [];
  hasChanges.value = false;
}
</script>
