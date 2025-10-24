<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-vue-next'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  show?: boolean
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
  duration: 3000,
  show: false,
})

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(props.show)
let timeoutId: NodeJS.Timeout | null = null

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
}

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
}

const close = () => {
  isVisible.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  emit('close')
}

const startTimer = () => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  if (props.duration > 0) {
    timeoutId = setTimeout(() => {
      close()
    }, props.duration)
  }
}

watch(() => props.show, (newVal) => {
  isVisible.value = newVal
  if (newVal) {
    startTimer()
  }
})

onMounted(() => {
  if (props.show) {
    startTimer()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="isVisible"
        class="fixed top-4 right-4 z-50 max-w-md w-full shadow-lg rounded-lg border-2 p-4"
        :class="colors[type]"
        role="alert"
      >
        <div class="flex items-start gap-3">
          <component
            :is="icons[type]"
            class="w-5 h-5 flex-shrink-0 mt-0.5"
            :class="iconColors[type]"
          />
          <div class="flex-1">
            <p class="text-sm font-medium">{{ message }}</p>
          </div>
          <button
            @click="close"
            class="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
