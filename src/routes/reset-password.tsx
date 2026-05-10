import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import loginVisual from "@/assets/login-visual.jpg";
import { BrandMark } from "@/components/brand/BrandMark";
import { Footer } from "@/components/portal/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({
  id: z.string().optional(),
  token: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — SingleStop Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: searchSchema,
  component: ResetPasswordPage,
});

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .max(128, "Too long")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

type Values = z.infer<typeof formSchema>;

function ResetPasswordPage() {
  const search = useSearch({ from: "/reset-password" });
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const missingLink = !search.id || !search.token;

  const onSubmit = async (values: Values) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: search.id,
          token: search.token,
          password: values.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not reset password");
        return;
      }
      setDone(true);
      toast.success("Password updated. You can sign in now.");
      setTimeout(() => navigate({ to: "/login" }), 1800);
    } catch {
      toast.error("Could not reset password");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
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
          <Link to="/" className="inline-flex">
            <BrandMark variant="light" />
          </Link>
          <div className="max-w-lg animate-rise-in">
            <div className="gold-divider w-16" />
            <h2 className="mt-6 font-display text-4xl font-light leading-tight xl:text-5xl">
              Set a new <em className="not-italic text-gold">password.</em>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-ivory/70">
              Choose a strong password. We will sign you out of all other sessions.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-ivory/50">
            Secure recovery · One-time link
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link to="/">
            <BrandMark />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-12 md:px-12">
          <div className="w-full max-w-md animate-rise-in">
            <Link
              to="/login"
              className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-navy-deep"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </Link>

            {missingLink ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
                <h2 className="font-display text-2xl text-navy-deep">Invalid link</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  This reset link is missing required information. Request a new one from the
                  forgot password page.
                </p>
                <Button asChild variant="outline" className="mt-7 w-full">
                  <Link to="/forgot-password">Request new link</Link>
                </Button>
              </div>
            ) : done ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
                <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-deep text-gold">
                  <CheckCircle2 size={26} />
                </div>
                <h2 className="font-display text-2xl text-navy-deep">Password updated</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Redirecting you to sign in…
                </p>
              </div>
            ) : (
              <>
                <h1 className="font-display text-4xl font-light text-navy-deep">Reset password</h1>
                <p className="mt-2 text-muted-foreground">
                  Enter a new password for your account. The link expires 30 minutes after it was
                  issued.
                </p>

                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPw ? "text" : "password"}
                        placeholder="At least 8 characters"
                        className="h-11 pr-11"
                        autoComplete="new-password"
                        {...form.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-navy-deep"
                        tabIndex={-1}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {form.formState.errors.password && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <Input
                      id="confirm"
                      type={showPw ? "text" : "password"}
                      placeholder="Re-enter password"
                      className="h-11"
                      autoComplete="new-password"
                      {...form.register("confirm")}
                    />
                    {form.formState.errors.confirm && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.confirm.message}
                      </p>
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
                        Updating…
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
