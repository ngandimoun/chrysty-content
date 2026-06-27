import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const CORAL = "#FF6F61";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: CORAL,
          borderRadius: 36,
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 112,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1,
          }}
        >
          C
        </span>
      </div>
    ),
    { ...size },
  );
}
