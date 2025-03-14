import "./graph-viewer.css";

const NODE_WIDTH = 100;
const NODE_HEIGHT = 75;

// Dictionary to track nodes by id
let nodes: { [key: string]: any } = {};

// Dictionary to track edges by id
let edges: { [key: string]: any } = {};

let graphWidth = 0;
let graphHeight = 0;

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startDragX: number, startDragY: number;

// Function to set up the canvas for high-DPI screens
const setupCanvas = (canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect(); // Get CSS size
    const dpr = window.devicePixelRatio || 1;

    // Set internal resolution to match high-DPI screens
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale drawing operations to match the new resolution
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    return ctx;
};

// Draws a node
const drawNode = (ctx: CanvasRenderingContext2D, node_id: string) => {
    const node = nodes[node_id];

    // Draw the rectangle
    ctx.beginPath();
    ctx.rect(node.x, node.y, node.width, node.height);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.stroke();

    ctx.font = "32px sans";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";
    ctx.fillText(node.name, node.x + node.width / 2, node.y + node.height / 2);
};

// Initialize the viewer
window.addEventListener("load", () => {
    const canvas = document.getElementById("llvm-graph-view-graphCanvas") as HTMLCanvasElement;
    const graphInput = document.getElementById("llvm-graph-view-graphInput") as HTMLTextAreaElement;
    const ctx = setupCanvas(canvas);

    if (!ctx || !graphInput) {
        console.error("Failed to initialize graph viewer");
        return;
    }

    // Set default input if empty
    if (graphInput.value === "") {
        graphInput.value = "a -> b\na -> e\nb -> c\nb -> d\ne -> f\nf -> e\nc -> g\nd -> g\ne -> g";
    }

    // Handle window resize
    window.addEventListener("resize", () => {
        setupCanvas(canvas);
    });

    // Add event listeners for graph manipulation
    document.getElementById("llvm-graph-view-updateGraphBtn")?.addEventListener("click", () => {
        // Update graph logic here
    });

    document.getElementById("llvm-graph-view-centerGraphBtn")?.addEventListener("click", () => {
        // Center graph logic here
    });
});
