import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import earthVertexShader from "./shaders/earth/vertex.glsl";
import earthFragmentShader from "./shaders/earth/fragment.glsl";
import atmosphereVertexShader from "./shaders/atmosphere/vertex.glsl";
import atmosphereFragmentShader from "./shaders/atmosphere/fragment.glsl";

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const textureLoader = new THREE.TextureLoader();

/**
 * Earth
 */
const earthParamesters = {
  rotationSpeed: 0.1,
  atmosphereDayColor: "#00aaff",
  atmosphereTwilightColor: "#ff6600",
};
gui.add(earthParamesters, "rotationSpeed").min(0).max(1);
gui.addColor(earthParamesters, "atmosphereDayColor").onChange(() => {
  earthMaterial.uniforms.uAtmosphereDayColor.value.set(
    earthParamesters.atmosphereDayColor
  );
  atmostphereMaterial.uniforms.uAtmosphereDayColor.value.set(
    earthParamesters.atmosphereDayColor
  );
});
gui.addColor(earthParamesters, "atmosphereTwilightColor").onChange(() => {
  earthMaterial.uniforms.uAtmosphereTwilightColor.value.set(
    earthParamesters.atmosphereTwilightColor
  );
  atmostphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(
    earthParamesters.atmosphereTwilightColor
  );
});

// Textures
const earthDayTexture = textureLoader.load("./earth/day.jpg");
earthDayTexture.anisotropy = 8;
earthDayTexture.colorSpace = THREE.SRGBColorSpace;
const earthNightTexture = textureLoader.load("./earth/night.jpg");
earthNightTexture.anisotropy = 8;
earthNightTexture.colorSpace = THREE.SRGBColorSpace;

const earthSpecularCloudsTexture = textureLoader.load(
  "./earth/specularClouds.jpg"
);
earthSpecularCloudsTexture.anisotropy = 8;
earthSpecularCloudsTexture.wrapS = THREE.RepeatWrapping;

// Perlint Texture
const perlintTexture = textureLoader.load("./perlin.png");
perlintTexture.wrapS = THREE.RepeatWrapping;
perlintTexture.wrapT = THREE.RepeatWrapping;

// Mesh
const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
const earthMaterial = new THREE.ShaderMaterial({
  vertexShader: earthVertexShader,
  fragmentShader: earthFragmentShader,
  uniforms: {
    uDayTexture: new THREE.Uniform(earthDayTexture),
    uNightTexture: new THREE.Uniform(earthNightTexture),
    uSpecularCloudsTexture: new THREE.Uniform(earthSpecularCloudsTexture),
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
    uAtmosphereDayColor: new THREE.Uniform(
      new THREE.Color(earthParamesters.atmosphereDayColor)
    ),
    uAtmosphereTwilightColor: new THREE.Uniform(
      new THREE.Color(earthParamesters.atmosphereTwilightColor)
    ),
    uPerlintTexture: new THREE.Uniform(perlintTexture),
    uTime: new THREE.Uniform(),
  },
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Atmostphere
const atmostphereMaterial = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  transparent: true,
  vertexShader: atmosphereVertexShader,
  fragmentShader: atmosphereFragmentShader,
  uniforms: {
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
    uAtmosphereDayColor: new THREE.Uniform(
      new THREE.Color(earthParamesters.atmosphereDayColor)
    ),
    uAtmosphereTwilightColor: new THREE.Uniform(
      new THREE.Color(earthParamesters.atmosphereTwilightColor)
    ),
  },
});

const atmostphere = new THREE.Mesh(earthGeometry, atmostphereMaterial);
atmostphere.scale.set(1.04, 1.04, 1.04);
scene.add(atmostphere);

/** Sun */
const sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5);
const sunDirection = new THREE.Vector3();

const debugSun = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.1, 2),
  new THREE.MeshBasicMaterial()
);
scene.add(debugSun);

const updateSun = () => {
  // Sun direction
  sunDirection.setFromSpherical(sunSpherical);

  // Debug
  debugSun.position.copy(sunDirection).multiplyScalar(5);

  // Uniforms
  earthMaterial.uniforms.uSunDirection.value.copy(sunDirection);
  atmostphereMaterial.uniforms.uSunDirection.value.copy(sunDirection);
};
updateSun();

gui.add(sunSpherical, "phi").min(0).max(Math.PI).onChange(updateSun);
gui.add(sunSpherical, "theta").min(-Math.PI).max(Math.PI).onChange(updateSun);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  25,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 12;
camera.position.y = 5;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);
renderer.setClearColor("#000011");

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  earth.rotation.y = elapsedTime * earthParamesters.rotationSpeed;
  earthMaterial.uniforms.uTime.value =
    elapsedTime * earthParamesters.rotationSpeed;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
