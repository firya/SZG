import * as THREE from "three";
import * as CANNON from "cannon-es";
import { world, scene, registerUpdateFunction } from "@/components/scene";
import { convertCannonBodyToMesh } from "@/utils/convert.ts";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

function createCar() {
  // Create car chassis
  const chassisShape = new CANNON.Box(new CANNON.Vec3(2, 0.5, 1));
  const chassisBody = new CANNON.Body({ mass: 150 });
  chassisBody.addShape(chassisShape);
  chassisBody.position.set(0, 5, 0);
  chassisBody.angularVelocity.set(0, 0.5, 0);

  const vehicle = new CANNON.RaycastVehicle({
    chassisBody,
  });

  const wheelOptions = {
    radius: 0.8,
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

  wheelOptions.chassisConnectionPointLocal.set(-1.5, 0, 1);
  vehicle.addWheel(wheelOptions);

  wheelOptions.chassisConnectionPointLocal.set(-1.5, 0, -1);
  vehicle.addWheel(wheelOptions);

  wheelOptions.chassisConnectionPointLocal.set(1.5, 0, 1);
  vehicle.addWheel(wheelOptions);

  wheelOptions.chassisConnectionPointLocal.set(1.5, 0, -1);
  vehicle.addWheel(wheelOptions);

  vehicle.addToWorld(world);

  // Create car mesh and add it to the scene
  const carMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const carMesh = convertCannonBodyToMesh(chassisBody, carMaterial);
  scene.add(carMesh);

  const wheelBodies = [];
  const wheelSceneBodies = [];
  const wheelMaterial = new CANNON.Material("wheel");
  const wheelMaterial2 = new THREE.MeshBasicMaterial({ color: 0x000000 });
  vehicle.wheelInfos.forEach((wheel) => {
    const cylinderShape = new CANNON.Cylinder(
      wheel.radius,
      wheel.radius,
      wheel.radius / 2,
      20,
    );
    const wheelBody = new CANNON.Body({
      mass: 0,
      material: wheelMaterial,
    });
    wheelBody.type = CANNON.Body.KINEMATIC;
    wheelBody.collisionFilterGroup = 0; // turn off collisions
    const quaternion = new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0);
    wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion);

    const wheelBodyScene = convertCannonBodyToMesh(wheelBody, wheelMaterial2);
    wheelSceneBodies.push(wheelBodyScene);
    wheelBodies.push(wheelBody);
    world.addBody(wheelBody);
    scene.add(wheelBodyScene);
  });

  // Update the wheel bodies
  world.addEventListener("postStep", () => {
    for (let i = 0; i < vehicle.wheelInfos.length; i++) {
      vehicle.updateWheelTransform(i);
      const transform = vehicle.wheelInfos[i].worldTransform;
      wheelBodies[i].position.copy(transform.position);
      wheelBodies[i].quaternion.copy(transform.quaternion);
      wheelSceneBodies[i].position.copy(transform.position);
      wheelSceneBodies[i].quaternion.copy(transform.quaternion);
    }
  });

  // Sync car mesh with physics body
  registerUpdateFunction(() => {
    carMesh.position.copy(chassisBody.position);
    carMesh.quaternion.copy(chassisBody.quaternion);
  });

  document.addEventListener("keydown", (event) => {
    const maxSteerVal = 0.5;
    const maxForce = 1000;
    const brakeForce = 1000000;

    switch (event.key) {
      case "w":
      case "ArrowUp":
        vehicle.applyEngineForce(-maxForce, 2);
        vehicle.applyEngineForce(-maxForce, 3);
        break;

      case "s":
      case "ArrowDown":
        vehicle.applyEngineForce(maxForce, 2);
        vehicle.applyEngineForce(maxForce, 3);
        break;

      case "a":
      case "ArrowLeft":
        vehicle.setSteeringValue(maxSteerVal, 0);
        vehicle.setSteeringValue(maxSteerVal, 1);
        break;

      case "d":
      case "ArrowRight":
        vehicle.setSteeringValue(-maxSteerVal, 0);
        vehicle.setSteeringValue(-maxSteerVal, 1);
        break;

      case "b":
        vehicle.setBrake(brakeForce, 0);
        vehicle.setBrake(brakeForce, 1);
        vehicle.setBrake(brakeForce, 2);
        vehicle.setBrake(brakeForce, 3);
        break;
    }
  });

  // Reset force on keyup
  document.addEventListener("keyup", (event) => {
    switch (event.key) {
      case "w":
      case "ArrowUp":
        vehicle.applyEngineForce(0, 2);
        vehicle.applyEngineForce(0, 3);
        break;

      case "s":
      case "ArrowDown":
        vehicle.applyEngineForce(0, 2);
        vehicle.applyEngineForce(0, 3);
        break;

      case "a":
      case "ArrowLeft":
        vehicle.setSteeringValue(0, 0);
        vehicle.setSteeringValue(0, 1);
        break;

      case "d":
      case "ArrowRight":
        vehicle.setSteeringValue(0, 0);
        vehicle.setSteeringValue(0, 1);
        break;

      case "b":
        vehicle.setBrake(0, 0);
        vehicle.setBrake(0, 1);
        vehicle.setBrake(0, 2);
        vehicle.setBrake(0, 3);
        break;
    }
  });
}

export class Car {
  moduleURL = "/models/truck.gltf";
  constructor() {
    const loader = new GLTFLoader();
    loader.load(this.moduleURL, function (gltf) {
      scene.add(gltf.scene);
    });
  }
}

export { createCar };
