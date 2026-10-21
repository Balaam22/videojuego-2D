const canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Cargar recursos multimedia
let bgImage = new Image();
bgImage.src = 'assets/fondo.jpg';

let ghostImg = new Image();
ghostImg.src = 'assets/fantasma.png';

let explosionImg = new Image();
explosionImg.src = 'assets/explosion.png';

let score = 0;
let ghosts = [];

// Función para limpiar de forma automática el fondo blanco de las imágenes
function removeWhiteBackground(img) {
    let tempCanvas = document.createElement('canvas');
    let tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tempCtx.drawImage(img, 0, 0);
    
    let imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    let data = imgData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        let red = data[i];
        let green = data[i + 1];
        let blue = data[i + 2];
        
        // Si el píxel es blanco o cercano a blanco, se vuelve transparente
        if (red > 200 && green > 200 && blue > 200) {
            data[i + 3] = 0;
        }
    }
    
    tempCtx.putImageData(imgData, 0, 0);
    let newImg = new Image();
    newImg.src = tempCanvas.toDataURL();
    return newImg;
}

// Procesar imágenes al cargarse
let processedGhostImg = new Image();
ghostImg.onload = function() {
    processedGhostImg = removeWhiteBackground(ghostImg);
};

let processedExplosionImg = new Image();
explosionImg.onload = function() {
    processedExplosionImg = removeWhiteBackground(explosionImg);
};

class Ghost {
    constructor() {
        this.radius = 25;
        this.resetPosition();
        this.speed = Math.random() * 2 + 1.5;
        this.type = Math.floor(Math.random() * 4); // 0: Arriba, 1: Abajo, 2: Diagonal, 3: Circular
        this.angle = Math.random() * Math.PI * 2;
        
        this.isColliding = false;
        this.collisionTimeout = null;
        
        switch(this.type) {
            case 0: this.dx = 0; this.dy = -this.speed; break;
            case 1: this.dx = 0; this.dy = this.speed; break;
            case 2: 
                this.dx = (Math.random() < 0.5 ? 1 : -1) * this.speed;
                this.dy = (Math.random() < 0.5 ? 1 : -1) * this.speed;
                break;
            case 3: 
                this.dx = (Math.random() < 0.5 ? 1 : -1) * this.speed;
                this.dy = (Math.random() < 0.5 ? 1 : -1) * this.speed;
                break;
        }
    }

    resetPosition() {
        this.x = Math.random() * (canvasWidth - 60) + 30;
        this.y = Math.random() * (canvasHeight - 60) + 30;
    }

    update() {
        if (this.type === 3) {
            this.angle += 0.05;
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        } else {
            this.x += this.dx;
            this.y += this.dy;
        }

        if (this.x - this.radius < 0 || this.x + this.radius > canvasWidth) {
            this.dx = -this.dx;
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvasHeight) {
            this.dy = -this.dy;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.globalCompositeOperation = 'source-over';
        if (this.isColliding && processedExplosionImg.complete) {
            ctx.drawImage(processedExplosionImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else if (processedGhostImg.complete) {
            ctx.drawImage(processedGhostImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        }

        ctx.restore();
    }

    triggerCollision() {
        if (!this.isColliding) {
            this.isColliding = true;
            clearTimeout(this.collisionTimeout);
            this.collisionTimeout = setTimeout(() => {
                this.isColliding = false;
            }, 400);
        }
    }
}

// Inicializar los 25 fantasmas requeridos
function initGhosts() {
    ghosts = [];
    for (let i = 0; i < 25; i++) {
        ghosts.push(new Ghost());
    }
}

// Colisiones entre objetos con rebote físico e intercambio de velocidades
function checkObjectCollisions() {
    for (let i = 0; i < ghosts.length; i++) {
        for (let j = i + 1; j < ghosts.length; j++) {
            let g1 = ghosts[i];
            let g2 = ghosts[j];

            let dx = g2.x - g1.x;
            let dy = g2.y - g1.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < g1.radius + g2.radius) {
                g1.triggerCollision();
                g2.triggerCollision();

                let tempDx = g1.dx;
                let tempDy = g1.dy;
                g1.dx = g2.dx;
                g1.dy = g2.dy;
                g2.dx = tempDx;
                g2.dy = tempDy;

                let overlap = (g1.radius + g2.radius) - distance;
                let nx = dx / distance;
                let ny = dy / distance;
                g1.x -= nx * overlap * 0.5;
                g1.y -= ny * overlap * 0.5;
                g2.x += nx * overlap * 0.5;
                g2.y += ny * overlap * 0.5;
            }
        }
    }
}

// Evento de clic para cazar fantasmas y reubicarlos
canvas.addEventListener("click", function(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    for (let i = 0; i < ghosts.length; i++) {
        let g = ghosts[i];
        let distance = Math.sqrt((mouseX - g.x) ** 2 + (mouseY - g.y) ** 2);

        if (distance <= g.radius) {
            score++;
            document.getElementById("contador").innerText = score;
            g.resetPosition();
            break;
        }
    }
});

// Control de audio de fondo
const audioFondo = document.getElementById("audioFondo");
const btnMusica = document.getElementById("btnMusica");
let musicPlaying = false;

btnMusica.addEventListener("click", function() {
    if (!musicPlaying) {
        audioFondo.play();
        btnMusica.innerText = "🔇 Silenciar Música";
        musicPlaying = true;
    } else {
        audioFondo.pause();
        btnMusica.innerText = "🎵 Reproducir Música";
        musicPlaying = false;
    }
});

// Bucle principal del juego
function animate() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);

    checkObjectCollisions();

    ghosts.forEach(ghost => {
        ghost.update();
        ghost.draw();
    });

    requestAnimationFrame(animate);
}

initGhosts();
animate();