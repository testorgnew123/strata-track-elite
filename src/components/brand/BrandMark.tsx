import logoUrl from "@/assets/logo.png";

interface BrandMarkProps {
  variant?: "light" | "dark";
  showWordmark?: boolean;
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <div className={`inline-flex items-center ${className ?? ""}`}>
      <img
        src={logoUrl}
        alt="SingleStop"
        className="h-12 sm:h-16 md:h-20 w-auto max-w-[160px] sm:max-w-[240px] md:max-w-[360px] object-contain"
      />
    </div>
  );
}
