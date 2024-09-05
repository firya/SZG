import * as THREE from "three";
import { scene } from "./scene.ts";

function createSkyBox() {
  const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
  const skyboxMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x87ceeb) }, // Light blue
      bottomColor: { value: new THREE.Color(0xf4bdf2) }, // Yellow
      offset: { value: 400 },
      exponent: { value: 0.6 },
    },
    vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
    fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `,
    side: THREE.BackSide,
  });
  const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
  skybox.rotation.y = Math.PI / 4; // Rotate the skybox
  scene.add(skybox);
}

export { createSkyBox };
