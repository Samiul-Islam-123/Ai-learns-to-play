let birds = [];
let best_bird = null;
let generation = 0;


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


function play(bird) {

    if (!bird.alive) return;

    // Find the closest pipe ahead
    let nextPipe = null;

    for (let pipe of pipes) {
        if (pipe.x + pipe.pipeWidth > bird.x) {
            nextPipe = pipe;
            break;
        }
    }

    if (nextPipe === null) return;

    const birdY         = bird.y / height;
    const birdVelocity  = bird.velocity / Math.abs(BIRD_JUMP_FORCE);
    const distanceX     = (nextPipe.x - bird.x) / width;
    const distanceTop   = (bird.y - nextPipe.topPipeHeight) / height;
    const gapBottom     = height - nextPipe.bottomPipeHeight;
    const distanceBottom = (gapBottom - bird.y) / height;

    const inputs = [birdY, birdVelocity, distanceX, distanceTop, distanceBottom];

    const prediction = bird.brain.predict(inputs);

    if (prediction[0] > 0.5) {
        bird.jump();
    }

    bird.fitness += SURVIVAL_REWARD;
    bird.fitness += bird.gaps_passed * GAP_SURVIVAL_REWARD;

    if (!bird.alive && !bird.dead_logged) {
        bird.dead_logged = true;
        bird.fitness += DEATH_PENALTY;
        console.log(`Bird died | fitness: ${bird.fitness.toFixed(2)} | gaps passed: ${bird.gaps_passed}`);
    }
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


function mainLoop() {

    for (let i = 0; i < birds.length; i++) {
        play(birds[i]);
    }

    const aliveBirds = birds.filter(b => b.alive).length;

    if (aliveBirds === 0 && birds.length > 0) {
        nextGeneration();
    }
}
