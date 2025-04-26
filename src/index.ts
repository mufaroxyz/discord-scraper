import { BuildQueue } from "./workers/build-queue";

const buildQueue = new BuildQueue();

buildQueue.start();