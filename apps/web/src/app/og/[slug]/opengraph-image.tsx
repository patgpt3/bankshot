import { ImageResponse } from "next/og";
import prisma from "@/lib/prisma";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const project = await prisma.project.findUnique({ where: { slug: params.slug }, include: { images: { orderBy: { position: "asc" } } } });
  const title = project?.title ?? "Bankshot";
  const subtitle = project?.subtitle ?? "Preorder";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: "#0b1020", color: "#fff", padding: 48 }}>
        <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: -1 }}>{title}</div>
        <div style={{ fontSize: 28, opacity: 0.85, marginTop: 8 }}>{subtitle}</div>
        <div style={{ position: "absolute", bottom: 32, right: 48, fontSize: 22, opacity: 0.7 }}>bankshot</div>
      </div>
    ),
    { ...size }
  );
}
