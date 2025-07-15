<template>
  <div
    :class="[
      'rounded-md border p-4 flex flex-col items-center text-center transition max-w-[200px] w-full mx-auto',
      isHighlighted
        ? 'bg-blue-900 text-white shadow-md shadow-blue-300'
        : 'bg-white text-gray-800'
    ]"
  >

    <p class="mb-3 font-semibold text-sm capitalize">{{ role }}</p>
    <div class="w-20 h-20 mb-2 relative">

      <img
        v-if="member.profile_image_path"
        :src="member.profile_image_path"
        :alt="`Photo of ${member.name}`"
        class="w-full h-full object-cover rounded-full"
      />

      <div
        v-else
        class="w-full h-full bg-blue-100 flex items-center justify-center rounded-full text-xs font-medium text-blue-900 p-2"
      >
        {{ initials }}
      </div>
    </div>


    <p class="text-sm font-medium">{{ member.name || '—' }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  role:   { type: String, required: true },
  member: {
    type: Object,
    required: true,
   
    default: () => ({ id: null, name: '', profile_image_path: null })
  }
})

const isHighlighted = computed(
  () => props.role.toLowerCase() === 'President'
)

const initials = computed(() => {
  return (props.member.name || '')
    .split(' ')
    .map(w => w[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('')
})
</script>
