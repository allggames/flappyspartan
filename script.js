const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- VARIABLES ---
let frames = 0;
const RAD = Math.PI / 180;
const state = { current: 0, getReady: 0, game: 1, over: 2 };

// --- CARGA DE IMÁGENES ---
const sprites = {
    bird: new Image(),
    pipe: new Image(),
    bg: new Image()
};

// ¡Asegúrate de que estos nombres coincidan con tus archivos!
sprites.bird.src = "guerrera.jpg"; // Si consigues el PNG sin fondo, cambia esto a .png
sprites.pipe.src = "columna.png";
sprites.bg.src = "fondo.jpg";

// --- OBJETOS ---

const bg = {
    draw: function() {
        // Dibujar fondo ocupando toda la pantalla
        ctx.drawImage(sprites.bg, 0, 0, canvas.width, canvas.height);
    }
}

const bird = {
    x: 100, 
    y: 400,
    // TAMAÑO "REAL": 80x80px en pantalla HD se ve muy bien
    w: 80, 
    h: 80, 
    radius: 30, // Radio del círculo de colisión (para que sea justo)
    speed: 0,
    gravity: 0.6,
    jump: -10, 
    rotation: 0,
    
    draw: function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Rotación
        if (this.speed >= this.jump) {
            this.rotation = Math.min(Math.PI / 4, this.rotation + 2 * RAD);
        } else {
            this.rotation = -25 * RAD;
        }
        ctx.rotate(this.rotation);
        
        // Dibuja la guerrera centrada en su posición
        ctx.drawImage(sprites.bird, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
    },
    
    flap: function() {
        this.speed = this.jump;
    },
    
    update: function() {
        if(state.current == state.getReady) {
            // Flotar suavemente antes de empezar
            this.y = 400 - 10 * Math.cos(frames/20);
            this.rotation = 0;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            // Suelo (ajustado para que no caiga al infinito)
            if(this.y + this.h/2 >= canvas.height - 20) {
                this.y = canvas.height - 20 - this.h/2;
                if(state.current == state.game) state.current = state.over;
            }
        }
    }
}

const pipes = {
    position: [],
    w: 130,  // Ancho de la columna (más gruesa para HD)
    h: 800,  // Altura visual de la columna
    dx: 6,   // Velocidad de movimiento
    gap: 320, // HUECO: Espacio vertical seguro para que pase la guerrera
    
    draw: function() {
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            
            // Coordenadas del hueco
            let topY = p.y; 
            let bottomY = p.y + this.gap;
            
            // 1. COLUMNA DE ARRIBA (Invertida)
            // Se dibuja desde el techo del hueco hacia arriba
            ctx.save();
            ctx.translate(p.x, topY); // Mover al borde del hueco superior
            ctx.scale(1, -1); // Voltear verticalmente
            ctx.drawImage(sprites.pipe, 0, 0, this.w, this.h);
            ctx.restore();
            
            // 2. COLUMNA DE ABAJO (Normal)
            // Se dibuja desde el suelo del hueco hacia abajo
            ctx.drawImage(sprites.pipe, p.x, bottomY, this.w, this.h);
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        // Generar columnas cada 100 cuadros
        if(frames % 100 == 0) {
            this.position.push({
                x: canvas.width,
                // Calcular posición Y aleatoria para el hueco
                // Math.random() * (max - min) + min
                y: Math.random() * (canvas.height - 600) + 200
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;
            
            // COLISIONES
            // Hitbox un poco más pequeño que la imagen para ser amables
            let hitX = p.x + 10;
            let hitW = this.w - 20;
            let bottomPipeYPos = p.y + this.gap;
            
            // Si la guerrera está horizontalmente dentro de la columna
            if(bird.x + bird.radius > hitX && bird.x - bird.radius < hitX + hitW) {
                // Y si toca la de arriba O la de abajo
                if(bird.y - bird.radius < p.y || bird.y + bird.radius > bottomPipeYPos) {
                    state.current = state.over;
                }
            }
            
            // Eliminar columna si sale de pantalla
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
        ctx.textAlign = "center";
        ctx.lineWidth = 3;
        
        if(state.current == state.game) {
            ctx.font = "80px Verdana";
            ctx.strokeText(this.value, canvas.width/2, 100);
            ctx.fillText(this.value, canvas.width/2, 100);
        } else if(state.current == state.over) {
            ctx.font = "50px Verdana";
            ctx.strokeText("Score: " + this.value, canvas.width/2, 300);
            ctx.fillText("Score: " + this.value, canvas.width/2, 300);
            
            ctx.strokeText("Best: " + this.best, canvas.width/2, 370);
            ctx.fillText("Best: " + this.best, canvas.width/2, 370);
            
            ctx.fillStyle = "#e74c3c";
            ctx.font = "80px Verdana";
            ctx.strokeText("GAME OVER", canvas.width/2, 200);
            ctx.fillText("GAME OVER", canvas.width/2, 200);
            
            ctx.fillStyle = "#FFF";
            ctx.font = "30px Verdana";
            ctx.fillText("Click para reiniciar", canvas.width/2, 500);
        } else if(state.current == state.getReady) {
            ctx.fillStyle = "#f1c40f";
            ctx.font = "70px Verdana";
            ctx.strokeText("SPARTAN", canvas.width/2, 250);
            ctx.fillText("SPARTAN", canvas.width/2, 250);
            
            ctx.fillStyle = "#FFF";
            ctx.font = "35px Verdana";
            ctx.fillText("Click o Espacio", canvas.width/2, 350);
        }
    }
}

// --- CONTROL ---
function action(evt) {
    if(evt.type === 'touchstart') evt.preventDefault();
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

window.addEventListener("keydown", (e) => { if(e.code === "Space") action(e); });
window.addEventListener("mousedown", action);
window.addEventListener("touchstart", action, {passive: false});

// --- INICIO ---
let loaded = 0;
function init() {
    loaded++;
    if(loaded === 3) loop();
}
sprites.bird.onload = init;
sprites.pipe.onload = init;
sprites.bg.onload = init;

// Seguridad por si alguna imagen falla
setTimeout(() => { if(loaded < 3) loop(); }, 1000); 

function loop() {
    bg.draw();
    pipes.update();
    pipes.draw();
    bird.update();
    bird.draw();
    score.draw();
    frames++;
    requestAnimationFrame(loop);
}
