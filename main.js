//-----GLOBAL VARIABLES-------
// particle variables and pinch threshold
let particles = [];
let rockets = [];
const PINCH_THRESHOLD_BEE = 60;
const PINCH_THRESHOLD_STAR = 30;


// video variables
let video;
let handpose;
let predictions = [];


let isNight = false;


let backgroundLayer;


// model detection 
let isModelLoaded = false;
let isVideoReady = false;


// grid background variables
const size = 250;
const layers = 120;
const gridCols = 8;
const gridRows = 4;


// bee variables
let beeLayer;
let bees = [];
const beeSize = 20;
const beeLayers = 8;
const beeSpeed = 0.02;


//flower variables
let flowerLayer;
let flowers = [];
let flowerSize = 20;
let flowerAmount = 10;
let flowerGap;


//firefly variables
const fieldSize = 50;
const divider = 10;
let field;
let agents = [];


//synth
let synth = null;
let buzzSynth = null;
let notes = ["C4","C4","G4","G4","A4","A4","G4", "0","F4","F4","E4","E4","D4","D4","C4", "0"];
let noteIndex = 0;
let previousNote = -1;
let isPinching = false;
let audioStarted = false;

//---------CLASSES--------
class Particle {
   constructor(x, y) {
       this.position = createVector(x, y);
       const a = random(TAU);
       const v = random(1.5, 4.5);
       this.velocity = createVector(cos(a) * v, sin(a) * v);
       this.lifespan = 80 + random(60);
       this.size = random(5, 8);
       this.points = int(random(4, 7));
   }
   update() {
       this.lifespan--;
       this.velocity.mult(0.99);
       this.velocity.y += 0.06; // gravity
       this.position.add(this.velocity);
   }
   draw() {
       push();
       translate(this.position.x, this.position.y);
       rotate(frameCount * 0.02); // make them twinkle a bit
       noStroke();


       // inner glow
       fill(255, 255, 255, 40);
       drawStar(0, 0, this.size * 1.5, this.size * 3.5, this.points);


       // main star
       fill(255, 255, 255, 180);
       drawStar(0, 0, this.size / 2, this.size, this.points);


       pop();
   }
   isDead() {
       return this.lifespan <= 0;
   }
}


function drawStar(x, y, radius1, radius2, npoints) {
   let angle = TWO_PI / npoints;
   let halfAngle = angle / 2;
   beginShape();
   for (let a = 0; a < TWO_PI; a += angle) {
       let sx = x + cos(a) * radius2;
       let sy = y + sin(a) * radius2;
       vertex(sx, sy);
       sx = x + cos(a + halfAngle) * radius1;
       sy = y + sin(a + halfAngle) * radius1;
       vertex(sx, sy);
   }
   endShape(CLOSE);
}


class Rocket {
   constructor(x, y) {
       this.pos = createVector(x, y);
       this.vel = createVector(random(-0.5, 0.5), random(-5, -7));
       this.dead = false;
       this.trail = [];
   }
   update() {
       this.vel.y += 0.06;
       this.vel.mult(0.995);
       this.pos.add(this.vel);
       this.trail.push(this.pos.copy());
       if (this.trail.length > 10) this.trail.shift();


       if (this.vel.y > 0 || this.pos.y < height * 0.2) {
           this.explode();
           this.dead = true;
       }
   }
   draw() {
       noStroke();
       fill(255, 240, 200, 120);
       ellipse(this.pos.x, this.pos.y, 6);
       stroke(255, 220, 180, 100);
       noFill();
       beginShape();
       for (let p of this.trail) vertex(p.x, p.y);
       endShape();
   }
   explode() {
       for (let i = 0; i < 50; i++) {
           const p = new Particle(this.pos.x, this.pos.y);
           p.velocity.add(this.vel.copy().mult(0.2));
           particles.push(p);
       }
   }
}


//firefly
class Agent {
 constructor(x, y, maxSpeed, maxForce) {
   this.position = createVector(x, y);
   this.lastPosition = createVector(x, y);
   this.acceleration = createVector(0, 0);
   this.velocity = createVector(0, 0);
   this.maxSpeed = maxSpeed;
   this.maxForce = maxForce;
 }


 follow(desiredDirection) {
   desiredDirection = desiredDirection.copy();
   desiredDirection.mult(this.maxSpeed);
   let steer = p5.Vector.sub(desiredDirection, this.velocity);
   steer.limit(this.maxForce);
   this.applyForce(steer);
 }


 applyForce(force) {
   this.acceleration.add(force);
 }


 update() {
   this.lastPosition = this.position.copy();


   this.velocity.add(this.acceleration);
   this.velocity.limit(this.maxSpeed);
   this.position.add(this.velocity);
   this.acceleration.mult(0);
 }


 checkBorders() {
   if (this.position.x < 0) {
     this.position.x = width - 1;
     this.lastPosition.x = width - 1;
   } else if (this.position.x > width) {
     this.position.x = 0;
     this.lastPosition.x = 0;
   }
   if (this.position.y < 0) {
     this.position.y = height - 1;
     this.lastPosition.y = height - 1;
   } else if (this.position.y > height) {
     this.position.y = 0;
     this.lastPosition.y = 0;
   }
 }


 draw() {
   push();
   stroke(255,179,71,85);
   strokeWeight(random(1,15))
   line(
     this.lastPosition.x,
     this.lastPosition.y,
     this.position.x,
     this.position.y
   );
   pop();
 }
}

function setup() {
   const canvas = createCanvas(windowWidth, windowHeight);
   canvas.parent('p5-canvas-container');
   frameRate(40);


   document.getElementById('loadingOverlay').classList.remove('hidden');


   //separate graphics layers start
   backgroundLayer = createGraphics(width, height);
   flowerLayer = createGraphics(width,height);
   beeLayer = createGraphics(width, height);
  
   const toggleButton = document.getElementById('toggleButton');
   if (toggleButton) {


     toggleButton.addEventListener('click', async () => {
        try {
          await toggleDayNight();
        } catch (error) {
          console.error("Error during mode toggle:", error);
        }
     });
      
       toggleButton.innerHTML = isNight ? 'Day' : 'Night';
   }

  //timeout logic was made by help of google gemini, 14/10, https://g.co/gemini/share/7aaa5e08aa17  
   setTimeout(() => {
       //ml5 start
       handpose = ml5.handPose(modelLoaded);
      
       video = createCapture(VIDEO, videoLoaded);
       video.size(width, height);
       video.hide();
   }, 1500); 


   // draw background grid ONCE
   backgroundSquares();


   flowerGap = 200;
}

//window resize logic was made by help of google gemini, 14/10, https://g.co/gemini/share/7aaa5e08aa17  
function windowResized() {
   resizeCanvas(windowWidth, windowHeight);
   //redraw graphics buffers on resize
   backgroundLayer = createGraphics(width, height);
   flowerLayer = createGraphics(width,height);
   beeLayer = createGraphics(width, height);


   if (isNight) {
     field = generateField();
     agents = [];
     generateAgents();
 }


   backgroundSquares();
}




//-------FUNCTIONS----------
//start of detection
function startDetection() {
   if (isModelLoaded && isVideoReady) {
       console.log("Starting Handpose detection.");
      
       const loadingOverlay = document.getElementById('loadingOverlay');
       if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => loadingOverlay.classList.add('hidden'), 500);
       }
      
       handpose.detectStart(video, getHandsData);
   }
}

//window two functions were made by help of google gemini, 14/10, https://g.co/gemini/share/7aaa5e08aa17  
// model and video callbacks
function videoLoaded() {
   console.log("Video loaded, setting flag.");
   isVideoReady = true;
   startDetection(); 
}


function modelLoaded() {
   console.log("Handpose Model Loaded!");
   isModelLoaded = true; 
   startDetection(); 
}


function getHandsData(results) {
   predictions = results;
}

// https://chatgpt.com/share/68f3c4ba-c818-8011-afb3-020deae9c5b4 - the following function was done with help from this conversation 
async function ensureAudioReady(){
 if (audioStarted) return true;


 if (typeof Tone === "undefined"){
   console.warn("tone js not loading, continuing without audio");
   return false;
 }


 try {
   await Tone.start();


   if (!synth){
     synth = new Tone.Synth().toDestination();
   }


   if (!buzzSynth) {
     buzzSynth = new Tone.Synth({
       noise: { type: "sine" },
       envelope: { attack: 0.005, decay: 0.1, sustain: 0.8, release: 0.2 }
     }).toDestination();
   }
   audioStarted = true;
   console.log("Tone.js Audio Context Started.");
   return true;
 } catch (err) {
   console.warn("Tone.start() failed; audio will be disabled.", err);
   return false;
 }
}




// day and night check
async function toggleDayNight() {
 await ensureAudioReady(); 

 isNight = !isNight;

 const button = document.getElementById('toggleButton');
 if (button) button.innerHTML = isNight ? 'Day' : 'Night';

 rockets = [];
 particles = [];
 bees = [];
 flowers = [];

 // stop any ongoing sounds 
 if (synth) synth.triggerRelease();
 if (buzzSynth) buzzSynth.triggerRelease();
 isPinching = false;

 if (isNight) {
   field = generateField();
   agents = [];
   generateAgents();
 } else {
   field = null;
   agents = [];
 }

 backgroundSquares();
}


// background and bees
function getRandomValue(pos, variance) {
   return pos + random(-variance, variance);
}


// draw background squares into a buffer
function drawLayers(buffer, x, y, size, layers, isNight) {
   buffer.noFill();
  
   const variance = isNight ? size / 2 : size / 150;


   for (let i = 0; i < layers; i++) {
       const s = (size / layers) * i;
       const half = isNight ? s / 100 : s / 2;


       buffer.beginShape();
       buffer.vertex(
           getRandomValue(x - half, variance),
           getRandomValue(y - half, variance)
       );
       buffer.vertex(
           getRandomValue(x + half, variance),
           getRandomValue(y - half, variance)
       );
       buffer.vertex(
           getRandomValue(x + half, variance),
           getRandomValue(y + half, variance)
       );
       buffer.vertex(
           getRandomValue(x - half, variance),
           getRandomValue(y + half, variance)
       );
       buffer.endShape(CLOSE);
   }
}


// draws grid lines ONCE to the backgroundLayer
function backgroundSquares() {
   const buffer = backgroundLayer;
   if (!buffer) return;
   buffer.clear();


   buffer.push();
   buffer.randomSeed(1);


   if (!isNight) {
       buffer.stroke(120, 140, 150, 180);

   } else {
       buffer.stroke(22, 25, 50, 80);
   }
   buffer.strokeWeight(1);


   const totalGridWidth = gridCols * size;
   const totalGridHeight = gridRows * size;
   const startX = (width - totalGridWidth) / 2;
   const startY = (height - totalGridHeight) / 2;


   for (let y = 0; y < gridRows; y++) {
       for (let x = 0; x < gridCols; x++) {
           const centerX = startX + x * size + size / 2;
           const centerY = startY + y * size + size / 2;
           drawLayers(buffer, centerX, centerY, size, layers, isNight);
       }
      }

   buffer.pop();
}


//flooweeer
function flower(buffer){
 buffer.noStroke();
 let petals = 9;
 for (let y = 0; y < petals; y++){
     for (let x = 0; x < petals; x++){
         //petals
         buffer.fill(random(220, 255));
         buffer.rect(x,y, 15, 50, 15);


         //yellow centre
         buffer.fill(205, 180, 20);
         buffer.ellipse(0, 0, 20);


         //darker spots to show some depth
         buffer.fill(150, 120, 10);
         for (let spots = 0; spots < 6; spots++) {
             let spotsx = random(-5, 5);
             let spotsy = random(-5, 5);
            buffer.ellipse(spotsx, spotsy, 3)
         }


         buffer.rotate(PI/5);
     }
 }
}


function drawFlowerLayer(){
 const buffer = flowerLayer;
 if (!buffer)return;
 buffer.clear();

 buffer.push();
 drawSun(buffer);
 drawGrass(buffer);
 buffer.pop();

 const totalRowWidth = flowerAmount * flowerSize + flowerGap * (flowerAmount - 1);

 let x = (width - totalRowWidth) /2;

 const rowY = height * 0.75;

 for (let j = 0; j< flowerAmount; j++){
   buffer.push();
   buffer.translate(x + flowerSize / 2, rowY);
   flower(buffer);
   buffer.pop();

   x += flowerSize + flowerGap;
 }
}


//drawing bees
function drawBeeShape(buffer, x, y, beeSize, beeLayers) {
   buffer.push();
   buffer.noFill();
   buffer.strokeWeight(1.5);
  
   const variance = beeSize / 20;


   for (let i = 0; i < beeLayers; i++){
       const s = (beeSize / beeLayers) * i;
       const half = s / 2;

       if (i % 2 === 0) {
           buffer.stroke(0);
       } else {
           buffer.stroke(255, 255, 0);
       }

       buffer.beginShape();
       for (let j = 0; j < 10; j++) {
           let angle = random(TWO_PI);
           let radius = random(half - variance, half);
           let xOffset = cos(angle) * radius;
           let yOffset = sin(angle) * radius;

           buffer.vertex(x + xOffset, y + yOffset);
       }
       buffer.endShape(CLOSE);
   }
   buffer.pop();
}


//-----FLOW FIELD-------
 function generateField() {
 const maxCols = Math.ceil(width / fieldSize);
 const maxRows = Math.ceil(height / fieldSize);


 let field = [];
 noiseSeed(Math.random() * 50);
 for (let x = 0; x < maxCols; x++) {
   field.push([]);
   for (let y = 0; y < maxRows; y++) {
     const value = noise(x / divider, y / divider) * Math.PI * 10;
     field[x].push(p5.Vector.fromAngle(value));
   }
 }
 return field;
}


function generateAgents() {
 for (let i = 0; i < 50; i++) {
   let agent = new Agent(
     Math.random() * width,
     height,
     4,
     0.1
   );
   agents.push(agent);
 }
}

//drawing vectors
function drawGrass(buffer) {
  buffer.push();
  buffer.noStroke();
  

  buffer.fill(100, 160, 80); 
  buffer.rect(0, height * 0.75, width, height * 0.25); 
  buffer.pop();
}

//sun
function drawSun(buffer) {
  buffer.push();
  buffer.noStroke();
  
  let sunX = width * 0.15;
  let sunY = height * 0.15; 
  let sunSize = 100;

  // outer glow
  buffer.fill(255, 200, 0, 80); 
  buffer.ellipse(sunX, sunY, sunSize * 2);

  // sun circle
  buffer.fill(255, 220, 0);
  buffer.ellipse(sunX, sunY, sunSize);
  buffer.pop();
}

//--------DRAWWWWW----------
function draw() {
 if (!isNight) {
     //-------DAY------
    
     //clear canvas background 
     background(200, 198, 197);
    
     //draw background grid layer
     if (backgroundLayer) {
         image(backgroundLayer, 0, 0);
     }

     drawFlowerLayer();
     if(flowerLayer){
       image(flowerLayer, 0, 0);
     }
 
     if (beeLayer) {
         beeLayer.clear();
     }
    
     //pinch logic made with using p5js.org, 16/10, https://editor.p5js.org/MOQN/sketches/DFRIUSvFC
     //pinch to beeeeees
     if (predictions.length > 0) {
         const hand = predictions[0];
         const fingerTip = hand.keypoints.find(kp => kp.name === "index_finger_tip");
         const thumbTip = hand.keypoints.find(kp => kp.name === "thumb_tip");
    
         if (fingerTip && thumbTip) {
             let pinchDistance = dist(fingerTip.x, fingerTip.y, thumbTip.x, thumbTip.y);


             if (pinchDistance < PINCH_THRESHOLD_BEE) {
               //buzzing sound initialised
               if (!isPinching && audioStarted && buzzSynth) {
                 buzzSynth.triggerAttack("C3");
                 isPinching = true;
                 }


                 const centerX = (fingerTip.x + thumbTip.x) / 2;
                 const centerY = (fingerTip.y + thumbTip.y) / 2;
                 const numBees = 75;
                
                 // cluster of bees around pinch pt
                 for (let i = 0; i < numBees; i++) {
                     const buzzX = noise(frameCount * 0.05 + i * 10) * 10;
                     const buzzY = noise(frameCount * 0.05 + i * 20) * 10;
                    
                     const spread = 120;
                     const beeX = getRandomValue(centerX + buzzX, spread);
                     const beeY = getRandomValue(centerY + buzzY, spread);


                     drawBeeShape(beeLayer, beeX, beeY, beeSize, beeLayers);
                   }
                 } else {
                     // stop buzzing on release
                     if (isPinching && audioStarted && buzzSynth) {
                         buzzSynth.triggerRelease();
                         isPinching = false;
                     }
                 }
             } else {
                 // stop buzzing no keypts
                 if (isPinching && audioStarted) {
                     buzzSynth.triggerRelease();
                     isPinching = false;
                 }
             }
         } else {
             //stop buzzong no hand
             if (isPinching && audioStarted) {
                 buzzSynth.triggerRelease();
                 isPinching = false;
             }
         }
    
     if (beeLayer) {
         image(beeLayer, 0, 0);
     }
  
 }


 else {
     //------- NIGHT---------
    
     //clear canvas background 
     background(2, 5, 30);
 
     //draw background grid layer
     if (backgroundLayer) {
         image(backgroundLayer, 0, 0);
     }

     push();
     fill(2, 5, 30, 4);
     noStroke();
     rect(0, 0, width, height);
     pop();

     // pinch rockets firework stars
     if (predictions.length > 0) {
         const hand = predictions[0];
         const fingerTip = hand.keypoints.find(kp => kp.name === "index_finger_tip");
         const thumbTip = hand.keypoints.find(kp => kp.name === "thumb_tip");


         if (fingerTip && thumbTip) {
             let centerX = (fingerTip.x + thumbTip.x) / 2;
             let centerY = (fingerTip.y + thumbTip.y) / 2;
             let pinchDistance = dist(fingerTip.x, fingerTip.y, thumbTip.x, thumbTip.y);


             if (pinchDistance < PINCH_THRESHOLD_STAR && frameCount % 10 === 0) {
               if (audioStarted && synth) {
                 synth.triggerAttackRelease(notes[noteIndex], "8n");
                 noteIndex = (noteIndex + 1) % notes.length; 
                 }
                 rockets.push(new Rocket(centerX, centerY));
             }
         }
     }

     // update/draw rockets
     for (let i = rockets.length - 1; i >= 0; i--) {
         rockets[i].update();
         rockets[i].draw();
         if (rockets[i].dead) rockets.splice(i, 1);
     }


     // update/draw particles
     for (let i = particles.length - 1; i >= 0; i--) {
         const p = particles[i];
         p.update();
         p.draw();
         if (p.isDead()) particles.splice(i, 1);
     }

           //moon
           push();
           noStroke();
           
           let moonX = width * 0.15; 
           let moonY = height * 0.15; 
           let moonSize = 140;
         
           //outer glow
           fill(255, 255, 220, 50); 
           ellipse(moonX, moonY, moonSize * 1.3);
         
           //moon circle
           fill(255, 255, 220); 
           ellipse(moonX, moonY, moonSize);
           
           //grass
           fill(25, 40, 45); 
           rect(0, height * 0.75, width, height * 0.25); 
           pop();

              //agents logic
     if (field) { 
      for (let agent of agents) {
        const x = Math.floor(agent.position.x / fieldSize);
        const y = Math.floor(agent.position.y / fieldSize);
       
        if (x >= 0 && x < field.length && y >= 0 && y < field[0].length) {
          const desiredDirection = field[x][y];
          agent.follow(desiredDirection);
        }
       
        agent.update();
        agent.checkBorders();
        agent.draw();
      }
    }

 }
}
