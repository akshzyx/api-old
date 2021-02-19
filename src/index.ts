import "reflect-metadata";

import * as dotenv from "dotenv";
dotenv.config();

import database from "./core/Database";
import router from "./core/Router";
const bootstrap = async (): Promise<void> => {
  await database();
  await router();
};

bootstrap();
