/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@platform/ui", "@platform/api-client", "@platform/validation-schemas", "@platform/domain-types"],
  async rewrites() {
    const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:4000";
    return [{ source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*` }];
  },
};

module.exports = nextConfig;
