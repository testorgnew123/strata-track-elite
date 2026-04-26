import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import {
  Building2,
  Home,
  Hammer,
  Compass,
  PaintBucket,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — SingleStop Building Solutions" },
      {
        name: "description",
        content:
          "End-to-end construction services: design, structural, interiors, renovation, and project management — all tracked through your private client portal.",
      },
      { property: "og:title", content: "SingleStop Services" },
      {
        property: "og:description",
        content:
          "Premium construction services with full transparency through a dedicated client portal.",
      },
    ],
  }),
  component: ServicesPage,
});

const SERVICES = [
  {
    icon: Compass,
    title: "Architectural Design",
    body:
      "Concept to detailed working drawings, structural design, and 3D walkthroughs. Approval-ready submissions for local authorities.",
  },
  {
    icon: Building2,
    title: "Structural Construction",
    body:
      "RCC framed structures, foundation engineering, masonry, and waterproofing. Site-supervised by named engineers.",
  },
  {
    icon: Home,
    title: "Premium Villas",
    body:
      "Bespoke residential villas with curated finishes, branded fittings, and architect-coordinated execution.",
  },
  {
    icon: Hammer,
    title: "Renovation & Extension",
    body:
      "Structural strengthening, layout reworks, and seamless extensions to existing homes — minimal disruption, maximum care.",
  },
  {
    icon: PaintBucket,
    title: "Turnkey Interiors",
    body:
      "Furniture, fixtures, lighting, and styling delivered to a single coordinated handover. Move in with the keys, not a checklist.",
  },
  {
    icon: Wrench,
    title: "Project Management",
    body:
      "We act as your owner's representative — coordinating consultants, contractors, and approvals on your behalf.",
  },
] as const;

function ServicesPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            What We Do
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-light leading-[1.05] text-navy-deep text-balance md:text-7xl">
            Construction services, delivered transparently.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Whether you're building a villa from scratch or renovating an existing
            home, every service comes with the same promise: real-time progress
            visibility through your dedicated portal.
          </p>
          <div className="mt-6 gold-divider w-24" />
        </div>
      </section>

      <section className="bg-secondary py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="group rounded-2xl border border-border bg-card p-8 shadow-soft hover-lift"
                >
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy-deep text-gold transition-transform group-hover:scale-110">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-display text-2xl text-navy-deep">{s.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
