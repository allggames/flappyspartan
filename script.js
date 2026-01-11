const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CONFIGURACIÓN ---
let frames = 0;
const scale = 2; // Escala para simular píxeles grandes (Retro Style)

const state = { current: 0, getReady: 0, game: 1, over: 2 };

// --- ARTISTA DE PÍXELES (SPRITES) ---
// Estos mapas definen los dibujos. Cada letra es un color.
// R=Rojo, D=Dorado, P=Piel, N=Negro, B=Blanco, G=Gris, _=Transparente

const spartanMap = [
    "____RRR_____",
    "___RRRRR____",
    "__DDDDDDD___",
    "__DNDDDND___",
    "__DDDDDDD___",
    "__DPPPPD____",
    "__RR_RR_____",
    "_DD__DD_____", // Cuerpo y escudo
    "_DD__DD____D", // La 'D' final es la punta de la lanza
    "_____DD____D",
    "_____DD____D"
];

const columnTopMap = [
    "GGGGGGGGGG",
    "GGBBBBBBGG",
    "BBBBBBBBBB",
    "BBBBBBBBBB"
];

const columnBodyMap = [
    "GG B GG B GG", // Patrón repetitivo de la columna
    "GG B GG B GG",
    "GG B GG B GG",
    "GG B GG B GG"
];

const owlMap = [
    "__BBBB__",
    "_BWBWB__",
    "_BBBBB__",
    "__MMM___",
    "__M_M___"
];

// Paleta de colores
const palette = {
    'R': '#e74c3c', // Rojo Pluma
    'D': '#f1c40f', // Dorado Casco
    'P': '#ffcdb2', // Piel
    'N': '#000000', // Negro Ojos
    'B': '#ecf0f1', // Blanco Marmol
    'G': '#bdc3c7', // Gris Sombra
    'W': '#ffffff', // Blanco Ojos Buho
    'M': '#8d6e63'  // Marrón Buho
};

// Función mágica que dibuja los mapas anteriores
function drawPixelArt(ctx, map, startX, startY, pixelSize) {
    for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[r].length; c++) {
            let colorCode = map[r][c];
            if (colorCode !== ' ' && colorCode !== '_') {
                ctx.fillStyle = palette[colorCode] || colorCode;
                ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

// --- OBJETOS DEL JUEGO ---

const bg = {
    draw: function() {
        // Cielo
        ctx.fillStyle = "#64b5f6";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Templo de fondo (simplificado)
        ctx.fillStyle = "#e3f2fd"; // Blanco azulado
        // Base
        ctx.fillRect(50, 300, 220, 10);
        // Columnas fondo
        for(let i=0; i<6; i++) ctx.fillRect(60 + i*40, 220, 10, 80);
        // Techo
        ctx.beginPath();
        ctx.moveTo(40, 220);
        ctx.lineTo(160, 150);
        ctx.lineTo(280, 220);
        ctx.fill();
        
        // Nubes pixeladas
        ctx.fillStyle = "#FFF";
        ctx.fillRect(50 - frames/2 % 400, 50, 60, 20);
        ctx.fillRect(250 - frames/3 % 400, 80, 80, 25);
    }
}

const fg = {
    h: 80,
    draw: function() {
        // Suelo Arena
        ctx.fillStyle = "#e0c097";
        ctx.fillRect(0, canvas.height - this.h, canvas.width, this.h);
        // Borde superior
        ctx.fillStyle = "#cbb28a";
        ctx.fillRect(0, canvas.height - this.h, canvas.width, 6);
    }
}

const bird = {
    x: 50,
    y: 150,
    w: 12 * scale, // 12 pixeles de ancho por la escala
    h: 11 * scale,
    speed: 0,
    gravity: 0.25,
    jump: -4.6,
    
    draw: function() {
        // Dibujar al espartano usando el mapa
        drawPixelArt(ctx, spartanMap, this.x, this.y, scale);
    },
    
    flap: function() {
        this.speed = this.jump;
    },
    
    update: function() {
        if(state.current == state.getReady) {
            this.y = 150 - 5 * Math.cos(frames/15);
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            if(this.y + this.h >= canvas.height - fg.h) {
                this.y = canvas.height - fg.h - this.h;
                if(state.current == state.game) state.current = state.over;
            }
        }
    }
}

const pipes = {
    position: [],
    w: 40, 
    h: 400,
    dx: 2,
    gap: 110,
    
    draw: function() {
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.h + this.gap;
            
            // DIBUJAR COLUMNAS GRIEGAS PIXELADAS
            
            // 1. Columna Arriba
            ctx.fillStyle = "#ecf0f1"; // Color base
            ctx.fillRect(p.x, topY, this.w, this.h); // Cuerpo solido relleno
            // Detalles verticales (estrías)
            ctx.fillStyle = "#bdc3c7";
            ctx.fillRect(p.x + 10, topY, 4, this.h);
            ctx.fillRect(p.x + 26, topY, 4, this.h);
            
            // Capitel (Remate) de abajo de la columna superior
            drawPixelArt(ctx, columnTopMap, p.x, topY + this.h - 16, 4);

            // 2. Columna Abajo
            ctx.fillStyle = "#ecf0f1";
            ctx.fillRect(p.x, bottomY, this.w, this.h);
            ctx.fillStyle = "#bdc3c7";
            ctx.fillRect(p.x + 10, bottomY, 4, this.h);
            ctx.fillRect(p.x + 26, bottomY, 4, this.h);
            
            // Capitel de arriba de la columna inferior
            drawPixelArt(ctx, columnTopMap, p.x, bottomY, 4);

            // Búho decorativo (probabilidad del 30%)
            if(p.hasOwl) {
                drawPixelArt(ctx, owlMap, p.x + 5, bottomY - 25, 4);
            }
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        if(frames % 120 == 0) {
            this.position.push({
                x: canvas.width,
                y: -150 * (Math.random() + 1),
                hasOwl: Math.random() < 0.3
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;
            
            let bottomPipeYPos = p.y + this.h + this.gap;
            
            // Colisiones
            if(bird.x + bird.w > p.x && bird.x < p.x + this.w && 
               (bird.y < p.y + this.h || bird.y + bird.h > bottomPipeYPos)) {
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
            ctx.fillText("SPARTAN JUMP", canvas.width/2 - 115, 200);
            ctx.strokeText("SPARTAN JUMP", canvas.width/2 - 115, 200);
            ctx.fillStyle = "#FFF";
            ctx.font = "15px Verdana";
            ctx.fillText("Click para empezar", canvas.width/2 - 70, 240);
        }
    }
}

// CONTROL
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
