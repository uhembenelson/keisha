import { ImageResponse } from "next/og";

export const alt = "Keisha ‘WriteNow’ Allen — Author & Creative Entrepreneur";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#2b1b1f",
          padding: "72px",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "76px",
              height: "76px",
              borderRadius: "16px",
              background: "#861738",
              color: "#d8b25a",
              fontSize: "48px",
              fontWeight: 700,
            }}
          >
            K
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "26px",
              letterSpacing: "6px",
              textTransform: "uppercase",
              color: "#d8b25a",
            }}
          >
            WriteNow
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "78px",
              lineHeight: 1.05,
              color: "#fff3df",
              letterSpacing: "-1px",
            }}
          >
            Keisha Allen
          </div>
          <div style={{ display: "flex", fontSize: "34px", color: "#fff3df", opacity: 0.75 }}>
            Author &amp; Creative Entrepreneur
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", fontSize: "28px", color: "#fff3df", opacity: 0.9 }}>
          <div
            style={{
              display: "flex",
              border: "2px solid #d8b25a",
              borderRadius: "999px",
              padding: "12px 28px",
            }}
          >
            Worth the Weight
          </div>
          <div
            style={{
              display: "flex",
              border: "2px solid #d8b25a",
              borderRadius: "999px",
              padding: "12px 28px",
            }}
          >
            The Love Enthusiast
          </div>
        </div>
      </div>
    ),
    size,
  );
}
