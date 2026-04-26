import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import gallery2 from "@/assets/gallery-2.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — SingleStop Building Solutions" },
      {
        name: "description",
        content:
          "SingleStop builds premium homes with uncompromising transparency. Meet the team and the philosophy behind every project.",
      },
      { property: "og:title", content: "About SingleStop" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            About SingleStop
          </span>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-light leading-[1.05] text-navy-deep text-balance md:text-7xl">
            Construction is a relationship,
            <br className="hidden md:inline" />
            <em className="not-italic text-gold">not a transaction</em>.
          </h1>
          <div className="mt-6 gold-divider w-24" />
        </div>
      </section>

      <section className="bg-background py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-16 px-5 md:grid-cols-2 md:px-8">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-elevated">
            <img
              src={gallery2}
              alt="SingleStop project"
              loading="lazy"
              width={1024}
              height={1280}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="font-display text-3xl font-light text-navy-deep md:text-4xl">
              Why we built the portal first.
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-muted-foreground text-pretty">
              <p>
                Every founder in the construction industry will tell you their
                clients are anxious. We decided to do something about it.
              </p>
              <p>
                Before we poured our first foundation, we built the SingleStop
                portal — a place where every photograph, milestone, and
                approval lives, visible to the people who matter most: you.
              </p>
              <p>
                Today, our engineers carry the portal in their pocket. Every
                site visit, every concrete pour, every tile placed — documented
                in real time. No phone tag. No "I'll send it tomorrow." Just
                proof, when it happens.
              </p>
            </div>
            <div className="mt-8 gold-divider w-16" />
            <p className="mt-6 font-display text-xl italic text-navy-deep">
              "Trust isn't a marketing line. It's a system."
            </p>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5 text-center md:px-8">
          <h2 className="font-display text-4xl font-light text-navy-deep md:text-5xl">
            By the numbers.
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-10 md:grid-cols-4">
            {[
              { n: "11+", l: "Years building" },
              { n: "120+", l: "Projects delivered" },
              { n: "98%", l: "On-time handover" },
              { n: "100%", l: "Portal-tracked" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-5xl font-light text-navy-deep md:text-6xl">
                  {s.n}
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
