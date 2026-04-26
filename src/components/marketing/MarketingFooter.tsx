import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand/BrandMark";

export function MarketingFooter() {
  return (
    <footer className="bg-navy-deep text-ivory">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <BrandMark variant="light" />
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ivory/70">
              Premium construction services with uncompromising transparency.
              Track every phase of your project — from foundation to handover —
              with daily updates from the site.
            </p>
            <div className="mt-6 gold-divider w-24" />
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Company
            </h4>
            <ul className="mt-5 space-y-3 text-sm text-ivory/70">
              <li><Link to="/about" className="transition-colors hover:text-gold">About</Link></li>
              <li><Link to="/services" className="transition-colors hover:text-gold">Services</Link></li>
              <li><Link to="/projects" className="transition-colors hover:text-gold">Projects</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-gold">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Client Portal
            </h4>
            <ul className="mt-5 space-y-3 text-sm text-ivory/70">
              <li><Link to="/login" className="transition-colors hover:text-gold">Sign In</Link></li>
              <li><Link to="/forgot-password" className="transition-colors hover:text-gold">Forgot Password</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-gold">Request Access</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-ivory/10 pt-6 text-xs text-ivory/50 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} SingleStop Building Solutions. All rights reserved.</p>
          <p className="tracking-wide">Crafted for clients who value transparency.</p>
        </div>
      </div>
    </footer>
  );
}
