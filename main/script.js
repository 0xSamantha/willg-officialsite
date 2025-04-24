// Three.js setup
const container = document.getElementById('scene-container');
const hotspotContainer = document.getElementById('hotspot-container');
const hotspots = document.querySelectorAll('.hotspot');
const zoomContent = document.getElementById('zoom-content');
const zoomText = document.getElementById('zoom-text');
const closeZoom = document.getElementById('close-zoom');

// Initialize Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Increase brightness with more aggressive tone mapping and exposure
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Better HDR tone mapping
renderer.toneMappingExposure = 9.0; // Increased exposure for brightness
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

// Add a 360 sphere with HDR texture
const geometry = new THREE.SphereGeometry(500, 60, 40);
geometry.scale(-1, 1, 1); // Flip inside-out to view the inner surface

// Create brighter ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 5.0); // Increased intensity
scene.add(ambientLight);

// Position camera inside the sphere
camera.position.set(0, 0, 0.1);

// Fix: Implement proper orbit controls for natural 360° viewing
// Using Euler angles for proper first-person camera control
let rotX = 0;
let rotY = 0;
const sensitivity = 0.005;

function updateCameraRotation() {
    // Apply rotation in correct order for natural first-person camera control
    camera.rotation.order = 'YXZ'; // Important: set rotation order
    camera.rotation.x = rotX; // Vertical rotation (pitch)
    camera.rotation.y = rotY; // Horizontal rotation (yaw)
}

// Start animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Load your HDR image
const rgbeLoader = new THREE.RGBELoader();
rgbeLoader.load(
    './night-sky.hdr', // Path to your HDR image
    (texture) => {
        // Process the texture with higher intensity
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
        
        // Use MeshBasicMaterial for maximum brightness
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
        
        // Start the animation loop
        animate();
    },
    undefined,
    (error) => {
        console.error('Error loading HDR texture:', error);
        // Start regular animation even if HDR fails to load
        animate();
    }
);

// Fixed mouse control for proper 360 rotation
let isDragging = false;
let previousX = 0;
let previousY = 0;

container.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousX = e.clientX;
    previousY = e.clientY;
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = (e.clientX - previousX) * sensitivity;
        const deltaY = (e.clientY - previousY) * sensitivity;
        
        // Update rotation values
        rotY -= deltaX; // Left-right movement affects Y rotation
        rotX -= deltaY;  // Up-down movement affects X rotation
        
        // Clamp vertical rotation to avoid flipping
        rotX = Math.max(Math.min(rotX, Math.PI/2 - 0.1), -Math.PI/2 + 0.1);
        
        // Apply camera rotation
        updateCameraRotation();
        
        previousX = e.clientX;
        previousY = e.clientY;
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

// Fix touch support with the same rotation logic
container.addEventListener('touchstart', (e) => {
    isDragging = true;
    previousX = e.touches[0].clientX;
    previousY = e.touches[0].clientY;
});

window.addEventListener('touchmove', (e) => {
    if (isDragging) {
        const deltaX = (e.touches[0].clientX - previousX) * sensitivity;
        const deltaY = (e.touches[0].clientY - previousY) * sensitivity;
        
        // Update rotation values with same logic as mouse
        rotY -= deltaX;
        rotX -= deltaY;
        
        // Clamp vertical rotation
        rotX = Math.max(Math.min(rotX, Math.PI/2 - 0.1), -Math.PI/2 + 0.1);
        
        // Apply camera rotation
        updateCameraRotation();
        
        previousX = e.touches[0].clientX;
        previousY = e.touches[0].clientY;
    }
});

window.addEventListener('touchend', () => {
    isDragging = false;
});

// Hotspot interaction
hotspots.forEach(hotspot => {
    hotspot.addEventListener('click', () => {
        const zone = hotspot.getAttribute('data-zoom');
        zoomText.textContent = `Zoomed into ${zone}`;
        zoomContent.classList.remove('hidden');
        camera.position.z = zone === 'zone1' ? 100 : -100;
    });
});

closeZoom.addEventListener('click', () => {
    zoomContent.classList.add('hidden');
    camera.position.z = 0.1;
});

// Resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});