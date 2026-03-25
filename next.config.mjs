/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    PLAYGROUND_PUBLIC_PROTOCOL_API_BASE: process.env.PLAYGROUND_PUBLIC_PROTOCOL_API_BASE,
  },
};

export default nextConfig;
