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
        this.visualize = false;
        this.init();
    }

    init() {

        for (let i = 0; i < this.layers.length - 1; i++) {
            const matrix = [];
            for (let j = 0; j < this.layers[i]; j++) {
                const row = [];
                for (let k = 0; k < this.layers[i + 1]; k++) row.push(random(-1, 1));
                matrix.push(row);
            }
            this.weights.push(matrix);
        }

        for (let i = 0; i < this.layers.length; i++) {
            const layer = [];
            for (let j = 0; j < this.layers[i]; j++) {
                layer.push(new Neuron(i === 0 ? 0 : this.layers[i - 1], "sigmoid"));
            }
            this.neurons.push(layer);
        }
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    predict(inputs) {

        // Input layer
        for (let i = 0; i < this.input_layer; i++) {
            this.neurons[0][i].value = inputs[i];
        }

        if (this.visualize) brainChannel.postMessage({
            type: "prediction_start",
            neurons: this.getSerializableNeurons(),
            weights: this.weights
        });

        // Hidden + output layers
        for (let layer = 1; layer < this.layers.length; layer++) {

            const prevLayer    = this.neurons[layer - 1];
            const currLayer    = this.neurons[layer];
            const weightMatrix = this.weights[layer - 1];

            for (let j = 0; j < currLayer.length; j++) {

                let sum = currLayer[j].bias;

                for (let k = 0; k < prevLayer.length; k++) {
                    sum += prevLayer[k].value * weightMatrix[k][j];
                }

                currLayer[j].input = sum;
                currLayer[j].value = this.sigmoid(sum);
            }

            if (this.visualize) brainChannel.postMessage({
                type: "layer_complete",
                layer: layer,
                neurons: this.getSerializableNeurons()
            });
        }

        const output = this.neurons[this.layers.length - 1].map(n => n.value);

        if (this.visualize) brainChannel.postMessage({
            type: "prediction_complete",
            output: output,
            neurons: this.getSerializableNeurons()
        });

        return output;
    }

    mutate(strength = 0.1) {

        for (let layer = 0; layer < this.weights.length; layer++)
            for (let i = 0; i < this.weights[layer].length; i++)
                for (let j = 0; j < this.weights[layer][i].length; j++)
                    this.weights[layer][i][j] += random(-strength, strength);

        for (let layer = 0; layer < this.neurons.length; layer++)
            for (let neuron of this.neurons[layer])
                neuron.bias += random(-strength, strength);
    }

    clone() {

        const copy = new Network(this.input_layer, this.hidden_layer, this.output_layer);

        for (let i = 0; i < this.weights.length; i++)
            for (let j = 0; j < this.weights[i].length; j++)
                for (let k = 0; k < this.weights[i][j].length; k++)
                    copy.weights[i][j][k] = this.weights[i][j][k];

        for (let i = 0; i < this.neurons.length; i++)
            for (let j = 0; j < this.neurons[i].length; j++)
                copy.neurons[i][j].bias = this.neurons[i][j].bias;

        return copy;
    }

    static fromJSON(data) {

        const hidden = data.layers.slice(1, -1);
        const net = new Network(data.layers[0], hidden, data.layers[data.layers.length - 1]);

        for (let i = 0; i < data.weights.length; i++)
            for (let j = 0; j < data.weights[i].length; j++)
                for (let k = 0; k < data.weights[i][j].length; k++)
                    net.weights[i][j][k] = data.weights[i][j][k];

        for (let i = 0; i < data.biases.length; i++)
            for (let j = 0; j < data.biases[i].length; j++)
                net.neurons[i][j].bias = data.biases[i][j];

        return net;
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

    display() {
        console.log(`Layers: ${this.layers}`);
        console.log("Neurons:", this.neurons);
        console.log("Weights:", this.weights);
    }
}
