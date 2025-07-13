// Import Three.js
import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';

// Declare global variables for scene, camera, renderer, and objects
let scene, camera, renderer;
let stars;
let grid;
let cube; // Keeping the cube for now as a placeholder object

function init() {
    // 1. Scene: The container for all your 3D objects, lights, and cameras
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black background for space/cyberpunk
    
    // --- Add Fog for atmosphere ---
    // Parameters: color, near (distance from camera where fog starts), far (distance where fog is densest)
    // Adjust these values to get the desired atmospheric density and color
    scene.fog = new THREE.Fog(0x000000, 10, 200); // Black fog, subtle, blends into distance
    // Alternative for a colored cyberpunk haze:
    // scene.fog = new THREE.Fog(0x800080, 50, 300); // Purple fog for a more distinct haze

    // 2. Camera: Defines what is visible in your scene
    // PerspectiveCamera(FOV, Aspect Ratio, Near Plane, Far Plane)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Set an initial position for the camera, far away for the cinematic fly-in
    camera.position.set(0, 50, 150); // Start relatively high and far back
    camera.lookAt(0, 0, 0); // Make the camera initially look at the center of the scene

    // 3. Renderer: Renders your scene onto a <canvas> element
    renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias for smoother edges
    renderer.setSize(window.innerWidth, window.innerHeight); // Set renderer size to full window
    document.body.appendChild(renderer.domElement); // Add the canvas to the HTML body

    // --- Add basic lighting ---
    // AmbientLight provides general illumination, so all parts of objects are visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light, 50% intensity
    scene.add(ambientLight);
    // DirectionalLight simulates sunlight, creating distinct shadows (if enabled on renderer/material)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Brighter light from a direction
    directionalLight.position.set(1, 1, 1); // Position it (relative to scene origin)
    scene.add(directionalLight);

    // --- Add a simple 3D object (a cube) to the scene to test the setup ---
    // You'll replace this with your actual portfolio content later
    const geometry = new THREE.BoxGeometry(5, 5, 5); // Larger cube
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green color
    cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, 0); // Place cube at the center
    scene.add(cube);

    // --- Create Starfield (Particle System) ---
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,        // White stars
        size: 0.1,              // Size of each star
        transparent: true,      // Enable transparency
        blending: THREE.AdditiveBlending // Makes stars glow a bit when overlapping
    });

    const starVertices = [];
    const numStars = 10000; // Number of stars
    const starFieldSize = 2000; // Spread stars over a large area
    for (let i = 0; i < numStars; i++) {
        const x = (Math.random() - 0.5) * starFieldSize;
        const y = (Math.random() - 0.5) * starFieldSize;
        const z = (Math.random() - 0.5) * starFieldSize;
        starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // --- Create Neon Grid (LineSegments) ---
    const divisions = 50; // Number of grid cells along one axis
    const gridSize = 1000; // Total size of the grid
    const gridYPosition = -50; // Position of the grid on the Y-axis (below the origin)

    const gridColor = new THREE.Color(0x00ffff); // Cyan for neon effect
    const gridMaterial = new THREE.LineBasicMaterial({
        color: gridColor,
        linewidth: 1, // Note: linewidth is generally ignored by WebGL without extensions
        transparent: true,
        opacity: 0.2, // Slightly transparent
        blending: THREE.AdditiveBlending // Glow effect
    });

    const gridGeometry = new THREE.BufferGeometry();
    const gridVertices = [];

    // Create horizontal lines
    for (let i = 0; i <= divisions; i++) {
        const z = (i / divisions - 0.5) * gridSize;
        gridVertices.push(-gridSize / 2, gridYPosition, z); // Start X, Y, Z
        gridVertices.push(gridSize / 2, gridYPosition, z);  // End X, Y, Z
    }
    // Create vertical lines
    for (let i = 0; i <= divisions; i++) {
        const x = (i / divisions - 0.5) * gridSize;
        gridVertices.push(x, gridYPosition, -gridSize / 2); // Start X, Y, Z
        gridVertices.push(x, gridYPosition, gridSize / 2);  // End X, Y, Z
    }
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3));
    grid = new THREE.LineSegments(gridGeometry, gridMaterial);
    scene.add(grid);

    // Animate the grid's opacity for a subtle pulsing neon effect using GSAP
    gsap.to(grid.material, {
        opacity: 0.4, // Brighter pulse
        duration: 2,
        repeat: -1,   // Infinite repeat
        yoyo: true,   // Go back and forth
        ease: "sine.inOut" // Smooth in and out
    });

    // --- Cinematic Camera Fly-in Animation with GSAP ---
    gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 15, // End closer to the origin, giving space for the cube/content
        duration: 4, // Animation duration: 4 seconds
        ease: "power2.out", // Smooth easing for a cinematic feel
        onUpdate: () => {
            // If the camera needs to continuously look at a specific point
            // (e.g., if the main content itself moves), you'd call camera.lookAt() here.
            // For now, looking at (0,0,0) is fine as we fly in.
            camera.lookAt(0, 0, 0);
        },
        onComplete: () => {
            console.log("Cinematic fly-in animation complete!");
            // This is the ideal place to trigger subsequent animations,
            // make interactive elements appear, or start background music.
        }
    });

    // Handle window resizing to keep the scene responsive
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // Update camera's projection matrix
    renderer.setSize(window.innerWidth, window.innerHeight); // Update renderer size
}

function animate() {
    requestAnimationFrame(animate); // Create a continuous render loop

    // Optional: Make the cube rotate for a simple animation
    if (cube) {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
    }

    // Animate Starfield (Subtle rotation)
    if (stars) {
        stars.rotation.y += 0.00005; // Very subtle rotation for depth
        stars.rotation.x += 0.00002;
    }

    renderer.render(scene, camera); // Render the scene from the camera's perspective
}

// Initialize the scene and start the animation loop when the script loads
init();
animate();
