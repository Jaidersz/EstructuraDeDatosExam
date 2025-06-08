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
    const angle = (i * 2 * Math.PI) / graph.nodes - Math.PI / 2 // Start from top
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    })
  }

  graph.setNodePositions(positions)

  // Draw the graph initially
  drawGraph()
}

// DOM elements
const canvasElement = document.getElementById("graphCanvas")
const sourceNodeSelectElement = document.getElementById("sourceNode")
const targetNodeSelectElement = document.getElementById("targetNode")
const calculateBtnElement = document.getElementById("calculateBtn")
const routeInfoElement = document.getElementById("routeInfo")
const progressBarElement = document.getElementById("progressBar")
const progressTextElement = document.getElementById("progressText")
const totalTimeSpanElement = document.getElementById("totalTime")
const totalCostSpanElement = document.getElementById("totalCost")

// Draw the graph
function drawGraph(path = []) {
  if (!ctx || !graph) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw edges first (so they appear behind nodes)
  for (let i = 0; i < graph.nodes; i++) {
    for (const edge of graph.adjacencyList[i]) {
      const { node: j, weight } = edge

      // Only draw each edge once (when i < j)
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

  // Draw nodes on top of edges
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
  // Draw node circle
  ctx.beginPath()
  ctx.arc(position.x, position.y, 25, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = "#333"
  ctx.lineWidth = 2
  ctx.stroke()

  // Draw node label
  ctx.fillStyle = "white"
  ctx.font = "bold 16px Arial"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(label, position.x, position.y)
}

// Draw an edge
function drawEdge(start, end, weight, color) {
  // Draw edge line
  ctx.beginPath()
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.stroke()

  // Draw weight label
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2

  // Add a white background for better readability
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

  // Draw the path
  drawGraph(path)

  // Calculate total time for the path
  let totalTime = 0
  for (let i = 0; i < path.length - 1; i++) {
    totalTime += graph.getEdgeWeight(path[i], path[i + 1])
  }

  // Reset progress bar
  const progressBar = document.getElementById("progressBar")
  const progressText = document.getElementById("progressText")
  progressBar.style.width = "0%"
  progressText.textContent = "0%"

  // Animate progress bar
  let elapsedTime = 0
  const animationSpeed = 100 // ms per update

  const animationInterval = setInterval(() => {
    elapsedTime += animationSpeed / 1000

    if (elapsedTime >= totalTime) {
      elapsedTime = totalTime
      clearInterval(animationInterval)

      // Reset after animation completes
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

      // Initialize graph after showing the app
      setTimeout(() => {
        initGraph()
      }, 100)
    }
  }

  // Hide app interface
  function hideApp() {
    appContainer.style.display = "none"
    authContainer.style.display = "block"
  }

  // Handle source node selection
  sourceNodeSelect.addEventListener("change", () => {
    selectedSource = Number.parseInt(sourceNodeSelect.value)
    drawGraph()
  })

  // Handle target node selection
  targetNodeSelect.addEventListener("change", () => {
    selectedTarget = Number.parseInt(targetNodeSelect.value)
    drawGraph()
  })

  // Handle calculate button click
  calculateBtn.addEventListener("click", () => {
    if (selectedSource === selectedTarget) {
      alert("Origin and destination must be different")
      return
    }

    if (animationInProgress) {
      return
    }

    // Find shortest path
    const { path, distance } = graph.findShortestPath(selectedSource, selectedTarget)

    if (path.length === 0 || distance === Number.POSITIVE_INFINITY) {
      alert("No path found between selected nodes")
      return
    }

    // Show route info
    routeInfo.style.display = "block"

    // Calculate total time and cost
    const totalTime = distance
    const totalCost = (totalTime * RATE_PER_SECOND).toFixed(2)

    totalTimeSpan.textContent = totalTime
    totalCostSpan.textContent = totalCost

    // Start animation
    animateRoute(path)
  })

  // Check if user is already logged in
  if (authService.isLoggedIn()) {
    showApp()
  }

  // Set default values
  selectedSource = 0
  selectedTarget = 5
  sourceNodeSelect.value = selectedSource
  targetNodeSelect.value = selectedTarget
})

// Graph class
class GraphSimple {
  constructor() {
    this.nodes = 6 // Fixed number of nodes
    this.adjacencyList = Array.from({ length: this.nodes }, () => [])
    this.nodePositions = [] // Positions of nodes for drawing
  }

  addEdge(u, v, weight) {
    this.adjacencyList[u].push({ node: v, weight })
    this.adjacencyList[v].push({ node: u, weight }) // Assuming undirected graph
  }

  setNodePositions(positions) {
    this.nodePositions = positions
  }

  // Method to find the shortest path using Dijkstra's algorithm
  findShortestPath(startNode, endNode) {
    const distances = new Array(this.nodes).fill(Number.POSITIVE_INFINITY)
    const previous = new Array(this.nodes).fill(null)
    const queue = new PriorityQueue()

    distances[startNode] = 0
    queue.enqueue(startNode, 0)

    while (!queue.isEmpty()) {
      const { element: currentNode, priority: currentPriority } = queue.dequeue()

      if (currentPriority > distances[currentNode]) {
        continue // Skip if we've already found a shorter path
      }

      for (const edge of this.adjacencyList[currentNode]) {
        const { node: neighbor, weight } = edge
        const newDist = distances[currentNode] + weight

        if (newDist < distances[neighbor]) {
          distances[neighbor] = newDist
          previous[neighbor] = currentNode
          queue.enqueue(neighbor, newDist)
        }
      }
    }

    // Reconstruct path
    const path = []
    let current = endNode
    while (current !== null) {
      path.unshift(current)
      current = previous[current]
    }

    // If the start node is not in the path, then there's no valid path
    if (path[0] !== startNode) {
      return { path: [], distance: Number.POSITIVE_INFINITY }
    }

    return { path, distance: distances[endNode] }
  }

  getEdgeWeight(node1, node2) {
    for (const edge of this.adjacencyList[node1]) {
      if (edge.node === node2) {
        return edge.weight
      }
    }
    return Number.POSITIVE_INFINITY
  }
}

// Priority Queue class (Min Priority Queue)
class PriorityQueue {
  constructor() {
    this.items = []
  }

  enqueue(element, priority) {
    const queueElement = { element, priority }

    let added = false
    for (let i = 0; i < this.items.length; i++) {
      if (queueElement.priority < this.items[i].priority) {
        this.items.splice(i, 0, queueElement)
        added = true
        break
      }
    }

    if (!added) {
      this.items.push(queueElement)
    }
  }

  dequeue() {
    if (this.isEmpty()) {
      return "Underflow"
    }
    return this.items.shift()
  }

  isEmpty() {
    return this.items.length === 0
  }
}
