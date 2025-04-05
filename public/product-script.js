let product = null;

async function getProduct(id) {
  try {
    const res = await fetch("/api/items");
    const data = await res.json();
    return data.find(p => p._id === id);
  } catch (error) {
    console.error("Error fetching product:", error);
    document.getElementById("product-detail").innerHTML = `
      <div class="message error">Failed to load product details. Please try again later.</div>
      <div class="center-button">
        <a href="/"><button>Back to Home</button></a>
      </div>
    `;
    return null;
  }
}

function getParam(key) {
  const url = new URL(window.location.href);
  return url.searchParams.get(key);
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

async function renderProduct() {
  const id = getParam("id");
  product = await getProduct(id);
  const token = localStorage.getItem("token");

  if (!product) {
    return;
  }

  document.title = `${product.name} | Altay Shop`;
  document.getElementById("category-nav").style.display = "none";

  let reviewsHTML = "<p>No reviews yet.</p>";
  if (Array.isArray(product.reviews) && product.reviews.length > 0) {
    const userRatings = {};
    if (Array.isArray(product.ratings)) {
      product.ratings.forEach(rating => {
        userRatings[rating.username] = rating.value;
      });
    }

    reviewsHTML = `
      <div class="review-section">
        <h3>Customer Reviews</h3>
        <div class="reviews-container">
          ${product.reviews.map(r => `
            <div class="review-card">
              <div class="review-header">
                <span class="review-author">${r.username}</span>
                <div class="review-meta">
                  ${userRatings[r.username] ? 
                    `<span class="review-rating">Rating: <strong>${userRatings[r.username]}/10</strong></span>` : 
                    ''}
                  <span class="review-date">${r.timestamp ? formatDate(r.timestamp) : 'N/A'}</span>
                </div>
              </div>
              <p class="review-text">${r.comment}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  let specificAttributes = '';
  
  if (product.category === 'GPS Sport Watches' && product.batteryLife) {
    specificAttributes += `<div class="product-attribute"><span>Battery Life:</span> ${product.batteryLife} hours</div>`;
  }
  
  if ((product.category === 'Antique Furniture' || product.category === 'Vinyls') && product.age) {
    specificAttributes += `<div class="product-attribute"><span>Age:</span> ${product.age} years</div>`;
  }
  
  if ((product.category === 'Antique Furniture' || product.category === 'Running Shoes') && product.material) {
    specificAttributes += `<div class="product-attribute"><span>Material:</span> ${product.material}</div>`;
  }
  
  if (product.category === 'Running Shoes' && product.size) {
    specificAttributes += `<div class="product-attribute"><span>Size:</span> ${product.size}</div>`;
  }

  document.getElementById("product-detail").innerHTML = `
    <div class="product-container">
      <div class="product-image">
        <img src="${product.image || 'https://via.placeholder.com/500x500?text=No+Image'}" 
          alt="${product.name}" />
      </div>
      
      <div class="product-info">
        <h1 class="product-title">${product.name}</h1>
        <div class="product-meta">
          <div class="product-category">${product.category}</div>
          <div class="product-seller">Seller: ${product.seller}</div>
          <div class="product-rating">★ ${product.rating?.toFixed(1) || '0.0'}</div>
        </div>
        
        <div class="product-price">$${product.price}</div>
        
        <div class="product-description">
          ${product.description}
        </div>
        
        <div class="product-attributes">
          ${specificAttributes}
        </div>
      </div>
    </div>
    
    ${token ? `
      <div class="review-form-container">
        <h3>Leave a Review</h3>
        <form class="review-form" onsubmit="submitReview(event, '${product._id}')">
          <div class="form-group">
            <label for="rating">Rating (1-10)</label>
            <input type="number" min="1" max="10" id="rating" required />
          </div>
          
          <div class="form-group">
            <label for="comment">Your comment</label>
            <textarea id="comment" required rows="3"></textarea>
          </div>
          
          <button type="submit" class="primary">Submit Review</button>
          <div id="review-message" class="message" style="display: none;"></div>
        </form>
      </div>
    ` : `
      <div class="login-prompt">
        <p>You must <a href="login.html">log in</a> to submit a review.</p>
      </div>
    `}
    
    ${reviewsHTML}
    
    <div class="center-button">
      <a href="/">
        <button>Back to Products</button>
      </a>
    </div>
  `;

  renderAuthButtons();
}

async function submitReview(event, itemId) {
  event.preventDefault();
  const rating = parseInt(document.getElementById("rating").value);
  const comment = document.getElementById("comment").value;
  const token = localStorage.getItem("token");
  const messageDiv = document.getElementById("review-message");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    messageDiv.textContent = "Submitting your review...";
    messageDiv.className = "message";
    messageDiv.style.display = "block";
    
    const reviewResponse = await fetch("/api/reviewItem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ itemId, comment })
    });
    
    const ratingResponse = await fetch("/api/rateItem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ itemId, rating })
    });
    
    if (reviewResponse.ok && ratingResponse.ok) {
      messageDiv.textContent = "Thank you! Your review has been submitted.";
      messageDiv.className = "message success";
      
      document.getElementById("rating").value = "";
      document.getElementById("comment").value = "";
      
      setTimeout(() => {
        renderProduct();
      }, 1500);
    } else {
      throw new Error("Failed to submit review or rating");
    }
  } catch (error) {
    console.error("Error submitting review:", error);
    messageDiv.textContent = "There was a problem submitting your review. Please try again.";
    messageDiv.className = "message error";
  }
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
  renderProduct();
});