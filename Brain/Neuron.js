class Neuron {
    constructor(numInputs, activation) {
        // Neural network data
        this.numInputs = numInputs;
        this.bias = random(-1, 1);
        this.activation = activation;

        // Runtime data
        this.input = 0;
        this.value = 0;

        // Visualization data
        this.x = 0;
        this.y = 0;
    }
}