// Import Three.js
import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';

// Declare global variables for scene, camera, renderer, and objects
let scene, camera, renderer;
let stars;
let grid;
let cube;

// New: Stargate Rings Array
const stargateRings = [];

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

// Camera Target Positions for Navigation
const cameraViews = {
    home: { position: new THREE.Vector3(0, 0, 15), lookAt: new THREE.Vector3(0, 0, 0) },
    projects: { position: new THREE.Vector3(-30, 10, 0), lookAt: new THREE.Vector3(-15, 0, -10) },
    experience: { position: new THREE.Vector3(0, 10, -30), lookAt: new THREE.Vector3(0, 0, -10) },
    contact: { position: new THREE.Vector3(30, 10, 0), lookAt: new THREE.Vector3(15, 0, -10) }
};
let isCameraAnimating = false;

// Clock Variables
let digitalClockElement;
let glitchInterval;

// Loading/Boot Sequence Variables
let loadingScreen;
let bootMessagesElement;
let powerNodeContainer;
const bootSequenceMessages = [
    "> INIT_CORE_SEQUENCE",
    "> SCANNING SYSTEM BIOS…",
    "> IDENTITY: P. Salmanul Faris",
    "> SYSTEM STATUS: FULL STACK OP • PEN TESTER • PHYSICIST",
    "> LOADING VISUAL CORE…",
    "",
    "Decrypting past... Compiling skills...",
    "Analyzing quantum signature... Physics meets code...",
    "Establishing neural handshake...",
    "Core systems online. Initiating visual."
];
let messageIndex = 0;
let charIndex = 0;
let typingInterval;
let bootSequenceComplete = false;


function init() {
    loadingScreen = document.getElementById('loading-screen');
    bootMessagesElement = document.getElementById('boot-messages');
    powerNodeContainer = document.getElementById('power-node-container');

    gsap.to(powerNodeContainer, { opacity: 1, duration: 1, delay: 0.5 });
    startBootSequence();
}

function startBootSequence() {
    bootMessagesElement.textContent = '';
    bootMessagesElement.classList.add('typed-text');

    typingInterval = setInterval(() => {
        if (messageIndex < bootSequenceMessages.length) {
            const currentLine = bootSequenceMessages[messageIndex];
            if (charIndex < currentLine.length) {
                bootMessagesElement.textContent += currentLine.charAt(charIndex);
                charIndex++;
            } else {
                clearInterval(typingInterval);
                setTimeout(() => {
                    messageIndex++;
                    charIndex = 0;
                    if (messageIndex < bootSequenceMessages.length) {
                        bootMessagesElement.textContent = '';
                        startBootSequence();
                    } else {
                        bootMessagesElement.classList.remove('typed-text');
                        bootSequenceComplete = true;
                        startStargateEntry();
                    }
                }, 1000);
            }
        }
    }, 50);
}

// --- Modified: startStargateEntry for Wormhole Effect ---
function startStargateEntry() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    // Use a lighter fog for better visibility of rings, or keep black
    scene.fog = new THREE.Fog(0x000000, 50, 400); // Adjust fog for wormhole depth

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Camera starts further back for a longer "wormhole" journey
    camera.position.set(0, 0, 300); // Start very far back
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Remove the placeholder cube for now, it doesn't fit the wormhole scene
    // cube = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    // cube.position.set(0, 10, -50);
    // scene.add(cube);


    // --- Modified Starfield for Particle Streams ---
    // Make stars more concentrated around Z-axis and give them movement
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    const starVertices = [];
    const numStreamStars = 50000; // More stars for denser streams
    const streamRadius = 50; // Stars closer to center
    const streamLength = 1000; // Stars spread along Z-axis
    for (let i = 0; i < numStreamStars; i++) {
        const x = (Math.random() - 0.5) * streamRadius * 2;
        const y = (Math.random() - 0.5) * streamRadius * 2;
        const z = (Math.random() - 0.5) * streamLength - streamLength / 2; // Spread around origin
        starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // --- Create Stargate / Code Rings ---
    const ringCount = 10;
    const maxRingRadius = 150;
    const ringThickness = 1;
    const tubeRadius = 0.5; // Thinness of the torus tube

    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff, // Cyan glow
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide // Important for seeing both sides of thin objects
    });

    for (let i = 0; i < ringCount; i++) {
        const radius = maxRingRadius * (i / ringCount) + 30; // Rings get larger further away
        const ringGeometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 100); // Radius, tube, radialSegments, tubularSegments
        const ring = new THREE.Mesh(ringGeometry, ringMaterial.clone()); // Clone material for potential unique animations later
        ring.position.z = -i * (streamLength / ringCount); // Distribute along Z axis
        ring.rotation.x = Math.random() * Math.PI; // Random initial rotation
        ring.rotation.y = Math.random() * Math.PI;

        // Animate individual ring rotation for dynamism
        gsap.to(ring.rotation, {
            x: `+=${Math.PI * 2}`, // Rotate indefinitely
            y: `+=${Math.PI * 2}`,
            z: `+=${Math.PI * 2}`,
            duration: 10 + Math.random() * 5, // Randomize speed
            repeat: -1,
            ease: "none"
        });

        stargateRings.push(ring);
        scene.add(ring);
    }


    // The grid might not make sense in a "wormhole" intro.
    // Consider removing or making it very subtle if it conflicts with the new visuals.
    // For now, let's keep it but be aware.
    const divisions = 50;
    const gridSize = 1000;
    const gridYPosition = -50;
    const gridColor = new THREE.Color(0x00ffff);
    const gridMaterial = new THREE.LineBasicMaterial({
        color: gridColor, linewidth: 1, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending
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

    gsap.to(grid.material, {
        opacity: 0.4, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut"
    });


    // --- Cinematic Camera Fly-in Animation (Scene 2's camera fly-in) ---
    // Animate camera through the rings to the 'home' position
    gsap.to(camera.position, {
        x: cameraViews.home.position.x,
        y: cameraViews.home.position.y,
        z: cameraViews.home.position.z,
        duration: 8, // Make the wormhole journey longer
        ease: "power3.inOut",
        onUpdate: () => {
            camera.lookAt(0, 0, 0); // Keep looking at the center
            // Move rings and stars towards camera for wormhole effect
            stargateRings.forEach(ring => {
                ring.position.z += 5; // Adjust speed
                if (ring.position.z > camera.position.z + 10) { // If ring passes camera, reset it
                    ring.position.z = -(streamLength / 2) - maxRingRadius;
                }
            });
            // Move stars directly
            starGeometry.attributes.position.array.forEach((val, i) => {
                if (i % 3 === 2) { // Z-coordinate
                    starGeometry.attributes.position.array[i] += 5; // Adjust speed
                    // Recycle stars that pass the camera
                    if (starGeometry.attributes.position.array[i] > camera.position.z + 50) {
                        starGeometry.attributes.position.array[i] -= streamLength;
                    }
                }
            });
            starGeometry.attributes.position.needsUpdate = true; // Crucial for updating geometry
        },
        onComplete: () => {
            console.log("Stargate / Wormhole Entry complete!");
            // Transition to Logo/Naming Reveal (Scene 3)
            // For now, this still triggers UI elements and fades loading screen
            // We'll modify this next to introduce the 3D text and background change.
            gsap.to(loadingScreen, {
                opacity: 0,
                duration: 1,
                onComplete: () => {
                    loadingScreen.style.display = 'none';
                    setupTerminal();
                    setupNavNodes();
                    setupAudio();
                    setupDigitalClock();
                    isCameraAnimating = false;
                }
            });
        }
    });

    window.addEventListener('resize', onWindowResize, false);
    animate();
}


// --- Setup Navigation Nodes ---
function setupNavNodes() {
    const nodeData = [
        { name: "Projects", position: new THREE.Vector3(-15, 0, -10), color: 0xff00ff },
        { name: "Experience", position: new THREE.Vector3(0, 0, -10), color: 0x00ffff },
        { name: "Contact", position: new THREE.Vector3(15, 0, -10), color: 0xffff00 }
    ];
    const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
    const baseMaterial = new THREE.MeshBasicMaterial({
        transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
    });
    nodeData.forEach(data => {
        const material = baseMaterial.clone();
        material.color.set(data.color);
        const node = new THREE.Mesh(sphereGeometry, material);
        node.position.copy(data.position);
        node.userData = { name: data.name };
        scene.add(node);
        navNodes.push(node);
        node.scale.set(0.01, 0.01, 0.01);
        gsap.to(node.scale, { x: 1, y: 1, z: 1, duration: 1, ease: "back.out(1.7)", delay: 0.5 + Math.random() * 0.5 });
        gsap.to(node.position, {
            y: node.position.y + 1, duration: 2, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 0.5 + Math.random()
        });
    });
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('click', onClick, false);
}

// --- Raycasting for Interaction ---
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
function onClick(event) {
    if (!terminalContainer || terminalContainer.style.pointerEvents !== 'auto' || isCameraAnimating) return;
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
    if (isCameraAnimating) return;
    isCameraAnimating = true;
    let targetView = cameraViews.home;
    switch (nodeName) {
        case "Projects": targetView = cameraViews.projects; break;
        case "Experience": targetView = cameraViews.experience; break;
        case "Contact": targetView = cameraViews.contact; break;
        case "home": targetView = cameraViews.home; break;
    }
    gsap.to(camera.position, {
        x: targetView.position.x, y: targetView.position.y, z: targetView.position.z,
        duration: 1.5, ease: "power3.inOut",
        onUpdate: () => { camera.lookAt(targetView.lookAt); },
        onComplete: () => {
            isCameraAnimating = false;
            appendToTerminal(`Now viewing: ${nodeName}`, 'info');
        }
    });
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
        opacity: 1, duration: 1, delay: 0,
        onComplete: () => { terminalContainer.style.pointerEvents = 'auto'; terminalInput.focus(); }
    });
}
function appendToTerminal(text, type = 'normal') {
    const line = document.createElement('div');
    line.textContent = text;
    if (type === 'error') { line.style.color = '#ff0000'; }
    else if (type === 'command') { line.style.color = '#00ffff'; }
    else if (type === 'info') { line.style.color = '#ffff00'; }
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
            appendToTerminal("  - resume: Download my resume (PDF)");
            appendToTerminal("  - home: Go to the main view");
            appendToTerminal("  - clear: Clear the terminal output");
            break;
        case 'projects': appendToTerminal("Loading projects...", 'info'); handleNodeClick("Projects"); break;
        case 'experience': appendToTerminal("Loading experience...", 'info'); handleNodeClick("Experience"); break;
        case 'contact': appendToTerminal("Loading contact info...", 'info'); handleNodeClick("Contact"); break;
        case 'resume': appendToTerminal("Initiating resume download...", 'info'); downloadResume('./P.SalmanulFaris (PT) Resume.pdf'); break;
        case 'home': appendToTerminal("Returning to home view...", 'info'); handleNodeClick("home"); break;
        case 'clear': terminalOutput.innerHTML = ''; break;
        case '': break;
        default: appendToTerminal(`Error: Unknown command '${command}'. Type 'help' for options.`, 'error'); break;
    }
}

// --- Resume Download Function ---
function downloadResume(filePath) {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = 'P.SalmanulFaris_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    appendToTerminal("Resume download initiated.", 'info');
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
        opacity: 1, duration: 1, delay: 0
    });
}
function toggleAudio() {
    if (isAudioMuted) { backgroundAudio.play(); audioToggleButton.textContent = "Mute Audio"; isAudioMuted = false; }
    else { backgroundAudio.pause(); audioToggleButton.textContent = "Play Audio"; isAudioMuted = true; }
}

// --- Digital Clock Functions ---
function setupDigitalClock() {
    digitalClockElement = document.getElementById('digital-clock');
    updateClock();
    setInterval(updateClock, 1000);
    glitchInterval = setInterval(toggleGlitch, 2000 + Math.random() * 3000);
    gsap.to(digitalClockElement, {
        opacity: 1, duration: 1, delay: 0
    });
}
function updateClock() {
    const now = new Date();
    const options = {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata'
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    let timeString = formatter.format(now);
    const dateOptions = {
        year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Kolkata'
    };
    const dateFormatter = new Intl.DateTimeFormat('en-US', dateOptions);
    const dateString = dateFormatter.format(now);
    const [month, day, year] = dateString.split('/');
    const formattedDate = `${year}-${month}-${day}`;
    digitalClockElement.textContent = `${formattedDate} ${timeString} IST`;
}
function toggleGlitch() {
    if (Math.random() < 0.3) {
        digitalClockElement.classList.add('glitch-active');
        setTimeout(() => {
            digitalClockElement.classList.remove('glitch-active');
        }, 200 + Math.random() * 300);
    }
}


// Handle window resizing to keep the scene responsive
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Only animate these if they exist
    if (cube) {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
    }

    // Animate stars for wormhole effect
    if (stars && bootSequenceComplete) { // Only animate after boot sequence
        // Simulate stars moving towards camera (for wormhole)
        stars.geometry.attributes.position.array.forEach((val, i) => {
            if (i % 3 === 2) { // Z-coordinate
                stars.geometry.attributes.position.array[i] += 1; // Speed of stars moving forward
                // Recycle stars that pass the camera
                if (stars.geometry.attributes.position.array[i] > camera.position.z + 20) {
                    stars.geometry.attributes.position.array[i] -= 1000; // Reset back along Z
                }
            }
        });
        stars.geometry.attributes.position.needsUpdate = true; // Crucial for updating geometry
    }


    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// IMPORTANT: Call init() here to start the entire process
init();
