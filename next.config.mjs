/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverComponentsExternalPackages: ['exceljs', 'jspdf', 'jspdf-autotable'] },
};
export default nextConfig;
