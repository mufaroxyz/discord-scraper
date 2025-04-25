import { expect, test } from "bun:test";
import type { BuildMetadata } from "../util/types";
import { BUILD_CACHE_TARGET_FILE, BuildCache, MetadataNotFoundError } from "../util/build-cache";
import { ok, err } from "neverthrow";

test("BuildCache.pull should return Ok when correct data is provided", async () => {
    const sampleConfig: BuildMetadata = {
        buildVersion: 1,
        hash: "hello world"
    }

    Bun.file(BUILD_CACHE_TARGET_FILE).write(JSON.stringify(sampleConfig));
    const result = await BuildCache.pull();
    expect(result).toEqual(ok(sampleConfig));
})

test("BuildCache.pull should return Err when incorrect data is provided", async () => {
    const sampleConfig1 = {
        hello: "world"
    };

    Bun.file(BUILD_CACHE_TARGET_FILE).write(JSON.stringify(sampleConfig1));
    const result = await BuildCache.pull();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
        expect(result.error).toBeInstanceOf(MetadataNotFoundError);
    }

    const sampleConfig2 = {};

    Bun.file(BUILD_CACHE_TARGET_FILE).write(JSON.stringify(sampleConfig2));
    const result2 = await BuildCache.pull();
    expect(result2.isErr()).toBe(true);
    if (result2.isErr()) {
        expect(result2.error).toBeInstanceOf(MetadataNotFoundError);
    }
})
