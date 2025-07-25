<template>
  <div>
    <!-- Carousel -->
    <Carousel :images="sanitizedContent.carousel" />

    <!-- Intro Section -->
    <section class="intro">
      <h1 class="intro-title">{{ sanitizedContent.intro.title }}</h1>
      <div class="intro-body">
        <p class="intro-text" v-html="sanitizedContent.intro.body"></p>
      </div>
    </section>

    <!-- Vision & Mission -->
    <section class="vision-mission">
      <h2 class="vm-title">IRC Vision and Mission</h2>
      <div class="vm-cards">
        <div class="vm-card vision">
          <div class="icon-wrapper">
            <img :src="visionIcon" alt="Vision Icon" />
          </div>
          <h3>IRC Vision</h3>
          <p>{{ sanitizedContent.vision }}</p>
        </div>
        <div class="vm-card mission">
          <div class="icon-wrapper">
            <img :src="missionIcon" alt="Mission Icon" />
          </div>
          <h3>IRC Mission</h3>
          <p>{{ sanitizedContent.mission }}</p>
        </div>
      </div>
    </section>

    <!-- Our Community -->
    <section class="community">
      <h2 class="community-title">— Our Community —</h2>
      <p class="community-subtitle">
        Building a Vibrant and Innovative Community
      </p>
      <div class="community-cards">
        <div
          v-for="(card, idx) in sanitizedContent.community"
          :key="idx"
          class="card"
        >
          <h3>{{ card.title }}</h3>
          <p>{{ card.body }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import DOMPurify from 'dompurify'
import Carousel from '@/components/Carousel.vue'

// Default static slides
import slide1 from '@/assets/SIT1.jpg'
import slide2 from '@/assets/SIT2.jpg'
import slide3 from '@/assets/SIT3.jpg'
import slide4 from '@/assets/SIT4.jpeg'

// Icons
import visionIcon from '@/assets/eye.svg'
import missionIcon from '@/assets/rocket.svg'

const content = ref({
  carousel: [slide1, slide2, slide3, slide4],
  intro: {
    title: '',
    body: ''
  },
  vision: '',
  mission: '',
  community: []
})

async function loadContent() {
  try {
    const res = await fetch('/api/content')
    if (!res.ok) throw new Error(res.statusText)
    content.value = await res.json()
  } catch (err) {
    console.error('Home load error', err)
  }
}

onMounted(loadContent)

// Build a fully sanitized mirror of content
const sanitizedContent = computed(() => ({
  // sanitize each image URL (strip any scripts)
  carousel: content.value.carousel.map(url => DOMPurify.sanitize(url)),

  intro: {
    title:  DOMPurify.sanitize(content.value.intro.title),
    body:   DOMPurify.sanitize(content.value.intro.body)
  },

  vision:  DOMPurify.sanitize(content.value.vision),
  mission: DOMPurify.sanitize(content.value.mission),

  community: (content.value.community || []).map(card => ({
    title: DOMPurify.sanitize(card.title),
    body:  DOMPurify.sanitize(card.body)
  }))
}))
</script>

<style scoped>
/* Global wrapper spacing */
div {
  padding-bottom: 4rem;
}

/* --- Intro Section --- */
.intro {
  background-color: #f9f9f9;
  padding: 4rem 1.5rem;
  text-align: center;
}
.intro-title {
  font-size: 2.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1a1a1a;
}
.intro-text {
  max-width: 850px;
  margin: 0 auto;
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
}
.intro-text a {
  color: #007bff;
  text-decoration: underline;
}
.intro-text a:hover {
  color: #0056b3;
}

/* --- Vision & Mission --- */
.vision-mission {
  background-color: #93bfe7;
  padding: 4rem 1.5rem;
  text-align: center;
}
.vm-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #2c3e50;
}
.vm-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
}
.vm-card {
  position: relative;
  flex: 1;
  min-width: 260px;
  max-width: 380px;
  padding: 2rem 1.5rem 1.5rem;
  background-color: #fffaf3;
  border: 1px solid #fce7c1;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
.icon-wrapper {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #eee;
  border-radius: 50%;
  padding: 1rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-wrapper img {
  width: 40px;
  height: 40px;
}
.vm-card.vision .icon-wrapper {
  background-color: #e63946;
}
.vm-card.mission .icon-wrapper {
  background-color: #2a9d8f;
}
.vm-card.vision h3 {
  color: #e63946;
}
.vm-card.mission h3 {
  color: #2a9d8f;
}
.vm-card h3 {
  margin-top: 2.5rem;
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}
.vm-card p {
  font-size: 1rem;
  line-height: 1.6;
  color: #444;
  max-width: 300px;
  margin: 0 auto;
}

/* --- Our Community --- */
.community {
  background-color: #f9f9f9;
  padding: 4rem 1.5rem;
  text-align: center;
}
.community-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}
.community-subtitle {
  font-size: 1.15rem;
  color: #2a9d8f;
  margin-bottom: 3rem;
}
.community-cards {
  max-width: 1140px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
}
.community-cards .card {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.community-cards .card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.08);
}
.community-cards .card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
}
.community-cards .card p {
  font-size: 1rem;
  line-height: 1.6;
  color: #555;
}
</style>
