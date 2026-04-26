import { createServerFn } from "@tanstack/react-start";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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
    const url = process.env.SUPABASE_URL!;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY!;

    // Use the caller's JWT — RLS will gate access
    const supabase = createClient<Database>(url, anon, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [{ data: project, error: pErr }, { data: milestones }, { data: photos }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", data.projectId).maybeSingle(),
      supabase
        .from("milestones")
        .select("*")
        .eq("project_id", data.projectId)
        .order("sort_order"),
      supabase
        .from("progress_updates")
        .select("*")
        .eq("project_id", data.projectId)
        .order("taken_at", { ascending: false })
        .limit(6),
    ]);

    if (pErr || !project) throw new Error(pErr?.message ?? "Project not accessible");

    const pdf = await PDFDocument.create();
    const display = await pdf.embedFont(StandardFonts.HelveticaBold);
    const body = await pdf.embedFont(StandardFonts.Helvetica);

    let page = pdf.addPage([595, 842]); // A4 portrait
    const { width, height } = page.getSize();
    let y = height - 50;

    // Brand bar
    page.drawRectangle({ x: 0, y: height - 6, width, height: 6, color: GOLD });

    // Header — brand
    page.drawText("SingleStop", { x: 50, y, size: 20, font: display, color: NAVY });
    page.drawText("Building Solutions", { x: 50, y: y - 14, size: 8, font: body, color: GOLD });
    page.drawText(new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }), {
      x: width - 180,
      y,
      size: 9,
      font: body,
      color: MUTED,
    });
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

    // Project header
    y -= 30;
    page.drawText(project.code ?? "", { x: 50, y, size: 8, font: body, color: GOLD });
    y -= 18;
    page.drawText(project.name ?? "", { x: 50, y, size: 22, font: display, color: NAVY });
    if (project.client_display_name) {
      y -= 16;
      page.drawText(`Client: ${project.client_display_name}`, { x: 50, y, size: 10, font: body, color: MUTED });
    }
    if (project.address) {
      y -= 14;
      page.drawText(project.address, { x: 50, y, size: 9, font: body, color: MUTED });
    }

    // Progress block
    y -= 30;
    page.drawText("PROGRESS", { x: 50, y, size: 8, font: display, color: GOLD });
    y -= 18;
    const pct = project.progress_percent ?? 0;
    page.drawRectangle({ x: 50, y: y - 4, width: width - 100, height: 8, color: rgb(0.92, 0.94, 0.97) });
    page.drawRectangle({ x: 50, y: y - 4, width: ((width - 100) * pct) / 100, height: 8, color: NAVY });
    page.drawText(`${pct}% complete`, { x: 50, y: y - 22, size: 10, font: body, color: INK });
    page.drawText(`Status: ${(project.status ?? "").replace("_", " ")}`, {
      x: 200,
      y: y - 22,
      size: 10,
      font: body,
      color: INK,
    });
    if (project.expected_handover_date) {
      page.drawText(`Expected handover: ${new Date(project.expected_handover_date).toLocaleDateString()}`, {
        x: width - 230,
        y: y - 22,
        size: 10,
        font: body,
        color: INK,
      });
    }

    // Milestones
    y -= 50;
    page.drawText("MILESTONES", { x: 50, y, size: 8, font: display, color: GOLD });
    y -= 18;
    for (const m of (milestones ?? []).slice(0, 12)) {
      if (y < 120) {
        page = pdf.addPage([595, 842]);
        y = height - 60;
      }
      const dot = m.status === "completed" ? GOLD : MUTED;
      page.drawCircle({ x: 56, y: y + 4, size: 3, color: dot });
      page.drawText(m.title, { x: 70, y, size: 11, font: display, color: NAVY });
      const meta: string[] = [];
      if (m.target_date) meta.push(`Target: ${new Date(m.target_date).toLocaleDateString()}`);
      if (m.completed_at) meta.push(`Completed: ${new Date(m.completed_at).toLocaleDateString()}`);
      meta.push(m.status.replace("_", " "));
      page.drawText(meta.join("  ·  "), { x: 70, y: y - 12, size: 8, font: body, color: MUTED });
      y -= 30;
    }

    // Recent photos (download bytes for embedding)
    if ((photos ?? []).length > 0) {
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
      for (const ph of photos ?? []) {
        if (!ph.photo_url) continue;
        try {
          const res = await fetch(ph.photo_url);
          if (!res.ok) continue;
          const buf = new Uint8Array(await res.arrayBuffer());
          const isPng = ph.photo_url.toLowerCase().includes(".png");
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
          // skip image on error
        }
      }
      if (col !== 0) y -= tileH + 30;
    }

    // Footer
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
