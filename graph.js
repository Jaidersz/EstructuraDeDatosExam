// GraphSimple class for graph operations and Dijkstra's algorithm
class GraphSimple {
  constructor() {
    this.nodes = 6 // 6 nodes as per requirement
    this.adjacencyList = Array(this.nodes)
      .fill()
      .map(() => [])
    this.nodePositions = [] // Store positions for drawing
  }

  // Add an edge between two nodes with a weight
  addEdge(u, v, weight) {
    // Bidirectional edge
    this.adjacencyList[u].push({ node: v, weight })
    this.adjacencyList[v].push({ node: u, weight })
  }

  // Set node positions for visualization
  setNodePositions(positions) {
    this.nodePositions = positions
  }

  // Dijkstra's algorithm implementation
  dijkstraSimple(source) {
    const distances = Array(this.nodes).fill(Number.POSITIVE_INFINITY)
    const visited = Array(this.nodes).fill(false)
    const previous = Array(this.nodes).fill(null)

    distances[source] = 0

    for (let i = 0; i < this.nodes; i++) {
      // Find the node with the minimum distance
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

      // Update distances to adjacent nodes
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

  // Find the shortest path between source and target
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

  // Get edge weight between two nodes
  getEdgeWeight(u, v) {
    const edge = this.adjacencyList[u].find((e) => e.node === v)
    return edge ? edge.weight : Number.POSITIVE_INFINITY
  }
}

// Global variables
let graph
const selectedSource = null
const selectedTarget = null
const animationInProgress = false
const RATE_PER_SECOND = 0.5 // $0.50 per second

// Declare canvas and drawGraph
let canvas
let drawGraph

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

  // Set node positions for visualization (in a circle)
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = Math.min(centerX, centerY) - 50
  const positions = []

  for (let i = 0; i < graph.nodes; i++) {
    const angle = (i * 2 * Math.PI) / graph.nodes
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    })
  }

  graph.setNodePositions(positions)

  // Draw the graph
  drawGraph()
}
