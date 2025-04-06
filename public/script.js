let allItems = [];

async function loadItems() {
  try {
    const res = await fetch("/api/items");
    if (!res.ok) throw new Error("Failed to fetch items");
    
    const data = await res.json();
    allItems = data;
    
    renderCategoryButtons(data);
    renderItems(data);
  } catch (error) {
    console.error("Error loading items:", error);
    document.getElementById("item-list").innerHTML = `
      <div class="error">Failed to load products. Please try again.</div>
    `;
  }
}

function renderCategoryButtons(items) {
  const categories = [...new Set(items.map(item => item.category))];
  const navContainer = document.getElementById("category-nav");
  
  navContainer.innerHTML = `
    <button class="category-btn active" data-category="all">All</button>
    ${categories.map(category => 
      `<button class="category-btn" data-category="${category}">${category}</button>`
    ).join('')}
  `;

  document.querySelectorAll('.category-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      document.querySelectorAll('.category-btn').forEach(btn => 
        btn.classList.remove('active'));
      e.target.classList.add('active');
      
      filterItems(e.target.dataset.category);
    });
  });
}

function filterItems(category) {
  const filteredItems = category === 'all' 
    ? allItems 
    : allItems.filter(item => item.category === category);
  
  renderItems(filteredItems);
}

function renderItems(items) {
  const container = document.getElementById("item-list");
  
  if (!items || items.length === 0) {
    container.innerHTML = `<div class="loading">No products found.</div>`;
    return;
  }
  
  container.innerHTML = items.map(item => `
    <div class="card">
      <a href="product.html?id=${item._id}">
        <img src="${item.image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
          alt="${item.name}" loading="lazy" />
        <div class="card-content">
          <div class="card-category">${item.category}</div>
          <h3 class="card-title">${item.name}</h3>
          <p class="card-seller">By ${item.seller}</p>
          <div class="card-footer">
            <span class="card-price">$${item.price}</span>
            <span class="card-rating">★ ${item.rating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
      </a>
    </div>
  `).join('');
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

window.addEventListener('DOMContentLoaded', () => {
  renderAuthButtons();
  loadItems();
});