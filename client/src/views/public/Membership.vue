<template>
  <section class="w-full flex flex-col items-center">
    <div class="w-full max-w-6xl py-12 text-center">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-8">IRC Membership Types</h1>
      <div class="mt-10 membership-cols mb-8">
        <!-- Junior Membership Card -->
        <div class="bg-white rounded-xl shadow p-6 text-left flex flex-col">
          <h2 class="text-lg font-semibold text-blue-700 mb-1">Junior Membership</h2>
          <div class="text-[1.6rem] font-bold text-green-600 mb-2">$30</div>
          <p class="text-sm text-gray-600 mb-1">For 2 Years</p>
          <p class="text-sm text-gray-600 mb-2">
            Eligibility: high-school or college students without first degree.
          </p>
          <ul class="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Entitled to use IRC membership benefits.</li>
            <li>Can publish paper in IRC-SET conferences at free of charge.</li>
            <li>Not entitled to vote at General Meetings.</li>
            <li>Not entitled to stand for election to the Executive Committee.</li>
          </ul>
        </div>

        <!-- Ordinary Membership Card -->
        <div class="bg-white rounded-xl shadow p-6 text-left flex flex-col">
          <h2 class="text-lg font-semibold text-blue-700 mb-1">Ordinary Membership</h2>
          <div class="text-[1.6rem] font-bold text-green-600 mb-2">$60</div>
          <p class="text-sm text-gray-600 mb-1">For 2 Years</p>
          <p class="text-sm text-gray-600 mb-2">
            Eligibility: holders of first degree and above.
          </p>
          <ul class="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Entitled to use IRC membership benefits.</li>
            <li>Can publish paper in IRC-SET conferences at free of charge.</li>
            <li>Entitled to vote at General Meetings.</li>
            <li>Entitled to stand for election to the Executive Committee.</li>
          </ul>
        </div>

        <!-- Corporate Membership Card -->
        <div class="bg-white rounded-xl shadow p-6 text-left flex flex-col">
          <h2 class="text-lg font-semibold text-blue-700 mb-1">Corporate Membership</h2>
          <div class="text-[1.6rem] font-bold text-green-600 mb-2">$1000</div>
          <p class="text-sm text-gray-600 mb-1">For 2 Years</p>
          <p class="text-sm text-gray-600 mb-2">
            Eligibility: companies, institutes, and agencies.
          </p>
          <ul class="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Entitled to use IRC membership benefits.</li>
            <li>Can publish paper in the IRC-SET conference at free of charge.</li>
            <li>Not entitled to vote at General Meetings.</li>
            <li>Not entitled to stand for election to the Executive Committee.</li>
          </ul>
        </div>
      </div>

      <router-link
        to="/signup"
        class="inline-block px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition"
      >
        Join Now
      </router-link>
    </div>

    <div class="mt-10 w-full max-w-6xl">
      <div class="bg-white rounded-xl shadow p-6 text-left text-gray-800">
        <h3 class="text-lg font-semibold text-green-600 mb-2">📱 Starhub Member Benefits</h3>
        <p class="text-sm mb-2">
          IRC members can enjoy <strong>20% to 30% corporate rate discount</strong> with Starhub,
          depending on mobile package signed up. Kindly produce IRC membership card during registration.
        </p>
        <p class="text-sm">
          <a
            href="http://www.starhub.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 underline hover:text-blue-800"
          >
            Visit: www.starhub.com
          </a>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { logSecurityClient } from '@/utils/logUtils'

onMounted(() => {
  document.title = 'IRC Membership | IRC'

  // Optional: track view of public membership info
  logSecurityClient({
    category: 'public',
    action: 'view_membership',
    details: 'User visited membership info page',
    severity: 'low'
  })
})
</script>

<style scoped>
.membership-cols {
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* About Tailwind's gap-6 */
  width: 100%;
}

@media (min-width: 768px) {
  .membership-cols {
    flex-direction: row;
    gap: 1.5rem;
  }
  .membership-cols > div {
    flex: 1;
  }
}
</style>