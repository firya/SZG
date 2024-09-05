import * as THREE from "three";
import * as CANNON from "cannon-es";

export function convertCannonBodyToMesh(
  body: CANNON.Body,
  material: THREE.MeshStandardMaterial,
): THREE.Mesh {
  let geometry: THREE.BufferGeometry;

  const shape = body.shapes[0];
  switch (shape.type) {
    case CANNON.Shape.types.BOX:
      const boxShape = shape as CANNON.Box;
      const halfExtents = boxShape.halfExtents;
      geometry = new THREE.BoxGeometry(
        halfExtents.x * 2,
        halfExtents.y * 2,
        halfExtents.z * 2,
      );
      break;

    case CANNON.Shape.types.SPHERE:
      const sphereShape = shape as CANNON.Sphere;
      geometry = new THREE.SphereGeometry(sphereShape.radius, 32, 32);
      break;

    case CANNON.Shape.types.CYLINDER:
      const cylinderShape = shape as CANNON.Cylinder;
      geometry = new THREE.CylinderGeometry(
        cylinderShape.radiusTop,
        cylinderShape.radiusBottom,
        cylinderShape.height,
        32,
      );
      break;

    case CANNON.Shape.types.TRIMESH:
      const trimeshShape = shape as CANNON.Trimesh;
      geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array(trimeshShape.vertices);
      const indices = new Uint32Array(trimeshShape.indices);
      geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      geometry.computeVertexNormals();
      break;

    case CANNON.Shape.types.HEIGHTFIELD:
      const heightfieldShape = shape as CANNON.Heightfield;
      const width = heightfieldShape.data.length - 1;
      const depth = heightfieldShape.data[0].length - 1;
      const elementSize = heightfieldShape.elementSize;

      geometry = new THREE.PlaneGeometry(
        width * elementSize,
        depth * elementSize,
        width,
        depth,
      );

      const verticesArray = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i <= width; i++) {
        for (let j = 0; j <= depth; j++) {
          const index = (i * (depth + 1) + j) * 3 + 2;
          console.log(index);
          verticesArray[index] = heightfieldShape.data[i][j];
        }
      }

      geometry.computeVertexNormals();
      geometry.rotateZ(Math.PI / 2); // Rotate to match the Cannon-es heightfield orientation
      break;

    default:
      throw new Error("Shape type not supported");
  }

  const mesh = new THREE.Mesh(geometry, material);

  mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);

  return mesh;
}
