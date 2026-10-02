let _pipeIdCounter = 0;

class Obstacle {
    constructor() {
        this.id = _pipeIdCounter++;
        this.pipeWidth = 60;
        this.gap = 200;

        // Make sure there is enough room for the gap
        const minHeight = 50;
        const maxHeight = height - this.gap - minHeight;

        this.topPipeHeight = random(minHeight, maxHeight);
        this.bottomPipeHeight =
            height - this.gap - this.topPipeHeight;

        this.x = width;
        this.speed = 5;
    }

    show() {
        fill(200);

        // Top pipe
        rect(
            this.x,
            0,
            this.pipeWidth,
            this.topPipeHeight
        );

        // Bottom pipe
        rect(
            this.x,
            height - this.bottomPipeHeight,
            this.pipeWidth,
            this.bottomPipeHeight
        );
    }

    update() {
        this.x -= this.speed;
    }

    isOffScreen() {
        return this.x < -this.pipeWidth;
    }

    checkBirdCollision(bird) {
        let collision = false;

        if (bird.x + bird.radius/2 > this.x &&
            bird.x - bird.radius/2 < this.x + this.pipeWidth &&
            (
                bird.y - bird.radius/2 < this.topPipeHeight ||
                bird.y + bird.radius/2 > height - this.bottomPipeHeight
            ))
            collision = true;

        return collision;
    }
}