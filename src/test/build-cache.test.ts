import { expect, test } from "bun:test";
import type { BuildMetadata } from "../util/types";
import { BUILD_CACHE_TARGET_FILE, BuildCache, MetadataNotFoundError } from "../util/build-cache";

test("Correct latest build cache parsing", async () => {
    const sampleConfig: BuildMetadata = {
        buildVersion: 1,
        hash: "hello world"
    }

    Bun.file(BUILD_CACHE_TARGET_FILE).write(JSON.stringify(sampleConfig));
    expect(await BuildCache.pull()).toEqual(sampleConfig);

    const sampleConfig1 = {
        hello: "world"
    };

    Bun.file(BUILD_CACHE_TARGET_FILE).write(JSON.stringify(sampleConfig1));
    expect(await BuildCache.pull()).toEqual(new MetadataNotFoundError());

    Bun.file(BUILD_CACHE_TARGET_FILE).write(JSON.stringify({}));
    expect(await BuildCache.pull()).toEqual(new MetadataNotFoundError());
})