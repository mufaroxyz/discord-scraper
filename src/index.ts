import { GitUtil } from "./util/git";
import { BuildQueue } from "./workers/build-queue";

await GitUtil.setCredentials();

const buildQueue = new BuildQueue();
buildQueue.start();