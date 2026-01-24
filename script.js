const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CONFIGURACIÓN ---
let frames = 0;
const RAD = Math.PI / 180;
const state = { current: 0, getReady: 0, game: 1, over: 2 };

// ¿Quieres ver las cajas de colisión? true = SÍ, false = NO
// Cuando termines de probar, cambia esto a false
const DEBUG = false; 

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
    // --- EL ARREGLO ESTÁ AQUÍ ---
    // Antes era 60. Ahora es 35.
    // Esto hace que el cuerpo "sólido" sea mucho más pequeño que el dibujo.
    radius: 35, 
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
        
        // MODO DEBUG: Dibuja el círculo de colisión
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
    gap: 380, 
    
    draw: function() {
        if (!sprites.pipe.complete) return;
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y; 
            let bottomY = p.y + this.gap;
            
            // Arriba
            ctx.save();
            ctx.translate(p.x, topY);
            ctx.scale(1, -1);
            ctx.drawImage(sprites.pipe, 0, 0, this.w, this.h);
            ctx.restore();
            
            // Abajo
            ctx.drawImage(sprites.pipe, p.x, bottomY, this.w, this.h);

            // MODO DEBUG: Dibuja las cajas de las columnas
            if (DEBUG) {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 3;
                
                // Caja Arriba (ajustada para ser permisiva)
                // Le damos 30px de margen a los lados para que no sea tan estricto
                let hitX = p.x + 30;
                let hitW = this.w - 60;
                
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
            
            // --- COLISIONES MEJORADAS ---
            // Hacemos la caja de la columna más angosta que el dibujo
            // Así, si rozas el borde, no mueres.
            let hitMargin = 30; // Margen de perdón
            let hitX = p.x + hitMargin;
            let hitW = this.w - (hitMargin * 2);
            let bottomPipeYPos = p.y + this.gap;
            
            // Lógica de choque
            // 1. ¿El pájaro está horizontalmente dentro de la zona peligrosa?
            if(bird.x + bird.radius > hitX && bird.x - bird.radius < hitX + hitW) {
                // 2. ¿Toca el techo O toca el suelo?
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
