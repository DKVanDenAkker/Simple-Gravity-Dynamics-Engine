//setup canvas-----------------------------------------------------------------------------------------
var canvas = document.getElementById("myCanvas");//taking the canvas element and storing in a variable
var c = canvas.getContext("2d"); //get a reference for 2d context, this is for drawing later 

/*resizing canvas by setting its width and height to the inner width
and height of the window with some margin */
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 100;

/*The cordinate system within the canvas has it's orgin at the top left (0,0)
with the width and height being (canvas.width) & (canvas.height)
--For physics we need the orgin to be at the bottom left (0.0, 0.0), and we need to
specify the (simWidth) & (simHeight) therefor we must be able to map from 
one cordinate system to the other; */

/*first we define a variable simMinWidth, this defines the minimum distance we
want to see on the screen no matter how the screen is oriented*/
var simMinWidth = 20.0;

/*Compute the "scaling" factor to go from the SIMULATION cordinates to the CANVAS cordinates
We then use the variable (cScale) to compute the simWidth & simHeight by "scaling" the sizes
of the canvas*/
var cScale = Math.min(canvas.width, canvas.height) / simMinWidth;
var simWidth  = canvas.width/ cScale; //scaling canvas width
var simHeight = canvas.height / cScale; //scaling canvas height

//Defining two functions for both cordinates (x,y) to go from simulation to canvas cordinates
function cX(pos) {
    return pos.x * cScale; //For X cordinate it simply needs to be scaled
}

function cY(pos) {
    return canvas.height - pos.y * cScale; //For Y cordinate it also needs to be flipped vertically
}

//Scene-----------------------------------------------------------------------------------------
var gravity = { x: 0.0, y: -10.0}; //Define gravity
var timeStep = 1.0/60.0; //Define timestep size

//Start by defining a ball with a radius and a position
var ball = {
    radius : 0.20, //radius = 20cm
    pos : {x: 0.2, y: 0.2}, //position is set to the bottom left
    vel : {x : 10.0, y : 15.0} //Add a velocity to ball, it is intialized to fly off at the beginning
};

//change radius based on what the button selected
document.getElementById("change-radius-btn").addEventListener("click", function() {
let radiusInput = document.getElementById("radius-input");
let newRadius = parseFloat(radiusInput.value);

let minRadius = 0.1; 
let maxRadius = 8.0; 

if (!isNaN(newRadius) && newRadius >= minRadius && newRadius <= maxRadius) {
    ball.radius = newRadius;
} else {
    alert(`Please enter a radius between ${minRadius} and ${maxRadius}.`);
    radiusInput.value = ball.radius; // Reset input to last valid value
    }
});



//drawing scene
// Store previous positions for the trail
var trail = [];
var maxTrailLength = 20; // Number of trail points

function draw(){
    //start by clearning the canvas
    c.fillStyle = "rgba(0, 0, 0, 0.1)"; // Slightly dark overlay
    c.fillRect(0, 0, canvas.width, canvas.height);

    // Save current position in the trail
    trail.push({ x: ball.pos.x, y: ball.pos.y });

    // Keep trail size limited
    if (trail.length > maxTrailLength) {
    trail.shift(); // Remove oldest position
    }

    // Draw trail with fading effect
    for (let i = 0; i < trail.length; i++) {
    let alpha = (i + 1) / trail.length; // Older points are more transparent
    c.fillStyle = `rgba(255, 0, 0, ${alpha})`;

    c.beginPath();
    c.arc(cX(trail[i]), cY(trail[i]), cScale * ball.radius, 0, 2 * Math.PI);
    c.fill();
    }

    //then define the fill style of the object, "RED" in this case
    c.fillStyle = "#FF0000";

    //method to draw a filled circle in JavaScript, You essentially have to define a "Center" and a "Radius"
    c.beginPath();
    c.arc(
        //Transformation functions are used to map the balls function from physical to canvas cordinates.
        //To find the radius we multiply the physical radius (ball.radius) by the scaling factor (cScale)
        cX(ball.pos), cY(ball.pos), cScale * ball.radius, 0.0, 2.0 * Math.PI);
    c.closePath();
    c.fill();
}

// Reference the correct switch element
var dampingSwitch = document.querySelector(".switchEL input");

// Update damping factor when the switch is toggled
dampingSwitch.addEventListener("change", function () {
dampeningFactor = this.checked ? 0.95 : 1.0; // Reduce energy on bounce
});
//simulation
var dampeningFactor = 1.0;

function simulate(){
/* f = m*a | Newton's 2nd Law/ Force does not change the position of an object but their velocities
or simply "A force changes the velocity of a body", the force has a stronger effect on lighter objects
and a weaker affect on heavier objects. Also means that without a force, objects keep a constant velocity
this means for "simulation" we have to store both the position and velocity of the object.
GRAVITY - The force that pulls objects towards the surface of earth
f gravity = m*g | (g==10m/s^2) where g is a constant */

    ball.vel.x += gravity.x * timeStep;
    ball.vel.y += gravity.y * timeStep;
    ball.pos.x += ball.vel.x * timeStep;
    ball.pos.y += ball.vel.y * timeStep;

    //collision which happens at the boundary of the window
    if (ball.pos.x - ball.radius < 0.0) { //check the x position everytimestep, If x is smaller than 0.0
        ball.pos.x = ball.radius; // PREVENT WALL CLIPPING
        ball.vel.x = -ball.vel.x * dampeningFactor; //And then reflect the x component of the velocity
    }
    if (ball.pos.x + ball.radius > simWidth) {
        ball.pos.x = simWidth - ball.radius;
        ball.vel.x = -ball.vel.x * dampeningFactor;
    }
    if (ball.pos.y - ball.radius < 0.0) {
        ball.pos.y = ball.radius;
        ball.vel.y = -ball.vel.y * dampeningFactor;

        // Apply friction when the ball is on the ground
        if (Math.abs(ball.vel.y) < 0.5) { // If vertical bounce is weak
        ball.vel.x *= 0.99; // Slow down horizontal movement
        if (Math.abs(ball.vel.x) < 0.0000001) { 
        ball.vel.x = 0; // Stop completely if very slow
        }
    }
    if (ball.pos.y + ball.radius > simHeight) { // Ceiling collision
        ball.pos.y = simHeight - ball.radius; // Adjust to prevent clipping
        ball.vel.y = -ball.vel.y * dampeningFactor;
    }
    
}
}

function updateDebugInfo(speed) {
    document.getElementById("debug-info").innerHTML = `
        <strong>Position:</strong> x: ${ball.pos.x.toFixed()}, y: ${ball.pos.y.toFixed()}<br>
        <strong>Speed:</strong> ${speed.toFixed(2)} m/s
    `;
}
var lastPos = { x: ball.pos.x, y: ball.pos.y };
var lastTime = performance.now();

//make browser call back repeatedly
function update(){
    let currentTime = performance.now();
    let deltaTime = (currentTime - lastTime) / 1000.0; // Convert ms to seconds
    lastTime = currentTime;

    simulate();

    //make var for velocity so i can display it
    let velocityX = (ball.pos.x - lastPos.x) / deltaTime;
    let velocityY = (ball.pos.y - lastPos.y) / deltaTime;
    //calculate the speed
    let speed = Math.sqrt(velocityX ** 2 + velocityY ** 2);

    // Update last position for next frame
    lastPos.x = ball.pos.x;
    lastPos.y = ball.pos.y;
    draw();
    updateDebugInfo(speed);
    requestAnimationFrame(update);
}

update();