const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CONFIGURACIÓN ---
let frames = 0;
const RAD = Math.PI / 180;

const state = { current: 0, getReady: 0, game: 1, over: 2 };

// --- CARGA DE IMÁGENES ---
const birdImg = new Image();
birdImg.src = "image_9.png"; // Tu guerrera espartana

const pipeImg = new Image();
pipeImg.src = "image_10.png"; // Tus columnas griegas

const bgImg = new Image();
bgImg.src = "image_11.png"; // Tu fondo de templo griego

// --- OBJETOS DEL JUEGO ---

const bg = {
    x: 0,
    dx: 0.5, // Velocidad del fondo (más lento para efecto de profundidad)
    draw: function() {
        // Dibujamos el fondo dos veces para el efecto de scroll infinito
        ctx.drawImage(bgImg, this.x, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImg, this.x + canvas.width, 0, canvas.width, canvas.height);
    },
    update: function() {
        if(state.current === state.game) {
            this.x = (this.x - this.dx) % (canvas.width);
        }
    }
}

const bird = {
    x: 50,
    y: 150,
    w: 34, // Ancho aproximado de tu sprite
    h: 34, // Alto aproximado de tu sprite
    speed: 0,
    gravity: 0.25,
    jump: -4.6,
    rotation: 0,
    
    draw: function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Rotación basada en la velocidad vertical
        if (this.speed >= this.jump) {
            this.rotation = Math.min(Math.PI / 4, this.rotation + 5 * RAD);
        } else {
            this.rotation = -25 * RAD;
        }
        ctx.rotate(this.rotation);
        // Dibujar el sprite de la guerrera centrado
        ctx.drawImage(birdImg, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
    },
    
    flap: function() {
        this.speed = this.jump;
    },
    
    update: function() {
        if(state.current == state.getReady) {
            // Flotar suavemente en la pantalla de inicio
            this.y = 150 - 5 * Math.cos(frames/15);
            this.rotation = 0;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            // Colisión con el suelo (ajustado para tu fondo)
            if(this.y + this.h/2 >= canvas.height - 50) {
                this.y = canvas.height - 50 - this.h/2;
                if(state.current == state.game) state.current = state.over;
            }
        }
    }
}

const pipes = {
    position: [],
    w: 50, // Ancho de la columna
    h: 300, // Altura de la imagen de la columna
    dx: 2,
    gap: 120, // Espacio entre columnas
    
    draw: function() {
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.h + this.gap;
            
            // Columna Superior (invertida)
            ctx.save();
            ctx.translate(p.x + this.w, topY + this.h);
            ctx.scale(-1, -1); // Voltear verticalmente
            ctx.drawImage(pipeImg, 0, 0, this.w, this.h);
            ctx.restore();
            
            // Columna Inferior
            ctx.drawImage(pipeImg, p.x, bottomY, this.w, this.h);
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        // Añadir una nueva columna cada 120 frames
        if(frames % 120 == 0) {
            this.position.push({
                x: canvas.width,
                y: -150 * (Math.random() + 1)
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;
            
            let bottomPipeYPos = p.y + this.h + this.gap;
            
            // Lógica de Colisión Simple
            if(bird.x + bird.w/3 > p.x && bird.x - bird.w/3 < p.x + this.w && 
               (bird.y - bird.h/3 < p.y + this.h || bird.y + bird.h/3 > bottomPipeYPos)) {
                state.current = state.over;
            }
            
            // Eliminar columna si sale de la pantalla y sumar punto
            if(p.x + this.w <= 0) {
                this.position.shift();
                score.value += 1;
                score.best = Math.max(score.value, score.best);
                localStorage.setItem("best", score.best);
            }
        }
    },
    reset: function() {
        this.position = [];
    }
}

const score = {
    best: localStorage.getItem("best") || 0,
    value: 0,
    draw: function() {
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        
        if(state.current == state.game) {
            ctx.lineWidth = 2;
            ctx.font = "35px Verdana";
            ctx.fillText(this.value, canvas.width/2 - 10, 50);
            ctx.strokeText(this.value, canvas.width/2 - 10, 50);
        } else if(state.current == state.over) {
            ctx.font = "25px Verdana";
            ctx.fillText("Score: " + this.value, canvas.width/2 - 50, 180);
            ctx.fillText("Best: " + this.best, canvas.width/2 - 50, 220);
            
            ctx.fillStyle = "#e74c3c";
            ctx.font = "40px Verdana";
            ctx.fillText("GAME OVER", canvas.width/2 - 115, 120);
            ctx.strokeText("GAME OVER", canvas.width/2 - 115, 120);
        } else if(state.current == state.getReady) {
            ctx.fillStyle = "#f1c40f";
            ctx.font = "30px Verdana";
            ctx.fillText("SPARTAN JUMP", canvas.width/2 - 115, 200);
            ctx.strokeText("SPARTAN JUMP", canvas.width/2 - 115, 200);
            ctx.fillStyle = "#FFF";
            ctx.font = "15px Verdana";
            ctx.fillText("Click o Espacio para empezar", canvas.width/2 - 100, 240);
        }
    }
}

// --- CONTROL ---
function action() {
    switch(state.current) {
        case state.getReady: state.current = state.game; break;
        case state.game: bird.flap(); break;
        case state.over: 
            bird.speed = 0;
            pipes.reset();
            score.value = 0;
            state.current = state.getReady;
            break;
    }
}
document.addEventListener("click", action);
document.addEventListener("keydown", (e) => { if(e.code === "Space") action(); });

// --- BUCLE PRINCIPAL ---
function loop() {
    bg.update();
    bg.draw();
    pipes.update();
    pipes.draw();
    bird.update();
    bird.draw();
    score.draw();
    
    frames++;
    requestAnimationFrame(loop);
}

// Iniciar el juego una vez que la imagen del personaje esté cargada
birdImg.onload = loop;
