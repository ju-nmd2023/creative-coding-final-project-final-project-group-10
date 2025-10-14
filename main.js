 //-----GLOBAL VARIABLES-------
        // particle variables and pinch threshold
        let particles = [];
        let rockets = [];
        const PINCH_THRESHOLD = 40;

        // video variables
        let video;
        let handpose;
        let predictions = [];

        let isNight = false;
        
        let backgroundLayer; 
        
        //the following two lines of code were implemented using the help of google gemini, 14/10, https://g.co/gemini/share/7aaa5e08aa17
        // Flags to ensure the model only starts detection when both model and video are loaded
        let isModelLoaded = false;
        let isVideoReady = false; 

        // grid background variables
        const size = 250;
        const layers = 120;
        const gridCols = 8;
        const gridRows = 4;

        // bee variables
        let beeLayer; // The p5.Graphics layer for the dynamic bees
        let bees = []; 

        const beeSize = 25; 
        const beeLayers = 10;
         //the following line of code were implemented using the help of google gemini, 14/10, https://g.co/gemini/share/7aaa5e08aa17
        const beeSpeed = 0.05;

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

        function setup() {
            //the following two lines of code were implemented using the help of google gemini, 14/10, https://g.co/gemini/share/7aaa5e08aa17
            const canvas = createCanvas(windowWidth, windowHeight);
            canvas.parent('p5-canvas-container');
            frameRate(30);

            // Show loading overlay while model loads
            document.getElementById('loadingOverlay').classList.remove('hidden');

            // Initialize the separate graphics layers
            beeLayer = createGraphics(width, height);
            backgroundLayer = createGraphics(width, height); 
            
            document.getElementById('toggleButton').addEventListener('click', toggleDayNight);

            toggleButton.innerHTML = isNight ? 'Day' : 'Night'; 

            //the following timeout logic code was implemented using the help of google gemini, 14/10, https://g.co/gemini/share/7aaa5e08aa17
            setTimeout(() => {
                // Initialize ml5.js Handpose model
                handpose = ml5.handPose(modelLoaded); 

                // Video setup for hand tracking
                video = createCapture(VIDEO, videoLoaded);
                video.size(width, height); 
                video.hide();
            }, 1500); // Increased delay to 1500ms

            // Draw the initial background grid ONCE
            backgroundSquares();
        }

         //the following resize function was implemented using the help of google gemini, 14/10, https://g.co/gemini/share/7aaa5e08aa17
        function windowResized() {
            resizeCanvas(windowWidth, windowHeight);
            // Re-initialize and redraw the graphics buffers on resize
            beeLayer = createGraphics(width, height);
            backgroundLayer = createGraphics(width, height); 
            backgroundSquares(); 
        }


        //-------FUNCTIONS----------
        //start of detection
        function startDetection() {
            if (isModelLoaded && isVideoReady) {
                console.log("Starting Handpose detection.");
                
                // Hide loading overlay with a fade-out effect
                const loadingOverlay = document.getElementById('loadingOverlay');
                loadingOverlay.style.opacity = '0';
                setTimeout(() => loadingOverlay.classList.add('hidden'), 500); // Wait for transition
                handpose.detectStart(video, getHandsData);
            }
        }

        // model and video callbacks
        function videoLoaded() {
            console.log("Video loaded, setting flag.");
            isVideoReady = true;
            startDetection();    // Check if we can start detection
        }

        function modelLoaded() {
            console.log("Handpose Model Loaded!");
            isModelLoaded = true; // Model is ready
            startDetection();    // Check if we can start detection
        }

        function getHandsData(results) {
            predictions = results;
        }

        // Day and night check
        function toggleDayNight() {
            isNight = !isNight;
            const button = document.getElementById('toggleButton');
            button.innerHTML = isNight ? 'Day' : 'Night';
            // Clear all particles and rockets when switching
            rockets = [];
            particles = [];
            bees = [];
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
            const buffer = backgroundLayer; // Target the background buffer
            if (!buffer) return; // Exit if not initialized
            buffer.clear(); // Clear the previous grid lines

            buffer.push();
            buffer.randomSeed(1); // Set seed for static pattern

            if (!isNight) {
                buffer.stroke(120, 140, 150, 180); 
            } else {
                buffer.stroke(22, 25, 50, 80); 
            }
            buffer.strokeWeight(1); // Making lines slightly thinner for better detail

            const totalGridWidth = gridCols * size;
            const totalGridHeight = gridRows * size;
            const startX = (width - totalGridWidth) / 2;
            const startY = (height - totalGridHeight) / 2;

            for (let y = 0; y < gridRows; y++) {
                for (let x = 0; x < gridCols; x++) {
                    const centerX = startX + x * size + size / 2;
                    const centerY = startY + y * size + size / 2;
                    // Draw the layers to the backgroundLayer buffer
                    drawLayers(buffer, centerX, centerY, size, layers, isNight); 
                }
            }
            buffer.pop();
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

                // Black and yellow stripes
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

        // Main animation loop
        function draw() {
            if (!isNight) {
                //-------DAY------
                //beeeee
               //Clear main canvas background (Day Color)
                background(164, 188, 197); 
                
                //Draw background grid layer
                if (backgroundLayer) {
                    image(backgroundLayer, 0, 0);
                }

                //clear bee layer every frame
                if (beeLayer) {
                    beeLayer.clear();
                }
                
                //pinch to beeeeees
                if (predictions.length > 0) {
                    const hand = predictions[0];
                    const fingerTip = hand.keypoints.find(kp => kp.name === "index_finger_tip");
                    const thumbTip = hand.keypoints.find(kp => kp.name === "thumb_tip");
                
                    if (fingerTip && thumbTip) {
                        let pinchDistance = dist(fingerTip.x, fingerTip.y, thumbTip.x, thumbTip.y);

                        if (pinchDistance < PINCH_THRESHOLD) {
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
                        }
                    }
                } 
                
                //display the bee layer on the main canvas
                if (beeLayer) {
                    image(beeLayer, 0, 0);
                }

            } else {
                //------- NIGHT---------
                
                // clear main canvas background (Night Color)
                background(2, 5, 30); 
             

                //draw background grid layer
                if (backgroundLayer) {
                    image(backgroundLayer, 0, 0);
                }

                // Add a slight darkening overlay for a deeper night feel (Drawn on top of background and grid)
                push();
                fill(2, 5, 30, 4); 
                noStroke();
                rect(0, 0, width, height);
                pop();


                // Pinch rockets firework stars
                if (predictions.length > 0) {
                    const hand = predictions[0];
                    const fingerTip = hand.keypoints.find(kp => kp.name === "index_finger_tip");
                    const thumbTip = hand.keypoints.find(kp => kp.name === "thumb_tip");

                    if (fingerTip && thumbTip) {
                        let centerX = (fingerTip.x + thumbTip.x) / 2;
                        let centerY = (fingerTip.y + thumbTip.y) / 2;
                        let pinchDistance = dist(fingerTip.x, fingerTip.y, thumbTip.x, thumbTip.y);

                        if (pinchDistance < PINCH_THRESHOLD && frameCount % 10 === 0) { // Throttle rocket launch
                            rockets.push(new Rocket(centerX, centerY));
                        }
                    }
                }

                // Update/draw rockets
                for (let i = rockets.length - 1; i >= 0; i--) {
                    rockets[i].update();
                    rockets[i].draw();
                    if (rockets[i].dead) rockets.splice(i, 1);
                }

                // Update/draw particles
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    p.update();
                    p.draw();
                    if (p.isDead()) particles.splice(i, 1);
                }
            }
        }
