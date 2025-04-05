const form = document.getElementById("register-form");
const message = document.getElementById("register-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    message.textContent = data.message;
    message.className = "message success";
    message.style.display = "block";
    setTimeout(() => window.location.href = "/login.html", 1500);
  } else {
    message.textContent = data.message || "Registration failed.";
    message.className = "message error";
    message.style.display = "block";
  }
});
