<template>
  <Button variant="outline" size="sm" @click="toggleDark">
    <Icon name="lucide:sun" class="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
    <Icon name="lucide:moon" class="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    <span class="sr-only">Toggle theme</span>
  </Button>
</template>

<script setup lang="ts">
const colorMode = useColorMode();
function toggleDark() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}
</script>
