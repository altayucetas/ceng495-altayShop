const form = document.getElementById("login-form");
const messageBox = document.getElementById("login-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  messageBox.style.display = "block";

  if (res.ok) {
    localStorage.setItem("token", data.token);
    messageBox.textContent = "Login successful.";
    messageBox.className = "message success";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } else {
    messageBox.textContent = data.message || "Login failed.";
    messageBox.className = "message error";
  }
});
