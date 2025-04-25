import type { BuildMetadata } from "./types";
import { err, ok, type Result } from "neverthrow";

export const BUILD_CACHE_TARGET_FILE = "latest_build.json"

export class MetadataNotFoundError extends Error {
   message = `${BUILD_CACHE_TARGET_FILE} is missing correct metadata` 
};

export class BuildCache {
    static async pull(): Promise<Result<BuildMetadata, MetadataNotFoundError>> {
        const file = Bun.file(`./${BUILD_CACHE_TARGET_FILE}`);
        const contents = await file.json() as BuildMetadata;

        if (Object.keys(contents).length == 0) return err(new MetadataNotFoundError());

        if ((!contents["buildVersion"] || !contents["hash"])) {
            return err(new MetadataNotFoundError());
        };

        return ok(contents);
    }
}