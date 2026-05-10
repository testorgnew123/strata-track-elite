import { createServerFn } from "@tanstack/react-start";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { milestones, progressUpdates, projects } from "@/db/schema";
import { verifyAccessToken } from "@/server/auth/jwt";
import { assertProjectMember } from "@/server/authz";
import { getBlobBytes } from "@/server/storage";

const NAVY = rgb(0.043, 0.106, 0.2);
const GOLD = rgb(0.788, 0.663, 0.38);
const INK = rgb(0.043, 0.106, 0.2);
const MUTED = rgb(0.45, 0.47, 0.51);

export const generateProjectReport = createServerFn({ method: "POST" })
  .inputValidator((d: { projectId: string; accessToken: string }) => {
    if (!d?.projectId || !d?.accessToken) throw new Error("projectId and accessToken required");
    return d;
  })
  .handler(async ({ data }) => {
    const claims = await verifyAccessToken(data.accessToken);
    await assertProjectMember(claims.sub, data.projectId);

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, data.projectId))
      .limit(1);
    if (!project) throw new Error("Project not accessible");

    const ms = await db
      .select()
      .from(milestones)
      .where(eq(milestones.projectId, data.projectId))
      .orderBy(asc(milestones.sortOrder));
    const photos = await db
      .select()
      .from(progressUpdates)
      .where(eq(progressUpdates.projectId, data.projectId))
      .orderBy(desc(progressUpdates.takenAt))
      .limit(6);

    const pdf = await PDFDocument.create();
    const display = await pdf.embedFont(StandardFonts.HelveticaBold);
    const body = await pdf.embedFont(StandardFonts.Helvetica);

    let page = pdf.addPage([595, 842]);
    const { width, height } = page.getSize();
    let y = height - 50;

    page.drawRectangle({ x: 0, y: height - 6, width, height: 6, color: GOLD });
    page.drawText("SingleStop", { x: 50, y, size: 20, font: display, color: NAVY });
    page.drawText("Building Solutions", { x: 50, y: y - 14, size: 8, font: body, color: GOLD });
    page.drawText(
      new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }),
      { x: width - 180, y, size: 9, font: body, color: MUTED },
    );
    page.drawText("PROJECT PROGRESS REPORT", {
      x: width - 180,
      y: y - 14,
      size: 8,
      font: display,
      color: NAVY,
    });

    y -= 50;
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 0.5,
      color: GOLD,
    });

    y -= 30;
    page.drawText(project.code ?? "", { x: 50, y, size: 8, font: body, color: GOLD });
    y -= 18;
    page.drawText(project.name ?? "", { x: 50, y, size: 22, font: display, color: NAVY });
    if (project.clientDisplayName) {
      y -= 16;
      page.drawText(`Client: ${project.clientDisplayName}`, {
        x: 50,
        y,
        size: 10,
        font: body,
        color: MUTED,
      });
    }
    if (project.address) {
      y -= 14;
      page.drawText(project.address, { x: 50, y, size: 9, font: body, color: MUTED });
    }

    y -= 30;
    page.drawText("PROGRESS", { x: 50, y, size: 8, font: display, color: GOLD });
    y -= 18;
    const pct = project.progressPercent ?? 0;
    page.drawRectangle({
      x: 50,
      y: y - 4,
      width: width - 100,
      height: 8,
      color: rgb(0.92, 0.94, 0.97),
    });
    page.drawRectangle({
      x: 50,
      y: y - 4,
      width: ((width - 100) * pct) / 100,
      height: 8,
      color: NAVY,
    });
    page.drawText(`${pct}% complete`, { x: 50, y: y - 22, size: 10, font: body, color: INK });
    page.drawText(`Status: ${(project.status ?? "").replace("_", " ")}`, {
      x: 200,
      y: y - 22,
      size: 10,
      font: body,
      color: INK,
    });
    if (project.expectedHandoverDate) {
      page.drawText(
        `Expected handover: ${new Date(project.expectedHandoverDate).toLocaleDateString()}`,
        { x: width - 230, y: y - 22, size: 10, font: body, color: INK },
      );
    }

    y -= 50;
    page.drawText("MILESTONES", { x: 50, y, size: 8, font: display, color: GOLD });
    y -= 18;
    for (const m of ms.slice(0, 12)) {
      if (y < 120) {
        page = pdf.addPage([595, 842]);
        y = height - 60;
      }
      const dot = m.status === "completed" ? GOLD : MUTED;
      page.drawCircle({ x: 56, y: y + 4, size: 3, color: dot });
      page.drawText(m.title, { x: 70, y, size: 11, font: display, color: NAVY });
      const meta: string[] = [];
      if (m.targetDate) meta.push(`Target: ${new Date(m.targetDate).toLocaleDateString()}`);
      if (m.completedAt) meta.push(`Completed: ${new Date(m.completedAt).toLocaleDateString()}`);
      meta.push(m.status.replace("_", " "));
      page.drawText(meta.join("  ·  "), { x: 70, y: y - 12, size: 8, font: body, color: MUTED });
      y -= 30;
    }

    if (photos.length > 0) {
      if (y < 280) {
        page = pdf.addPage([595, 842]);
        y = height - 60;
      }
      y -= 10;
      page.drawText("RECENT PROGRESS", { x: 50, y, size: 8, font: display, color: GOLD });
      y -= 14;

      const cols = 2;
      const tileW = (width - 100 - 10) / cols;
      const tileH = 110;
      let col = 0;
      for (const ph of photos) {
        if (!ph.photoKey && !ph.photoUrl) continue;
        try {
          let buf: Uint8Array | null = null;
          if (ph.photoKey) {
            const ab = await getBlobBytes("photos", ph.photoKey);
            if (ab) buf = new Uint8Array(ab);
          }
          if (!buf && ph.photoUrl && /^https?:\/\//.test(ph.photoUrl)) {
            const res = await fetch(ph.photoUrl);
            if (!res.ok) continue;
            buf = new Uint8Array(await res.arrayBuffer());
          }
          if (!buf) continue;
          const isPng = (ph.photoKey ?? ph.photoUrl ?? "").toLowerCase().includes(".png");
          const img = isPng ? await pdf.embedPng(buf) : await pdf.embedJpg(buf);
          const x = 50 + col * (tileW + 10);
          if (col === 0 && y < tileH + 60) {
            page = pdf.addPage([595, 842]);
            y = height - 60;
          }
          page.drawImage(img, { x, y: y - tileH, width: tileW, height: tileH });
          if (ph.caption) {
            page.drawText(ph.caption.slice(0, 80), {
              x,
              y: y - tileH - 12,
              size: 8,
              font: body,
              color: MUTED,
            });
          }
          col = (col + 1) % cols;
          if (col === 0) y -= tileH + 30;
        } catch {
          // skip
        }
      }
      if (col !== 0) y -= tileH + 30;
    }

    const pages = pdf.getPages();
    pages.forEach((p, i) => {
      p.drawText(`SingleStop · Confidential · Page ${i + 1} of ${pages.length}`, {
        x: 50,
        y: 24,
        size: 8,
        font: body,
        color: MUTED,
      });
      p.drawText(`Generated ${new Date().toLocaleString()}`, {
        x: width - 180,
        y: 24,
        size: 8,
        font: body,
        color: MUTED,
      });
    });

    const bytes = await pdf.save();
    return {
      filename: `${project.code ?? "project"}-report-${Date.now()}.pdf`,
      base64: btoa(String.fromCharCode(...bytes)),
    };
  });
