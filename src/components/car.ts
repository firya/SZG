import * as THREE from "three";
import * as CANNON from "cannon-es";
import { world, scene, registerUpdateFunction } from "@/components/scene";

function createCar() {
  // Create car chassis
  const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
  const chassisBody = new CANNON.Body({ mass: 150 });
  chassisBody.addShape(chassisShape);
  chassisBody.position.set(0, 5, 0); // Initial position

  const vehicle = new CANNON.RaycastVehicle({
    chassisBody,
  });

  const wheelOptions = {
    radius: 0.5,
    directionLocal: new CANNON.Vec3(0, -1, 0),
    suspensionStiffness: 30,
    suspensionRestLength: 0.3,
    frictionSlip: 1.4,
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
    maxSuspensionForce: 100000,
    rollInfluence: 0.01,
    axleLocal: new CANNON.Vec3(0, 0, 1),
    chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, 1),
    maxSuspensionTravel: 0.3,
    customSlidingRotationalSpeed: -30,
    useCustomSlidingRotationalSpeed: true,
  };

  wheelOptions.chassisConnectionPointLocal.set(-1, 0, 1);
  vehicle.addWheel(wheelOptions);

  wheelOptions.chassisConnectionPointLocal.set(-1, 0, -1);
  vehicle.addWheel(wheelOptions);

  wheelOptions.chassisConnectionPointLocal.set(1, 0, 1);
  vehicle.addWheel(wheelOptions);

  wheelOptions.chassisConnectionPointLocal.set(1, 0, -1);
  vehicle.addWheel(wheelOptions);

  vehicle.addToWorld(world);

  // Create car mesh and add it to the scene
  const carGeometry = new THREE.BoxGeometry(2, 1, 4);
  const carMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const carMesh = new THREE.Mesh(carGeometry, carMaterial);
  scene.add(carMesh);

  // Sync car mesh with physics body
  registerUpdateFunction(() => {
    carMesh.position.copy(chassisBody.position);
    carMesh.quaternion.copy(chassisBody.quaternion);
  });

  const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  };

  document.addEventListener("keydown", (event) => {
    keys[event.code] = true;
  });

  document.addEventListener("keyup", (event) => {
    keys[event.code] = false;
  });

  const maxSteerVal = Math.PI / 8;
  const maxForce = 10000;
  const brakeForce = 1000000;

  registerUpdateFunction(() => {
    let steerVal = 0;
    let engineForce = 0;

    if (keys.ArrowUp) {
      engineForce = maxForce;
    }
    if (keys.ArrowDown) {
      engineForce = -maxForce;
    }
    if (keys.ArrowLeft) {
      steerVal = maxSteerVal;
    }
    if (keys.ArrowRight) {
      steerVal = -maxSteerVal;
    }

    // Apply engine force
    chassisBody.applyForce(
      new CANNON.Vec3(0, 0, engineForce),
      chassisBody.position,
    );

    // Apply steering
    chassisBody.angularVelocity.set(0, steerVal, 0);
  });
}

export { createCar };
