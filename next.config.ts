import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * next/image throws at RUNTIME for any host not listed here, which showed
     * up as the "flyer display error": uploads come back from whichever CDN
     * the backend is configured with (cloudinary today, cdn.viju.ng in the
     * handoff samples), and an unlisted host breaks the card.
     *
     * `**` accepts any https host. The images are public CDN assets, so this
     * is the pragmatic trade-off against the UI breaking whenever the backend
     * changes storage provider.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
