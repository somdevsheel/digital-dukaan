const fs = require("fs");
const path = require("path");

// app.config.json is git-ignored (it may carry a real Google Maps key); app.config.example.json
// is the checked-in fallback so `expo start` works out of the box in a fresh clone, mirroring
// the .env.example -> .env pattern the Next.js/Nest apps use elsewhere in this monorepo.
function loadOverrides() {
  const localPath = path.join(__dirname, "app.config.json");
  const examplePath = path.join(__dirname, "app.config.example.json");
  const source = fs.existsSync(localPath) ? localPath : examplePath;
  return JSON.parse(fs.readFileSync(source, "utf-8")).expo;
}

/** @type {import('@expo/config-types').ExpoConfig} */
module.exports = ({ config }) => {
  const overrides = loadOverrides();
  return {
    ...config,
    ...overrides,
    ios: { ...config.ios, ...overrides.ios, bundleIdentifier: "com.arutech.marketplace.delivery" },
    android: { ...config.android, ...overrides.android, package: "com.arutech.marketplace.delivery" },
    extra: { ...config.extra, ...overrides.extra },
  };
};
