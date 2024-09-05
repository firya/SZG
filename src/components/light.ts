import * as THREE from "three";
import { scene } from "@/components/scene";

function createLight() {
  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(50, 100, 50);
  light.castShadow = true;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
}

export { createLight };
