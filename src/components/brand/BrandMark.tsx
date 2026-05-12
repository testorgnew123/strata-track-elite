import logoUrl from "@/assets/ss1.webp";

interface BrandMarkProps {
  variant?: "light" | "dark";
  showWordmark?: boolean;
  size?: "default" | "lg";
  className?: string;
}

export function BrandMark({ size = "default", className }: BrandMarkProps) {
  const imgClass =
    size === "lg"
      ? "h-16 sm:h-20 md:h-24 w-auto max-w-[240px] sm:max-w-[320px] md:max-w-[420px] object-contain"
      : "h-8 sm:h-10 md:h-12 w-auto max-w-[120px] sm:max-w-[160px] md:max-w-[220px] object-contain";

  return (
    <div className={`inline-flex items-center ${className ?? ""}`}>
      <img src={logoUrl} alt="SingleStop" className={imgClass} />
    </div>
  );
}
