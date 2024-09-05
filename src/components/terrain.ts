import * as THREE from "three";
import { scene, world } from "@/components/scene";
import * as CANNON from "cannon-es";
import { convertCannonBodyToMesh } from "@/utils/convert";

function createTerrain() {
  const sizeX = 100;
  const sizeZ = 100;
  const segments = 50;

  const heightfield = createHeightfield(sizeX, sizeZ, segments);

  const material = new THREE.MeshStandardMaterial({
    color: 0xfff49f,
    flatShading: true,
  });
  const plane = convertCannonBodyToMesh(heightfield, material);
  plane.receiveShadow = true;
  plane.castShadow = true;

  world.addBody(heightfield);
  scene.add(plane);
}

function createHeightfield(
  width: number,
  depth: number,
  segments: number,
): CANNON.Body {
  const matrix: number[][] = [];
  const elementSize = width / segments;

  for (let i = 0; i <= segments; i++) {
    const row: number[] = [];
    for (let j = 0; j <= segments; j++) {
      const x = i * elementSize - width / 2;
      const z = j * elementSize - depth / 2;
      const y = Math.cos(x * 0.3) * Math.cos(z * 0.3) * 1;
      row.push(y);
    }
    matrix.push(row);
  }

  const heightfieldShape = new CANNON.Heightfield(matrix, {
    elementSize: elementSize,
  });

  const heightfieldBody = new CANNON.Body({ mass: 0 });
  heightfieldBody.addShape(heightfieldShape);
  heightfieldBody.position.set(-width / 2, 0, depth / 2);
  heightfieldBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

  return heightfieldBody;
}

export { createTerrain };
