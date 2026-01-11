const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- VARIABLES ---
let frames = 0;
const RAD = Math.PI / 180;

const state = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2
}

// CONTROL DEL JUEGO
function clickHandler() {
    switch(state.current) {
        case state.getReady:
            state.current = state.game;
            break;
        case state.game:
            bird.flap();
            break;
        case state.over:
            bird.speedReset();
            pipes.reset();
            score.value = 0;
            frames = 0;
            state.current = state.getReady;
            break;
    }
}

document.addEventListener("click", clickHandler);
document.addEventListener("keydown", function(e) {
    if (e.code === "Space") clickHandler();
});

// --- OBJETOS DIBUJADOS CON CÓDIGO (Sin imágenes externas) ---

const bg = {
    draw: function() {
        // Cielo Azul Griego
        ctx.fillStyle = "#4bb4e6";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Nubes decorativas (círculos blancos)
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(50, 400, 30, 0, Math.PI * 2);
        ctx.arc(100, 400, 40, 0, Math.PI * 2);
        ctx.arc(280, 380, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Un templo lejano (opcional)
        ctx.fillStyle = "#e0e0e0";
        ctx.fillRect(180, 300, 100, 10); // Base
        for(let i=0; i<6; i++) ctx.fillRect(185 + i*15, 270, 5, 30); // Columnas
        ctx.beginPath(); // Techo triangular
        ctx.moveTo(180, 270);
        ctx.lineTo(230, 240);
        ctx.lineTo(280, 270);
        ctx.fill();
    }
}

const fg = {
    h: 112,
    draw: function() {
        // Suelo color arena/tierra
        ctx.fillStyle = "#e3cca5";
        ctx.fillRect(0, canvas.height - this.h, canvas.width, this.h);
        // Borde superior del suelo (hierba o detalle)
        ctx.fillStyle = "#cbb28a";
        ctx.fillRect(0, canvas.height - this.h, canvas.width, 10);
    }
}

const bird = {
    x: 50,
    y: 150,
    w: 30,
    h: 30,
    speed: 0,
    gravity: 0.25,
    jump: -4.6,
    rotation: 0,
    
    draw: function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Rotación
        if (this.speed >= this.jump) {
            this.rotation = Math.min(Math.PI / 4, this.rotation + 5 * RAD);
        } else {
            this.rotation = -25 * RAD;
        }
        ctx.rotate(this.rotation);
        
        // DIBUJO DEL ESPARTANO (Simplificado)
        
        // 1. Pluma del casco (Roja)
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.moveTo(-5, -15);
        ctx.lineTo(10, -15);
        ctx.lineTo(0, -5);
        ctx.fill();
        
        // 2. Casco (Dorado)
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(-10, -10, 20, 20);
        
        // 3. Ojo (Negro)
        ctx.fillStyle = "#000";
        ctx.fillRect(2, -5, 4, 4);
        
        // 4. Capa (Roja atrás)
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(-15, 0, 10, 15);
        
        // 5. Cuerpo/Escudo (Dorado oscuro)
        ctx.fillStyle = "#d35400";
        ctx.beginPath();
        ctx.arc(0, 5, 10, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    },
    
    flap: function() {
        this.speed = this.jump;
    },
    
    update: function() {
        if(state.current == state.getReady) {
            this.y = 150 - 10 * Math.cos(frames/15);
            this.rotation = 0;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            if(this.y + this.h/2 >= canvas.height - fg.h) {
                this.y = canvas.height - fg.h - this.h/2;
                if(state.current == state.game) state.current = state.over;
            }
        }
    }
}

const pipes = {
    position: [],
    w: 52,
    h: 400,
    dx: 2,
    gap: 120, // Más espacio para que sea fácil
    
    draw: function() {
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.h + this.gap;
            
            // DIBUJO DE COLUMNAS GRIEGAS
            
            // Función auxiliar para dibujar una columna
            function drawColumn(x, y, width, height) {
                ctx.fillStyle = "#ecf0f1"; // Blanco marmol
                ctx.fillRect(x, y, width, height);
                
                // Estrías (rayas verticales) de la columna
                ctx.fillStyle = "#bdc3c7"; // Gris
                ctx.fillRect(x + 10, y, 5, height);
                ctx.fillRect(x + 25, y, 5, height);
                ctx.fillRect(x + 40, y, 5, height);
                
                // Borde negro fino
                ctx.strokeStyle = "#555";
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, width, height);
            }

            // Tubería Arriba
            drawColumn(p.x, topY, this.w, this.h);
            // Capitel (parte ancha de la columna)
            ctx.fillStyle = "#ecf0f1";
            ctx.fillRect(p.x - 5, topY + this.h - 20, this.w + 10, 20);
            ctx.strokeRect(p.x - 5, topY + this.h - 20, this.w + 10, 20);

            // Tubería Abajo
            drawColumn(p.x, bottomY, this.w, this.h);
            // Capitel
            ctx.fillStyle = "#ecf0f1";
            ctx.fillRect(p.x - 5, bottomY, this.w + 10, 20);
            ctx.strokeRect(p.x - 5, bottomY, this.w + 10, 20);
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        if(frames % 120 == 0) {
            this.position.push({
                x: canvas.width,
                y: -150 * (Math.random() + 1)
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;
            
            // Colisiones simples
            let bottomPipeYPos = p.y + this.h + this.gap;
            
            if(bird.x + bird.w/2 > p.x && bird.x - bird.w/2 < p.x + this.w && 
               (bird.y - bird.h/2 < p.y + this.h || bird.y + bird.h/2 > bottomPipeYPos)) {
                state.current = state.over;
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
            ctx.fillText("GET READY", canvas.width/2 - 85, 200);
            ctx.strokeText("GET READY", canvas.width/2 - 85, 200);
            ctx.fillStyle = "#FFF";
            ctx.font = "15px Verdana";
            ctx.fillText("(Tap to Jump)", canvas.width/2 - 50, 230);
        }
    }
}

// BUCLE PRINCIPAL
function loop() {
    bg.draw();
    pipes.draw();
    fg.draw();
    bird.draw();
    score.draw();
    
    bird.update();
    pipes.update();
    
    frames++;
    requestAnimationFrame(loop);
}

loop();
