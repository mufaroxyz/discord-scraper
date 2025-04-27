import { mkdir } from "node:fs/promises"

export class GitUtil {

    static async setCredentials(): Promise<void> {
        await  Bun.$`git config --global user.name "${process.env.GH_USER}"`;
        await Bun.$`git config --global user.email "${process.env.GH_EMAIL}"`;
    }

    static async validateGitRepo(): Promise<void> {
        const localBuild = Bun.file("./localbuild/");
        if (!(await localBuild.exists())) {
            await mkdir("./localbuild");
        }

        const gitDir = Bun.file("./localbuild/.git");
        if (!(await gitDir.exists())) {
            Bun.$`git clone https://${process.env.GH_USER}:${process.env.GH_TOKEN}@github.com/${process.env.GH_USER}/${process.env.GH_BUILD_REPO} ./localbuild --depth 2`;
        } else {
            await Bun.$`git stash`;
            Bun.$`git -C ./localbuild pull origin main`;
        }
    }
}