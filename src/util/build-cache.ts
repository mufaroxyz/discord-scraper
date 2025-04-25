import type { BuildMetadata } from "./types";

export const BUILD_CACHE_TARGET_FILE = "latest_build.json"

export class MetadataNotFoundError extends Error {
   message = `${BUILD_CACHE_TARGET_FILE} is missing correct metadata` 
};

export class BuildCache {
    static async pull(): Promise<BuildMetadata | MetadataNotFoundError> {
        const file = Bun.file(`./${BUILD_CACHE_TARGET_FILE}`);
        const contents = await file.json() as BuildMetadata;

        if (Object.keys(contents).length == 0) return new MetadataNotFoundError();

        if ((!contents["buildVersion"] || !contents["hash"])) {
            return new MetadataNotFoundError();
        };

        return contents;
    }
}