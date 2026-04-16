// Show alert message
const showAlert = (id, message, type) => {
    const alert = document.getElementById(id);
    alert.textContent = message;
    alert.className = `alert show ${type}`;
    setTimeout(() => {
      alert.className = 'alert';
    }, 4000);
  };
  
  // Check if already logged in
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = '/pages/dashboard.html';
  }
  
  // ===== REGISTER =====
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      const confirmPassword = document.getElementById('confirmPassword').value.trim();
  
      if (!name || !email || !password || !confirmPassword) {
        return showAlert('alert', 'All fields are required.', 'error');
      }
  
      if (password !== confirmPassword) {
        return showAlert('alert', 'Passwords do not match.', 'error');
      }
  
      if (password.length < 6) {
        return showAlert('alert', 'Password must be at least 6 characters.', 'error');
      }
  
      try {
        registerBtn.textContent = 'Creating account...';
        registerBtn.disabled = true;
  
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          registerBtn.textContent = 'Create Account';
          registerBtn.disabled = false;
          return showAlert('alert', data.error, 'error');
        }
  
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/pages/dashboard.html';
  
      } catch (error) {
        registerBtn.textContent = 'Create Account';
        registerBtn.disabled = false;
        showAlert('alert', 'Something went wrong. Please try again.', 'error');
      }
    });
  }
  
  // ===== LOGIN =====
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
  
      if (!email || !password) {
        return showAlert('alert', 'All fields are required.', 'error');
      }
  
      try {
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;
  
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          loginBtn.textContent = 'Login';
          loginBtn.disabled = false;
          return showAlert('alert', data.error, 'error');
        }
  
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/pages/dashboard.html';
  
      } catch (error) {
        loginBtn.textContent = 'Login';
        loginBtn.disabled = false;
        showAlert('alert', 'Something went wrong. Please try again.', 'error');
      }
    });
  }