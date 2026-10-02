// const brainChannel = new BroadcastChannel("brain");

async function setupTensorFlow() {
  console.log("Setting up TensorFlow backend...");

  await tf.setBackend("webgpu");
  await tf.ready();

  console.log("TensorFlow backend:", tf.getBackend());
}


// Game objects
let jumpForce = -10;

let pipes = [];

let pipeSpacing = 400;

let game_running = true;


async function setup() {
  await setupTensorFlow();

  createCanvas(innerWidth, innerHeight);

  // brain = new Network(5, [4,4,4], 1);
  // bird = new Bird(20, jumpForce, brain);
  // brain.display();

  //sending informations to the visualizer
  //   brainChannel.postMessage({
  //     layers: brain.layers,
  //     neurons: brain.neurons,
  //     weights: brain.weights
  // });

  // First pipe
  pipes.push(new Obstacle());
  
  // startTraining();
  initGeneticEvolution()
}


function draw() {

  background(20);

  // const pipe = pipes[0];

  // const gapStart =
  //   pipe.topPipeHeight;

  // const gapEnd =
  //   height -
  //   pipe.bottomPipeHeight;

  // const gapCenter =
  //   (gapStart + gapEnd) / 2;


  // const inputs = [

  //   bird.y / height,

  //   bird.velocity / 10,

  //   (pipe.x - bird.x) / width,

  //   (gapCenter - bird.y) / height,

  //   pipe.gap / height
  // ];


  // autoPlay(
  //   bird,
  //   inputs,
  //   i
  // );


  //check for collision of pipes with bird
  // for (let j = pipes.length - 1; j >= 0; j-- ) {

  //   const currentPipe =
  //     pipes[j];

  //   if (
  //     currentPipe.checkBirdCollision(bird)) {

  //     // killBird(i);

  //     break;
  //   }
  // }



  //Rendering and updating pipe position
  for (let pipe of pipes) {
    pipe.show();
    pipe.update();
  }
  // Remove pipes that are fully off-screen
  pipes = pipes.filter(pipe => pipe.x + pipe.pipeWidth + 10 > 0);

  // Remove pipes that have completely left the screen
  // pipes = pipes.filter(pipe => pipe.x + pipe.width <= 0);

  // Add a new pipe at the end
  if (
    pipes.length === 0 ||
    pipes[pipes.length - 1].x < width - pipeSpacing
  ) {
    pipes.push(new Obstacle());
  }

  //rendering birds

  for (let bird of birds) {
    if (!bird.alive) continue;
    bird.show();
    bird.update();
  }

  mainLoop();

  //start the training approach
  // switch (TRAINING_METHOD) {
  //   case "GeneticEvolution":

  //   GeneticEvolution();

  //     break;
  // }



  // let aliveBirds = 0;

  // for (let bird of birds) {

  //   if (bird.alive) {
  //     aliveBirds++;
  //   }
  // }


  // if (aliveBirds === 0) {

  //   endGeneration();
  // }






}

// Space bar
function keyPressed() {

  if (game_running === true) {

    if (key === " ") {
      birds[0].jump();
    }
  }
}


let _simRunning = true;

function stopSimulation() {

    if (_simRunning) {
        noLoop();
        _simRunning = false;
        document.getElementById("btn-stop").textContent = "▶ Resume";
    } else {
        loop();
        _simRunning = true;
        document.getElementById("btn-stop").textContent = "⏸ Stop";
    }
}

function resetSimulation() {

    pretrained = false;
    best_bird = null;
    generation = 0;
    birds = [];
    pipes = [];

    _simRunning = true;
    document.getElementById("btn-stop").textContent = "⏸ Stop";

    loop();
    initGeneticEvolution();
}


function handleBrainImport(event) {

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            loadBrainFromJSON(data);
        } catch (err) {
            console.error("Failed to parse brain JSON:", err);
        }
    };

    reader.readAsText(file);

    // Reset input so the same file can be re-imported
    event.target.value = "";
}