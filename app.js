// DOM elements
const canvas = document.getElementById("graphCanvas")
const ctx = canvas.getContext("2d")
const sourceNodeSelect = document.getElementById("sourceNode")
const targetNodeSelect = document.getElementById("targetNode")
const calculateBtn = document.getElementById("calculateBtn")
const routeInfo = document.getElementById("routeInfo")
const progressBar = document.getElementById("progressBar")
const progressText = document.getElementById("progressText")
const totalTimeSpan = document.getElementById("totalTime")
const totalCostSpan = document.getElementById("totalCost")

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

// Declare variables
let graph
let selectedSource
let selectedTarget
let animationInProgress = false
const RATE_PER_SECOND = 0.5 // Example value, adjust as needed

// Draw the graph
function drawGraph(path = []) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw edges
  for (let i = 0; i < graph.nodes; i++) {
    for (const edge of graph.adjacencyList[i]) {
      const { node: j, weight } = edge

      // Only draw each edge once (when i < j)
      if (i < j) {
        const isInPath =
          path.length > 1 &&
          path.findIndex((n) => n === i) !== -1 &&
          path.findIndex((n) => n === j) !== -1 &&
          Math.abs(path.indexOf(i) - path.indexOf(j)) === 1

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

    if (path.includes(i)) {
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
  ctx.arc(position.x, position.y, 20, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()

  ctx.fillStyle = "white"
  ctx.font = "16px Arial"
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
  ctx.lineWidth = 2
  ctx.stroke()

  // Draw weight
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2

  ctx.fillStyle = "black"
  ctx.font = "12px Arial"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  // Add a white background for better readability
  const textWidth = ctx.measureText(weight + "s").width
  ctx.fillStyle = "white"
  ctx.fillRect(midX - textWidth / 2 - 2, midY - 8, textWidth + 4, 16)

  ctx.fillStyle = "black"
  ctx.fillText(weight + "s", midX, midY)
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
  if (selectedSource === null || selectedTarget === null) {
    alert("Please select both origin and destination")
    return
  }

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
  routeInfo.style.display = "none"
  drawGraph()
}

// Initialize with default values
window.addEventListener("DOMContentLoaded", () => {
  selectedSource = 0
  selectedTarget = 5
  sourceNodeSelect.value = selectedSource
  targetNodeSelect.value = selectedTarget

  // Example graph initialization (replace with your actual graph data)
  graph = {
    nodes: 6,
    adjacencyList: [
      [
        { node: 1, weight: 10 },
        { node: 2, weight: 15 },
      ],
      [
        { node: 0, weight: 10 },
        { node: 3, weight: 12 },
      ],
      [
        { node: 0, weight: 15 },
        { node: 4, weight: 10 },
      ],
      [
        { node: 1, weight: 12 },
        { node: 5, weight: 20 },
      ],
      [
        { node: 2, weight: 10 },
        { node: 5, weight: 18 },
      ],
      [
        { node: 3, weight: 20 },
        { node: 4, weight: 18 },
      ],
    ],
    nodePositions: [
      { x: 50, y: 50 },
      { x: 200, y: 50 },
      { x: 50, y: 200 },
      { x: 200, y: 200 },
      { x: 50, y: 350 },
      { x: 200, y: 350 },
    ],
    findShortestPath: function (start, end) {
      // Dummy implementation for demonstration
      const path = [start]
      let current = start
      while (current !== end) {
        let nextNode = -1
        let minWeight = Number.POSITIVE_INFINITY
        for (const edge of this.adjacencyList[current]) {
          if (edge.weight < minWeight) {
            minWeight = edge.weight
            nextNode = edge.node
          }
        }
        if (nextNode === -1) {
          return { path: [], distance: Number.POSITIVE_INFINITY }
        }
        path.push(nextNode)
        current = nextNode
      }
      return { path: path, distance: 100 } // Dummy distance
    },
    getEdgeWeight: function (node1, node2) {
      for (const edge of this.adjacencyList[node1]) {
        if (edge.node === node2) {
          return edge.weight
        }
      }
      return Number.POSITIVE_INFINITY
    },
  }

  drawGraph()
})
