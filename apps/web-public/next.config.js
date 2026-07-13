/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@platform/ui", "@platform/api-client", "@platform/domain-types"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }, { protocol: "http", hostname: "**" }],
  },
};

module.exports = nextConfig;
