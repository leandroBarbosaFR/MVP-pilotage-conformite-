import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const shield =
  "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 256 256'>" +
  "<path d='M128 44 L208 80 V132 C208 168 172 196 128 212 C84 196 48 168 48 132 V80 Z' fill='#FF4103'/>" +
  "<path d='M98 130 L120 152 L162 102' fill='none' stroke='#FFFFFF' stroke-width='18' stroke-linecap='round' stroke-linejoin='round'/>" +
  "</svg>";

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
          background: "#001621",
          borderRadius: 40,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width="120" height="120" src={`data:image/svg+xml;utf8,${encodeURIComponent(shield)}`} alt="" />
      </div>
    ),
    size
  );
}
