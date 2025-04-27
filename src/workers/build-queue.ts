import os from "os";
import PQueue from "p-queue";
import { BuildCache } from "../util/build-cache";
import { assert } from "console";
import { ok, err, type Result } from "neverthrow";
import type { BuildMetadata } from "../util/types";
import { BuildScraper } from "../util/build-scraper";

const MAX_CONCURRENCY = Math.max(1, Math.floor(os.cpus().length / 2) || 1);
const DISCORD_POLLING_RATE = 5 * 60 * 1000; // 5 minutes

export class BuildQueue {
    public queuedBuilds: string[] = [];
    public queue = new PQueue({ concurrency: MAX_CONCURRENCY });
    public activeBuildIds = new Set<string>();
    
    constructor() { }

    public start() {
        this.setupQueueListeners();
        this.initializePolling();
    }    
    
    private async processBuild(buildMetadata: BuildMetadata): Promise<Result<string, Error>> {
        console.log(`[BuildQueue::processBuild] Processing build: ${buildMetadata.hash}`);
        
        try {
            const scraper = new BuildScraper();
            
            await scraper.freeDataSpace();
            
            await scraper.startScraping(buildMetadata);
            
            await BuildCache.push({
                buildVersion: buildMetadata.hash,
                hash: buildMetadata.hash
            });
            
            return ok(buildMetadata.hash);
        } catch (error) {
            console.error(`[BuildQueue::processBuild] Error processing build: ${error}`);
            return err(error as Error);
        }
    }

    private async setupQueueListeners() {
        this.queue.on("active", () => {
            console.log(`[BuildQueue::setupQueueListeners] Queue running`);
        });

        this.queue.on("idle", () => {
            console.log(`[BuildQueue::setupQueueListeners] Queue went idle`);
        });

        this.queue.on("next", () => {
            console.log(`[BuildQueue::setupQueueListeners] Ready for next build`);
        });

        this.queue.on("completed", (result: Result<string, Error>) => {
            if (result.isErr()) {
                console.error(`[BuildQueue::setupQueueListeners] Scraping build failed: ${result.error}`);
                return;
            }

            const buildId = result.value;
            this.activeBuildIds.delete(buildId);
            console.log(`[BuildQueue::setupQueueListeners] Build with ID ${buildId} completed`);
        });
    }   

    private async checkForNewDiscordBuilds() {
        const cachedBuild = await BuildCache.pull();
        if (cachedBuild.isErr()) {
            console.error("Failed to pull build cache:", cachedBuild.error);
            return;
        }

        const cachedBuildData = cachedBuild.value;

        const latestBuild = await fetch("https://canary.discord.com/app");

        if (!latestBuild.ok) {
            console.error("Failed to fetch latest build:", latestBuild.statusText);
            return;
        }

        const buildId = latestBuild.headers.get("X-Build-Id");
        if (!buildId) {
            console.error("Failed to get build ID from headers");
            return;
        }
        
        console.log(`[BuildQueue::checkForNewDiscordBuilds] Cached Build: ${cachedBuildData.buildVersion || "000000"} (${cachedBuildData.hash || "NONE"}); Latest Build: ${buildId}`);
        
        if (this.activeBuildIds.has(buildId)) {
            console.log(`[BuildQueue::checkForNewDiscordBuilds] Build ${buildId} is already being processed`);
            return;
        }

        if (cachedBuildData.buildVersion !== buildId) {
            console.log(`[BuildQueue::checkForNewDiscordBuilds] New build detected: ${buildId}`);
            this.activeBuildIds.add(buildId);
            this.queue.add(async () => this.processBuild({ hash: buildId, html: await latestBuild.text() }));
        } else {
            console.log(`[BuildQueue::checkForNewDiscordBuilds] No new build detected`);
        }
    }


    private async initializePolling() {
        this.checkForNewDiscordBuilds();
        
        setInterval(() => {
            this.checkForNewDiscordBuilds();
        }, DISCORD_POLLING_RATE);
    }
}