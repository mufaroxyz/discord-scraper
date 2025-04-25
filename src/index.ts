import { BuildCache } from "./util/build-cache";

const cache = await BuildCache.pull();
console.log(cache);