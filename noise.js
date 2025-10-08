function setup(){
    createCanvas(innerWidth, innerHeight);
}


// variable decloration for the noise 
const size = 15;
const noisedivider = 10;
const numRows = 100;
const numCols = 100;

let counter = 0; 

function draw(){
    background(173, 200, 230);
    noStroke();
    //for loop for noise
    for (let y = 0; y < numRows; y++){
        for (let x= 0; x < numCols; x++){
            const value = noise(x / noisedivider, y / noisedivider, counter) * size;
            fill(255, 255 ,255, 80);
            rect(size / 2 + x * size, size / 2 + y * size, value);
        }
    }

     counter += 0.08;

}