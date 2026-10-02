const brainChannel = new BroadcastChannel("brain");

const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const chartCanvas = document.getElementById("chartCanvas");
const chartCtx = chartCanvas.getContext("2d");


// ============================================================
// CHART STATE
// ============================================================

const chartData = {
    generations: [],
    fitness: [],
    gaps: []
};

let currentStats = {
    generation: 0,
    bestFitness: 0,
    gapsPassed: 0
};


// ============================================================
// CURRENT NETWORK STATE
// ============================================================

let network = null;

// Currently completed layer
let activeLayer = -1;


// ============================================================
// RECEIVE DATA FROM GAME
// ============================================================

brainChannel.onmessage = (event) => {

    const data = event.data;


    // --------------------------------------------------------
    // Prediction started
    // --------------------------------------------------------

    if (data.type === "prediction_start") {

        console.log("Prediction started");

        activeLayer = 0;

        network = {
            layers: data.neurons.map(layer => layer.length),
            neurons: data.neurons,
            weights: data.weights
        };

        draw();
    }


    // --------------------------------------------------------
    // A layer has finished
    // --------------------------------------------------------

    if (data.type === "layer_complete") {

        console.log(
            `Layer ${data.layer} completed`
        );

        console.log(
            "Neuron states:",
            data.neurons[data.layer]
        );

        activeLayer = data.layer;

        network.neurons = data.neurons;

        draw();
    }


    // --------------------------------------------------------
    // Prediction finished
    // --------------------------------------------------------

    if (data.type === "prediction_complete") {

        activeLayer =
            network.layers.length - 1;

        network.neurons = data.neurons;

        draw();
    }


if (data.type === "stats_update") {

        currentStats = {
            generation: data.generation,
            bestFitness: data.bestFitness,
            gapsPassed: data.gapsPassed
        };

        chartData.generations.push(data.generation);
        chartData.fitness.push(data.bestFitness);
        chartData.gaps.push(data.gapsPassed);

        drawChart();
    }
};


// ============================================================
// DRAW CHART
// ============================================================

function drawChart() {

    const W = chartCanvas.width;
    const H = chartCanvas.height;
    const pad = { top: 40, right: 20, bottom: 40, left: 55 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    chartCtx.clearRect(0, 0, W, H);


    // Background
    chartCtx.fillStyle = "rgba(10, 10, 10, 0.88)";
    roundRect(chartCtx, 0, 0, W, H, 12);
    chartCtx.fill();


    // Stat cards
    drawStatCard(chartCtx, 16,  8, `GEN`,          currentStats.generation);
    drawStatCard(chartCtx, 150, 8, `BEST FITNESS`, currentStats.bestFitness.toFixed(1));
    drawStatCard(chartCtx, 310, 8, `GAPS`,         currentStats.gapsPassed);


    if (chartData.fitness.length < 2) return;


    const maxFitness = Math.max(...chartData.fitness, 1);
    const maxGaps    = Math.max(...chartData.gaps, 1);
    const n          = chartData.fitness.length;


    // Grid lines
    chartCtx.strokeStyle = "rgba(255,255,255,0.07)";
    chartCtx.lineWidth = 1;

    for (let g = 0; g <= 4; g++) {
        const y = pad.top + plotH - (g / 4) * plotH;
        chartCtx.beginPath();
        chartCtx.moveTo(pad.left, y);
        chartCtx.lineTo(pad.left + plotW, y);
        chartCtx.stroke();

        chartCtx.fillStyle = "rgba(255,255,255,0.35)";
        chartCtx.font = "10px monospace";
        chartCtx.textAlign = "right";
        chartCtx.fillText(
            ((g / 4) * maxFitness).toFixed(0),
            pad.left - 6,
            y + 4
        );
    }


    // Fitness line
    drawLine(
        chartCtx, chartData.fitness, maxFitness,
        n, pad, plotW, plotH,
        "rgba(99, 179, 237, 0.9)"
    );


    // Gaps line (scaled to same axis proportionally)
    drawLine(
        chartCtx, chartData.gaps, maxGaps,
        n, pad, plotW, plotH,
        "rgba(104, 211, 145, 0.9)"
    );


    // Axis
    chartCtx.strokeStyle = "rgba(255,255,255,0.2)";
    chartCtx.lineWidth = 1;
    chartCtx.beginPath();
    chartCtx.moveTo(pad.left, pad.top);
    chartCtx.lineTo(pad.left, pad.top + plotH);
    chartCtx.lineTo(pad.left + plotW, pad.top + plotH);
    chartCtx.stroke();


    // Legend
    drawLegendDot(chartCtx, pad.left,      H - 12, "rgba(99, 179, 237, 0.9)",  "Fitness");
    drawLegendDot(chartCtx, pad.left + 90, H - 12, "rgba(104, 211, 145, 0.9)", "Gaps");
}


function drawLine(ctx, data, maxVal, n, pad, plotW, plotH, color) {

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    for (let i = 0; i < n; i++) {
        const x = pad.left + (i / (n - 1)) * plotW;
        const y = pad.top + plotH - (data[i] / maxVal) * plotH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Dot on latest point
    const lx = pad.left + plotW;
    const ly = pad.top + plotH - (data[n - 1] / maxVal) * plotH;
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}


function drawStatCard(ctx, x, y, label, value) {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(label, x, y + 10);

    ctx.fillStyle = "white";
    ctx.font = "bold 14px monospace";
    ctx.fillText(value, x, y + 26);
}


function drawLegendDot(ctx, x, y, color, label) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(label, x + 8, y + 4);
}


function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
}


// ============================================================
// DRAW
// ============================================================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // --------------------------------------------------------
    // Background
    // --------------------------------------------------------

    ctx.fillStyle = "black";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // --------------------------------------------------------
    // Waiting screen
    // --------------------------------------------------------

    if (!network) {

        drawWaitingScreen();

        return;
    }


    // --------------------------------------------------------
    // Draw network
    // --------------------------------------------------------

    drawNetwork();
}


// ============================================================
// DRAW NETWORK
// ============================================================

function drawNetwork() {

    const layers = network.layers;
    const neurons = network.neurons;


    // --------------------------------------------------------
    // Layout
    // --------------------------------------------------------

    const paddingX = 150;
    const paddingY = 100;

    const availableWidth =
        canvas.width - paddingX * 2;

    const layerSpacing =
        availableWidth /
        (layers.length - 1);


    const maxNeurons =
        Math.max(...layers);

    const availableHeight =
        canvas.height - paddingY * 2;

    const neuronSpacing =
        availableHeight /
        (maxNeurons - 1);


    const positions = [];


    // --------------------------------------------------------
    // Calculate neuron positions
    // --------------------------------------------------------

    for (
        let layerIndex = 0;
        layerIndex < layers.length;
        layerIndex++
    ) {

        const layerPositions = [];

        const neuronCount =
            layers[layerIndex];


        const layerHeight =
            (neuronCount - 1) *
            neuronSpacing;


        const startY =
            (canvas.height - layerHeight) / 2;


        for (
            let neuronIndex = 0;
            neuronIndex < neuronCount;
            neuronIndex++
        ) {

            const x =
                paddingX +
                layerIndex *
                layerSpacing;


            const y =
                startY +
                neuronIndex *
                neuronSpacing;


            layerPositions.push({
                x,
                y
            });
        }


        positions.push(layerPositions);
    }


    // --------------------------------------------------------
    // Draw connections
    // --------------------------------------------------------

    for (
        let layerIndex = 0;
        layerIndex < layers.length - 1;
        layerIndex++
    ) {

        const currentLayer =
            positions[layerIndex];

        const nextLayer =
            positions[layerIndex + 1];


        // Actual weight matrix
        const weightMatrix =
            network.weights[layerIndex];


        for (
            let i = 0;
            i < currentLayer.length;
            i++
        ) {

            for (
                let j = 0;
                j < nextLayer.length;
                j++
            ) {

                const weight =
                    weightMatrix[i][j];


                drawConnection(
                    currentLayer[i],
                    nextLayer[j],
                    weight
                );
            }
        }
    }


    // --------------------------------------------------------
    // Draw neurons
    // --------------------------------------------------------

    for (
        let layerIndex = 0;
        layerIndex < neurons.length;
        layerIndex++
    ) {

        for (
            let neuronIndex = 0;
            neuronIndex < neurons[layerIndex].length;
            neuronIndex++
        ) {

            const neuron =
                neurons[layerIndex][neuronIndex];

            const position =
                positions[layerIndex][neuronIndex];


            drawNeuron(
                position,
                neuron,
                layerIndex,
                neuronIndex
            );
        }
    }


    // --------------------------------------------------------
    // Layer labels
    // --------------------------------------------------------

    drawLayerLabels(
        layers,
        paddingX,
        layerSpacing
    );
}


// ============================================================
// CONNECTION
// ============================================================

function drawConnection(
    source,
    destination,
    weight
) {

    ctx.beginPath();

    ctx.moveTo(
        source.x,
        source.y
    );

    ctx.lineTo(
        destination.x,
        destination.y
    );


    // --------------------------------------------------------
    // Weight magnitude
    // --------------------------------------------------------

    const magnitude =
        Math.abs(weight);


    /*
        Weight is approximately between -1 and +1.

        We use its magnitude only for thickness.

        Weak weight:
            0.05 → thin

        Strong weight:
            0.90 → thick
    */

    ctx.lineWidth =
        1 + magnitude * 5;


    // --------------------------------------------------------
    // Weight sign
    // --------------------------------------------------------

    /*
        Positive and negative weights are currently
        represented differently.

        Positive → lighter
        Negative → darker
    */

    if (weight >= 0) {

        ctx.strokeStyle =
            "rgba(180, 180, 180, 0.35)";

    } else {

        ctx.strokeStyle =
            "rgba(100, 100, 100, 0.35)";
    }


    ctx.stroke();
}


// ============================================================
// NEURON
// ============================================================

function drawNeuron(
    position,
    neuron,
    layerIndex,
    neuronIndex
) {

    const radius = 20;


    // --------------------------------------------------------
    // Activation value
    // --------------------------------------------------------

    const value =
        neuron.value || 0;


    /*
        Sigmoid output is between 0 and 1.

        Convert it into brightness.

        0 → dark
        1 → bright
    */

    const brightness =
        Math.floor(
            60 + value * 195
        );


    // --------------------------------------------------------
    // Active layer
    // --------------------------------------------------------

    const isActive =
        layerIndex === activeLayer;


    // --------------------------------------------------------
    // Neuron
    // --------------------------------------------------------

    ctx.beginPath();

    ctx.arc(
        position.x,
        position.y,
        radius,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        `rgb(${brightness}, ${brightness}, ${brightness})`;

    ctx.fill();


    // --------------------------------------------------------
    // Border
    // --------------------------------------------------------

    ctx.lineWidth =
        isActive ? 4 : 2;

    ctx.strokeStyle =
        isActive
            ? "white"
            : "rgb(100, 100, 100)";

    ctx.stroke();


    // --------------------------------------------------------
    // Neuron index
    // --------------------------------------------------------

    ctx.fillStyle = "black";

    ctx.font =
        "bold 13px monospace";

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";

    ctx.fillText(
        neuronIndex,
        position.x,
        position.y
    );


    // --------------------------------------------------------
    // Value
    // --------------------------------------------------------

    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = "white";

    ctx.font =
        "12px monospace";

    ctx.fillText(
        `v: ${neuron.value.toFixed(3)}`,
        position.x,
        position.y + radius + 18
    );


    // --------------------------------------------------------
    // Weighted sum
    // --------------------------------------------------------

    ctx.fillStyle =
        "rgb(180, 180, 180)";

    ctx.fillText(
        `z: ${neuron.input.toFixed(3)}`,
        position.x,
        position.y + radius + 33
    );


    // --------------------------------------------------------
    // Bias
    // --------------------------------------------------------

    ctx.fillText(
        `b: ${neuron.bias.toFixed(3)}`,
        position.x,
        position.y + radius + 48
    );
}


// ============================================================
// LAYER LABELS
// ============================================================

function drawLayerLabels(
    layers,
    paddingX,
    layerSpacing
) {

    ctx.textAlign = "center";


    for (
        let i = 0;
        i < layers.length;
        i++
    ) {

        const x =
            paddingX +
            i * layerSpacing;


        let label;


        if (i === 0) {

            label = "INPUT";

        } else if (
            i === layers.length - 1
        ) {

            label = "OUTPUT";

        } else {

            label = `HIDDEN ${i}`;
        }


        // ----------------------------------------------------
        // Label
        // ----------------------------------------------------

        ctx.fillStyle =
            i === activeLayer
                ? "white"
                : "rgb(130, 130, 130)";

        ctx.font =
            "bold 15px monospace";

        ctx.fillText(
            label,
            x,
            45
        );


        // ----------------------------------------------------
        // Number of neurons
        // ----------------------------------------------------

        ctx.fillStyle =
            "rgb(120, 120, 120)";

        ctx.font =
            "12px monospace";

        ctx.fillText(
            `${layers[i]} neurons`,
            x,
            65
        );
    }
}


// ============================================================
// WAITING SCREEN
// ============================================================

function drawWaitingScreen() {

    ctx.fillStyle = "white";

    ctx.font =
        "20px monospace";

    ctx.textAlign = "center";

    ctx.fillText(
        "Waiting for neural network...",
        canvas.width / 2,
        canvas.height / 2
    );
}


// ============================================================
// RESIZE
// ============================================================

window.addEventListener(
    "resize",
    () => {

        canvas.width =
            window.innerWidth;

        canvas.height =
            window.innerHeight;

        draw();
    }
);


// ============================================================
// INITIAL DRAW
// ============================================================

draw();
