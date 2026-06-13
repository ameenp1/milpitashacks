/** @type {import('next').NextConfig} */
const nextConfig = {
  // DOCX templates + field maps are read from disk at runtime via fs.
  outputFileTracingIncludes: {
    "/api/**": ["./data/**/*"],
  },
};

export default nextConfig;
