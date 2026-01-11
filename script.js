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

// Asegúrate de que los archivos se llamen así en tu carpeta:
sprites.bird.src = "guerrera.png"; 
sprites.pipe.src = "columna.png";
sprites.bg.src = "fondo.png";

// --- OBJETOS ---

const bg = {
    draw: function() {
        if (!sprites.bg.complete) return;
        // Dibujamos el fondo cubriendo todo el canvas
        ctx.drawImage(sprites.bg, 0, 0, canvas.width, canvas.height);
    }
}

const bird = {
    x: 50, 
    y: 150,
    // ¡AQUÍ ESTÁ EL CAMBIO! 
    // He puesto tamaños grandes para una resolución de 320x480.
    // 50px es bastante grande en una pantalla de 320px de ancho.
    w: 50, 
    h: 50, 
    radius: 20, 
    speed: 0,
    gravity: 0.25,
    jump: -4.6, 
    rotation: 0,
    
    draw: function() {
        if (!sprites.bird.complete) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Rotación al saltar/caer
        if (this.speed >= this.jump) {
            this.rotation = Math.min(Math.PI / 4, this.rotation + 5 * RAD);
        } else {
            this.rotation = -25 * RAD;
        }
        ctx.rotate(this.rotation);
        
        // Dibujamos la guerrera
        ctx.drawImage(sprites.bird, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
    },
    
    flap: function() {
        this.speed = this.jump;
    },
    
    update: function() {
        if(state.current == state.getReady) {
            this.y = 150 - 5 * Math.cos(frames/15);
            this.rotation = 0;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            // Suelo
            if(this.y + this.h/2 >= canvas.height - 40) {
                this.y = canvas.height - 40 - this.h/2;
                if(state.current == state.game) state.current = state.over;
            }
        }
    }
}

const pipes = {
    position: [],
    w: 60,  // Columnas anchas
    h: 400, // Altura base
    dx: 2,  // Velocidad
    gap: 130, // Hueco generoso para que pase la guerrera grande
    
    draw: function() {
        if (!sprites.pipe.complete) return;
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y; 
            let bottomY = p.y + this.gap;
            
            // Arriba (Espejo)
            ctx.save();
            ctx.translate(p.x, topY);
            ctx.scale(1, -1); 
            ctx.drawImage(sprites.pipe, 0, 0, this.w, this.h);
            ctx.restore();
            
            // Abajo (Normal)
            ctx.drawImage(sprites.pipe, p.x, bottomY, this.w, this.h);
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        // Añadir columna cada 120 frames
        if(frames % 120 == 0) {
            this.position.push({
                x: canvas.width,
                y: Math.random() * (canvas.height - 350) + 150
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;
            
            // Colisiones (ajustadas al nuevo tamaño)
            let hitX = p.x + 5;
            let hitW = this.w - 10;
            let bottomPipeYPos = p.y + this.gap;
            
            if(bird.x + bird.radius > hitX && bird.x - bird.radius < hitX + hitW) {
                if(bird.y - bird.radius < p.y || bird.y + bird.radius > bottomPipeYPos) {
                    state.current = state.over;
                }
            }
            
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
        ctx.lineWidth = 2;
        
        if(state.current == state.game) {
            ctx.font = "40px Verdana";
            ctx.strokeText(this.value, canvas.width/2, 50);
            ctx.fillText(this.value, canvas.width/2, 50);
        } else if(state.current == state.over) {
            ctx.font = "30px Verdana";
            ctx.strokeText("Score: " + this.value, canvas.width/2, 180);
            ctx.fillText("Score: " + this.value, canvas.width/2, 180);
            
            ctx.font = "40px Verdana";
            ctx.fillStyle = "#e74c3c";
            ctx.strokeText("GAME OVER", canvas.width/2, 120);
            ctx.fillText("GAME OVER", canvas.width/2, 120);
            
            ctx.fillStyle = "#FFF";
            ctx.font = "20px Verdana";
            ctx.fillText("Click para reiniciar", canvas.width/2, 300);
        } else if(state.current == state.getReady) {
            ctx.fillStyle = "#f1c40f";
            ctx.font = "40px Verdana";
            ctx.strokeText("SPARTAN", canvas.width/2, 200);
            ctx.fillText("SPARTAN", canvas.width/2, 200);
            
            ctx.fillStyle = "#FFF";
            ctx.font = "20px Verdana";
            ctx.fillText("Toca para saltar", canvas.width/2, 240);
        }
    }
}

// --- CONTROL ---
function action(evt) {
    if(evt.type === 'touchstart') evt.preventDefault(); // Evita doble toque zoom
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

loop();
