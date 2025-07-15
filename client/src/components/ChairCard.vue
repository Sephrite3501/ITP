<template>
  <div
    class="border border-black rounded-md p-3 w-full max-w-[160px] mx-auto
           bg-white flex flex-col items-center text-center shadow-sm"
  >

    <div class="w-20 h-20 mb-2 relative">
      <img
        v-if="member.profile_image_path"
        :src="member.profile_image_path"
        :alt="`Photo of ${member.name}`"
        class="w-full h-full object-cover rounded-full"
      />

      <div
        v-else
        class="w-full h-full bg-blue-200 flex items-center justify-center rounded-full text-xs font-medium text-blue-900 p-2"
      >
        {{ initials }}
      </div>
    </div>


    <p class="text-xs font-medium text-gray-800">{{ member.name || '—' }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  member: {
    type: Object,
    required: true,
    // expected shape: { id, name, profile_image_path }
    default: () => ({ id: null, name: '', profile_image_path: null })
  }
})

const initials = computed(() => {
  return (props.member.name || '')
    .split(' ')
    .map(w => w[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('')
})
</script>
