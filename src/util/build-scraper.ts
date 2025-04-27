import { GitUtil } from "./git";
import type { BuildMetadata } from "./types";
import { rename } from "node:fs/promises";

export class BuildScraper {
    public async startScraping(metadata: BuildMetadata): Promise<void> {
        await GitUtil.validateGitRepo();
        
        console.log(metadata.html);
    }

    public async freeDataSpace(): Promise<void> {
        const buildDir = Bun.file('./localbuild/chunks');
        if (await buildDir.exists()) {
            await rename("./localbuild/chunks", "./localbuild/chunks_old");
            console.log(`[BuildScraper::freeDataSpace] Renamed chunks directory to chunks_old`);
        }
    }
};