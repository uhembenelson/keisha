import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Keisha ‘WriteNow’ Allen — Author",
    short_name: "WriteNow",
    description:
      "Miami-based contemporary fiction author, singer, and speaker. Read Worth the Weight and The Love Enthusiast.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff3df",
    theme_color: "#861738",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
