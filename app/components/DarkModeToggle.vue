<template>
  <Button variant="outline" size="sm" @click="toggleDark">
    <Icon
      name="lucide:sun"
      class="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
    />
    <Icon
      name="lucide:moon"
      class="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
    />
    <span class="sr-only">Toggle theme</span>
  </Button>
</template>

<script setup lang="ts">
const colorMode = useColorMode();
function toggleDark() {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}
</script>
