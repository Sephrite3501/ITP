<template>
  <div class="content-mgmt">
    <h1>Content Management</h1>

    <!-- ✅ Grid wrapper OUTSIDE the form -->
    <div class="card-grid">
      <!-- Carousel images -->
      <section class="card">
        <h2>Carousel Slides</h2>
        <div
          v-for="(url, i) in content.carousel"
          :key="i"
          class="field"
        >
          <label>Slide {{ i + 1 }} Image URL</label>
          <input
            type="text"
            v-model="content.carousel[i]"
            placeholder="Paste image URL or use upload"
          />
          <input
            type="file"
            @change="onFileChange($event, i)"
          />
        </div>
      </section>

      <!-- Introduction -->
      <section class="card">
        <h2>Introduction</h2>
        <label>Title</label>
        <input type="text" v-model="content.intro.title" />

        <label>Body</label>
        <textarea v-model="content.intro.body" rows="4" />
      </section>

      <!-- Vision & Mission -->
      <section class="card">
        <h2>Vision & Mission</h2>
        <label>Vision</label>
        <textarea v-model="content.vision" rows="2" />

        <label>Mission</label>
        <textarea v-model="content.mission" rows="2" />
      </section>

      <!-- Our Community -->
      <section class="card">
        <h2>Our Community</h2>
        <div
          v-for="(card, idx) in content.community"
          :key="idx"
          class="field"
        >
          <label>Card {{ idx + 1 }} Title</label>
          <input type="text" v-model="card.title" />

          <label>Description</label>
          <textarea v-model="card.body" rows="2" />
        </div>
      </section>
    </div>

    <!-- ✅ Form only wraps the button -->
    <form @submit.prevent="saveContent" class="submit-wrapper">
      <button type="submit">💾 Save All</button>
    </form>
  </div>
</template>




<script>
export default {
  name: 'ContentManagement',
  data() {
    return {
      content: {
        carousel: ['', '', '', ''],
        intro:    { title: '', body: '' },
        vision:   '',
        mission:  '',
        community: [
          { title: '', body: '' },
          { title: '', body: '' },
          { title: '', body: '' },
        ],
      },
    }
  },
  methods: {
    loadContent() {
      // Uses the same /api prefix—be sure to proxy this in vite.config.js to your backend
      fetch('/api/content')
        .then(r => r.json())
        .then(data => {
          this.content = data;
        })
        .catch(err => console.error('loadContent error', err));
    },
    onFileChange(event, idx) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        // Vue 3: use splice to update a reactive array entry
        this.content.carousel.splice(idx, 1, e.target.result);
      };
      reader.readAsDataURL(file);
    },
    saveContent() {
      fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.content),
      })
        .then(res => {
          if (!res.ok) throw new Error(res.statusText);
          alert('Content saved successfully!');
        })
        .catch(err => {
          console.error('saveContent error', err);
          alert(`Failed to save: ${err.message}`);
        });
    },
  },
  mounted() {
    this.loadContent();
  },
};
</script>

<style scoped>
.content-mgmt {
  background-color: #c0bebe;
  min-height: 100vh;
  padding: 2rem 2rem 4rem 240px; /* Leave space for fixed sidebar */
  color: #2c3e50;
}

h1 {
  color: #ffffff;
  font-size: 50px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 1rem;
  display: inline-block;
  transition: color 0.3s ease;
}

h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.card {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  border: 1px solid #eee;
}

.field {
  margin-bottom: 1.25rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

input[type="text"],
textarea {
  width: 100%;
  padding: 0.65rem 0.75rem;
  font-size: 0.95rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f9f9f9;
  transition: border-color 0.2s;
}

input[type="text"]:focus,
textarea:focus {
  border-color: #00c853;
  outline: none;
  background-color: #fff;
}

input[type="file"] {
  margin-top: 0.5rem;
}

button[type="submit"] {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  background-color: #00c853;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button[type="submit"]:hover {
  background-color: #00b34a;
}

.submit-wrapper {
  display: flex;
  justify-content: center;
}


</style>
