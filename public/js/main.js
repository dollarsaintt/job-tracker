// Redirect to dashboard if already logged in
const token = localStorage.getItem('token');
if (token) {
  window.location.href = '/pages/dashboard.html';
}