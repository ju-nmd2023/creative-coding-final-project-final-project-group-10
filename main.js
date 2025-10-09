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
  video.size(1500, 1000);
  video.hide();
}

//video variables
let video;
let handpose;
let predictions = [];

let isNight = false;

const size = 250;
const layers = 120;

const gridCols = 8;
const gridRows = 4;

let position;

function getHandsData(results) {
  predictions = results;
}

function toggleDayNight() {
  isNight = !isNight;
}

function getRandomValue(pos, variance) {
  return pos + random(-variance, variance);
}

function drawLayers(x, y, size, layers, isNight) {
  noFill();
  strokeWeight(2);

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

    //full isze of og square devided by layer multiplied by i to ensure squares are not on top of eachother
  }
}

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

function draw() {
  const totalGridWidth = gridCols * size;
  const totalGridHeight = gridRows * size;
  const startX = (width - totalGridWidth) / 2;
  const startY = (height - totalGridHeight) / 2;

  image(video, 0, 0, 1500, 1000);

  if (!isNight) {
    // DAY MODE
    stroke(174, 198, 207);
    background(166, 190, 199);

    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        const centerX = startX + x * size + size / 2;
        const centerY = startY + y * size + size / 2;
        drawLayers(centerX, centerY, size, layers, isNight);
      }
    }
  } else {
    // NIGHT MODE
    stroke(8, 15, 40);
    background(4, 7, 32);

    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        const centerX = startX + x * size + size / 2;
        const centerY = startY + y * size + size / 2;
        drawLayers(centerX, centerY, size, layers, isNight);
      }
    }
  }

  for (let hand of predictions) {
    const keypoints = hand.keypoints;
    for (let keypoint of keypoints) {
      push();
      noStroke();
      fill(0, 255, 0);
      ellipse(keypoint.x, keypoint.y, 10);
      pop();
    }
  }
}

function modelLoaded() {
  console.log("Model Loaded!");
}
