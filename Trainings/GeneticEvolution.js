let birds = [];
let best_bird = null;
let generation = 0;
let pretrained = false;


function initGeneticEvolution() {
    console.log("Creating population");
    generation = 1;
    spawnGeneration(null);
}


function spawnGeneration(parentBrain) {

    birds = [];
    pipes = [];
    pipes.push(new Obstacle());

    for (let i = 0; i < POPULATION_SIZE; i++) {

        let brain;

        if (parentBrain === null) {
            brain = new Network(5, [4, 4, 4], 1);
        } else {
            brain = parentBrain.clone();
            brain.mutate(MUTATION_STRENGTH);
        }

        if (i === 0 && parentBrain !== null) brain.visualize = true;

        birds.push(new Bird(BIRD_RADIUS, BIRD_JUMP_FORCE, brain));
    }

    console.log(`Generation ${generation} started | population: ${POPULATION_SIZE}`);
}



function nextGeneration() {

    // Pick best bird of this generation
    let generationBest = birds[0];

    for (let i = 1; i < birds.length; i++) {
        if (birds[i].fitness > generationBest.fitness) {
            generationBest = birds[i];
        }
    }

    // Update all-time best
    if (best_bird === null || generationBest.fitness > best_bird.fitness) {
        if (best_bird !== null) best_bird.brain.visualize = false;
        best_bird = generationBest;
        best_bird.brain.visualize = true;
        console.log(`New best brain! fitness: ${best_bird.fitness.toFixed(2)} | gaps passed: ${best_bird.gaps_passed}`);
    }

    console.log(`Generation ${generation} ended | best fitness: ${generationBest.fitness.toFixed(2)} | gaps passed: ${generationBest.gaps_passed}`);

    brainChannel.postMessage({
        type: "stats_update",
        generation: generation,
        bestFitness: generationBest.fitness,
        gapsPassed: generationBest.gaps_passed
    });

    generation++;

    spawnGeneration(best_bird.brain);
}


function downloadBestBrain() {

    const bird = best_bird || (birds.length > 0 ? birds.reduce((a, b) => a.fitness > b.fitness ? a : b) : null);

    if (!bird) {
        console.warn("No bird available to download.");
        return;
    }

    const brain = bird.brain;

    const data = {
        generation: generation,
        fitness: bird.fitness,
        gaps_passed: bird.gaps_passed,
        layers: brain.layers,
        weights: brain.weights,
        biases: brain.neurons.map(layer => layer.map(n => n.bias))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");

    a.href     = url;
    a.download = `best_brain_gen${generation}.json`;
    a.click();

    URL.revokeObjectURL(url);

    console.log(`Downloaded brain: gen ${generation} | fitness: ${bird.fitness.toFixed(2)}`);
}


function play(bird) {

    if (!bird.alive) return;

    let nextPipe = null;
    for (let pipe of pipes) {
        if (pipe.x + pipe.pipeWidth > bird.x) { nextPipe = pipe; break; }
    }

    if (nextPipe === null) return;

    const gapBottom = height - nextPipe.bottomPipeHeight;

    const inputs = [
        bird.y / height,
        bird.velocity / Math.abs(BIRD_JUMP_FORCE),
        (nextPipe.x - bird.x) / width,
        (bird.y - nextPipe.topPipeHeight) / height,
        (gapBottom - bird.y) / height
    ];

    const prediction = bird.brain.predict(inputs);

    if (prediction[0] > 0.5) bird.jump();

    bird.fitness += SURVIVAL_REWARD;
    bird.fitness += bird.gaps_passed * GAP_SURVIVAL_REWARD;

    if (!bird.alive && !bird.dead_logged) {
        bird.dead_logged = true;
        bird.fitness += DEATH_PENALTY;
        console.log(`Bird died | fitness: ${bird.fitness.toFixed(2)} | gaps passed: ${bird.gaps_passed}`);
    }
}


function mainLoop() {

    for (let i = 0; i < birds.length; i++) {
        play(birds[i]);
    }

    const aliveBirds = birds.filter(b => b.alive);

    // Track current best alive bird for visualizer
    let currentBest = null;
    for (let bird of aliveBirds) {
        if (currentBest === null || bird.fitness > currentBest.fitness) {
            currentBest = bird;
        }
    }

    for (let bird of birds) bird.brain.visualize = false;
    if (currentBest !== null) currentBest.brain.visualize = true;

    if (aliveBirds.length === 0 && birds.length > 0) {
        if (pretrained) {
            console.log(`Pretrained bird died | fitness: ${birds[0].fitness.toFixed(2)} | gaps: ${birds[0].gaps_passed}`);
            noLoop();
        } else {
            nextGeneration();
        }
    }
}


function loadBrainFromJSON(data) {

    const required = ["layers", "weights", "biases"];
    for (const field of required) {
        if (!data[field]) {
            console.error(`Invalid brain JSON: missing field "${field}"`);
            return;
        }
    }

    console.log(`Loading pretrained brain | layers: ${data.layers} | gen: ${data.generation || "?"}`);

    pretrained = true;
    generation = data.generation || 0;

    const brain = Network.fromJSON(data);
    brain.visualize = true;

    birds = [];
    pipes = [];
    pipes.push(new Obstacle());
    birds.push(new Bird(BIRD_RADIUS, BIRD_JUMP_FORCE, brain));

    loop();
    document.getElementById("btn-stop").textContent = "⏸ Stop";
    _simRunning = true;

    console.log("Pretrained bird spawned. Simulation started.");
}
