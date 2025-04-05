let activeTab = "product";
let allItems = [];
let allUsers = [];

function showForm(type) {
  activeTab = type;
  
  const tabs = document.querySelectorAll(".admin-tab");
  tabs.forEach(tab => {
    tab.classList.remove("active");
  });
  
  let selectedTab;
  if (type === "product") {
    selectedTab = document.querySelector(`.admin-tab:nth-child(1)`);
  } else if (type === "user") {
    selectedTab = document.querySelector(`.admin-tab:nth-child(2)`);
  }
  
  if (selectedTab) selectedTab.classList.add("active");
  
  document.getElementById("product-form").style.display = type === "product" ? "block" : "none";
  document.getElementById("user-form").style.display = type === "user" ? "block" : "none";
  
  if (type === "product") {
    loadItems();
  }
  
  if (type === "user") {
    loadUsers();
  }
}

function toggleCategoryFields(category) {
  document.querySelectorAll('.category-specific').forEach(field => {
    field.style.display = 'none';
    const input = field.querySelector('input, select');
    if (input) input.required = false;
  });
  
  if (category === 'GPS Sport Watches') {
    document.getElementById('batteryLife-field').style.display = 'grid';
    document.getElementById('batteryLife').required = true;
  }
  
  if (category === 'Antique Furniture' || category === 'Vinyls') {
    document.getElementById('age-field').style.display = 'grid';
    document.getElementById('age').required = true;
  }
  
  if (category === 'Running Shoes') {
    document.getElementById('size-field').style.display = 'grid';
    document.getElementById('size').required = true;
    document.getElementById('material-field').style.display = 'grid';
    document.getElementById('material').required = true;
  }
  
  if (category === 'Antique Furniture') {
    document.getElementById('material-field').style.display = 'grid';
    document.getElementById('material').required = true;
  }
}

async function loadItems() {
  try {
    const res = await fetch("/api/items");
    if (!res.ok) throw new Error("Failed to fetch items");
    
    allItems = await res.json();
    renderItems(allItems);
  } catch (error) {
    console.error("Error loading items:", error);
    document.getElementById("items-list").innerHTML = `
      <div class="message error">Failed to load products. Please try again.</div>
    `;
  }
}

async function loadUsers() {
  try {
    const res = await fetch("/api/usersList", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!res.ok) throw new Error("Failed to fetch users");
    
    allUsers = await res.json();
    renderUsers(allUsers);
  } catch (error) {
    console.error("Error loading users:", error);
    document.getElementById("users-list").innerHTML = `
      <div class="message error">Failed to load users. Please try again.</div>
    `;
  }
}

function renderItems(items) {
  const container = document.getElementById("items-list");
  
  if (!items || items.length === 0) {
    container.innerHTML = `<div class="message">No products found.</div>`;
    return;
  }
  
  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Price</th>
          <th>Rating</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>$${item.price}</td>
            <td>${item.rating?.toFixed(1) || '0.0'}</td>
            <td>
              <button onclick="deleteItem('${item._id}')" class="delete-btn">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderUsers(users) {
  const container = document.getElementById("users-list");
  
  if (!users || users.length === 0) {
    container.innerHTML = `<div class="message">No users found.</div>`;
    return;
  }
  
  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Role</th>
          <th>Average Rating</th>
          <th>Reviews</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(user => `
          <tr>
            <td>${user.username}</td>
            <td>${user.role || 'user'}</td>
            <td>${user.averageRating?.toFixed(1) || '0.0'}</td>
            <td>${user.reviews?.length || 0}</td>
            <td>
              <button onclick="deleteUser('${user.username}')" class="delete-btn">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function deleteItem(itemId) {
  if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
    return;
  }
  
  try {
    const res = await fetch("/api/deleteItem", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ itemId })
    });
    
    const msg = document.getElementById("delete-item-message");
    const data = await res.json();
    
    msg.textContent = data.message || "Product deleted successfully.";
    msg.className = res.ok ? "message success" : "message error";
    msg.style.display = "block";
    
    if (res.ok) {
      loadItems();
    }
  } catch (err) {
    console.error("Delete item error:", err);
    const msg = document.getElementById("delete-item-message");
    msg.textContent = "An error occurred while deleting the product.";
    msg.className = "message error";
    msg.style.display = "block";
  }
}

async function deleteUser(username) {
  if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    const res = await fetch("/api/deleteUser", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ username })
    });
    
    const msg = document.getElementById("delete-user-message");
    const data = await res.json();
    
    msg.textContent = data.message || "User deleted successfully.";
    msg.className = res.ok ? "message success" : "message error";
    msg.style.display = "block";
    
    if (res.ok) {
      loadUsers();
    }
  } catch (err) {
    console.error("Delete user error:", err);
    const msg = document.getElementById("delete-user-message");
    msg.textContent = "An error occurred while deleting the user.";
    msg.className = "message error";
    msg.style.display = "block";
  }
}

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
}

document.getElementById("category").addEventListener("change", function() {
  toggleCategoryFields(this.value);
});

document.getElementById("add-product-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const category = document.getElementById("category").value.trim();
  
  const product = {
    name: document.getElementById("product-name").value.trim(),
    description: document.getElementById("description").value.trim(),
    price: document.getElementById("price").value.trim(),
    seller: document.getElementById("seller").value.trim(),
    category: category,
    image: document.getElementById("image").value.trim()
  };
  
  if (category === 'GPS Sport Watches') {
    product.batteryLife = document.getElementById("batteryLife").value.trim();
  }
  
  if (category === 'Antique Furniture' || category === 'Vinyls') {
    product.age = document.getElementById("age").value.trim();
  }
  
  if (category === 'Running Shoes') {
    product.size = document.getElementById("size").value.trim();
    product.material = document.getElementById("material").value.trim();
  }
  
  if (category === 'Antique Furniture') {
    product.material = document.getElementById("material").value.trim();
  }

  const res = await fetch("/api/addItem", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(product)
  });

  const msg = document.getElementById("product-message");
  
  try {
    const data = await res.json();
    msg.textContent = data.message || "Product added successfully.";
    msg.className = res.ok ? "message success" : "message error";
  } catch (err) {
    msg.textContent = "An error occurred.";
    msg.className = "message error";
  }
  
  msg.style.display = "block";
  
  if (res.ok) {
    document.getElementById("add-product-form").reset();
    document.querySelectorAll('.category-specific').forEach(field => {
      field.style.display = 'none';
    });
    loadItems();
  }
});

document.getElementById("add-user-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const newUser = {
    username: document.getElementById("username").value.trim(),
    password: document.getElementById("password").value.trim(),
    role: document.getElementById("role").value.trim()
  };

  const res = await fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(newUser)
  });

  const msg = document.getElementById("user-message");
  
  try {
    const data = await res.json();
    msg.textContent = data.message || "User added successfully.";
    msg.className = res.ok ? "message success" : "message error";
  } catch (err) {
    msg.textContent = "An error occurred.";
    msg.className = "message error";
  }
  
  msg.style.display = "block";
  
  if (res.ok) {
    document.getElementById("add-user-form").reset();
    loadUsers();
  }
});

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}

window.addEventListener('DOMContentLoaded', () => {
  showForm("product");
});