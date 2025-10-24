<script setup lang="ts">
import { X, AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-vue-next'

interface Props {
  show: boolean
  title: string
  message: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'danger',
  confirmText: 'Confirm',
  cancelText: 'Cancel'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}

const iconComponent = {
  danger: Trash2,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle
}

const iconColors = {
  danger: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900',
  warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900',
  info: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900',
  success: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900'
}

const buttonColors = {
  danger: 'btn-danger',
  warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
  info: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  success: 'btn-success'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-[100] overflow-y-auto"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-scale-in"
            @click.stop
          >
            <!-- Icon -->
            <div class="flex flex-col items-center pt-8 pb-4 px-6">
              <div 
                class="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                :class="iconColors[type]"
              >
                <component 
                  :is="iconComponent[type]" 
                  class="w-8 h-8"
                />
              </div>

              <!-- Title -->
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
                {{ title }}
              </h3>

              <!-- Message -->
              <p class="text-gray-600 dark:text-gray-300 text-center">
                {{ message }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 p-6 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
              <button
                @click="handleCancel"
                class="flex-1 btn bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {{ cancelText }}
              </button>
              <button
                @click="handleConfirm"
                class="flex-1 btn"
                :class="buttonColors[type]"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}

@keyframes scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-scale-in {
  animation: scale-in 0.3s ease-out;
}
</style>
