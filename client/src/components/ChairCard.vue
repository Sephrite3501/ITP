<template>
  <div
    class="border border-black rounded-md p-3 w-full max-w-[160px] mx-auto
           bg-white flex flex-col items-center text-center shadow-sm"
  >
    <div
      class="w-20 h-24 rounded bg-blue-200 flex items-center justify-center
             px-2 text-xs font-medium text-blue-900 leading-tight"
    >
      {{ member?.name ?? '<<Name>>' }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  member: { type: Object, required: true }
})
</script>
