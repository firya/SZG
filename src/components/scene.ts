import * as THREE from "three";
import * as CANNON from "cannon-es";
import { Car } from "./car";
import { Terrain } from "@/components/terrain.ts";
import CannonDebugger from "cannon-es-debugger";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as dat from "dat.gui";

const defaultCameraOffset = new THREE.Vector3(10, 10, 10);

export class SceneManager {
  public debug: boolean;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world: CANNON.World;
  private car: Car;
  private terrain: Terrain;
  private lastCallTime: number;
  private light: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private controls: any; // TODO
  private cannonDebugger: any; // TODO
  private GUI: dat.GUI;
  private settings = {
    wireframe: false,
  };

  constructor(debug = false) {
    this.debug = debug;

    this.createScene();
    this.createWorld();
    this.createLight();
    this.createCamera();
    this.createSkyBox();

    if (this.debug) {
      this.createDebugger();
    }

    this.init();
  }

  async init() {
    this.car = new Car(this.scene, this.world);
    this.terrain = new Terrain(this.scene, this.world);

    // TODO
    const wheel_ground = new CANNON.ContactMaterial(
      this.car.wheelMaterial,
      this.terrain.groundMaterial,
      {
        friction: 1,
        restitution: 0,
        contactEquationStiffness: 1,
      },
    );
    this.world.addContactMaterial(wheel_ground);

    if (this.debug) this.initGUI();

    this.animate();
  }

  private initGUI() {
    this.GUI = new dat.GUI();

    this.GUI.add({ click: () => this.car.reset() }, "click").name("Reset Car");
    const renderFolder = this.GUI.addFolder("Rendering");
    // TODO: Hide cannon wireframe when disabled
    renderFolder
      .add(this.settings, "wireframe")
      .name("Cannon Debugger")
      .onChange((value) => {
        if (value) {
          this.createDebugger();
        } else {
          this.cannonDebugger = null;
        }
      });
  }

  private createDebugger() {
    this.cannonDebugger = CannonDebugger(this.scene, this.world, {});
  }

  private createScene() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    document.body.appendChild(this.renderer.domElement);
  }

  private createWorld() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
  }

  private createLight() {
    this.light = new THREE.DirectionalLight(0xffffff, 2);
    this.light.position.set(50, 100, 50);
    this.light.castShadow = true;
    this.light.shadow.mapSize.width = 2048;
    this.light.shadow.mapSize.height = 2048;
    this.scene.add(this.light);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);
  }

  private createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    // Add orbital controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 20;
    this.controls.screenSpacePanning = false;
    this.controls.maxPolarAngle = Math.PI / 2;

    // Set up isometric view
    this.camera.position.copy(defaultCameraOffset);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  private createSkyBox() {
    const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
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
    this.scene.add(skybox);
  }

  private animate() {
    requestAnimationFrame(() => this.animate());

    const time = performance.now() / 1000;
    if (!this.lastCallTime) {
      this.world.step(1 / 60);
    } else {
      const dt = time - this.lastCallTime;
      this.world.step(1 / 60, dt);
    }
    this.lastCallTime = time;

    if (this.car.initialized) {
      this.car.update();

      this.controls.target.copy(this.car.position);

      this.camera.position.copy(
        new THREE.Vector3(
          this.car.position.x + defaultCameraOffset.x,
          this.car.position.y + defaultCameraOffset.y,
          this.car.position.z + defaultCameraOffset.z,
        ),
      );
    }
    this.controls.update();

    if (this.debug) {
      this.cannonDebugger?.update();
    }

    this.renderer.render(this.scene, this.camera);
  }
}
