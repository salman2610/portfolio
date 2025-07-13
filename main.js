// Import Three.js
import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';

// Declare global variables for scene, camera, renderer, and objects
let scene, camera, renderer;
let stars;
let grid;
let cube; // Keeping the cube for now as a placeholder object

// --- New: Navigation Nodes Variables ---
const navNodes = []; // Array to store your navigation spheres
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// --- Terminal Variables ---
let terminalContainer;
let terminalOutput;
let terminalInput;

function init() {
    // 1. Scene: The container for all your 3D objects, lights, and cameras
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black background for space/cyberpunk
    
    // --- Add Fog for atmosphere ---
    scene.fog = new THREE.Fog(0x000000, 10, 200); // Black fog, subtle, blends into distance

    // 2. Camera: Defines what is visible in your scene
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 150); // Start relatively high and far back
    camera.lookAt(0, 0, 0); // Make the camera initially look at the center of the scene

    // 3. Renderer: Renders your scene onto a <canvas> element
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // --- Add basic lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // --- Add a simple 3D object (a cube) to the scene to test the setup ---
    const geometry = new THREE.BoxGeometry(5, 5, 5);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, 0);
    scene.add(cube);

    // --- Create Starfield (Particle System) ---
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    const starVertices = [];
    const numStars = 10000;
    const starFieldSize = 2000;
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
    const divisions = 50;
    const gridSize = 1000;
    const gridYPosition = -50;
    const gridColor = new THREE.Color(0x00ffff);
    const gridMaterial = new THREE.LineBasicMaterial({
        color: gridColor,
        linewidth: 1,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });
    const gridGeometry = new THREE.BufferGeometry();
    const gridVertices = [];
    for (let i = 0; i <= divisions; i++) {
        const z = (i / divisions - 0.5) * gridSize;
        gridVertices.push(-gridSize / 2, gridYPosition, z);
        gridVertices.push(gridSize / 2, gridYPosition, z);
    }
    for (let i = 0; i <= divisions; i++) {
        const x = (i / divisions - 0.5) * gridSize;
        gridVertices.push(x, gridYPosition, -gridSize / 2);
        gridVertices.push(x, gridYPosition, gridSize / 2);
    }
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3));
    grid = new THREE.LineSegments(gridGeometry, gridMaterial);
    scene.add(grid);

    // Animate the grid's opacity for a subtle pulsing neon effect using GSAP
    gsap.to(grid.material, {
        opacity: 0.4,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });

    // --- Cinematic Camera Fly-in Animation with GSAP ---
    gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 15,
        duration: 4,
        ease: "power2.out",
        onUpdate: () => {
            camera.lookAt(0, 0, 0);
        },
        onComplete: () => {
            console.log("Cinematic fly-in animation complete!");
            // Once camera fly-in is complete, fade in the terminal and nodes
            setupTerminal();
            setupNavNodes(); // Call this to create and display nodes
        }
    });

    // --- New: Setup Navigation Nodes ---
    function setupNavNodes() {
        const nodeData = [
            { name: "Projects", position: new THREE.Vector3(-15, 0, -10), color: 0xff00ff }, // Magenta
            { name: "Experience", position: new THREE.Vector3(0, 0, -10), color: 0x00ffff }, // Cyan
            { name: "Contact", position: new THREE.Vector3(15, 0, -10), color: 0xffff00 }    // Yellow
        ];

        const sphereGeometry = new THREE.SphereGeometry(2, 32, 32); // Radius 2, 32 segments
        const baseMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending, // For glowing effect
            depthWrite: false // Avoid rendering issues with transparent objects
        });

        nodeData.forEach(data => {
            const material = baseMaterial.clone(); // Clone material to give each node a unique color
            material.color.set(data.color);
            const node = new THREE.Mesh(sphereGeometry, material);
            node.position.copy(data.position);
            node.userData = { name: data.name }; // Store data on the object for identification
            scene.add(node);
            navNodes.push(node);

            // Animate node into view and make it float
            node.scale.set(0.01, 0.01, 0.01); // Start small
            gsap.to(node.scale, { x: 1, y: 1, z: 1, duration: 1, ease: "back.out(1.7)", delay: 5 + Math.random() * 0.5 });
            gsap.to(node.position, {
                y: node.position.y + 1, // Float up slightly
                duration: 2,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut",
                delay: 5 + Math.random() // Stagger animation start
            });
        });

        // Add event listeners for interaction
        window.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('click', onClick, false);
    }

    // --- New: Raycasting for Interaction ---
    function onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function onClick(event) {
        // Only allow clicks after the terminal has appeared and scene is ready
        if (terminalContainer.style.pointerEvents !== 'auto') return;

        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);

        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(navNodes);

        if (intersects.length > 0) {
            const clickedNode = intersects[0].object;
            const nodeName = clickedNode.userData.name;
            appendToTerminal(`Clicked on: ${nodeName}`, 'info');
            handleNodeClick(nodeName);

            // Optional: visual feedback on click (e.g., scale up briefly)
            gsap.to(clickedNode.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.1, yoyo: true, repeat: 1 });
        }
    }

    function handleNodeClick(nodeName) {
        // This is where you'll define what happens when a node is clicked.
        // For now, it just prints to the terminal.
        // Later, this will trigger camera animations to specific views,
        // load content, or activate specific UI elements.
        switch (nodeName) {
            case "Projects":
                appendToTerminal("Navigating to Projects section...", 'info');
                // Implement camera animation to Projects view
                // Implement displaying project details
                break;
            case "Experience":
                appendToTerminal("Navigating to Experience section...", 'info');
                // Implement camera animation to Experience view
                // Implement displaying experience details
                break;
            case "Contact":
                appendToTerminal("Navigating to Contact section...", 'info');
                // Implement camera animation to Contact view
                // Implement displaying contact form/info
                break;
        }
    }


    // --- Terminal Functions (copied from previous full code) ---
    function setupTerminal() {
        terminalContainer = document.getElementById('terminal-container');
        terminalOutput = document.getElementById('terminal-output');
        terminalInput = document.getElementById('terminal-input');

        appendToTerminal("Welcome to P. Salmanul Faris's immersive portfolio.", 'info');
        appendToTerminal("Type 'help' for a list of commands.", 'info');
        appendToTerminal("You can also click on the floating nodes.", 'info');


        terminalInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const command = terminalInput.value.trim();
                appendToTerminal(`user@portfolio:~ $ ${command}`, 'command'); // Echo command
                handleCommand(command);
                terminalInput.value = ''; // Clear input
                terminalOutput.scrollTop = terminalOutput.scrollHeight; // Scroll to bottom
            }
        });

        // Make the terminal appear after the camera fly-in
        gsap.to(terminalContainer, {
            opacity: 1,
            duration: 1,
            delay: 4.5, // Start slightly after camera animation (4s duration + 0.5s buffer)
            onComplete: () => {
                terminalContainer.style.pointerEvents = 'auto'; // Make interactive
                terminalInput.focus(); // Focus on input
            }
        });
    }

    function appendToTerminal(text, type = 'normal') {
        const line = document.createElement('div');
        line.textContent = text;
        if (type === 'error') {
            line.style.color = '#ff0000'; // Red for errors
        } else if (type === 'command') {
            line.style.color = '#00ffff'; // Cyan for echoed commands
        } else if (type === 'info') {
            line.style.color = '#ffff00'; // Yellow for info messages
        }
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight; // Auto-scroll
    }

    function handleCommand(command) {
        switch (command.toLowerCase()) {
            case 'help':
                appendToTerminal("Available commands:");
                appendToTerminal("  - projects: View my projects");
                appendToTerminal("  - experience: See my work experience");
                appendToTerminal("  - contact: Get my contact details");
                appendToTerminal("  - clear: Clear the terminal output");
                // Add more commands later
                break;
            case 'projects':
                appendToTerminal("Loading projects...", 'info');
                handleNodeClick("Projects"); // Reuse node click handler
                break;
            case 'experience':
                appendToTerminal("Loading experience...", 'info');
                handleNodeClick("Experience"); // Reuse node click handler
                break;
            case 'contact':
                appendToTerminal("Loading contact info...", 'info');
                handleNodeClick("Contact"); // Reuse node click handler
                break;
            case 'clear':
                terminalOutput.innerHTML = '';
                break;
            case '': // Empty command
                break;
            default:
                appendToTerminal(`Error: Unknown command '${command}'. Type 'help' for options.`, 'error');
                break;
        }
    }


    // Handle window resizing to keep the scene responsive
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Optional: Make the cube rotate for a simple animation
    if (cube) {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
    }

    // Animate Starfield (Subtle rotation)
    if (stars) {
        stars.rotation.y += 0.00005;
        stars.rotation.x += 0.00002;
    }

    // Animate Nav Nodes (Hover effect - not implemented yet, but for future use)
    // Raycasting for hover effects would typically go here or in a separate function
    // For now, their floating animation is handled by GSAP setupNavNodes

    renderer.render(scene, camera);
}

// Initialize the scene and start the animation loop when the script loads
init();
animate();
