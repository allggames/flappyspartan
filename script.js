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
    owl: new Image(),
    panelTexture: new Image()
};

sprites.bird.src = "guerrera.png"; 
sprites.pipe.src = "columna.png";
sprites.bg.src = "fondo.png";
sprites.owl.src = "buho.png"; 
sprites.panelTexture.src = "textura.jpg"; 

// --- VARIABLES DE JUEGO ---
let pipesPassed = 0; 
let displayScore = "0%"; 

// Variable para guardar la posición del botón y detectar el clic
let restartBtn = {
    x: 0,
    y: 0,
    w: 300,
    h: 80
};

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
        
        if(state.current !== state.getReady) {
            ctx.drawImage(sprites.bird, -this.w/2, -this.h/2, this.w, this.h);
        }
        
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
            this.y = canvas.height / 2;
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

function drawPanel(height) {
    const w = canvas.width * 0.85; 
    const h = height || 400; 
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (sprites.panelTexture.complete && sprites.panelTexture.naturalWidth > 0) {
        ctx.drawImage(sprites.panelTexture, x, y, w, h);
    } else {
        ctx.fillStyle = "#111"; 
        ctx.fillRect(x, y, w, h);
    }
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; 
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = "#FFD700"; 
    ctx.lineWidth = 8;
    ctx.strokeRect(x, y, w, h);
    
    ctx.strokeStyle = "#C0A000"; 
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 12, y + 12, w - 24, h - 24);

    return { x, y, w, h }; 
}

const ui = {
    draw: function() {
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        ctx.textAlign = "center";
        
        // JUEGO
        if(state.current == state.game) {
            ctx.lineWidth = 5; 
            ctx.font = "900 120px 'Cinzel Decorative', serif";
            ctx.fillStyle = "#FFD700"; 
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = 15;
            ctx.strokeText(displayScore, canvas.width/2, 150);
            ctx.fillText(displayScore, canvas.width/2, 150);
            ctx.shadowBlur = 0; 
            ctx.fillStyle = "#FFF"; 
        }

        // INICIO
        if(state.current == state.getReady) {
            const panel = drawPanel(450); 
            const centerY = canvas.height / 2;

            ctx.fillStyle = "#f1c40f"; 
            ctx.font = "900 100px 'Cinzel Decorative', serif";
            ctx.shadowColor = "#000"; 
            ctx.shadowBlur = 20;
            ctx.strokeText("SPARTAN", canvas.width/2, centerY - 50);
            ctx.fillText("SPARTAN", canvas.width/2, centerY - 50);
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = "#FFF";
            ctx.font = "700 40px 'Cinzel', serif";
            ctx.strokeText("TOCA PARA EMPEZAR", canvas.width/2, centerY + 80);
            ctx.fillText("TOCA PARA EMPEZAR", canvas.width/2, centerY + 80);
        } 
        
        // GAME OVER
        else if(state.current == state.over) {
            const panel = drawPanel(550);
            const centerY = canvas.height / 2;

            if (pipesPassed >= 3) {
                // BIEN HECHO
                ctx.fillStyle = "#FFD700"; 
                ctx.font = "900 80px 'Cinzel Decorative', serif";
                ctx.shadowColor = "#000"; ctx.shadowBlur = 15;
                ctx.strokeText("¡BIEN HECHO!", canvas.width/2, centerY - 100);
                ctx.fillText("¡BIEN HECHO!", canvas.width/2, centerY - 100);
                ctx.shadowBlur = 0;

                ctx.fillStyle = "#FFF";
                ctx.font = "700 45px 'Cinzel', serif";
                ctx.strokeText("BONO OBTENIDO:", canvas.width/2, centerY + 10);
                ctx.fillText("BONO OBTENIDO:", canvas.width/2, centerY + 10);
                
                ctx.fillStyle = "#FFD700";
                ctx.font = "900 70px 'Cinzel Decorative', serif";
                ctx.strokeText(displayScore, canvas.width/2, centerY + 90);
                ctx.fillText(displayScore, canvas.width/2, centerY + 90);

            } else {
                // GAME OVER MALO
                ctx.fillStyle = "#e74c3c"; 
                ctx.font = "900 90px 'Cinzel Decorative', serif";
                ctx.shadowColor = "#000"; ctx.shadowBlur = 15;
                ctx.strokeText("GAME OVER", canvas.width/2, centerY - 100);
                ctx.fillText("GAME OVER", canvas.width/2, centerY - 100);
                ctx.shadowBlur = 0;
                
                ctx.fillStyle = "#ccc"; 
                ctx.font = "700 45px 'Cinzel', serif";
                ctx.fillText("Sin Bono", canvas.width/2, centerY + 20);
            }

            // --- DIBUJAR BOTÓN ---
            this.drawRestartButton(centerY + 160);
        }
        
        // VICTORIA
        else if(state.current == state.win) {
            const panel = drawPanel(650); 
            const centerY = canvas.height / 2;

            if(sprites.owl.complete && sprites.owl.naturalHeight !== 0) {
                const owlSize = 280; 
                ctx.drawImage(sprites.owl, canvas.width/2 - owlSize/2, centerY - 360, owlSize, owlSize);
            }

            ctx.fillStyle = "#FFD700"; 
            ctx.font = "900 100px 'Cinzel Decorative', serif";
            ctx.shadowColor = "#000"; ctx.shadowBlur = 20;
            ctx.strokeText("VICTORIA", canvas.width/2, centerY + 20);
            ctx.fillText("VICTORIA", canvas.width/2, centerY + 20);
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = "#FFF";
            ctx.font = "700 45px 'Cinzel', serif";
            ctx.strokeText("BONO TOTAL: " + displayScore, canvas.width/2, centerY + 110);
            ctx.fillText("BONO TOTAL: " + displayScore, canvas.width/2, centerY + 110);

            // --- DIBUJAR BOTÓN ---
            this.drawRestartButton(centerY + 210);
        }
    },

    // FUNCIÓN PARA DIBUJAR EL BOTÓN FÍSICO
    drawRestartButton: function(yPos) {
        // Configuramos la posición del botón
        restartBtn.w = 350;
        restartBtn.h = 80;
        restartBtn.x = canvas.width / 2 - restartBtn.w / 2;
        restartBtn.y = yPos;

        // Sombra del botón
        ctx.fillStyle = "#000";
        ctx.fillRect(restartBtn.x + 5, restartBtn.y + 5, restartBtn.w, restartBtn.h);

        // Fondo del botón (Dorado)
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(restartBtn.x, restartBtn.y, restartBtn.w, restartBtn.h);

        // Borde del botón
        ctx.strokeStyle = "#C0A000";
        ctx.lineWidth = 4;
        ctx.strokeRect(restartBtn.x, restartBtn.y, restartBtn.w, restartBtn.h);

        // Texto del botón
        ctx.fillStyle = "#3e2723"; // Marrón oscuro para contraste
        ctx.font = "700 35px 'Cinzel', serif";
        ctx.fillText("JUGAR DE NUEVO", canvas.width/2, restartBtn.y + 52);
    }
}

// --- FUNCIÓN PARA DETECTAR EL CLICK EXACTO ---
function getClickPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Obtenemos las coordenadas dependiendo si es touch o mouse
    let clientX, clientY;
    if(evt.type.startsWith('touch')) {
         clientX = evt.changedTouches[0].clientX;
         clientY = evt.changedTouches[0].clientY;
    } else {
         clientX = evt.clientX;
         clientY = evt.clientY;
    }

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// --- CONTROL ---
function action(evt) {
    // Si es touch, prevenimos el scroll, excepto si toca el botón
    if(evt.type === 'touchstart') evt.preventDefault();
    
    switch(state.current) {
        case state.getReady: 
            state.current = state.game; 
            break;
            
        case state.game: 
            bird.flap(); 
            break;
            
        case state.over: 
        case state.win:
            // --- AQUÍ ESTÁ LA MAGIA DEL BOTÓN ---
            // Calculamos dónde hizo click el usuario
            const click = getClickPos(evt);
            
            // Verificamos si el click está DENTRO del rectángulo del botón
            if (click.x >= restartBtn.x && 
                click.x <= restartBtn.x + restartBtn.w &&
                click.y >= restartBtn.y && 
                click.y <= restartBtn.y + restartBtn.h) {
                
                // SOLO SI TOCÓ EL BOTÓN: Reiniciamos
                bird.speed = 0;
                pipes.reset();
                pipesPassed = 0;
                displayScore = "0%"; 
                pipes.totalSpawned = 0;
                state.current = state.getReady;
            }
            // Si tocó fuera, no pasa nada (break)
            break;
    }
}

// Event Listeners
window.addEventListener("keydown", (e) => { 
    if(e.code === "Space" || e.code === "ArrowUp") {
        // La barra espaciadora siempre sirve (opcional, si quieres quitarla borra esto)
        if(state.current !== state.game && state.current !== state.getReady) {
             // Forzamos reinicio con espacio
             bird.speed = 0; pipes.reset(); pipesPassed = 0; displayScore = "0%"; pipes.totalSpawned = 0; state.current = state.getReady;
        } else {
             action(e);
        }
    }
});
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
sprites.panelTexture.onload = () => {}; 

setTimeout(() => { if(loaded < 3) loop(); }, 1000);
