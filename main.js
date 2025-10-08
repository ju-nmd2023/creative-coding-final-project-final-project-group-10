function setup(){
    createCanvas(innerWidth, innerHeight);
    position = createVector(100,100);
}

    const size = 150;
    const layers = 10;

    function getRandomValue(pos, variance){
        return pos + random(-variance, variance);
    }

    function drawLayers(x,y,size,layers, isDay = true){

        noFill();
        stroke(14,108,217, 50);
        strokeWeight(3);
    
        const variance = size / 50;
    
        for(let i = 0; i < layers; i++){
            const s = (size / layers) * i;
            const half = s / 2;
          
            beginShape();
            vertex(getRandomValue(x - half, variance), getRandomValue( y - half, variance));
            vertex( getRandomValue(x + half, variance), getRandomValue(y - half, variance));
            vertex( getRandomValue(x + half, variance), getRandomValue( y + half, variance));
            vertex( getRandomValue(x - half, variance), getRandomValue(y + half, variance));
            endShape(CLOSE);
    
            //full isze of og square devided by layer multiplied by i to ensure squares are not on top of eachother
        }
    }


function draw(){
    stroke(14,108,217, 50);
    background(174,198,207);

    if (isDay = true){
    for (let y = 0; y < 10; y++){
        for (let x = 0; x < 10; x ++){
        const centerX = size / 50 + x * size;
        const centerY = size / 50 + y *size;

        drawLayers(centerX, centerY, size, layers);  
     }
    }
} else {
    background (255);
}

    noLoop();

}

//change square variance for night so they look liuke stars