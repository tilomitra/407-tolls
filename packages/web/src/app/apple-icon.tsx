import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        borderRadius: 36,
        backgroundColor: "#1e3a5f",
      }}
    >
      <span
        style={{
          fontSize: 80,
          fontWeight: 700,
          color: "#ffffff",
          fontFamily: "system-ui",
        }}
      >
        407
      </span>
    </div>,
    size,
  );
}
