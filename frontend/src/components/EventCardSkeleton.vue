<script setup lang="ts">
/**
 * EventCardSkeleton Component
 * Skeleton placeholder for event cards while loading
 */
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
    <!-- Status Badge Skeleton -->
    <div class="flex items-center gap-2 mb-3">
      <div class="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>

    <!-- Title Skeleton -->
    <div class="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>

    <!-- Description Skeleton -->
    <div class="space-y-2 mb-4">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>

    <!-- Details Skeleton -->
    <div class="space-y-2 mb-4">
      <div class="flex items-center gap-2">
        <div class="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
      </div>
      <div class="flex items-center gap-2">
        <div class="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
      <div class="flex items-center gap-2">
        <div class="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
      </div>
    </div>

    <!-- RSVP Stats Skeleton -->
    <div class="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
      <div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>

    <!-- Capacity Bar Skeleton -->
    <div class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full"></div>
    </div>

    <!-- Buttons Skeleton -->
    <div class="flex flex-col sm:flex-row gap-2 mt-4">
      <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
      <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
