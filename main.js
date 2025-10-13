//-----GLOBAL VARIABLES-------
//particle variables and pinch threshold
let particles = [];
let rockets = [];
const PINCH_THRESHOLD = 20;

//video variables
let video;
let handpose;
let predictions = [];

let isNight = false;
let squaresDrawn = false;

//grid background variables
const size = 250;
const layers = 120;

const gridCols = 8;
const gridRows = 4;

let position;

// bee variables
const beeSize = 20;
const beeLayers = 10;


//---------CLASSES--------
//particle classes
class Particle {
  constructor(x, y) {
    this.position = createVector(x, y);
    const a = random(TAU);
    const v = random(1.5, 4.5);
    this.velocity = createVector(cos(a) * v, sin(a) * v);
    this.lifespan = 80 + random(60);
    this.size = random(3, 6);
    this.points = int(random(4, 7));
  }
  update() {
    this.lifespan--;
    this.velocity.mult(0.99);
    this.velocity.y += 0.06; //gravity
    this.position.add(this.velocity);
  }
  draw() {
    push();
    translate(this.position.x, this.position.y);
    rotate(frameCount * 0.02); // make them twinkle a bit
    noStroke();

    // inner glow
    fill(255, 220, 80, 40);
    drawStar(0, 0, this.size * 1.5, this.size * 3.5, this.points);

    // main star
    fill(255, 240, 120, 180);
    drawStar(0, 0, this.size / 2, this.size, this.points);

    pop();
  }
  isDead() {
    return this.lifespan <= 0;
  }
}

function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
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
    // Modified velocity to launch vertically from the point of pinch
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
    fill(255, 200, 120, 180);
    ellipse(this.pos.x, this.pos.y, 6);
    stroke(255, 180, 100, 120);
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

//---------SETUP AND PRELOAD FUNCTIONS--------
function preload() {
  handpose = ml5.handPose(modelLoaded);
}

function setup() {
  createCanvas(innerWidth, innerHeight);
  position = createVector(100, 100);

  let button = createButton("Toggle Day/Night");

  button.position(250, 250);

  button.mousePressed(toggleDayNight);

  video = createCapture(VIDEO, videoLoaded);
  video.size(1000, 800);
  video.hide();

  backgroundSquares();
}

//-------FUNCTIONS----------
//hands
function getHandsData(results) {
  predictions = results;
}

//dat and night check
function toggleDayNight() {
  isNight = !isNight;
  squaresDrawn = false;
}

//squares for bee and background
function getRandomValue(pos, variance) {
  return pos + random(-variance, variance);
}

function drawLayers(x, y, size, layers, isNight) {
  noFill();
  strokeWeight(1);
  randomSeed(1);

  const variance = isNight ? size / 2 : size / 150;

  for (let i = 0; i < layers; i++) {
    const s = (size / layers) * i;
    const half = isNight ? s / 100 : s / 2;

    beginShape();
    vertex(
      getRandomValue(x - half, variance),
      getRandomValue(y - half, variance)
    );
    vertex(
      getRandomValue(x + half, variance),
      getRandomValue(y - half, variance)
    );
    vertex(
      getRandomValue(x + half, variance),
      getRandomValue(y + half, variance)
    );
    vertex(
      getRandomValue(x - half, variance),
      getRandomValue(y + half, variance)
    );
    endShape(CLOSE);

    //full size of og square devided by layer multiplied by i to ensure squares are not on top of eachother
  }
}

function backgroundSquares() {
  push();
  randomSeed(1);

  const totalGridWidth = gridCols * size;
  const totalGridHeight = gridRows * size;
  const startX = (width - totalGridWidth) / 2;
  const startY = (height - totalGridHeight) / 2;

  for (let y = 0; y < gridRows; y++) {
    for (let x = 0; x < gridCols; x++) {
      const centerX = startX + x * size + size / 2;
      const centerY = startY + y * size + size / 2;
      drawLayers(centerX, centerY, size, layers, isNight);
    }
  }
  pop();
}

//video
function videoLoaded() {
  console.log("Video loaded, starting handpose detection.");
  handpose.detectStart(video, getHandsData);
}

function modelLoaded() {
  console.log("Handpose Model Loaded!");
}

function getHandsData(results) {
  predictions = results;
}

// bee function

function drawBeeLayers (x,y,beeSize, beeLayers){
  noFill();
  const variance = beeSize / 20;

  for (let i = 0; i < beeLayers; i++){
      const s = (beeSize / beeLayers) * i;
      const half = s / 2;

      //alters the black and yellow, had to ask ChatGPT how to do it https://chatgpt.com/share/68dd8161-9938-8011-8082-56747b724f74
      if (i % 2 === 0) {
          stroke(0); 
      } else {
          stroke(255, 255, 0); 
      }

      beginShape();
      for (let j = 0; j < 10; j++) {
          let angle = random(TWO_PI); //randomising the angle https://chatgpt.com/share/68dd8297-3d60-8011-998d-f5c158d6b93b 
          let radius = random(half - variance, half); 
          let xOffset = cos(angle) * radius;
          let yOffset = sin(angle) * radius;

          vertex(x + xOffset, y + yOffset);
      }
      endShape(CLOSE);
  }
}

function draw() {
  //image(video, 0, 0, 1500, 1000)

  if (!isNight) {
    // DAY MODE
    if (!squaresDrawn) {
      background(164, 188, 197);
      stroke(174, 198, 207);
      backgroundSquares();
      const numBees = 10; //draw 10 bees

      for (let i = 0; i < numBees; i++) {
          let x = random(0, width);
          let y = random(0, height);
  
          drawBeeLayers(x, y, beeSize, beeLayers);
    }
  } else {
    // NIGHT MODE
    if (!squaresDrawn) {
      background(2, 5, 30);
      stroke(10, 17, 42);
      backgroundSquares();

      push();
      fill(4, 7, 32, 40);
      noStroke();
      rect(0, 0, width, height);
      pop();
    }

    //pinch trigger check
    if (predictions.length > 0) {
      const hand = predictions[0];
      const fingerTip = hand.keypoints.find(
        (kp) => kp.name === "index_finger_tip"
      );
      const thumbTip = hand.keypoints.find((kp) => kp.name === "thumb_tip");

      if (fingerTip && thumbTip) {
        let centerX = (fingerTip.x + thumbTip.x) / 2;
        let centerY = (fingerTip.y + thumbTip.y) / 2;
        let pinchDistance = dist(
          fingerTip.x,
          fingerTip.y,
          thumbTip.x,
          thumbTip.y
        );

        if (pinchDistance < PINCH_THRESHOLD) {
          rockets.push(new Rocket(centerX, centerY));
        }
      }
    }


    // Update and draw rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      rockets[i].update();
      rockets[i].draw();
      if (rockets[i].dead) rockets.splice(i, 1);
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();
      if (p.isDead()) particles.splice(i, 1);
    }

    /* for (let hand of predictions) {
      const keypoints = hand.keypoints;
      for (let keypoint of keypoints) {
        push();
        noStroke();
        fill(0, 255, 0); 
        ellipse(keypoint.x, keypoint.y, 10);
        pop();
      }
    } */
  }
}
}
