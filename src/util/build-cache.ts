import type { BuildCacheMetadata } from "./types";
import { err, ok, type Result } from "neverthrow";

export const BUILD_CACHE_TARGET_FILE = "latest_build.json"

export class MetadataNotFoundError extends Error {
   message = `${BUILD_CACHE_TARGET_FILE} is missing correct metadata` 
};

const EMPTY_CACHE = {
    buildVersion: "",
    hash: ""
}

export class BuildCache {    
    static async pull(): Promise<Result<BuildCacheMetadata, MetadataNotFoundError>> {
        if (!(await Bun.file(BUILD_CACHE_TARGET_FILE).exists())) {
            Bun.file(BUILD_CACHE_TARGET_FILE).write(JSON.stringify(EMPTY_CACHE));
            return ok(EMPTY_CACHE);
        }

        const file = Bun.file(`./${BUILD_CACHE_TARGET_FILE}`);
        const contents = await file.json() as BuildCacheMetadata;

        if (!contents["buildVersion"] || !contents["hash"] || Object.keys(contents).length == 0) {
            Bun.file(BUILD_CACHE_TARGET_FILE).write(JSON.stringify(EMPTY_CACHE));
            return ok(EMPTY_CACHE);
        };

        return ok(contents);
    }

    static async push(metadata: BuildCacheMetadata): Promise<Result<BuildCacheMetadata, Error>> {
        try {
            await Bun.write(BUILD_CACHE_TARGET_FILE, JSON.stringify(metadata, null, 2));
            console.log(`[BuildCache::push] Updated build cache with version ${metadata.buildVersion}`);
            return ok(metadata);
        } catch (error) {
            console.error(`[BuildCache::push] Failed to update build cache: ${error}`);
            return err(error as Error);
        }
    }
}