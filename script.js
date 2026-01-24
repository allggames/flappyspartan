const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CONFIGURACIÓN ---
let frames = 0;
const RAD = Math.PI / 180;

// Estados: 0=GetReady, 1=Game, 2=GameOver, 3=WIN
const state = { current: 0, getReady: 0, game: 1, over: 2, win: 3 };

// MODO DEBUG
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
sprites.owl.src = "buho.png"; 

// --- VARIABLES DE JUEGO ---
let pipesPassed = 0; 
let displayScore = "0%"; 

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
    gravity: 0.4,  
    jump: -8,      
    rotation: 0,
    
    draw: function() {
        if (!sprites.bird.complete) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
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
        
        // Dibujamos siempre a la guerrera
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
        if(state.current == state.win) {
            this.y = canvas.height / 2 + 50 + 10 * Math.cos(frames/20);
            return;
        }

        if(state.current == state.getReady) {
            // En el inicio, flota suavemente en el centro
            this.y = canvas.height / 2 + 10 * Math.cos(frames/20);
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
    hitMargin: 40,      
    columnaPadding: 200, 
    floorHeight: 50, 
    
    draw: function() {
        if (!sprites.pipe.complete) return;
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y; 
            let bottomY = p.y + this.gap;
            
            ctx.save();
            ctx.translate(p.x, topY);
            ctx.scale(1, -1);
            ctx.drawImage(sprites.pipe, 0, 0, this.w, this.h);
            ctx.restore();
            ctx.drawImage(sprites.pipe, p.x, bottomY, this.w, this.h);

            if (DEBUG) {
                ctx.strokeStyle = "red"; ctx.lineWidth = 3;
                let hitX = p.x + this.hitMargin;
                let hitW = this.w - (this.hitMargin * 2);
                ctx.strokeRect(hitX, 0, hitW, topY - this.columnaPadding); 
                let boxY = bottomY + this.columnaPadding;
                let boxH = (canvas.height - this.floorHeight) - boxY;
                ctx.strokeRect(hitX, boxY, hitW, boxH);
            }
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        if(frames % 110 == 0) {
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
            
            let hitX = p.x + this.hitMargin;
            let hitW = this.w - (this.hitMargin * 2);
            let techo = p.y - this.columnaPadding;
            let suelo = p.y + this.gap + this.columnaPadding;
            
            if(bird.x + bird.radius > hitX && bird.x - bird.radius < hitX + hitW) {
                if(bird.y - bird.radius < techo || bird.y + bird.radius > suelo) {
                     state.current = state.over;
                }
            }
            
            if(p.x + this.w < bird.x && !p.passed) {
                pipesPassed += 1;
                p.passed = true;
                
                if(pipesPassed === 3) displayScore = "50%";
                else if(pipesPassed === 6) displayScore = "100%";
                else if(pipesPassed === 9) displayScore = "150%";
                else if(pipesPassed === 12) {
                    displayScore = "200%";
                    state.current = state.win; 
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
        ctx.lineWidth = 5; 
        
        // --- PUNTUACIÓN EN JUEGO ---
        if(state.current == state.game || state.current == state.win) {
            ctx.font = "900 120px 'Cinzel Decorative', serif";
            ctx.fillStyle = "#FFD700"; 
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = 15;
            ctx.strokeText(displayScore, canvas.width/2, 150);
            ctx.fillText(displayScore, canvas.width/2, 150);
            ctx.shadowBlur = 0; 
            ctx.fillStyle = "#FFF"; 
        }

        // --- PANTALLA INICIO (LIMPIA Y ÉPICA) ---
        if(state.current == state.getReady) {
            // Título Principal
            ctx.fillStyle = "#f1c40f"; // Dorado Espartano
            ctx.font = "900 110px 'Cinzel Decorative', serif";
            ctx.shadowColor = "rgba(0,0,0,1)";
            ctx.shadowBlur = 25;
            ctx.strokeText("SPARTAN", canvas.width/2, canvas.height/2 - 120);
            ctx.fillText("SPARTAN", canvas.width/2, canvas.height/2 - 120);
            
            // Subtítulo
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#FFF";
            ctx.font = "700 45px 'Cinzel', serif";
            // Dibujamos un borde negro fino al texto pequeño para que se lea mejor sobre el fondo
            ctx.lineWidth = 3; 
            ctx.strokeText("TOCA PARA EMPEZAR", canvas.width/2, canvas.height/2 - 40);
            ctx.fillText("TOCA PARA EMPEZAR", canvas.width/2, canvas.height/2 - 40);
        } 
        // --- PANTALLA GAME OVER ---
        else if(state.current == state.over) {
            ctx.fillStyle = "#e74c3c"; 
            ctx.font = "900 100px 'Cinzel Decorative', serif";
            ctx.shadowColor = "rgba(0,0,0,1)";
            ctx.shadowBlur = 20;
            ctx.strokeText("GAME OVER", canvas.width/2, canvas.height/2 - 50);
            ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 50);
            ctx.shadowBlur = 0;
            
            ctx.font = "700 50px 'Cinzel', serif";
            ctx.fillStyle = "#FFD700";
            ctx.fillText("Progreso: " + displayScore, canvas.width/2, canvas.height/2 + 50);

            ctx.fillStyle = "#FFF";
            ctx.font = "700 40px 'Cinzel', serif";
            ctx.strokeText("Toca para reiniciar", canvas.width/2, canvas.height/2 + 150);
            ctx.fillText("Toca para reiniciar", canvas.width/2, canvas.height/2 + 150);
        }
        // --- PANTALLA VICTORIA ---
        else if(state.current == state.win) {
            if(sprites.owl.complete && sprites.owl.naturalHeight !== 0) {
                const owlSize = 300; 
                ctx.drawImage(sprites.owl, canvas.width/2 - owlSize/2, canvas.height/2 - 350, owlSize, owlSize);
            }

            ctx.fillStyle = "#FFD700"; 
            ctx.font = "900 110px 'Cinzel Decorative', serif";
            ctx.shadowColor = "rgba(0,0,0,1)";
            ctx.shadowBlur = 25;
            ctx.strokeText("¡VICTORIA!", canvas.width/2, canvas.height/2 + 80);
            ctx.fillText("¡VICTORIA!", canvas.width/2, canvas.height/2 + 80);
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = "#FFF";
            ctx.font = "700 45px 'Cinzel', serif";
            ctx.strokeText("Misión Cumplida", canvas.width/2, canvas.height/2 + 160);
            ctx.fillText("Misión Cumplida", canvas.width/2, canvas.height/2 + 160);
            ctx.font = "700 35px 'Cinzel', serif";
            ctx.fillText("Click para jugar de nuevo", canvas.width/2, canvas.height/2 + 230);
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
            pipesPassed = 0;
            displayScore = "0%"; 
            pipes.totalSpawned = 0;
            state.current = state.getReady;
            break;
        case state.win:
            bird.speed = 0;
            pipes.reset();
            pipesPassed = 0;
            displayScore = "0%"; 
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

let loaded = 0;
const checkLoad = () => { loaded++; if(loaded >= 3) loop(); };
sprites.bird.onload = checkLoad;
sprites.pipe.onload = checkLoad;
sprites.bg.onload = checkLoad;
sprites.owl.onload = () => {}; 

setTimeout(() => { if(loaded < 3) loop(); }, 1000);
