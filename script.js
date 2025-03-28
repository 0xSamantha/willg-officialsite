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
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Better handling of HDR
renderer.toneMappingExposure = 1.0; // Adjust exposure for HDR (tweak as needed)
container.appendChild(renderer.domElement);

// Add a 360 sphere with HDR texture
const geometry = new THREE.SphereGeometry(500, 60, 40);
geometry.scale(-1, 1, 1); // Flip inside-out to view the inner surface

// Load your HDR image
const rgbeLoader = new THREE.RGBELoader();
rgbeLoader.load(
    './night-sky.hdr', // Path to your HDR image
    (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping; // Required for HDR environment maps
        scene.background = texture; // Set as scene background for ambient lighting
        scene.environment = texture; // Use for environment lighting
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.5, // Adjust for material appearance
            metalness: 0.0 // Non-metallic surface
        });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
    },
    undefined,
    (error) => {
        console.error('Error loading HDR texture:', error);
    }
);

// Add ambient light to brighten the scene (optional, since HDR provides some lighting)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Lower intensity since HDR contributes light
scene.add(ambientLight);

// Position camera inside the sphere
camera.position.set(0, 0, 0.1);

// Mouse control for 360 rotation
let isDragging = false;
let previousX = 0;

container.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousX = e.clientX;
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const delta = (e.clientX - previousX) * 0.005;
        camera.rotation.y -= delta;
        previousX = e.clientX;
    }
});

window.addEventListener('mouseup', () => {
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

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});