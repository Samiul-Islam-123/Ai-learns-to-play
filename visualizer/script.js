const brainChannel = new BroadcastChannel("brain");

const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


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

        console.log(
            "Prediction complete"
        );

        console.log(
            "Final output:",
            data.output
        );

        activeLayer =
            network.layers.length - 1;

        network.neurons = data.neurons;

        draw();
    }
};


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
