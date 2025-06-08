// Simulating user storage with localStorage
class AuthService {
  constructor() {
    // Initialize users from localStorage or create empty array
    this.users = JSON.parse(localStorage.getItem("users")) || []
    this.currentUser = JSON.parse(localStorage.getItem("currentUser")) || null
  }

  // Register a new user
  register(name, email, password) {
    // Check if user already exists
    if (this.users.some((user) => user.email === email)) {
      return { success: false, message: "Email already registered" }
    }

    // Create new user
    const newUser = { name, email, password }
    this.users.push(newUser)

    // Save to localStorage (simulating users.txt)
    localStorage.setItem("users", JSON.stringify(this.users))

    return { success: true, message: "Registration successful" }
  }

  // Login user
  login(email, password) {
    const user = this.users.find((user) => user.email === email && user.password === password)

    if (user) {
      this.currentUser = { name: user.name, email: user.email }
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser))
      return { success: true, user: this.currentUser }
    } else {
      return { success: false, message: "Invalid email or password" }
    }
  }

  // Logout user
  logout() {
    this.currentUser = null
    localStorage.removeItem("currentUser")
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser
  }
}

// Initialize auth service
const authService = new AuthService()

// DOM elements
const loginForm = document.getElementById("loginForm")
const registerForm = document.getElementById("registerForm")
const showRegisterLink = document.getElementById("showRegister")
const showLoginLink = document.getElementById("showLogin")
const logoutBtn = document.getElementById("logoutBtn")
const authContainer = document.querySelector(".auth-container")
const registerContainer = document.getElementById("registerContainer")
const appContainer = document.getElementById("appContainer")
const userNameSpan = document.getElementById("userName")

// Show register form
showRegisterLink.addEventListener("click", (e) => {
  e.preventDefault()
  authContainer.style.display = "none"
  registerContainer.style.display = "block"
})

// Show login form
showLoginLink.addEventListener("click", (e) => {
  e.preventDefault()
  registerContainer.style.display = "none"
  authContainer.style.display = "block"
})

// Handle register form submission
registerForm.addEventListener("submit", (e) => {
  e.preventDefault()

  const name = document.getElementById("regName").value
  const email = document.getElementById("regEmail").value
  const password = document.getElementById("regPassword").value

  const result = authService.register(name, email, password)

  if (result.success) {
    alert("Registration successful! Please login.")
    registerContainer.style.display = "none"
    authContainer.style.display = "block"
  } else {
    alert(result.message)
  }
})

// Handle login form submission
loginForm.addEventListener("submit", (e) => {
  e.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  const result = authService.login(email, password)

  if (result.success) {
    showApp()
  } else {
    alert(result.message)
  }
})

// Handle logout
logoutBtn.addEventListener("click", () => {
  authService.logout()
  hideApp()
})

// Show app interface
function showApp() {
  const currentUser = authService.getCurrentUser()
  if (currentUser) {
    userNameSpan.textContent = currentUser.name
    authContainer.style.display = "none"
    registerContainer.style.display = "none"
    appContainer.style.display = "block"

    // Initialize graph
    initGraph()
  }
}

// Hide app interface
function hideApp() {
  appContainer.style.display = "none"
  authContainer.style.display = "block"
}

// Check if user is already logged in
window.addEventListener("DOMContentLoaded", () => {
  if (authService.isLoggedIn()) {
    showApp()
  }
})

// Dummy initGraph function to resolve the error.  In a real application, this would be replaced with actual graph initialization code.
function initGraph() {
  console.log("Graph initialized (placeholder)")
}
