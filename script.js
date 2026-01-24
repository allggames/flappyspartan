const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CONFIGURACIÓN ---
let frames = 0;
const RAD = Math.PI / 180;
const state = { current: 0, getReady: 0, game: 1, over: 2 };

// MODO DEBUG: true para ver las cajas rojas.
const DEBUG = true; 

// --- CARGA DE IMÁGENES ---
const sprites = {
    bird: new Image(),
    pipe: new Image(),
    bg: new Image()
};

sprites.bird.src = "guerrera.png"; 
sprites.pipe.src = "columna.png";
sprites.bg.src = "fondo.png";

// --- OBJETOS ---

const bg = {
    draw: function() {
        if (!sprites.bg.complete) {
             ctx.fillStyle = "#333"; ctx.fillRect(0,0,canvas.width, canvas.height); return;
        }
        const scale = canvas.height / sprites.bg.height;
        const scaledWidth = sprites.bg.width * scale;
        const xOffset = (canvas.width - scaledWidth) / 2;
        ctx.drawImage(sprites.bg, xOffset, 0, scaledWidth, canvas.height);
    }
}

const bird = {
    x: canvas.width / 3, 
    y: canvas.height / 2,
    w: 180, 
    h: 180, 
    // Radio de colisión (el círculo rojo)
    radius: 25, 
    speed: 0,
    gravity: 0.8,
    jump: -15, 
    rotation: 0,
    
    draw: function() {
        if (!sprites.bird.complete) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.speed >= this.jump) {
            this.rotation = Math.min(Math.PI / 8, this.rotation + 1 * RAD);
        } else {
            this.rotation = -15 * RAD;
        }
        ctx.rotate(this.rotation);
        
        ctx.drawImage(sprites.bird, -this.w/2, -this.h/2, this.w, this.h);
        
        // DIBUJAR CÍRCULO ROJO
        if (DEBUG) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI*2);
            ctx.strokeStyle = "red"; 
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        ctx.restore();
    },
    
    flap: function() {
        this.speed = this.jump;
    },
    
    update: function() {
        if(state.current == state.getReady) {
            this.y = canvas.height / 2 - 20 * Math.cos(frames/30);
            this.rotation = 0;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            if(this.y + this.h/2 >= canvas.height - 50) {
                this.y = canvas.height - 50 - this.h/2;
                if(state.current == state.game) state.current = state.over;
            }
            if(this.y - this.h/2 <= 0) {
                this.y = this.h/2;
                this.speed = 0;
            }
        }
    }
}

const pipes = {
    position: [],
    w: 160,   
    h: 1000,  
    dx: 7,    
    gap: 390, 
    
    draw: function() {
        if (!sprites.pipe.complete) return;
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y; 
            let bottomY = p.y + this.gap;
            
            // DIBUJO DE COLUMNAS
            ctx.save();
            ctx.translate(p.x, topY);
            ctx.scale(1, -1);
            ctx.drawImage(sprites.pipe, 0, 0, this.w, this.h);
            ctx.restore();
            
            ctx.drawImage(sprites.pipe, p.x, bottomY, this.w, this.h);

            // DIBUJAR CAJAS ROJAS (Ajustadas a los bordes exactos)
            if (DEBUG) {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 3;
                
                // --- CAMBIO: Margen eliminado ---
                // Ahora la caja roja es exactamente del ancho de la columna
                let hitX = p.x;
                let hitW = this.w;
                
                // Caja Arriba
                ctx.strokeRect(hitX, 0, hitW, topY); 
                // Caja Abajo
                ctx.strokeRect(hitX, bottomY, hitW, canvas.height - bottomY);
            }
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        if(frames % 110 == 0) {
            this.position.push({
                x: canvas.width,
                y: Math.random() * (canvas.height - 700) + 200
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;
            
            // --- COLISIONES EXACTAS ---
            // Usamos las mismas medidas exactas que el dibujo
            let hitX = p.x;
            let hitW = this.w;
            let bottomPipeYPos = p.y + this.gap;
            
            // Lógica de choque
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
        ctx.lineWidth = 4;
        
        if(state.current == state.game) {
            ctx.font = "100px Georgia, serif";
            ctx.strokeText(this.value, canvas.width/2, 150);
            ctx.fillText(this.value, canvas.width/2, 150);
        } else if(state.current == state.over) {
            ctx.fillStyle = "#e74c3c";
            ctx.font = "80px Georgia, serif";
            ctx.strokeText("GAME OVER", canvas.width/2, canvas.height/2 - 100);
            ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 100);

            ctx.fillStyle = "#FFF";
            ctx.font = "50px Georgia, serif";
            ctx.strokeText("Score: " + this.value, canvas.width/2, canvas.height/2 + 20);
            ctx.fillText("Score: " + this.value, canvas.width/2, canvas.height/2 + 20);
            
            ctx.font = "40px Verdana";
            ctx.fillText("Tap to restart", canvas.width/2, canvas.height/2 + 150);
        } else if(state.current == state.getReady) {
            ctx.fillStyle = "#f1c40f";
            ctx.font = "90px Georgia, serif";
            ctx.strokeText("SPARTAN", canvas.width/2, canvas.height/2 - 100);
            ctx.fillText("SPARTAN", canvas.width/2, canvas.height/2 - 100);
            
            ctx.fillStyle = "#FFF";
            ctx.font = "40px Verdana";
            ctx.fillText("Tap to start", canvas.width/2, canvas.height/2 + 50);
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

window.addEventListener("keydown", (e) => { if(e.code === "Space" || e.code === "ArrowUp") action(e); });
window.addEventListener("mousedown", action);
window.addEventListener("touchstart", action, {passive: false});

// --- INICIO ---
let assetsLoaded = 0;
function checkAssets() {
    assetsLoaded++;
    if(assetsLoaded === 3) loop();
}

sprites.bird.onload = checkAssets;
sprites.pipe.onload = checkAssets;
sprites.bg.onload = checkAssets;

setTimeout(() => { if (assetsLoaded < 3) loop(); }, 1000);

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
