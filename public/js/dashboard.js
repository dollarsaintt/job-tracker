// ===== SETUP =====
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

// Redirect to login if not logged in
if (!token) {
  window.location.href = '/pages/login.html';
}

// Set user name in navbar
document.getElementById('navUser').textContent = `👋 ${user?.name}`;

// Alert helper
const showAlert = (id, message, type) => {
  const alert = document.getElementById(id);
  alert.textContent = message;
  alert.className = `alert show ${type}`;
  setTimeout(() => { alert.className = 'alert'; }, 4000);
};

// Auth headers helper
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
});

// ===== STATS =====
const loadStats = async () => {
  try {
    const res = await fetch('/api/jobs/stats/summary', { headers: authHeaders() });
    const data = await res.json();
    document.getElementById('statTotal').textContent = data.total;
    document.getElementById('statApplied').textContent = data.applied;
    document.getElementById('statInterview').textContent = data.interview;
    document.getElementById('statOffer').textContent = data.offer;
    document.getElementById('statRejected').textContent = data.rejected;
    renderChart(data.applied, data.interview, data.offer, data.rejected);
  } catch (error) {
    console.error('Failed to load stats', error);
  }
};

// ===== LOAD JOBS =====
let allJobs = [];

const loadJobs = async () => {
  try {
    const res = await fetch('/api/jobs', { headers: authHeaders() });
    const data = await res.json();
    allJobs = data;
    renderJobs(allJobs);
    loadStats();
  } catch (error) {
    console.error('Failed to load jobs', error);
  }
};

// ===== RENDER JOBS =====
const renderJobs = (jobs) => {
  const tbody = document.getElementById('jobsTableBody');
  const noJobs = document.getElementById('noJobs');
  tbody.innerHTML = '';

  if (jobs.length === 0) {
    noJobs.style.display = 'block';
    return;
  }

  noJobs.style.display = 'none';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  jobs.forEach(job => {
    const row = document.createElement('tr');

    let deadlineDisplay = '—';
    let deadlineClass = '';
    let rowClass = '';

    if (job.deadline) {
      const deadlineDate = new Date(job.deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        deadlineDisplay = `${job.deadline} (Overdue)`;
        deadlineClass = 'deadline-danger';
        rowClass = 'row-danger';
      } else if (daysLeft <= 7) {
        deadlineDisplay = `${job.deadline} (${daysLeft}d left)`;
        deadlineClass = 'deadline-warning';
        rowClass = 'row-warning';
      } else {
        deadlineDisplay = job.deadline;
      }
    }

    if (rowClass) row.classList.add(rowClass);

    row.innerHTML = `
      <td><strong>${job.company}</strong></td>
      <td>${job.position}</td>
      <td><span class="badge badge-${job.status.toLowerCase()}">${job.status}</span></td>
      <td>${job.location || '—'}</td>
      <td>${job.salary ? '$' + parseFloat(job.salary.replace(/[^0-9.]/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
      <td>${job.apply_date || '—'}</td>
      <td class="${deadlineClass}">${deadlineDisplay}</td>
      <td>
        <button class="btn-edit" onclick="openEditModal(${job.id})">Edit</button>
        <button class="btn-delete" onclick="deleteJob(${job.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
};

// ===== SEARCH & FILTER =====
const filterJobs = () => {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;

  const filtered = allJobs.filter(job => {
    const matchSearch =
      job.company.toLowerCase().includes(search) ||
      job.position.toLowerCase().includes(search);
    const matchStatus = status === '' || job.status === status;
    return matchSearch && matchStatus;
  });

  renderJobs(filtered);
};

document.getElementById('searchInput').addEventListener('input', filterJobs);
document.getElementById('filterStatus').addEventListener('change', filterJobs);

// ===== MODAL =====
let editingJobId = null;

const openAddModal = () => {
  editingJobId = null;
  document.getElementById('modalTitle').textContent = 'Add Job';
  document.getElementById('modalCompany').value = '';
  document.getElementById('modalPosition').value = '';
  document.getElementById('modalStatus').value = 'Applied';
  document.getElementById('modalLocation').value = '';
  document.getElementById('modalSalary').value = '';
  document.getElementById('modalApplyDate').value = '';
  document.getElementById('modalDeadline').value = '';
  document.getElementById('modalNotes').value = '';
  document.getElementById('modalOverlay').classList.add('show');
};

const openEditModal = (id) => {
  const job = allJobs.find(j => j.id === id);
  if (!job) return;
  editingJobId = id;
  document.getElementById('modalTitle').textContent = 'Edit Job';
  document.getElementById('modalCompany').value = job.company;
  document.getElementById('modalPosition').value = job.position;
  document.getElementById('modalStatus').value = job.status;
  document.getElementById('modalLocation').value = job.location || '';
  document.getElementById('modalSalary').value = job.salary || '';
  document.getElementById('modalApplyDate').value = job.apply_date || '';
  document.getElementById('modalDeadline').value = job.deadline || '';
  document.getElementById('modalNotes').value = job.notes || '';
  document.getElementById('modalOverlay').classList.add('show');
};

const closeModal = () => {
  document.getElementById('modalOverlay').classList.remove('show');
  editingJobId = null;
};

document.getElementById('addJobBtn').addEventListener('click', openAddModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalCancelBtn').addEventListener('click', closeModal);

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

// ===== SAVE JOB (ADD or EDIT) =====
document.getElementById('modalSaveBtn').addEventListener('click', async () => {
  const company = document.getElementById('modalCompany').value.trim();
  const position = document.getElementById('modalPosition').value.trim();
  const status = document.getElementById('modalStatus').value;
  const location = document.getElementById('modalLocation').value.trim();
  const salary = document.getElementById('modalSalary').value.trim();
  const apply_date = document.getElementById('modalApplyDate').value;
  const deadline = document.getElementById('modalDeadline').value;
  const notes = document.getElementById('modalNotes').value.trim();

  if (!company || !position) {
    return showAlert('modalAlert', 'Company and position are required.', 'error');
  }

  const body = { company, position, status, location, salary, apply_date, deadline, notes };

  try {
    const url = editingJobId ? `/api/jobs/${editingJobId}` : '/api/jobs';
    const method = editingJobId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return showAlert('modalAlert', data.error, 'error');
    }

    closeModal();
    loadJobs();
    showAlert('alert', editingJobId ? 'Job updated successfully.' : 'Job added successfully.', 'success');

  } catch (error) {
    showAlert('modalAlert', 'Something went wrong. Please try again.', 'error');
  }
});

// ===== DELETE JOB =====
const deleteJob = async (id) => {
  if (!confirm('Are you sure you want to delete this job?')) return;

  try {
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      return showAlert('alert', data.error, 'error');
    }

    loadJobs();
    showAlert('alert', 'Job deleted successfully.', 'success');

  } catch (error) {
    showAlert('alert', 'Something went wrong. Please try again.', 'error');
  }
};

// ===== CHART =====
let statusChart = null;

const renderChart = (applied, interview, offer, rejected) => {
  const ctx = document.getElementById('statusChart').getContext('2d');

  if (statusChart) {
    statusChart.destroy();
  }

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Applied', 'Interview', 'Offer', 'Rejected'],
      datasets: [{
        data: [applied, interview, offer, rejected],
        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 20, font: { size: 13 } }
        },
        title: {
          display: true,
          text: 'Applications by Status',
          font: { size: 16, weight: 'bold' },
          padding: { bottom: 20 }
        }
      }
    }
  });
};

// ===== EXPORT CSV =====
document.getElementById('exportBtn').addEventListener('click', () => {
  if (allJobs.length === 0) {
    return showAlert('alert', 'No jobs to export.', 'error');
  }

  const headers = ['Company', 'Position', 'Status', 'Location', 'Salary', 'Apply Date', 'Deadline', 'Notes'];

  const rows = allJobs.map(job => [
    job.company,
    job.position,
    job.status,
    job.location || '',
    job.salary || '',
    job.apply_date || '',
    job.deadline || '',
    job.notes || ''
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(value => `"${value}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showAlert('alert', 'Jobs exported successfully!', 'success');
});

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');

// Load saved theme on page load
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  themeToggle.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ===== INIT =====
loadJobs();