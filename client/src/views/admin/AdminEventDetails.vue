<template>
  <section v-if="event" class="event-page">
    <!-- Left: Event Details -->
    <div class="event-details">
      <h2 class="event-title">{{ event.name }}</h2>

        <!-- Banner Image -->
        <div v-if="event.image_paths?.banner" class="banner-section">
        <h3 class="font-semibold mb-2">Banner</h3>
        <img :src="event.image_paths.banner" class="banner-img" />
        </div>

      <div class="event-info">
        <p><strong>📅 Date:</strong> {{ formatDate(event.date) }}</p>
        <p><strong>📍 Location:</strong> {{ event.location }}</p>
        <p><strong>🎯 Type:</strong> {{ event.event_type }}</p>
        <p><strong>📝 Description:</strong> {{ event.description }}</p>
      </div>

        <!-- Guest Speaker Images -->
        <div v-if="event.image_paths?.guests?.length" class="guests-section">
        <h3 class="font-semibold mb-2">Guest Speakers</h3>
        <div class="guests-grid">
            <img
            v-for="(img, i) in event.image_paths.guests"
            :key="i"
            :src="img"
            class="guest-img"
            />
        </div>
        </div>
        <div v-else class="text-center text-gray-500 text-lg italic mt-10">
            Loading event details...
        </div>

    </div>

    <!-- Right: Registered Users -->
    <div class="registered-users">
      <h3>Registered Users</h3>
      <div class="table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Pax</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in registeredUsers" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ parseDetails(user.details).phone }}</td>
              <td>{{ parseDetails(user.details).pax }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex gap-3 justify-end">
        <button @click="exportToCSV"
            class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
            Export CSV
        </button>

        <button @click="exportToExcel"
            class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition">
            Export Excel
        </button>
        </div>
    </div>
  </section>
</template>





<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import * as XLSX from 'xlsx'

const route = useRoute()
const router = useRouter()
const event = ref(null)
const toast = useToast()
const registeredUsers = ref([])

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleString('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true
  })
}

onMounted(async () => {
  const slug = route.params.slug;

  try {
    const res = await fetch(`/api/events/${slug}`);
    if (!res.ok) throw new Error('Event not found');

    const eventData = await res.json();

    // Process images
    const newImagePaths = {};

    if (eventData.image_paths?.banner) {
      const bannerRes = await fetch(`http://localhost:3001${eventData.image_paths.banner}`);
      const bannerBlob = await bannerRes.blob();
      newImagePaths.banner = await blobToDataURL(bannerBlob);
    }

    if (Array.isArray(eventData.image_paths?.guests)) {
      newImagePaths.guests = await Promise.all(
        eventData.image_paths.guests.map(async (guestPath) => {
          const guestRes = await fetch(`http://localhost:3001${guestPath}`);
          const guestBlob = await guestRes.blob();
          return await blobToDataURL(guestBlob);
        })
      );
    }

    eventData.image_paths = newImagePaths;
    event.value = eventData;

    // Fetch registered users
    const userRes = await fetch(`/api/admin/${eventData.id}/registrations`);
    if (userRes.ok) {
      const rawUsers = await userRes.json();

      // Parse `details` string into object
      registeredUsers.value = rawUsers.map(user => {
        const parsed = parseDetails(user.details || "");
        return {
          ...user,
          phone: parsed.phone || '',
          pax: parsed.pax || '',
        };
      });
    } else {
      toast.warning('Could not load registered users.');
    }

  } catch (err) {
    console.error('Failed to load event details:', err);
    router.replace({ name: 'NotFound' });
  }
});

function parseDetails(detailsStr) {
  const obj = {};
  for (const part of detailsStr.split(',')) {
    const [key, value] = part.split(':').map(s => s.trim());
    if (key && value) obj[key.toLowerCase()] = value;
  }
  return obj; // { name: "...", email: "...", phone: "...", pax: "..." }
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function exportToCSV() {
  let csvContent = 'Name,Email,Phone,Pax\n'

  for (const user of registeredUsers.value) {
    const parsed = parseDetails(user.details || '')
    const row = [
      `"${user.name}"`,
      `"${user.email}"`,
      `"${parsed.phone || ''}"`,
      `"${parsed.pax || ''}"`
    ].join(',')
    csvContent += row + '\n'
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${event.value?.name || 'event'}_registrations.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function exportToExcel() {
  const worksheetData = registeredUsers.value.map(user => {
    const parsed = parseDetails(user.details || '')
    return {
      Name: user.name,
      Email: user.email,
      Phone: parsed.phone || '',
      Pax: parsed.pax || ''
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations')

  XLSX.writeFile(workbook, `${event.value?.name || 'event'}_registrations.xlsx`)
}

</script>

<style scoped>
.event-page {
  display: flex;
  flex-direction: row;
  gap: 24px;
  padding: 48px 24px;
  background-color: #f3f4f6; /* Tailwind's gray-100 */
  min-height: 80vh;
}

.event-details {
  flex: 1;
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

.registered-users {
  flex: 1;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  max-height: 600px;
  overflow: auto;
}

.event-title {
  font-size: 28px;
  font-weight: bold;
  color: #1f2937; /* Tailwind's gray-900 */
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb; /* Tailwind's gray-200 */
  padding-bottom: 12px;
}

.banner-section,
.guests-section {
  text-align: center;
  margin-top: 24px;
}

.banner-img {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.guests-grid {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.guest-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.guests-grid {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
}

.event-info {
  text-align: center;
  color: #374151; /* Tailwind's gray-800 */
  font-size: 18px;
  line-height: 1.7;
  margin-top: 24px;
}

.table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;
}

.users-table th,
.users-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #d1d5db; /* gray-300 */
  text-align: left;
}

.users-table th {
  background-color: #fff;
  position: sticky;
  top: 0;
}
</style>


