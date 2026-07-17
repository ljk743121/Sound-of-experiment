<template>
  <div class="grid gap-4">
    <div>
      <div class="justify-center text-center text-sm text-muted-foreground">
        选择下载 CSV 数据区段
      </div>
      <RangeCalendar
        :model-value="copyValue"
        :is-date-unavailable="isCopyDateUnavailable"
        locale="zh"
        class="p-0"
        @update:model-value="$emit('update:copyValue', $event)"
      />
      <div
        v-if="copyValue.start && copyValue.end"
        class="mt-3 flex items-center justify-between"
      >
        <Badge variant="outline">
          {{ copyValue.start }}
        </Badge>
        <Icon name="lucide:arrow-right" size="14" />
        <Badge variant="outline">
          {{ copyValue.end }}
        </Badge>
      </div>
    </div>

    <Button class="transition-all" @click="$emit('copyAll')">
      <Icon name="lucide:clipboard" class="mr-2" />
      下载选定区域全部歌曲 CSV 数据
    </Button>
  </div>
</template>

<script setup lang="ts">
import type { DateValue } from "@internationalized/date";
import type { DateRange } from "reka-ui";
import type { RouterOutput } from "~~/types";
import { RangeCalendar } from "@/components/ui/range-calendar";

const props = defineProps<{
  copyValue: DateRange;
  arrangementList: RouterOutput["arrangements"]["list"] | undefined;
}>();

defineEmits<{
  (e: "update:copyValue", value: DateRange): void;
  (e: "copyAll"): void;
}>();

function isCopyDateUnavailable(date: DateValue) {
  return !props.arrangementList?.some(x => x.date === date.toString());
}
</script>
