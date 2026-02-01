/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['fs', 'path', 'os'],
};

export default nextConfig;
