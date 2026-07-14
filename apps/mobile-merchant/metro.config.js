const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// pnpm workspace: @platform/* packages are symlinked into node_modules from packages/*, so
// Metro needs to watch the monorepo root (not just this app) to see them, plus fall back to
// the workspace root's node_modules for hoisted deps — the standard Expo+pnpm-monorepo shape.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules"), path.resolve(workspaceRoot, "node_modules")];
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
