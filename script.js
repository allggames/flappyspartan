const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CONFIGURACIÓN ---
let frames = 0;
const RAD = Math.PI / 180;

// Estados: 0=GetReady, 1=Game, 2=GameOver, 3=WIN (Victoria)
const state = { current: 0, getReady: 0, game: 1, over: 2, win: 3 };

// MODO DEBUG: Ponlo en false cuando termines de ajustar
const DEBUG = false; 

// --- CARGA DE IMÁGENES ---
const sprites = {
    bird: new Image(),
    pipe: new Image(),
    bg: new Image(),
    owl: new Image()
};

sprites.bird.src = "guerrera.png"; 
sprites.pipe.src = "columna.png";
sprites.bg.src = "fondo.png";
sprites.owl.src = "buho.png"; // ¡Tu imagen del Jefe Final!

// --- VARIABLES DE JUEGO ---
let scoreValue = 0;
let pipesPassed = 0; 
let bonusText = ""; 
let bonusTimer = 0; 

// --- OBJETOS ---

const bg = {
    draw: function() {
        if (!sprites.bg.complete) {
             ctx.fillStyle = "#4bb4e6"; ctx.fillRect(0,0,canvas.width, canvas.height); return;
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
    radius: 25, 
    speed: 0,
    gravity: 0.8,
    jump: -15, 
    rotation: 0,
    
    draw: function() {
        if (!sprites.bird.complete) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Rotación
        if(state.current == state.getReady || state.current == state.win) {
             this.rotation = 0;
        } else {
            if (this.speed >= this.jump) {
                this.rotation = Math.min(Math.PI / 8, this.rotation + 1 * RAD);
            } else {
                this.rotation = -15 * RAD;
            }
        }
        ctx.rotate(this.rotation);
        
        ctx.drawImage(sprites.bird, -this.w/2, -this.h/2, this.w, this.h);
        
        if (DEBUG) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI*2);
            ctx.strokeStyle = "red"; ctx.lineWidth = 3; ctx.stroke();
        }
        
        ctx.restore();
    },
    
    flap: function() {
        this.speed = this.jump;
    },
    
    update: function() {
        // En estado WIN, el pájaro se queda flotando en el centro
        if(state.current == state.win) {
            // Movimiento suave de flotación
            this.y = canvas.height / 2 + 50 + 10 * Math.cos(frames/20);
            return;
        }

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
    
    // --- TUS AJUSTES SOLICITADOS ---
    hitMargin: 40,       // Hace la caja más flaca
    columnaPadding: 200, // Hace la caja mucho más corta (perdonadora)
    
    floorHeight: 50, 
    
    draw: function() {
        if (!sprites.pipe.complete) return;
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y; 
            let bottomY = p.y + this.gap;
            
            // Dibujo Visual (Columna completa)
            ctx.save();
            ctx.translate(p.x, topY);
            ctx.scale(1, -1);
            ctx.drawImage(sprites.pipe, 0, 0, this.w, this.h);
            ctx.restore();
            ctx.drawImage(sprites.pipe, p.x, bottomY, this.w, this.h);

            // Debug (Cajas Rojas recortadas con tus medidas)
            if (DEBUG) {
                ctx.strokeStyle = "red"; ctx.lineWidth = 3;
                let hitX = p.x + this.hitMargin;
                let hitW = this.w - (this.hitMargin * 2);
                
                // Caja Arriba (con recorte vertical)
                ctx.strokeRect(hitX, 0, hitW, topY - this.columnaPadding); 
                
                // Caja Abajo (con recorte vertical)
                let boxY = bottomY + this.columnaPadding;
                let boxH = (canvas.height - this.floorHeight) - boxY;
                ctx.strokeRect(hitX, boxY, hitW, boxH);
            }
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        // --- GENERADOR ---
        if(frames % 110 == 0) {
            // LÍMITE: Solo generamos 12 columnas en total
            if (this.totalSpawned < 12) { 
                this.position.push({
                    x: canvas.width,
                    y: Math.random() * (canvas.height - 700) + 200,
                    passed: false 
                });
                this.totalSpawned++;
            }
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;
            
            // Colisiones usando TUS variables
            let hitX = p.x + this.hitMargin;
            let hitW = this.w - (this.hitMargin * 2);
            let techo = p.y - this.columnaPadding;
            let suelo = p.y + this.gap + this.columnaPadding;
            
            if(bird.x + bird.radius > hitX && bird.x - bird.radius < hitX + hitW) {
                if(bird.y - bird.radius < techo || bird.y + bird.radius > suelo) {
                     state.current = state.over;
                }
            }
            
            // --- BONOS ---
            if(p.x + this.w < bird.x && !p.passed) {
                scoreValue += 1;
                pipesPassed += 1;
                p.passed = true;
                
                if(pipesPassed === 3) {
                    bonusText = "¡BONO 50%!"; bonusTimer = 60; scoreValue += 50;
                } else if(pipesPassed === 6) {
                    bonusText = "¡BONO 100%!"; bonusTimer = 60; scoreValue += 100;
                } else if(pipesPassed === 9) {
                    bonusText = "¡BONO 150%!"; bonusTimer = 60; scoreValue += 150;
                } else if(pipesPassed === 12) {
                    bonusText = "¡LLEGASTE!"; bonusTimer = 100; scoreValue += 200;
                    state.current = state.win; // ¡GANASTE!
                }
            }
            
            if(p.x + this.w <= 0) {
                this.position.shift();
                i--; 
            }
        }
    },
    reset: function() {
        this.position = [];
        this.totalSpawned = 0;
    },
    totalSpawned: 0
}

const ui = {
    draw: function() {
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        ctx.textAlign = "center";
        
        // PUNTUACIÓN
        if(state.current == state.game || state.current == state.win) {
            ctx.lineWidth = 4;
            ctx.font = "80px Georgia";
            ctx.strokeText(scoreValue, canvas.width/2, 100);
            ctx.fillText(scoreValue, canvas.width/2, 100);
            
            if(bonusTimer > 0) {
                ctx.fillStyle = "#FFD700"; 
                ctx.font = "60px Verdana";
                ctx.strokeText(bonusText, canvas.width/2, 200);
                ctx.fillText(bonusText, canvas.width/2, 200);
                bonusTimer--;
                ctx.fillStyle = "#FFF"; 
            }
        }

        if(state.current == state.getReady) {
            ctx.fillStyle = "#f1c40f";
            ctx.font = "90px Georgia";
            ctx.strokeText("SPARTAN", canvas.width/2, canvas.height/2 - 100);
            ctx.fillText("SPARTAN", canvas.width/2, canvas.height/2 - 100);
            ctx.fillStyle = "#FFF";
            ctx.font = "40px Verdana";
            ctx.fillText("Tap to Start", canvas.width/2, canvas.height/2 + 50);
        } 
        else if(state.current == state.over) {
            ctx.fillStyle = "#e74c3c";
            ctx.font = "80px Georgia";
            ctx.strokeText("GAME OVER", canvas.width/2, canvas.height/2 - 50);
            ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 50);
            ctx.fillStyle = "#FFF";
            ctx.font = "40px Verdana";
            ctx.fillText("Tap to Restart", canvas.width/2, canvas.height/2 + 100);
        }
        else if(state.current == state.win) {
            // --- PANTALLA FINAL CON BÚHO ---
            if(sprites.owl.complete && sprites.owl.naturalHeight !== 0) {
                // Dibujamos el Búho (Imagen)
                const owlSize = 300; // Tamaño grande
                ctx.drawImage(sprites.owl, canvas.width/2 - owlSize/2, canvas.height/2 - 300, owlSize, owlSize);
            } else {
                // Si olvidaste poner la imagen, sale un cuadro dorado
                ctx.fillStyle = "gold";
                ctx.fillRect(canvas.width/2 - 50, canvas.height/2 - 200, 100, 100);
            }

            ctx.fillStyle = "#FFD700"; 
            ctx.font = "80px Georgia";
            ctx.strokeText("¡VICTORIA!", canvas.width/2, canvas.height/2 + 80);
            ctx.fillText("¡VICTORIA!", canvas.width/2, canvas.height/2 + 80);
            
            ctx.fillStyle = "#FFF";
            ctx.font = "40px Verdana";
            ctx.fillText("¡Misión Cumplida!", canvas.width/2, canvas.height/2 + 150);
            ctx.font = "30px Verdana";
            ctx.fillText("Click para jugar de nuevo", canvas.width/2, canvas.height/2 + 220);
        }
    }
}

// --- CONTROL ---
function action(evt) {
    if(evt.type === 'touchstart') evt.preventDefault();
    
    switch(state.current) {
        case state.getReady: 
            state.current = state.game; 
            break;
        case state.game: 
            bird.flap(); 
            break;
        case state.over: 
            bird.speed = 0;
            pipes.reset();
            scoreValue = 0;
            pipesPassed = 0;
            pipes.totalSpawned = 0;
            state.current = state.getReady;
            break;
        case state.win:
            // Reiniciar tras ganar
            bird.speed = 0;
            pipes.reset();
            scoreValue = 0;
            pipesPassed = 0;
            pipes.totalSpawned = 0;
            state.current = state.getReady;
            break;
    }
}

window.addEventListener("keydown", (e) => { if(e.code === "Space" || e.code === "ArrowUp") action(e); });
window.addEventListener("mousedown", action);
window.addEventListener("touchstart", action, {passive: false});

// --- INICIO ---
function loop() {
    bg.draw();
    pipes.update();
    pipes.draw();
    bird.update();
    bird.draw();
    ui.draw(); 
    
    frames++;
    requestAnimationFrame(loop);
}

// Carga
let loaded = 0;
const checkLoad = () => { loaded++; if(loaded >= 3) loop(); };
sprites.bird.onload = checkLoad;
sprites.pipe.onload = checkLoad;
sprites.bg.onload = checkLoad;
// El buho es opcional para arrancar
sprites.owl.onload = () => {}; 

setTimeout(() => { if(loaded < 3) loop(); }, 1000);
