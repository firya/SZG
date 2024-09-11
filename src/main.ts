import { createScene } from "@/components/scene";
import { createSkyBox } from "@/components/skybox";
import { createLight } from "@/components/light";
import { createTerrain } from "@/components/terrain";
import { Car, createCar } from "@/components/car";

createScene();
createSkyBox();
createLight();
createTerrain();
createCar();

const car = new Car();
