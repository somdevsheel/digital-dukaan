const fs = require("fs");
const path = require("path");

// app.config.json is git-ignored (local overrides); app.config.example.json is the checked-in
// fallback so `expo start` works out of the box in a fresh clone — same pattern as
// mobile-customer's app.config.js, mirroring the .env.example -> .env convention elsewhere.
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
    ios: { ...config.ios, ...overrides.ios, bundleIdentifier: "com.arutech.marketplace.merchant" },
    android: { ...config.android, ...overrides.android, package: "com.arutech.marketplace.merchant" },
    extra: { ...config.extra, ...overrides.extra },
  };
};
