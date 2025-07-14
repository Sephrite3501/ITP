<template>
  <section class="membership-container">
    <div class="membership-box">
      <h1 class="membership-title">IRC Membership Types</h1>

      <div class="membership-cards">
        <div class="membership-card">
          <h2>Junior Membership</h2>
          <div class="membership-price">$30</div>
          <p>For 2 Years</p>
          <p>Eligibility: high-school or college students without first degree.</p>
          <ul>
            <li>Entitled to use IRC membership benefits.</li>
            <li>Can publish paper in IRC-SET conferences at free of charge.</li>
            <li>Not entitled to vote at General Meetings.</li>
            <li>Not entitled to stand for election to the Executive Committee.</li>
          </ul>
        </div>

        <div class="membership-card">
          <h2>Ordinary Membership</h2>
          <div class="membership-price">$60</div>
          <p>For 2 Years</p>
          <p>Eligibility: holders of first degree and above.</p>
          <ul>
            <li>Entitled to use IRC membership benefits.</li>
            <li>Can publish paper in IRC-SET conferences at free of charge.</li>
            <li>Entitled to vote at General Meetings.</li>
            <li>Entitled to stand for election to the Executive Committee.</li>
          </ul>
        </div>

        <div class="membership-card">
          <h2>Corporate Membership</h2>
          <div class="membership-price">$1000</div>
          <p>For 2 Years</p>
          <p>Eligibility: companies, institutes, and agencies.</p>
          <ul>
            <li>Entitled to use IRC membership benefits.</li>
            <li>Can publish paper in the IRC-SET conference at free of charge.</li>
            <li>Not entitled to vote at General Meetings.</li>
            <li>Not entitled to stand for election to the Executive Committee.</li>
          </ul>
        </div>
      </div>

      <router-link to="/signup" class="join-button">Join Now</router-link>
    </div>

    <div class="starhub-card">
      <h3>📱 Starhub Member Benefits</h3>
      <p>
        IRC members can enjoy <strong>20% to 30% corporate rate discount</strong> with Starhub,
        depending on mobile package signed up. Kindly produce IRC membership card during registration.
      </p>
      <p>
        <a href="http://www.starhub.com" target="_blank" rel="noopener noreferrer">
          Visit: www.starhub.com
        </a>
      </p>
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
.membership-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
  background: #f9fafb;
  min-height: 80vh;
}

.membership-box {
  max-width: 900px;
  width: 100%;
  text-align: center;
}

.membership-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #111827;
}

.membership-cards {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .membership-cards {
    flex-direction: row;
  }
}

.membership-card {
  flex: 1;
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  text-align: left;
}

.membership-card h2 {
  font-size: 1.25rem;
  color: #1e40af;
  margin-bottom: 0.3rem;
}

.membership-price {
  font-size: 1.75rem;
  color: #16a34a;
  font-weight: bold;
  margin: 0.3rem 0 0.5rem;
}

.membership-card p {
  font-size: 0.95rem;
  color: #374151;
  margin-bottom: 0.4rem;
}

.membership-card ul {
  margin-top: 0.5rem;
  padding-left: 1rem;
  color: #374151;
  font-size: 0.9rem;
}

.membership-card ul li {
  list-style: disc;
  margin-bottom: 0.3rem;
}

.join-button {
  display: inline-block;
  background-color: #16a34a;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
}

.join-button:hover {
  background-color: #15803d;
}

.starhub-card {
  margin-top: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  max-width: 900px;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  text-align: left;
  color: #1f2937;
}

.starhub-card h3 {
  font-size: 1.25rem;
  color: #16a34a;
  margin-bottom: 0.5rem;
}

.starhub-card p {
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.starhub-card a {
  color: #2563eb;
  text-decoration: underline;
}
</style>
