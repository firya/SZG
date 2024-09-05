import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { renderer, registerUpdateFunction } from "./scene.ts";

let camera: THREE.PerspectiveCamera;

function createCamera() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  // Add orbital controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2;

  // Set up isometric view
  camera.position.set(10, 10, 10);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  registerUpdateFunction(() => controls.update());
}

export { camera, createCamera };
