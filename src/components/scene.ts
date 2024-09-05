import * as THREE from "three";
import { camera, createCamera } from "./camera.ts";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";

let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let world: CANNON.World;
let cannonDebugger: ReturnType<typeof CannonDebugger>;
let debug = true;
const updateFunctions: Function[] = [];

function createScene() {
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);
  world.broadphase = new CANNON.SAPBroadphase(world);
  let lastCallTime: number;
  registerUpdateFunction(() => {
    const time = performance.now() / 1000;
    if (!lastCallTime) {
      world.step(1 / 60);
    } else {
      const dt = time - lastCallTime;
      world.step(1 / 60, dt);
    }
    lastCallTime = time;
  });

  if (debug) {
    cannonDebugger = CannonDebugger(scene, world, {});
    registerUpdateFunction(() => cannonDebugger.update());
  }

  createCamera();

  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function animate() {
  requestAnimationFrame(animate);

  updateFunctions.forEach((fn) => fn());

  renderer.render(scene, camera);
}

function registerUpdateFunction(fn: Function) {
  updateFunctions.push(fn);
}

export { renderer, scene, world, createScene, registerUpdateFunction };
