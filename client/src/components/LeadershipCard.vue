<template>
  <div
    :class="[
      'rounded-md border p-4 flex flex-col items-center text-center transition',
      isHighlighted
        ? 'bg-blue-900 text-white shadow-md shadow-blue-300'
        : 'bg-white text-gray-800',
      'border-black max-w-[200px] w-full mx-auto'
    ]"
  >
    <p class="mb-3 font-semibold text-sm capitalize">{{ props.role }}</p>
    <div
      class="w-20 h-24 rounded bg-blue-100 flex items-center justify-center px-2
             text-xs font-medium text-blue-900"
    >
      {{ props.member.name || '—' }}
    </div>
  </div>
</template>


<script setup>
import { computed } from 'vue'

const props = defineProps({
  role:   { type: String, required: true },
  member: { type: Object, required: true }
})

const isHighlighted = computed(
  () => props.role.toLowerCase() === 'general chair'
)
</script>