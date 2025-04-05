const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

async function loadUserProfile() {
  try {
    const payload = parseJwt(token);
    
    if (!payload || !payload.username) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    const username = payload.username;
    const response = await fetch(`/api/userInfo?username=${username}`);
    
    if (!response.ok) {
      throw new Error('Failed to load user profile');
    }
    
    const userData = await response.json();
    
    document.getElementById('profile-username').textContent = userData.username;
    
    const averageRating = userData.averageRating || 0;
    document.getElementById('average-rating').textContent = 
      typeof averageRating === 'number' ? averageRating.toFixed(1) : '0.0';
    
    const reviewsCount = Array.isArray(userData.reviews) ? userData.reviews.length : 0;
    document.getElementById('reviews-count').textContent = reviewsCount;
    
    renderUserReviews(userData.reviews || []);
    renderAuthButtons();
    
  } catch (error) {
    console.error('Error loading profile:', error);
    document.getElementById('profile-username').textContent = 'Error loading profile';
    document.getElementById('user-reviews').innerHTML = 
      `<div class="message error">Failed to load profile data. Please try again later.</div>`;
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function renderUserReviews(reviews) {
  const container = document.getElementById('user-reviews');
  
  if (!Array.isArray(reviews) || reviews.length === 0) {
    container.innerHTML = '<p>You haven\'t written any reviews yet.</p>';
    return;
  }
  
  const reviewsHTML = reviews.map(review => `
    <div class="review-card">
      <div class="review-header">
        <span class="review-author">${review.itemName || 'Unknown Product'}</span>
        <span class="review-date">${formatDate(review.timestamp)}</span>
      </div>
      <p class="review-text">${review.comment}</p>
      <div class="review-actions">
        <a href="product.html?id=${review.itemId}" class="view-item-link">View Item</a>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = reviewsHTML;
}

function renderAuthButtons() {
  const container = document.getElementById("auth-buttons");
  const token = localStorage.getItem("token");
  
  if (!token) {
    container.innerHTML = `
      <a href="login.html"><button>Login</button></a>
      <a href="register.html"><button class="primary">Register</button></a>
    `;
    return;
  }
  
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    
    if (payload.role === 'admin') {
      container.innerHTML = `
        <a href="admin.html"><button>Admin Panel</button></a>
        <button class="primary" onclick="logout()">Logout</button>
      `;
    } else {
      container.innerHTML = `
        <a href="profile.html"><button>My Profile</button></a>
        <button class="primary" onclick="logout()">Logout</button>
      `;
    }
  } catch (e) {
    console.error("Invalid token", e);
    localStorage.removeItem("token");
    renderAuthButtons();
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}

window.addEventListener('DOMContentLoaded', loadUserProfile);