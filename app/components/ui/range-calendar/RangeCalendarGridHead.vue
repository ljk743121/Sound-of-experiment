<template>
  <RangeCalendarGridHead v-bind="props">
    <slot />
  </RangeCalendarGridHead>
</template>

<script lang="ts" setup>
import { RangeCalendarGridHead, type RangeCalendarGridHeadProps } from 'radix-vue';

const props = defineProps<RangeCalendarGridHeadProps>();
</script>
