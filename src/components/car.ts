import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { threeToCannon, ShapeType } from "three-to-cannon";

const wheelOptions = {
  radius: 0.8,
  directionLocal: new CANNON.Vec3(0, -1, 0),
  suspensionStiffness: 40,
  suspensionRestLength: 0.3,
  frictionSlip: 2,
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

export class Car {
  private scene: THREE.Scene;
  private world: CANNON.World;

  private moduleURL = "/models/truck.gltf";

  private model: THREE.Group;
  private carMesh: THREE.Mesh;
  private chassisMesh: THREE.Mesh;
  private wheelMeshes: THREE.Mesh[] = [];

  private physicsChassis: CANNON.Body;
  private physicsVehicle: CANNON.RaycastVehicle;
  private physicsWheels: CANNON.Body[] = [];

  constructor(scene: THREE.Scene, world: CANNON.World) {
    this.scene = scene;
    this.world = world;
    this.init();
  }

  async init() {
    await this.loadModel();
    this.setupPhysics();
    this.setupControls();
  }

  private async loadModel() {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(this.moduleURL);
    this.model = gltf.scene;

    this.scene.add(this.model);

    this.model.traverse((child) => {
      if (child.name.includes("wheel")) {
        this.wheelMeshes.push(child as THREE.Mesh);
      }
      if (child.name === "car") {
        this.carMesh = child as THREE.Mesh;
      }
      if (child.name === "chassis") {
        child.visible = false;
        this.chassisMesh = child as THREE.Mesh;
      }
    });

    if (!this.carMesh || this.wheelMeshes.length !== 4) {
      throw new Error("Model must contain one chassis and four wheels");
    }
  }

  private setupPhysics() {
    const result = threeToCannon(this.chassisMesh, { type: ShapeType.HULL });
    const chassisShape = result.shape;

    // Create chassis
    this.physicsChassis = new CANNON.Body({ mass: 1000 });
    this.physicsChassis.addShape(chassisShape);
    this.physicsVehicle = new CANNON.RaycastVehicle({
      chassisBody: this.physicsChassis,
    });
    this.physicsChassis.position.set(0, 4, 0);

    // Create wheels
    this.wheelMeshes.forEach((wheelMesh) => {
      const wheelBox = new THREE.Box3().setFromObject(wheelMesh);
      const wheelSize = new THREE.Vector3();
      wheelBox.getSize(wheelSize);

      wheelOptions.radius = wheelSize.y / 2;
      wheelOptions.chassisConnectionPointLocal.copy(
        wheelMesh.position as unknown as CANNON.Vec3,
      );
      this.physicsVehicle.addWheel(wheelOptions);
    });

    // Create wheels body for cannon es debug
    const wheelMaterial = new CANNON.Material("wheel");
    this.physicsVehicle.wheelInfos.forEach((wheel) => {
      const cylinderShape = new CANNON.Cylinder(
        wheel.radius,
        wheel.radius,
        wheel.radius,
        20,
      );
      const wheelBody = new CANNON.Body({
        mass: 0,
        material: wheelMaterial,
      });
      wheelBody.type = CANNON.Body.KINEMATIC;
      wheelBody.collisionFilterGroup = 0; // turn off collisions
      const quaternion = new CANNON.Quaternion().setFromEuler(
        -Math.PI / 2,
        0,
        0,
      );
      wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion);
      this.physicsWheels.push(wheelBody);
      this.world.addBody(wheelBody);
    });

    this.physicsVehicle.addToWorld(this.world);
  }

  update() {
    this.physicsVehicle.updateWheelTransform(0);
    this.physicsVehicle.updateWheelTransform(1);
    this.physicsVehicle.updateWheelTransform(2);
    this.physicsVehicle.updateWheelTransform(3);
    for (let i = 0; i < this.physicsVehicle.wheelInfos.length; i++) {
      const wheelInfo = this.physicsVehicle.wheelInfos[i];
      const transform = wheelInfo.worldTransform;
      const wheelMesh = this.wheelMeshes[i];
      wheelMesh.position.copy(transform.position as unknown as THREE.Vector3);
      wheelMesh.quaternion.copy(
        transform.quaternion as unknown as THREE.Quaternion,
      );

      this.physicsWheels[i].position.copy(transform.position);
      this.physicsWheels[i].quaternion.copy(transform.quaternion);
    }

    this.carMesh.position.copy(
      this.physicsChassis.position as unknown as THREE.Vector3,
    );
    this.carMesh.quaternion.copy(
      this.physicsChassis.quaternion as unknown as THREE.Quaternion,
    );
  }

  private setupControls() {
    document.addEventListener("keydown", (event) => {
      const maxSteerVal = 0.5;
      const maxForce = 1000;
      const brakeForce = 100000;

      switch (event.key) {
        case "w":
        case "ArrowUp":
          this.physicsVehicle.applyEngineForce(-maxForce, 0);
          this.physicsVehicle.applyEngineForce(-maxForce, 1);
          this.physicsVehicle.applyEngineForce(-maxForce, 2);
          this.physicsVehicle.applyEngineForce(-maxForce, 3);
          break;

        case "s":
        case "ArrowDown":
          this.physicsVehicle.applyEngineForce(maxForce, 0);
          this.physicsVehicle.applyEngineForce(maxForce, 1);
          this.physicsVehicle.applyEngineForce(maxForce, 2);
          this.physicsVehicle.applyEngineForce(maxForce, 3);
          break;

        case "a":
        case "ArrowLeft":
          this.physicsVehicle.setSteeringValue(maxSteerVal, 0);
          this.physicsVehicle.setSteeringValue(maxSteerVal, 2);
          break;

        case "d":
        case "ArrowRight":
          this.physicsVehicle.setSteeringValue(-maxSteerVal, 0);
          this.physicsVehicle.setSteeringValue(-maxSteerVal, 2);
          break;

        case "b":
          this.physicsVehicle.setBrake(brakeForce, 0);
          this.physicsVehicle.setBrake(brakeForce, 1);
          this.physicsVehicle.setBrake(brakeForce, 2);
          this.physicsVehicle.setBrake(brakeForce, 3);
          break;
      }
    });

    // Reset force on keyup
    document.addEventListener("keyup", (event) => {
      switch (event.key) {
        case "w":
        case "ArrowUp":
          this.physicsVehicle.applyEngineForce(0, 0);
          this.physicsVehicle.applyEngineForce(0, 1);
          this.physicsVehicle.applyEngineForce(0, 2);
          this.physicsVehicle.applyEngineForce(0, 3);
          break;

        case "s":
        case "ArrowDown":
          this.physicsVehicle.applyEngineForce(0, 0);
          this.physicsVehicle.applyEngineForce(0, 1);
          this.physicsVehicle.applyEngineForce(0, 2);
          this.physicsVehicle.applyEngineForce(0, 3);
          break;

        case "a":
        case "ArrowLeft":
          this.physicsVehicle.setSteeringValue(0, 0);
          this.physicsVehicle.setSteeringValue(0, 2);
          break;

        case "d":
        case "ArrowRight":
          this.physicsVehicle.setSteeringValue(0, 0);
          this.physicsVehicle.setSteeringValue(0, 2);
          break;

        case "b":
          this.physicsVehicle.setBrake(0, 0);
          this.physicsVehicle.setBrake(0, 1);
          this.physicsVehicle.setBrake(0, 2);
          this.physicsVehicle.setBrake(0, 3);
          break;
      }
    });
  }
}
