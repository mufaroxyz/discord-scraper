import os from "os";
import PQueue from "p-queue";
import { BuildCache } from "../util/build-cache";
import { assert } from "console";
import { ok, type Result } from "neverthrow";

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

    private async processBuild(buildId: string): Promise<Result<string, Error>> {
        console.log(`[BuildQueue::processBuild] Processing build: ${buildId}`);
        await Bun.sleep(3000);
        return ok(buildId);
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
            this.queue.add(() => this.processBuild(buildId));
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