import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LIVYUE — Live Yourself Everyday",
    short_name: "LIVYUE",
    description:
      "LIVYUE — Live Yourself Everyday. A simple space to set intentions, reflect on your days, and understand the patterns that shape how you live.",
    start_url: "/today",
    display: "standalone",
    background_color: "#FBF8F3",
    theme_color: "#181512",
    icons: [
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
