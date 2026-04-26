import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import loginVisual from "@/assets/login-visual.jpg";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — SingleStop Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Enter your User ID or registered mobile number")
    .max(40),
});

type Values = z.infer<typeof schema>;

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "" },
  });

  const onSubmit = async (_values: Values) => {
    await new Promise((r) => setTimeout(r, 700));
    setSent(true);
    toast.success("If an account exists, an OTP has been sent to the registered email.");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        <img
          src={loginVisual}
          alt="Luxury modern villa at twilight"
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
              Recover access in <em className="not-italic text-gold">a minute or two.</em>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-ivory/70">
              We'll send a one-time code to the email registered with your account.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-ivory/50">
            Secure recovery · 10-minute OTP
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link to="/"><BrandMark /></Link>
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

            {!sent ? (
              <>
                <h1 className="font-display text-4xl font-light text-navy-deep">
                  Forgot password
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Enter your User ID or registered mobile number — we'll email you a one-time code.
                </p>

                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">User ID or Mobile</Label>
                    <Input
                      id="identifier"
                      placeholder="CLIENT2201 or +91 98765 43210"
                      className="h-11"
                      {...form.register("identifier")}
                    />
                    {form.formState.errors.identifier && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.identifier.message}
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
                        Sending…
                      </>
                    ) : (
                      "Send Reset Code"
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
                <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-deep text-gold">
                  <MailCheck size={26} />
                </div>
                <h2 className="font-display text-2xl text-navy-deep">Check your inbox</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  If an account exists for that identifier, we've sent a 6-digit
                  code to the registered email. The code expires in 10 minutes.
                </p>
                <Button asChild variant="outline" className="mt-7 w-full">
                  <Link to="/login">Return to Sign In</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border px-5 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SingleStop Building Solutions
        </div>
      </div>
    </div>
  );
}
