<template>
  <div v-if="images.length" class="carousel">
    <div class="slides">
      <transition name="fade" mode="in-out">
        <img
          :key="currentIndex"
          :src="images[currentIndex]"
          :alt="`Slide ${currentIndex + 1}`"
          class="slide-img"
        />
      </transition>
      <div class="caption">International Researchers Club</div>
    </div>

    <button class="arrow left"  @click="prev">&#10094;</button>
    <button class="arrow right" @click="next">&#10095;</button>

    <div class="dots">
      <span
        v-for="(_, idx) in images"
        :key="idx"
        class="dot"
        :class="{ active: currentIndex === idx }"
        @click="goTo(idx)"
      ></span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

// static default slides in the order you want
import slide1 from '@/assets/IRC1.jpg'
import slide2 from '@/assets/IRC2.jpg'
import slide3 from '@/assets/IRC3.jpg'
import slide4 from '@/assets/IRC4.jpg'

const defaultImages = [slide1, slide2, slide3, slide4]

// accept an optional images prop
const props = defineProps({
  images: {
    type: Array,
    default: () => []
  }
})

// if user passed images, use them; otherwise use the SIT defaults
const images = computed(() =>
  props.images.length >= 4 ? props.images : defaultImages
)

const currentIndex = ref(0)
let timer = null

function next() {
  currentIndex.value = (currentIndex.value + 1) % images.value.length
}
function prev() {
  currentIndex.value =
    (currentIndex.value - 1 + images.value.length) % images.value.length
}
function goTo(i) {
  currentIndex.value = i
}
function startAutoPlay() {
  stopAutoPlay()
  timer = setInterval(next, 5000)
}
function stopAutoPlay() {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

// reset to first slide whenever the images array changes
watch(
  images,
  () => {
    currentIndex.value = 0
    if (images.value.length) startAutoPlay()
    else stopAutoPlay()
  },
  { immediate: true }
)

onMounted(() => {
  if (images.value.length) startAutoPlay()
})

onBeforeUnmount(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.carousel {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
}
.slides {
  position: relative;
  width: 100%;
  height: 100%;
}
.slide-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Caption overlay */
.caption {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2.5rem;
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.7);
  pointer-events: none;
}

/* Arrows */
.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.8);
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 2rem;
  border-radius: 50%;
  user-select: none;
}
.arrow.left { left: 1rem; }
.arrow.right { right: 1rem; }

/* Dots */
.dots {
  position: absolute;
  bottom: 1rem;
  width: 100%;
  text-align: center;
}
.dot {
  display: inline-block;
  width: 12px; height: 12px;
  margin: 0 4px;
  background: rgba(255,255,255,0.6);
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.3s;
}
.dot.active,
.dot:hover {
  background: rgba(255,255,255,1);
}

/* Cross-fade animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}
.fade-enter-from,
.fade-leave-to { opacity: 0; }
.fade-enter-to,
.fade-leave-from { opacity: 1; }
</style>
