class Bird {
    constructor(radius, jumpForce, brain) {
        this.y = this.y = random(radius, height-radius);
        this.x = width / 2;
        this.gravity = 0.5;
        this.velocity = 0;
        this.radius = radius;
        this.jumpForce = jumpForce;
        this.brain = brain;
        this.alive = true;
        this.fitness = 0;
        this.gaps_passed = 0;
        this._passedPipes = new Set();
    }

    show() {
        // if (this.alive) {
            fill(255);
            ellipse(this.x, this.y, this.radius)
        // }
    }

    update() {
        this.checkCollision();
        this.velocity += this.gravity;
        this.y += this.velocity;
        if (this.y > height - this.radius) {
            this.y = height - this.radius;
            this.velocity = 0;
        }

        if (this.y < this.radius) {
            this.y = this.radius;
            this.velocity = 0;
        }

    }

    checkCollision() {
        for (let i = 0; i < pipes.length; i++) {
            if (this.x + this.radius / 2 > pipes[i].x &&
                this.x - this.radius / 2 < pipes[i].x + pipes[i].pipeWidth &&
                (
                    this.y - this.radius / 2 < pipes[i].topPipeHeight ||
                    this.y + this.radius / 2 > height - pipes[i].bottomPipeHeight
                )) {
                this.alive = false;
            }

            // Gap crossed: bird's center has just passed the right edge of the pipe
            if (
                !this._passedPipes.has(pipes[i].id) &&
                this.x > pipes[i].x + pipes[i].pipeWidth
            ) {
                this._passedPipes.add(pipes[i].id);

                const clearTop = this.y - this.radius / 2 > pipes[i].topPipeHeight;
                const clearBottom = this.y + this.radius / 2 < height - pipes[i].bottomPipeHeight;

                if (clearTop && clearBottom) {
                    this.gaps_passed++;
                }
            }
        }
    }

    clone(){
        const clonedBrain = this.brain.clone();
        const clonedBird = new Bird(this.radius, this.jumpForce, clonedBrain);
        return clonedBird;
    }

    jump() {
        this.velocity = this.jumpForce;
    }
}