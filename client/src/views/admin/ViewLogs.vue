<template>
  <div class="view-logs">
    <h1 class="logs-title">View Logs</h1>

    <!-- Filter Controls -->
    <form @submit.prevent="fetchLogs" class="filters">
      <label>
        Log Type:
        <select v-model="logType">
          <option value="admin">Admin</option>
          <option value="audit">Audit</option>
          <option value="auth">Auth</option>
          <option value="csrf">CSRF</option>
          <option value="error">Error</option>
          <option value="session">Session</option>
        </select>
      </label>

      <label>
        Search:
        <input
          type="text"
          v-model.trim="searchTerm"
          placeholder="Search logs..."
        />
      </label>

      <label>
        From:
        <input type="date" v-model="fromDate" />
      </label>
      <label>
        To:
        <input type="date" v-model="toDate" />
      </label>

      <button type="submit">Filter</button>
    </form>

    <!-- Logs Table -->
    <table class="logs-table">
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Action</th>
          <th>Details</th>
          <th>Ref ID</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in filteredLogs" :key="log.id">
          <td>{{ formatDate(log.created_at) }}</td>
          <td>{{ log.action }}</td>
          <td>{{ log.details }}</td>
          <td>{{ log.ref_id }}</td>
        </tr>
        <tr v-if="filteredLogs.length === 0">
          <td colspan="4">No entries found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'ViewLogs',
  data() {
    return {
      logs: [],
      searchTerm: '',
      fromDate: '',
      toDate: '',
      logType: 'admin' // default type
    };
  },
  computed: {
    filteredLogs() {
      const term = this.searchTerm.toLowerCase();
      return this.logs.filter(log => {
        return (
          log.action.toLowerCase().includes(term) ||
          log.details.toLowerCase().includes(term)
        );
      });
    }
  },
  methods: {
    async fetchLogs() {
      const params = new URLSearchParams();
      if (this.fromDate) {
        params.append('from', this.fromDate);
      }
      if (this.toDate) {
        // inclusive end-date: bump by one day
        const dt = new Date(this.toDate);
        dt.setDate(dt.getDate() + 1);
        const toParam = dt.toISOString().split('T')[0];
        params.append('to', toParam);
      }
      const url = `/api/logs/${this.logType}?${params.toString()}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.statusText);
        this.logs = await res.json();
      } catch (err) {
        console.error('Failed to fetch logs', err);
        this.logs = [];
      }
    },
    formatDate(ts) {
      const d = new Date(ts);
      return d.toLocaleString();
    }
  },
  watch: {
    logType: 'fetchLogs',
    fromDate: 'fetchLogs',
    toDate: 'fetchLogs'
  },
  mounted() {
    this.fetchLogs();
  }
};
</script>

<style scoped>
.view-logs {
  padding: 1rem;
}
.logs-title {
  margin-bottom: 1rem;
  color: black;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}
.filters select,
.filters input[type="text"],
.filters input[type="date"] {
  padding: 0.4rem;
  border: 1px solid #000;
  border-radius: 4px;
  background: #fff;
  color: #000;
}
.filters button {
  padding: 0.5rem 1rem;
  border: 1px solid #000;
  background: #fff;
  color: #000;
  border-radius: 4px;
  cursor: pointer;
}
.filters button:hover {
  background: #f0f0f0;
}
.logs-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid black;
}
.logs-table th,
.logs-table td {
  border: 1px solid black;
  padding: 0.5rem;
  text-align: left;
  color: black;
}
.logs-table th {
  background-color: #f5f5f5;
  color: black;
}
</style>
