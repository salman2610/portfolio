// Import Three.js
import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';

// Declare global variables for scene, camera, renderer, and objects
let scene, camera, renderer;
let stars;
let grid;
let cube;

// Navigation Nodes Variables
const navNodes = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Terminal Variables
let terminalContainer;
let terminalOutput;
let terminalInput;

// Audio Variables
let backgroundAudio;
let audioToggleButton;
let isAudioMuted = false;

function init() {
    // 1. Scene: The container for all your 3D objects, lights, and cameras
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black background for space/cyberpunk
    
    // --- Add Fog for atmosphere ---
    // Parameters: color, near (distance from camera where fog starts), far (distance where fog is densest)
    // Try changing to a distinct color like 0x800080 (purple) to clearly see the fog effect
    scene.fog = new THREE.Fog(0x000000, 10, 200); // Black fog, subtle, blends into distance
    // For a more distinct cyberpunk haze, uncomment the line below and comment the one above:
    // scene.fog = new THREE.Fog(0x800080, 50, 300); // Purple fog for a more distinct haze

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
            // Once camera fly-in is complete, fade in the terminal, nodes, and audio controls
            setupTerminal();
            setupNavNodes();
            setupAudio();
        }
    });

    // --- Setup Navigation Nodes ---
    function setupNavNodes() {
        const nodeData = [
            { name: "Projects", position: new THREE.Vector3(-15, 0, -10), color: 0xff00ff }, // Magenta
            { name: "Experience", position: new THREE.Vector3(0, 0, -10), color: 0x00ffff }, // Cyan
            { name: "Contact", position: new THREE.Vector3(15, 0, -10), color: 0xffff00 }    // Yellow
        ];

        const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
        const baseMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        nodeData.forEach(data => {
            const material = baseMaterial.clone();
            material.color.set(data.color);
            const node = new THREE.Mesh(sphereGeometry, material);
            node.position.copy(data.position);
            node.userData = { name: data.name };
            scene.add(node);
            navNodes.push(node);

            // Animate node into view and make it float
            node.scale.set(0.01, 0.01, 0.01);
            gsap.to(node.scale, { x: 1, y: 1, z: 1, duration: 1, ease: "back.out(1.7)", delay: 5 + Math.random() * 0.5 });
            gsap.to(node.position, {
                y: node.position.y + 1,
                duration: 2,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut",
                delay: 5 + Math.random()
            });
        });

        // Add event listeners for interaction
        window.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('click', onClick, false);
    }

    // --- Raycasting for Interaction ---
    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function onClick(event) {
        if (terminalContainer.style.pointerEvents !== 'auto') return; // Only allow clicks after scene is ready

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(navNodes);

        if (intersects.length > 0) {
            const clickedNode = intersects[0].object;
            const nodeName = clickedNode.userData.name;
            appendToTerminal(`Clicked on: ${nodeName}`, 'info');
            handleNodeClick(nodeName);
            gsap.to(clickedNode.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.1, yoyo: true, repeat: 1 });
        }
    }

    function handleNodeClick(nodeName) {
        switch (nodeName) {
            case "Projects":
                appendToTerminal("Navigating to Projects section...", 'info');
                // Future: Implement camera animation to Projects view
                // Future: Implement displaying project details
                break;
            case "Experience":
                appendToTerminal("Navigating to Experience section...", 'info');
                // Future: Implement camera animation to Experience view
                // Future: Implement displaying experience details
                break;
            case "Contact":
                appendToTerminal("Navigating to Contact section...", 'info');
                // Future: Implement camera animation to Contact view
                // Future: Implement displaying contact form/info
                break;
        }
    }

    // --- Terminal Functions ---
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
                appendToTerminal(`user@portfolio:~ $ ${command}`, 'command');
                handleCommand(command);
                terminalInput.value = '';
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
            }
        });

        gsap.to(terminalContainer, {
            opacity: 1,
            duration: 1,
            delay: 4.5,
            onComplete: () => {
                terminalContainer.style.pointerEvents = 'auto';
                terminalInput.focus();
            }
        });
    }

    function appendToTerminal(text, type = 'normal') {
        const line = document.createElement('div');
        line.textContent = text;
        if (type === 'error') {
            line.style.color = '#ff0000';
        } else if (type === 'command') {
            line.style.color = '#00ffff';
        } else if (type === 'info') {
            line.style.color = '#ffff00';
        }
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function handleCommand(command) {
        switch (command.toLowerCase()) {
            case 'help':
                appendToTerminal("Available commands:");
                appendToTerminal("  - projects: View my projects");
                appendToTerminal("  - experience: See my work experience");
                appendToTerminal("  - contact: Get my contact details");
                appendToTerminal("  - clear: Clear the terminal output");
                break;
            case 'projects':
                appendToTerminal("Loading projects...", 'info');
                handleNodeClick("Projects");
                break;
            case 'experience':
                appendToTerminal("Loading experience...", 'info');
                handleNodeClick("Experience");
                break;
            case 'contact':
                appendToTerminal("Loading contact info...", 'info');
                handleNodeClick("Contact");
                break;
            case 'clear':
                terminalOutput.innerHTML = '';
                break;
            case '':
                break;
            default:
                appendToTerminal(`Error: Unknown command '${command}'. Type 'help' for options.`, 'error');
                break;
        }
    }

    // --- Audio Functions ---
    function setupAudio() {
        backgroundAudio = document.getElementById('background-audio');
        audioToggleButton = document.getElementById('audio-toggle-btn');
        const audioControls = document.getElementById('audio-controls');

        backgroundAudio.volume = 0.5;
        backgroundAudio.play().catch(error => {
            console.warn("Autoplay prevented:", error);
            appendToTerminal("Autoplay failed. Click 'Play Audio' to enable sound.", 'info');
            audioToggleButton.textContent = "Play Audio";
            isAudioMuted = true;
        });

        audioToggleButton.addEventListener('click', toggleAudio);

        gsap.to(audioControls, {
            opacity: 1,
            duration: 1,
            delay: 4.5
        });
    }

    function toggleAudio() {
        if (isAudioMuted) {
            backgroundAudio.play();
            audioToggleButton.textContent = "Mute Audio";
            isAudioMuted = false;
        } else {
            backgroundAudio.pause();
            audioToggleButton.textContent = "Play Audio";
            isAudioMuted = true;
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

    if (cube) {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
    }

    if (stars) {
        stars.rotation.y += 0.00005;
        stars.rotation.x += 0.00002;
    }

    renderer.render(scene, camera);
}

// Initialize the scene and start the animation loop when the script loads
init();
animate();
