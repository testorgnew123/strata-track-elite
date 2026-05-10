import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, User as UserIcon, Bell, MoreHorizontal } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface Props {
  navItems: NavItem[];
  layout?: "sidebar" | "bottom-bar";
  children: ReactNode;
}

export function PortalShell({ navItems, layout = "sidebar", children }: Props) {
  const { profile, user, signOut, primaryRole } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  const initials = (profile?.fullName ?? user?.email ?? "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 md:px-8">
          <Link
            to={
              primaryRole === "admin" ? "/admin" : primaryRole === "engineer" ? "/field" : "/portal"
            }
          >
            <BrandMark />
          </Link>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications">
              <Bell size={16} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 inline-flex h-9 items-center gap-2 rounded-md border border-border bg-secondary px-2 text-xs font-medium text-navy-deep transition-colors hover:bg-background">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-navy-deep text-[10px] font-semibold text-ivory">
                    {initials}
                  </span>
                  <span className="hidden md:inline">{profile?.fullName ?? user?.email}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {primaryRole === "client" && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/portal/settings" })}>
                    <UserIcon size={14} /> Profile & settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut size={14} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Body */}
      {layout === "sidebar" ? (
        <div className="mx-auto flex w-full max-w-[1400px] flex-1">
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-border px-4 py-6 lg:block">
            <NavList items={navItems} orientation="vertical" />
          </aside>
          <main className="min-w-0 flex-1 px-4 pb-12 pt-6 md:px-8">{children}</main>
        </div>
      ) : (
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-12 pt-6">{children}</main>
      )}

      {layout === "sidebar" ? (
        <div className="lg:hidden">
          <MobileBottomNav items={navItems} fixed />
        </div>
      ) : (
        <MobileBottomNav items={navItems} />
      )}
    </div>
  );
}

function MobileBottomNav({ items, fixed = false }: { items: NavItem[]; fixed?: boolean }) {
  const [open, setOpen] = useState(false);
  const overflow = items.length > 5;
  const visible = overflow ? items.slice(0, 4) : items;
  const rest = overflow ? items.slice(4) : [];

  return (
    <nav
      className={`${fixed ? "fixed bottom-0 left-0 right-0 z-30" : ""} border-t border-border bg-background/95 backdrop-blur-md`}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-1.5">
        {visible.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeProps={{ className: "text-navy-deep" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors"
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </Link>
        ))}
        {overflow && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-navy-deep"
              >
                <MoreHorizontal size={18} />
                <span>More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>All sections</SheetTitle>
              </SheetHeader>
              <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {rest.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setOpen(false)}
                      activeProps={{
                        className: "border-gold bg-secondary text-navy-deep",
                      }}
                      inactiveProps={{
                        className: "border-border text-muted-foreground hover:text-navy-deep",
                      }}
                      className="flex flex-col items-center gap-2 rounded-lg border bg-background px-3 py-4 text-xs font-medium transition-colors"
                    >
                      <item.icon size={20} />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}

function NavList({ items, orientation }: { items: NavItem[]; orientation: "vertical" }) {
  return (
    <ul className={orientation === "vertical" ? "space-y-1" : "flex"}>
      {items.map((item) => (
        <li key={item.to}>
          <Link
            to={item.to}
            activeProps={{
              className: "bg-secondary text-navy-deep font-medium border-l-2 border-gold pl-[10px]",
            }}
            inactiveProps={{
              className: "text-muted-foreground hover:text-navy-deep hover:bg-secondary/60 pl-3",
            }}
            className="flex items-center gap-2.5 rounded-md py-2 pr-3 text-sm transition-colors"
          >
            <item.icon size={16} />
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
