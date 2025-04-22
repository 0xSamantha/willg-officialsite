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

// Change to Linear tone mapping which allows for much higher exposure values
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = 15.0; // Extremely high exposure value
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

// Add a 360 sphere with HDR texture
const geometry = new THREE.SphereGeometry(500, 60, 40);
geometry.scale(-1, 1, 1); // Flip inside-out to view the inner surface

// Create a much brighter environment first
const brightAmbientLight = new THREE.AmbientLight(0xffffff, 5.0); // Very bright ambient light
scene.add(brightAmbientLight);

// Add multiple bright point lights to illuminate the scene
for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 200;
    const z = Math.sin(angle) * 200;
    
    const pointLight = new THREE.PointLight(0xffffff, 2.0, 1000);
    pointLight.position.set(x, 100, z);
    scene.add(pointLight);
}

// Add ground illumination
const groundLight = new THREE.PointLight(0xffffff, 3.0, 500);
groundLight.position.set(0, -200, 0);
scene.add(groundLight);

// Load your HDR image
const rgbeLoader = new THREE.RGBELoader();
rgbeLoader.load(
    './night-sky.hdr', // Path to your HDR image
    (texture) => {
        // Process the texture to enhance brightness
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
        
        // Try a MeshBasicMaterial which ignores lighting for the HDR
        const material = new THREE.MeshBasicMaterial({
            map: texture,
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
        
        // Post-processing to brighten the scene
        createBrightnessPostProcessing();
    },
    undefined,
    (error) => {
        console.error('Error loading HDR texture:', error);
    }
);

// Add post-processing for enhanced brightness
function createBrightnessPostProcessing() {
    // Make sure Three.js EffectComposer is available
    if (typeof THREE.EffectComposer !== 'undefined') {
        // Add brightness/contrast post-processing
        const composer = new THREE.EffectComposer(renderer);
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);
        
        // Add brightness/contrast adjustment
        const brightnessPass = new THREE.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                brightness: { value: 0.5 },
                contrast: { value: 0.5 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float brightness;
                uniform float contrast;
                varying vec2 vUv;
                
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    color.rgb += brightness;
                    color.rgb = (color.rgb - 0.5) * (1.0 + contrast) + 0.5;
                    gl_FragColor = color;
                }
            `
        });
        composer.addPass(brightnessPass);
        
        // Update animation function to use composer
        function animate() {
            requestAnimationFrame(animate);
            composer.render();
        }
        animate();
    } else {
        // Fall back to regular renderer if EffectComposer is not available
        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }
        animate();
    }
}

// If no post-processing, use regular animation loop
let animationStarted = false;
function startRegularAnimation() {
    if (!animationStarted) {
        animationStarted = true;
        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }
        animate();
    }
}

// Start animation after a short delay if post-processing doesn't initialize
setTimeout(startRegularAnimation, 1000);

// Position camera inside the sphere
camera.position.set(0, 0, 0.1);

// Mouse control for 360 rotation
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
        const deltaX = (e.clientX - previousX) * 0.005;
        const deltaY = (e.clientY - previousY) * 0.005;
        
        // Limit vertical rotation to avoid flipping
        const nextRotationX = camera.rotation.x - deltaY;
        if (nextRotationX < Math.PI/2 && nextRotationX > -Math.PI/2) {
            camera.rotation.x = nextRotationX;
        }
        
        camera.rotation.y -= deltaX;
        previousX = e.clientX;
        previousY = e.clientY;
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

// Add touch support for mobile devices
container.addEventListener('touchstart', (e) => {
    isDragging = true;
    previousX = e.touches[0].clientX;
    previousY = e.touches[0].clientY;
});

window.addEventListener('touchmove', (e) => {
    if (isDragging) {
        const deltaX = (e.touches[0].clientX - previousX) * 0.005;
        const deltaY = (e.touches[0].clientY - previousY) * 0.005;
        
        // Limit vertical rotation to avoid flipping
        const nextRotationX = camera.rotation.x - deltaY;
        if (nextRotationX < Math.PI/2 && nextRotationX > -Math.PI/2) {
            camera.rotation.x = nextRotationX;
        }
        
        camera.rotation.y -= deltaX;
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

// Add a more direct solution - let's create a simple fallback in case the HDR approach isn't working
// This adds an image directly to the background as a backup
setTimeout(() => {
    // Check if scene is still dark after 3 seconds
    const testRenderer = new THREE.WebGLRenderer({ antialias: true });
    testRenderer.setSize(10, 10); // Small test render
    testRenderer.render(scene, camera);
    
    // Get pixel data to test brightness
    const pixelBuffer = new Uint8Array(4 * 10 * 10);
    testRenderer.readRenderTargetPixels(testRenderer.getRenderTarget(), 0, 0, 10, 10, pixelBuffer);
    
    // Calculate average brightness
    let totalBrightness = 0;
    for (let i = 0; i < pixelBuffer.length; i += 4) {
        totalBrightness += (pixelBuffer[i] + pixelBuffer[i+1] + pixelBuffer[i+2]) / 3;
    }
    const avgBrightness = totalBrightness / (10 * 10);
    
    // If still dark, try a different approach
    if (avgBrightness < 50) {
        console.log("HDR rendering still too dark, applying alternative solution");
        
        // Create a new material with extremely high emission properties
        const emissiveMaterial = new THREE.MeshStandardMaterial({
            map: scene.background,
            emissive: 0xffffff,
            emissiveMap: scene.background,
            emissiveIntensity: 5.0
        });
        
        // Find and update the sphere material
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.material = emissiveMaterial;
            }
        });
    }
}, 3000);

// Add a fallback to check brightness after 3 seconds
setTimeout(() => {
    // Render the scene to check brightness
    const pixelBuffer = new Uint8Array(4); // Single pixel buffer
    renderer.readRenderTargetPixels(
        renderer.getRenderTarget(),
        Math.floor(renderer.domElement.width / 2),
        Math.floor(renderer.domElement.height / 2),
        1,
        1,
        pixelBuffer
    );

    // Calculate brightness of the center pixel
    const brightness = (pixelBuffer[0] + pixelBuffer[1] + pixelBuffer[2]) / 3;

    // If brightness is too low, log a warning and ensure HDR is applied
    if (brightness < 50) {
        console.warn("HDR rendering appears too dark. Reapplying HDR texture.");

        // Reapply the HDR texture to the scene
        rgbeLoader.load(
            './night-sky.hdr', // Path to your HDR image
            (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                scene.background = texture;
                scene.environment = texture;
            },
            undefined,
            (error) => {
                console.error('Error reloading HDR texture:', error);
            }
        );
    }
}, 3000);