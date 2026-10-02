let birds = [];
let best_bird = null;

function initGeneticEvolution(){ //already called by the sketch.js setup function
    console.log("Creating population");
     //create first population
     for(let i=0 ; i<POPULATION_SIZE; i++){
        let current_bird_brain = new Network(5, [4,4,4], 1);
        birds[i] = new Bird(BIRD_RADIUS, BIRD_JUMP_FORCE, current_bird_brain);
     }
}

function play(bird) {
    if (!bird.alive) return;

    // Find the closest pipe that is ahead of the bird
    let nextPipe = null;

    for (let pipe of pipes) {
        if (pipe.x + pipe.pipeWidth > bird.x) {
            nextPipe = pipe;
            break;
        }
    }

    // No upcoming pipe
    if (nextPipe === null) return;

    // Calculate neural inputs

    // 1. Bird's vertical position
    const birdY = bird.y / height;

    // 2. Bird's vertical velocity
    const birdVelocity = bird.velocityY / Math.abs(BIRD_JUMP_FORCE);

    // 3. Horizontal distance to pipe
    const distanceX =
        (nextPipe.x - bird.x) / width;

    // 4. Distance from bird to top of gap
    const distanceTop =
        (bird.y - nextPipe.topPipeHeight) / height;

    // 5. Distance from bird to bottom of gap
    const gapBottom =
        height - nextPipe.bottomPipeHeight;

    const distanceBottom =
        (gapBottom - bird.y) / height;

    const inputs = [
        birdY,
        birdVelocity,
        distanceX,
        distanceTop,
        distanceBottom
    ];

    const prediction = bird.brain.predict(inputs);

    if (prediction[0] > 0.5) {
        bird.jump();
    }

    // Fitness
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

    const aliveBirds = birds.filter(b => b.alive).length;

    if (aliveBirds === 0 && birds.length > 0) {
        console.log("All birds died,,, analysing insights...");
        //find best bird
        for(let i=0; i<birds.length; i++){
            if(best_bird === null || birds[i].fitness > best_bird.fitness){
                best_bird = birds[i];
            }
        }
        console.log(`Best bird fitness: ${best_bird.fitness.toFixed(2)} | gaps passed: ${best_bird.gaps_passed}`); 
        noLoop() 
    }
}