// Global variables
let graph
let canvas
let ctx
let selectedSource = 0
let selectedTarget = 5
let animationInProgress = false
const RATE_PER_SECOND = 0.5 // $0.50 per second

// Node colors
const NODE_COLORS = {
  DEFAULT: "#9c27b0",
  SOURCE: "#4CAF50",
  TARGET: "#F44336",
  PATH: "#2196F3",
}

// Edge colors
const EDGE_COLORS = {
  DEFAULT: "#666666",
  PATH: "#2196F3",
}

// Authentication Service
class AuthService {
  constructor() {
    this.users = JSON.parse(localStorage.getItem("users")) || []
    this.currentUser = JSON.parse(localStorage.getItem("currentUser")) || null
  }

  register(name, email, password) {
    if (this.users.some((user) => user.email === email)) {
      return { success: false, message: "Email already registered" }
    }

    const newUser = { name, email, password }
    this.users.push(newUser)
    localStorage.setItem("users", JSON.stringify(this.users))
    return { success: true, message: "Registration successful" }
  }

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

  logout() {
    this.currentUser = null
    localStorage.removeItem("currentUser")
  }

  isLoggedIn() {
    return this.currentUser !== null
  }

  getCurrentUser() {
    return this.currentUser
  }
}

// Graph class
class GraphSimple {
  constructor() {
    this.nodes = 6
    this.adjacencyList = Array.from({ length: this.nodes }, () => [])
    this.nodePositions = []
  }

  addEdge(u, v, weight) {
    this.adjacencyList[u].push({ node: v, weight })
    this.adjacencyList[v].push({ node: u, weight })
  }

  setNodePositions(positions) {
    this.nodePositions = positions
  }

  dijkstraSimple(source) {
    const distances = Array(this.nodes).fill(Number.POSITIVE_INFINITY)
    const visited = Array(this.nodes).fill(false)
    const previous = Array(this.nodes).fill(null)

    distances[source] = 0

    for (let i = 0; i < this.nodes; i++) {
      let minDistance = Number.POSITIVE_INFINITY
      let minNode = -1

      for (let j = 0; j < this.nodes; j++) {
        if (!visited[j] && distances[j] < minDistance) {
          minDistance = distances[j]
          minNode = j
        }
      }

      if (minNode === -1) break

      visited[minNode] = true

      for (const edge of this.adjacencyList[minNode]) {
        const { node, weight } = edge

        if (!visited[node]) {
          const newDistance = distances[minNode] + weight

          if (newDistance < distances[node]) {
            distances[node] = newDistance
            previous[node] = minNode
          }
        }
      }
    }

    return { distances, previous }
  }

  findShortestPath(source, target) {
    const { distances, previous } = this.dijkstraSimple(source)

    if (distances[target] === Number.POSITIVE_INFINITY) {
      return { path: [], distance: Number.POSITIVE_INFINITY }
    }

    const path = []
    let current = target

    while (current !== null) {
      path.unshift(current)
      current = previous[current]
    }

    return { path, distance: distances[target] }
  }

  getEdgeWeight(u, v) {
    const edge = this.adjacencyList[u].find((e) => e.node === v)
    return edge ? edge.weight : Number.POSITIVE_INFINITY
  }
}

// Initialize auth service
const authService = new AuthService()

// Initialize graph with predefined edges
function initGraph() {
  graph = new GraphSimple()

  // Define edges [u, v, weight] - 9 edges for 6 nodes
  const edges = [
    [0, 1, 5], // Node 1 to Node 2: 5 seconds
    [0, 2, 10], // Node 1 to Node 3: 10 seconds
    [1, 2, 3], // Node 2 to Node 3: 3 seconds
    [1, 3, 7], // Node 2 to Node 4: 7 seconds
    [2, 3, 8], // Node 3 to Node 4: 8 seconds
    [2, 4, 12], // Node 3 to Node 5: 12 seconds
    [3, 4, 6], // Node 4 to Node 5: 6 seconds
    [3, 5, 9], // Node 4 to Node 6: 9 seconds
    [4, 5, 4], // Node 5 to Node 6: 4 seconds
  ]

  // Add edges to graph
  edges.forEach(([u, v, w]) => {
    graph.addEdge(u, v, w)
  })

  // Get canvas and context
  canvas = document.getElementById("graphCanvas")
  ctx = canvas.getContext("2d")

  // Set node positions for visualization (in a circle)
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = Math.min(centerX, centerY) - 60
  const positions = []

  for (let i = 0; i < graph.nodes; i++) {
    const angle = (i * 2 * Math.PI) / graph.nodes - Math.PI / 2
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    })
  }

  graph.setNodePositions(positions)

  // Draw the graph initially
  drawGraph()
}

// Draw the graph
function drawGraph(path = []) {
  if (!ctx || !graph) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw edges first
  for (let i = 0; i < graph.nodes; i++) {
    for (const edge of graph.adjacencyList[i]) {
      const { node: j, weight } = edge

      if (i < j) {
        const isInPath =
          path.length > 1 && path.includes(i) && path.includes(j) && Math.abs(path.indexOf(i) - path.indexOf(j)) === 1

        drawEdge(
          graph.nodePositions[i],
          graph.nodePositions[j],
          weight,
          isInPath ? EDGE_COLORS.PATH : EDGE_COLORS.DEFAULT,
        )
      }
    }
  }

  // Draw nodes
  for (let i = 0; i < graph.nodes; i++) {
    let color = NODE_COLORS.DEFAULT

    if (path.includes(i) && i !== selectedSource && i !== selectedTarget) {
      color = NODE_COLORS.PATH
    }

    if (i === selectedSource) {
      color = NODE_COLORS.SOURCE
    } else if (i === selectedTarget) {
      color = NODE_COLORS.TARGET
    }

    drawNode(graph.nodePositions[i], i + 1, color)
  }
}

// Draw a node
function drawNode(position, label, color) {
  ctx.beginPath()
  ctx.arc(position.x, position.y, 25, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = "#333"
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = "white"
  ctx.font = "bold 16px Arial"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(label, position.x, position.y)
}

// Draw an edge
function drawEdge(start, end, weight, color) {
  ctx.beginPath()
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.stroke()

  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2

  const text = weight + "s"
  ctx.font = "12px Arial"
  const textWidth = ctx.measureText(text).width

  ctx.fillStyle = "white"
  ctx.fillRect(midX - textWidth / 2 - 3, midY - 8, textWidth + 6, 16)

  ctx.strokeStyle = "#333"
  ctx.lineWidth = 1
  ctx.strokeRect(midX - textWidth / 2 - 3, midY - 8, textWidth + 6, 16)

  ctx.fillStyle = "black"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, midX, midY)
}

// Animate the route
function animateRoute(path) {
  animationInProgress = true
  drawGraph(path)

  let totalTime = 0
  for (let i = 0; i < path.length - 1; i++) {
    totalTime += graph.getEdgeWeight(path[i], path[i + 1])
  }

  const progressBar = document.getElementById("progressBar")
  const progressText = document.getElementById("progressText")
  progressBar.style.width = "0%"
  progressText.textContent = "0%"

  let elapsedTime = 0
  const animationSpeed = 100

  const animationInterval = setInterval(() => {
    elapsedTime += animationSpeed / 1000

    if (elapsedTime >= totalTime) {
      elapsedTime = totalTime
      clearInterval(animationInterval)

      setTimeout(() => {
        resetRoute()
      }, 3000)
    }

    const progress = (elapsedTime / totalTime) * 100
    progressBar.style.width = `${progress}%`
    progressText.textContent = `${Math.round(progress)}%`
  }, animationSpeed)
}

// Reset route selection
function resetRoute() {
  animationInProgress = false
  document.getElementById("routeInfo").style.display = "none"
  drawGraph()
}

// DOM Content Loaded Event
document.addEventListener("DOMContentLoaded", () => {
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
  const sourceNodeSelect = document.getElementById("sourceNode")
  const targetNodeSelect = document.getElementById("targetNode")
  const calculateBtn = document.getElementById("calculateBtn")
  const routeInfo = document.getElementById("routeInfo")
  const totalTimeSpan = document.getElementById("totalTime")
  const totalCostSpan = document.getElementById("totalCost")

  // Show register form
  if (showRegisterLink) {
    showRegisterLink.addEventListener("click", (e) => {
      e.preventDefault()
      authContainer.style.display = "none"
      registerContainer.style.display = "block"
    })
  }

  // Show login form
  if (showLoginLink) {
    showLoginLink.addEventListener("click", (e) => {
      e.preventDefault()
      registerContainer.style.display = "none"
      authContainer.style.display = "block"
    })
  }

  // Handle register form submission
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const name = document.getElementById("regName").value.trim()
      const email = document.getElementById("regEmail").value.trim()
      const password = document.getElementById("regPassword").value.trim()

      if (!name || !email || !password) {
        alert("Please fill in all fields")
        return
      }

      const result = authService.register(name, email, password)

      if (result.success) {
        alert("Registration successful! Please login.")
        registerContainer.style.display = "none"
        authContainer.style.display = "block"
        // Clear form
        document.getElementById("regName").value = ""
        document.getElementById("regEmail").value = ""
        document.getElementById("regPassword").value = ""
      } else {
        alert(result.message)
      }
    })
  }

  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const email = document.getElementById("email").value.trim()
      const password = document.getElementById("password").value.trim()

      if (!email || !password) {
        alert("Please fill in all fields")
        return
      }

      console.log("Attempting login with:", email) // Debug log

      const result = authService.login(email, password)

      console.log("Login result:", result) // Debug log

      if (result.success) {
        console.log("Login successful, showing app") // Debug log
        showApp()
        // Clear form
        document.getElementById("email").value = ""
        document.getElementById("password").value = ""
      } else {
        alert(result.message)
      }
    })
  }

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      authService.logout()
      hideApp()
    })
  }

  // Show app interface
  function showApp() {
    const currentUser = authService.getCurrentUser()
    console.log("Current user:", currentUser) // Debug log

    if (currentUser && userNameSpan) {
      userNameSpan.textContent = currentUser.name

      if (authContainer) authContainer.style.display = "none"
      if (registerContainer) registerContainer.style.display = "none"
      if (appContainer) appContainer.style.display = "block"

      console.log("App container shown, initializing graph") // Debug log

      // Initialize graph after showing the app
      setTimeout(() => {
        initGraph()
        console.log("Graph initialized") // Debug log
      }, 200)
    } else {
      console.log("No current user found") // Debug log
    }
  }

  // Hide app interface
  function hideApp() {
    if (appContainer) appContainer.style.display = "none"
    if (authContainer) authContainer.style.display = "block"
    if (registerContainer) registerContainer.style.display = "none"
  }

  // Handle source node selection
  if (sourceNodeSelect) {
    sourceNodeSelect.addEventListener("change", () => {
      selectedSource = Number.parseInt(sourceNodeSelect.value)
      if (graph) drawGraph()
    })
  }

  // Handle target node selection
  if (targetNodeSelect) {
    targetNodeSelect.addEventListener("change", () => {
      selectedTarget = Number.parseInt(targetNodeSelect.value)
      if (graph) drawGraph()
    })
  }

  // Handle calculate button click
  if (calculateBtn) {
    calculateBtn.addEventListener("click", () => {
      if (selectedSource === selectedTarget) {
        alert("Origin and destination must be different")
        return
      }

      if (animationInProgress) {
        return
      }

      if (!graph) {
        alert("Graph not initialized")
        return
      }

      // Find shortest path
      const { path, distance } = graph.findShortestPath(selectedSource, selectedTarget)

      if (path.length === 0 || distance === Number.POSITIVE_INFINITY) {
        alert("No path found between selected nodes")
        return
      }

      // Show route info
      if (routeInfo) routeInfo.style.display = "block"

      // Calculate total time and cost
      const totalTime = distance
      const totalCost = (totalTime * RATE_PER_SECOND).toFixed(2)

      if (totalTimeSpan) totalTimeSpan.textContent = totalTime
      if (totalCostSpan) totalCostSpan.textContent = totalCost

      // Start animation
      animateRoute(path)
    })
  }

  // Check if user is already logged in on page load
  console.log("Checking if user is logged in...") // Debug log
  if (authService.isLoggedIn()) {
    console.log("User is already logged in") // Debug log
    showApp()
  } else {
    console.log("No user logged in") // Debug log
  }

  // Set default values
  selectedSource = 0
  selectedTarget = 5
  if (sourceNodeSelect) sourceNodeSelect.value = selectedSource
  if (targetNodeSelect) targetNodeSelect.value = selectedTarget
})
