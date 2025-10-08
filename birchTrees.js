const CANVAS_WIDTH = innerWidth;
const CANVAS_HEIGHT = innerHeight;
const TREE_COUNT = 4;

//noise variables


const COLOR_PALETTE = {
    TRUNK_LIGHT: '#d6d1c4',
    TRUNK_DARK: '#423d38',  
    LEAVES: '#91a87e',     
    OUTLINE: '#2c2a27'    
};

function setup() {
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    noLoop();
}

function draw() {
    background(255);
    
    // The semicolon (;) is the correct statement terminator
    line(0, CANVAS_HEIGHT * 0.9, CANVAS_WIDTH, CANVAS_HEIGHT * 0.9);

    // Create the trees, spreading them across the canvas
    for (let i = 0; i < TREE_COUNT; i++) {
        // Calculate tree position
        const x = map(i, 0, TREE_COUNT - 1, 100, CANVAS_WIDTH - 100);
        const height = CANVAS_HEIGHT * 0.8;
        
        drawBirchTree(x, height);
    }
}


// --- BIRCH TREEs---
function drawBirchTree(xCenter, maxHeight) {
    const trunkWidth = 60; 
    const trunkHeight = maxHeight;
    
    noFill();
    stroke(COLOR_PALETTE.OUTLINE);
    strokeWeight(3);
    
    beginShape();
    
    // End at bottom center
    vertex(xCenter + trunkWidth / 2, trunkHeight + 5); 
    endShape(CLOSE);
    
   
   //----SQUARE FILL------- 
    const SQUARE_SIZE = 5;
    const GRID_COLS = Math.ceil(trunkWidth / SQUARE_SIZE);
    const GRID_ROWS = Math.ceil(trunkHeight / SQUARE_SIZE);
    
    noStroke();
    
    // Loop through the 'pixels' or 'squares' of the trunk
    for (let j = 0; j < GRID_ROWS; j++) {
        for (let i = 0; i < GRID_COLS; i++) {
            const x = xCenter - trunkWidth / 2 + i * SQUARE_SIZE;
            const y = CANVAS_HEIGHT * 0.1 + j * SQUARE_SIZE;
            
            // Only draw inside the rough trunk area
            if (x < xCenter - trunkWidth / 2 || x + SQUARE_SIZE > xCenter + trunkWidth / 2) {
                continue;
            }
            
            // Decision: Light square (bark) or Dark square (Molnár's black mark/birch stripe)
            let colorToUse;
            
            // The Molnár Variation: Randomly perturb a small shape within the square
            const variance = random(1);
            
            if (variance < 0.12) { // 25% chance for a dark stripe
                colorToUse = COLOR_PALETTE.TRUNK_DARK;
            } else {
                colorToUse = COLOR_PALETTE.TRUNK_LIGHT;
            }
            
            fill(colorToUse);
            
            // Draw a slightly rotated/misplaced square to capture the generative/Molnár feel
            push();
            translate(x + SQUARE_SIZE / 2, y + SQUARE_SIZE / 2);
            
            // Introduce a subtle random rotation (a key Molnár element)
            rotate(random(-0.35, 0.05)); 
            
            // And a slight random shift
            const shiftX = random(-5, 1);
            const shiftY = random(-1, 1);
            
            rectMode(CENTER);
            rect(shiftX, shiftY, SQUARE_SIZE * 0.9, SQUARE_SIZE * 0.9);
            pop();
        }
    }
}