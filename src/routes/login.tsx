import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import loginVisual from "@/assets/login-visual.jpg";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, homeForRole, type AppRole } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — SingleStop Client Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(120),
  password: z.string().min(6, "Password is required").max(128),
});
type Values = z.infer<typeof schema>;

function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <VisualPanel />
      <FormPanel />
    </div>
  );
}

function VisualPanel() {
  return (
    <aside className="relative hidden overflow-hidden lg:block">
      <img
        src={loginVisual}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        width={1080}
        height={1920}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/40 to-navy-deep/30" />
      <div className="relative flex h-full flex-col justify-between p-12 text-ivory">
        <BrandMark variant="light" />

        <div className="max-w-lg animate-rise-in">
          <div className="gold-divider w-16" />
          <h2 className="mt-6 font-display text-4xl font-light leading-tight text-balance xl:text-5xl">
            Secure access to your <em className="not-italic text-gold">SingleStop project</em>.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-ivory/70">
            Daily progress, milestones, and documents — in one place.
          </p>
        </div>

        <p className="text-xs uppercase tracking-[0.22em] text-ivory/50">
          Authorized users only · End-to-end encrypted
        </p>
      </div>
    </aside>
  );
}

function FormPanel() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="p-6 lg:hidden">
        <BrandMark />
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-12 md:px-12 lg:py-0">
        <div className="w-full max-w-md animate-rise-in">
          <div className="mb-10 hidden lg:block">
            <h1 className="font-display text-4xl font-light text-navy-deep">Welcome back.</h1>
            <p className="mt-2 text-muted-foreground">Sign in to your project portal.</p>
          </div>

          <div className="lg:hidden">
            <h1 className="font-display text-3xl font-light text-navy-deep">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Access your project portal.</p>
          </div>

          <div className="mt-8">
            <LoginForm />
          </div>

          <DemoCard />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Account issues? Contact your project manager.
          </p>
        </div>
      </div>

      <div className="border-t border-border px-5 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SingleStop Building Solutions
      </div>
    </div>
  );
}

function LoginForm() {
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: Values) => {
    let result: { primaryRole: AppRole | null };
    try {
      result = await signIn(values.email, values.password);
    } catch (e) {
      toast.error((e as Error).message || "Sign in failed");
      return;
    }
    toast.success("Welcome back");
    navigate({ to: homeForRole(result.primaryRole) });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className="h-11"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={() => toast.info("Contact your project manager to reset your password.")}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-navy-deep"
          >
            Forgot?
          </button>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            className="h-11 pr-10"
            {...form.register("password")}
          />
          <button
            type="button"
            aria-label={showPwd ? "Hide password" : "Show password"}
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-navy-deep"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="h-11 w-full bg-navy-deep text-ivory hover:bg-navy"
      >
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}

const DEMO = [
  { label: "Admin", email: "admin@demo.singlestop.com", password: "Demo@Admin2026" },
  { label: "Engineer", email: "engineer@demo.singlestop.com", password: "Demo@Engg2026" },
  { label: "Client", email: "client@demo.singlestop.com", password: "Demo@Client2026" },
];

function DemoCard() {
  const copy = (e: string, p: string) => {
    navigator.clipboard.writeText(`${e} / ${p}`);
    toast.success("Credentials copied");
  };
  return (
    <div className="mt-8 rounded-lg border border-gold/30 bg-gold/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
        Demo credentials
      </p>
      <div className="mt-3 space-y-2">
        {DEMO.map((d) => (
          <button
            key={d.email}
            type="button"
            onClick={() => copy(d.email, d.password)}
            className="flex w-full items-center justify-between rounded-md border border-transparent px-2 py-1.5 text-left text-xs transition-colors hover:border-gold/30 hover:bg-background"
          >
            <span className="font-medium text-navy-deep">{d.label}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{d.email}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Tap a row to copy <span className="font-mono">email / password</span>.
      </p>
    </div>
  );
}
