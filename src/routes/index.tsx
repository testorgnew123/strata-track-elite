import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Hammer, Eye, Calendar } from "lucide-react";
import heroImg from "@/assets/hero-construction.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SingleStop Building Solutions — Track Your Dream Project In Real Time" },
      {
        name: "description",
        content:
          "Premium construction services with daily progress updates, transparent milestones, and a dedicated client portal. Built for clients who value trust.",
      },
      { property: "og:title", content: "SingleStop Building Solutions" },
      {
        property: "og:description",
        content:
          "Track your dream project in real time. Premium construction with full transparency.",
      },
      { property: "og:image", content: heroImg },
      { property: "twitter:image", content: heroImg },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingLayout>
      <Hero />
      <WhySection />
      <GalleryPreview />
      <Testimonials />
      <ContactCTA />
    </MarketingLayout>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[88vh] overflow-hidden">
      <img
        src={heroImg}
        alt="Luxury villa under construction at golden hour"
        className="absolute inset-0 h-full w-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-hero-overlay" />
      <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-end px-5 pb-20 pt-32 md:px-8 md:pb-28">
        <div className="max-w-3xl animate-rise-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-navy-deep/40 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-gold backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Premium Construction · Est. 2014
          </span>
          <h1 className="mt-6 font-display text-5xl font-light leading-[1.05] text-ivory text-balance md:text-7xl lg:text-[5.5rem]">
            Track Your <em className="not-italic text-gold">Dream Project</em>
            <br />
            In Real Time.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/80 text-pretty">
            From foundation to handover, every detail of your build — photographed,
            documented, and shared with you the day it happens.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-gold text-navy-deep hover:bg-gold-soft shadow-gold-glow">
              <Link to="/login">
                Client Login
                <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory"
            >
              <Link to="/contact">Book a Consultation</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    icon: Eye,
    title: "Total Transparency",
    body:
      "Daily site photos, timeline updates, and milestone acknowledgements — visible only to you, on your dedicated portal.",
  },
  {
    icon: Hammer,
    title: "Dedicated Engineers",
    body:
      "A named site engineer assigned to your project, accountable for every update and reachable through the portal.",
  },
  {
    icon: ShieldCheck,
    title: "Premium Construction",
    body:
      "RCC framing, branded fittings, signed-off milestones at every phase. No shortcuts, no surprises.",
  },
  {
    icon: Calendar,
    title: "On-Time Handover",
    body:
      "Phase-wise readiness tracker keeps your project on schedule. Site visits scheduled directly through the portal.",
  },
] as const;

function WhySection() {
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Why SingleStop
          </span>
          <h2 className="mt-4 font-display text-4xl font-light leading-tight text-navy-deep md:text-5xl">
            Construction without the anxiety.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-pretty">
            We built SingleStop after watching too many homeowners feel locked
            out of their own project. The portal exists to put you back in.
          </p>
          <div className="mt-6 gold-divider w-24" />
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="group relative rounded-2xl border border-border bg-card p-7 shadow-soft hover-lift"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy-deep text-gold">
                  <Icon size={20} />
                </div>
                <h3 className="font-display text-xl text-navy-deep">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const GALLERY = [
  { src: gallery1, alt: "Premium villa interior with double-height living room" },
  { src: gallery2, alt: "Luxury modern villa exterior at twilight" },
  { src: gallery3, alt: "Construction site with structural framework" },
] as const;

function GalleryPreview() {
  return (
    <section className="bg-secondary py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col items-end justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Selected Work
            </span>
            <h2 className="mt-4 font-display text-4xl font-light leading-tight text-navy-deep md:text-5xl">
              Built with conviction.
            </h2>
          </div>
          <Link
            to="/projects"
            className="group inline-flex items-center gap-2 text-sm font-medium text-navy-deep"
          >
            Explore the portfolio
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {GALLERY.map((g, i) => (
            <div
              key={g.src}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-elevated"
            >
              <img
                src={g.src}
                alt={g.alt}
                loading="lazy"
                width={1024}
                height={1024}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-ivory">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Project 0{i + 1}
                </span>
                <p className="mt-1 font-display text-lg">
                  {["Skyline Residence", "Coral Bay Villa", "Greenway Estate"][i]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote:
      "I travel for work. The portal meant I never missed a single phase of my home being built. Photos every day, milestone sign-offs in one tap.",
    name: "Anjali R.",
    project: "Skyline Residence, Bengaluru",
  },
  {
    quote:
      "The transparency is unreal. Other builders give you excuses; SingleStop gives you photos with timestamps.",
    name: "Vikram S.",
    project: "Coral Bay Villa, Goa",
  },
  {
    quote:
      "Booking a site visit, raising a query, downloading the progress report — everything in one place. It feels like a luxury service, not a construction project.",
    name: "Meera & Arun",
    project: "Greenway Estate, Pune",
  },
] as const;

function Testimonials() {
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Client Voices
          </span>
          <h2 className="mt-4 font-display text-4xl font-light leading-tight text-navy-deep md:text-5xl">
            Trusted by clients who pay attention to detail.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-border bg-card p-8 shadow-soft hover-lift"
            >
              <div className="mb-5 text-3xl text-gold leading-none font-display">"</div>
              <blockquote className="text-base leading-relaxed text-navy-deep text-pretty">
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 border-t border-border pt-4">
                <p className="font-medium text-navy-deep">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.project}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactCTA() {
  return (
    <section className="relative overflow-hidden bg-navy-deep py-24 md:py-32">
      <div className="absolute inset-0 opacity-[0.04]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 30%, var(--gold) 0%, transparent 40%), radial-gradient(circle at 75% 70%, var(--gold) 0%, transparent 35%)",
          }}
        />
      </div>
      <div className="relative mx-auto max-w-4xl px-5 text-center md:px-8">
        <h2 className="font-display text-4xl font-light leading-tight text-ivory text-balance md:text-6xl">
          Ready to start your project with full visibility?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ivory/70">
          Book a consultation. We'll walk you through what your portal will look like
          before you commit to a single brick.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-gold text-navy-deep hover:bg-gold-soft shadow-gold-glow">
            <Link to="/contact">Book a Consultation</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory"
          >
            <Link to="/login">Existing Client Login</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
