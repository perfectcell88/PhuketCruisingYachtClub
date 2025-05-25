import * as THREE from './three.module.js';
import { OrbitControls } from './controls/OrbitControls.js';
import { Water } from './objects/Water.js';
import { Sky } from './objects/Sky.js';
import { UnrealBloomPass } from './js/postprocessing/UnrealBloomPass.js';
import { Lensflare, LensflareElement } from './objects/Lensflare.js';

let container;
let camera, scene, renderer;
let controls, water, sun;

const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

init();
simulateLoadingAndStart();

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(30, 15, 100);

  scene = new THREE.Scene();

  sun = new THREE.Vector3();

  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffcc66,
    waterColor: 0x2288aa,
    distortionScale: 1.0,
    fog: scene.fog !== undefined
  });

  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  water.material.uniforms.alpha.value = 0.9;
  water.material.uniforms.distortionScale.value = 0.02;

  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 0.5;
  skyUniforms['mieCoefficient'].value = 0.02;
  skyUniforms['mieDirectionalG'].value = 0.8;

  const parameters = { elevation: 5, azimuth: 150 };
  const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
  const theta = THREE.MathUtils.degToRad(parameters.azimuth);

  sun.setFromSphericalCoords(1, phi, theta);
  sky.material.uniforms['sunPosition'].value.copy(sun);
  water.material.uniforms['sunDirection'].value.copy(sun).normalize();

  const directionalLight = new THREE.DirectionalLight(0xffaa66, 2.0);
  directionalLight.position.copy(sun.clone().multiplyScalar(100));

  const textureLoader = new THREE.TextureLoader();
  const textureFlare0 = textureLoader.load('textures/lensflare0.png');
  const textureFlare3 = textureLoader.load('textures/lensflare3.png');

  const lensflare = new Lensflare();
  lensflare.addElement(new LensflareElement(textureFlare0, 700, 0.0, new THREE.Color(0xffcc88)));
  lensflare.addElement(new LensflareElement(textureFlare3, 200, 0.4));
  lensflare.addElement(new LensflareElement(textureFlare3, 100, 0.6));
  lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.8));
  directionalLight.add(lensflare);

  scene.add(directionalLight);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.4;
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;

  const sunTargetDistance = 100;
  const sunTarget = sun.clone().multiplyScalar(sunTargetDistance);
  controls.target.copy(sunTarget);
  controls.update();

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  water.material.uniforms['time'].value += 1.0 / 60.0;
  renderer.render(scene, camera);
}

function simulateLoadingAndStart() {
  let progress = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 5;
    if (progress >= 100) {
      progress = 100;
      updateLoadingUI(progress);
      clearInterval(interval);
      fadeOutLoadingOverlay();
      animate();
    } else {
      updateLoadingUI(progress);
    }
  }, 100);
}

function updateLoadingUI(progress) {
  loadingText.textContent = `Setting sail... ${Math.floor(progress)}%`;
}

function fadeOutLoadingOverlay() {
  loadingOverlay.style.opacity = '0';
  setTimeout(() => {
    loadingOverlay.style.display = 'none';
  }, 1000);
}
