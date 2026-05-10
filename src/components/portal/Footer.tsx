import { Globe, Instagram, Facebook, Linkedin } from "lucide-react";

export function Footer() {
  const links = [
    { href: "https://www.kyleinnovate.com/", label: "Website", Icon: Globe },
    { href: "https://www.instagram.com/kyleinnovate", label: "Instagram", Icon: Instagram },
    { href: "https://www.facebook.com/kyleinnovate", label: "Facebook", Icon: Facebook },
    { href: "https://www.linkedin.com/company/kyleinnovate-solutions/", label: "LinkedIn", Icon: Linkedin },
  ];

  return (
    <footer className="border-t border-border bg-background/80">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-1.5 px-4 py-2 text-[11px] text-muted-foreground md:flex-row md:px-8">
        <p className="text-center md:text-left">
          Designed &amp; Developed by{" "}
          <a
            href="https://www.kyleinnovate.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gold underline underline-offset-2 transition-colors hover:text-navy-deep"
          >
            KyleInnovate
          </a>{" "}
          | All Rights Reserved &copy; 2026
        </p>
        <ul className="flex items-center gap-2">
          {links.map(({ href, label, Icon }) => (
            <li key={label}>
              <a
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-gold hover:text-navy-deep"
              >
                <Icon size={12} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
