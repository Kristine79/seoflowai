import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfmake", "pdfkit", "@foliojs-fork/pdfkit"],
};

export default nextConfig;
