const brainChannel = new BroadcastChannel("brain");

class Network {
    constructor(input_layer, hidden_layer, output_layer) {
        this.input_layer = input_layer;
        this.hidden_layer = hidden_layer;
        this.output_layer = output_layer;

        this.neurons = [];

        this.layers = [
            input_layer,
            ...hidden_layer,
            output_layer
        ];

        this.weights = [];
        this.init();
    }

    init() {
        console.log("initializing network...");
        for (let i = 0; i < this.layers.length - 1; i++) {
            const currentLayer = this.layers[i];
            const nextLayer = this.layers[i + 1];

            const matrix = [];

            for (let j = 0; j < currentLayer; j++) {
                const row = [];

                for (let k = 0; k < nextLayer; k++) {
                    row.push(random(-1, 1));
                }

                matrix.push(row);
            }

            this.weights.push(matrix);
        }

        //intialize the neurons
        for (let i = 0; i < this.layers.length; i++) {
            const layer = [];

            for (let j = 0; j < this.layers[i]; j++) {
                const numInputs = i === 0 ? 0 : this.layers[i - 1];

                layer.push(
                    new Neuron(numInputs, "sigmoid")
                );
            }

            this.neurons.push(layer);
        }

        console.log("Network initialized with weights:");
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    predict(inputs) {


        // INPUT LAYER


        for (let i = 0; i < this.input_layer; i++) {
            this.neurons[0][i].value = inputs[i];
        }

        // Tell visualizer that prediction started
        brainChannel.postMessage({
            type: "prediction_start",
            neurons: this.getSerializableNeurons(),
            weights: this.weights
        });



        // PROCESS LAYERS


        for (
            let layer = 1;
            layer < this.layers.length;
            layer++
        ) {

            const previousLayer =
                this.neurons[layer - 1];

            const currentLayer =
                this.neurons[layer];

            const weightMatrix =
                this.weights[layer - 1];



            // Calculate every neuron in this layer


            for (
                let neuronIndex = 0;
                neuronIndex < currentLayer.length;
                neuronIndex++
            ) {

                let sum = 0;


                // Weighted sum

                for (
                    let previousIndex = 0;
                    previousIndex < previousLayer.length;
                    previousIndex++
                ) {

                    sum +=
                        previousLayer[previousIndex].value *
                        weightMatrix[previousIndex][neuronIndex];
                }


                // Bias

                sum +=
                    currentLayer[neuronIndex].bias;


                // Store weighted sum

                currentLayer[neuronIndex].input = sum;


                // Activation

                currentLayer[neuronIndex].value =
                    this.sigmoid(sum);
            }



            // Layer finished


            brainChannel.postMessage({
                type: "layer_complete",
                layer: layer,
                neurons: this.getSerializableNeurons()
            });
        }



        // OUTPUT


        const output =
            this.neurons[this.neurons.length - 1]
                .map(neuron => neuron.value);


        brainChannel.postMessage({
            type: "prediction_complete",
            output: output,
            neurons: this.getSerializableNeurons()
        });


        return output;
    }

    mutate(strength = 0.1) {

        // Mutate weights
        for (let layer = 0; layer < this.weights.length; layer++) {

            for (let i = 0; i < this.weights[layer].length; i++) {

                for (let j = 0; j < this.weights[layer][i].length; j++) {

                    const change = random(
                        -strength,
                        strength
                    );

                    this.weights[layer][i][j] += change;
                }
            }
        }




        // Mutate biases
        for (let layer = 0; layer < this.neurons.length; layer++) {

            for (let neuron of this.neurons[layer]) {

                const change = random(
                    -strength,
                    strength
                );

                neuron.bias += change;
            }
        }
    }

    display() {
        console.log("Network Structure:");
        console.log(`Total Layers: ${this.layers.length}`);
        console.log(`Input Neurons: ${this.input_layer}`);
        console.log(`Hidden Layers: ${this.hidden_layer.length}`);
        console.log(`Output Neurons: ${this.output_layer}`);

        console.log("Neurons in each layer:");
        console.log(this.neurons)
        console.log("weights");
        console.log(this.weights)


    }

    getSerializableNeurons() {

        return this.neurons.map(layer =>
            layer.map(neuron => ({
                bias: neuron.bias,
                input: neuron.input,
                value: neuron.value,
                x: neuron.x,
                y: neuron.y
            }))
        );
    }

    clone() {

        const copy = new Network(
            this.input_layer,
            this.hidden_layer,
            this.output_layer
        );

        // Copy weights
        for (let i = 0; i < this.weights.length; i++) {

            for (let j = 0; j < this.weights[i].length; j++) {

                for (let k = 0; k < this.weights[i][j].length; k++) {

                    copy.weights[i][j][k] =
                        this.weights[i][j][k];
                }
            }
        }

        // Copy biases
        for (let i = 0; i < this.neurons.length; i++) {

            for (let j = 0; j < this.neurons[i].length; j++) {

                copy.neurons[i][j].bias =
                    this.neurons[i][j].bias;
            }
        }

        return copy;
    }
}