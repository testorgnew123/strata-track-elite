import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — SingleStop Building Solutions" },
      {
        name: "description",
        content:
          "A selection of completed and ongoing residential projects by SingleStop Building Solutions.",
      },
      { property: "og:title", content: "SingleStop Projects" },
      { property: "og:image", content: gallery2 },
    ],
  }),
  component: ProjectsPage,
});

const PROJECTS = [
  {
    img: gallery2,
    name: "Skyline Residence",
    location: "Bengaluru",
    year: "2024",
    status: "Completed",
    description:
      "A 6,200 sq ft contemporary villa with a double-height living volume, infinity edge pool, and curated Italian stonework.",
  },
  {
    img: gallery1,
    name: "Coral Bay Villa",
    location: "Goa",
    year: "2024",
    status: "Handover",
    description:
      "A coastal retreat designed around natural light. Floor-to-ceiling sliders, indoor-outdoor living, marine-grade materials throughout.",
  },
  {
    img: gallery3,
    name: "Greenway Estate",
    location: "Pune",
    year: "2025",
    status: "In Progress",
    description:
      "RCC framed structure for a four-bedroom family home with rooftop garden, currently in the structural completion phase.",
  },
] as const;

function ProjectsPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Selected Work
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-light leading-[1.05] text-navy-deep text-balance md:text-7xl">
            A portfolio built on trust.
          </h1>
          <div className="mt-6 gold-divider w-24" />
        </div>
      </section>

      <section className="bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl space-y-20 px-5 md:px-8">
          {PROJECTS.map((p, i) => (
            <article
              key={p.name}
              className={`grid gap-10 md:grid-cols-2 md:gap-16 ${i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""}`}
            >
              <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-elevated">
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                  {p.status} · {p.year}
                </span>
                <h2 className="mt-3 font-display text-4xl font-light text-navy-deep md:text-5xl">
                  {p.name}
                </h2>
                <p className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">
                  {p.location}
                </p>
                <div className="mt-5 gold-divider w-16" />
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
                  {p.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
