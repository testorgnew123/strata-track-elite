import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import loginVisual from "@/assets/login-visual.jpg";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — SingleStop Client Portal" },
      {
        name: "description",
        content:
          "Secure sign-in for SingleStop clients, engineers, and admins. Use your User ID or registered mobile number.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

const userIdSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(3, "User ID is required")
    .max(40)
    .regex(/^[A-Z0-9_-]+$/i, "Letters, numbers, underscore or dash only"),
  password: z.string().min(6, "Password is required").max(128),
});

const mobileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .min(7, "Mobile number is required")
    .max(20)
    .regex(/^[+0-9\s-]+$/, "Digits, +, spaces or dashes only"),
  password: z.string().min(6, "Password is required").max(128),
});

type UserIdValues = z.infer<typeof userIdSchema>;
type MobileValues = z.infer<typeof mobileSchema>;

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
          <h2 className="mt-6 font-display text-4xl font-light leading-tight text-balance xl:text-5xl">
            Your project, photographed and accounted for —
            <em className="not-italic text-gold"> every single day.</em>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-ivory/70">
            Sign in to view today's site update, the latest milestones,
            and your complete project archive.
          </p>
        </div>

        <p className="text-xs uppercase tracking-[0.22em] text-ivory/50">
          Secure portal · End-to-end encrypted
        </p>
      </div>
    </aside>
  );
}

function FormPanel() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between p-6 lg:hidden">
        <Link to="/">
          <BrandMark />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <ArrowLeft size={14} />
          Home
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-12 md:px-12 lg:py-0">
        <div className="w-full max-w-md animate-rise-in">
          <div className="mb-10 hidden lg:block">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-navy-deep"
            >
              <ArrowLeft size={14} />
              Back to home
            </Link>
            <h1 className="font-display text-4xl font-light text-navy-deep">
              Welcome back.
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to your project portal.
            </p>
          </div>

          <div className="lg:hidden">
            <h1 className="font-display text-3xl font-light text-navy-deep">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Access your project portal.
            </p>
          </div>

          <Tabs defaultValue="userid" className="mt-8">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="userid">User ID</TabsTrigger>
              <TabsTrigger value="mobile">Mobile</TabsTrigger>
            </TabsList>
            <TabsContent value="userid" className="mt-6">
              <UserIdForm />
            </TabsContent>
            <TabsContent value="mobile" className="mt-6">
              <MobileForm />
            </TabsContent>
          </Tabs>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/contact" className="font-medium text-navy-deep underline-offset-4 hover:underline">
              Request access
            </Link>
          </p>
        </div>
      </div>

      <div className="border-t border-border px-5 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SingleStop Building Solutions
      </div>
    </div>
  );
}

function UserIdForm() {
  const [showPwd, setShowPwd] = useState(false);
  const form = useForm<UserIdValues>({
    resolver: zodResolver(userIdSchema),
    defaultValues: { userId: "", password: "" },
  });

  const onSubmit = async (values: UserIdValues) => {
    // Will be wired to auth server function next phase
    await new Promise((r) => setTimeout(r, 600));
    toast.info(`Auth not connected yet. Received: ${values.userId}`);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="userId">User ID</Label>
        <Input
          id="userId"
          placeholder="e.g. CLIENT2201"
          autoCapitalize="characters"
          autoComplete="username"
          className="h-11"
          {...form.register("userId")}
        />
        {form.formState.errors.userId && (
          <p className="text-xs text-destructive">{form.formState.errors.userId.message}</p>
        )}
      </div>

      <PasswordField
        register={form.register("password")}
        error={form.formState.errors.password?.message}
        show={showPwd}
        onToggle={() => setShowPwd((v) => !v)}
      />

      <SubmitFooter loading={form.formState.isSubmitting} />
    </form>
  );
}

function MobileForm() {
  const [showPwd, setShowPwd] = useState(false);
  const form = useForm<MobileValues>({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobile: "", password: "" },
  });

  const onSubmit = async (values: MobileValues) => {
    await new Promise((r) => setTimeout(r, 600));
    toast.info(`Auth not connected yet. Received: ${values.mobile}`);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile number</Label>
        <Input
          id="mobile"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          className="h-11"
          {...form.register("mobile")}
        />
        {form.formState.errors.mobile && (
          <p className="text-xs text-destructive">{form.formState.errors.mobile.message}</p>
        )}
      </div>

      <PasswordField
        register={form.register("password")}
        error={form.formState.errors.password?.message}
        show={showPwd}
        onToggle={() => setShowPwd((v) => !v)}
      />

      <SubmitFooter loading={form.formState.isSubmitting} />
    </form>
  );
}

function PasswordField({
  register,
  error,
  show,
  onToggle,
}: {
  register: ReturnType<ReturnType<typeof useForm>["register"]>;
  error?: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="password">Password</Label>
        <Link
          to="/forgot-password"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-navy-deep"
        >
          Forgot?
        </Link>
      </div>
      <div className="relative">
        <Input
          id="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Your password"
          className="h-11 pr-10"
          {...register}
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-navy-deep"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SubmitFooter({ loading }: { loading: boolean }) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="h-11 w-full bg-navy-deep text-ivory hover:bg-navy"
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" />
          Signing in…
        </>
      ) : (
        "Sign In"
      )}
    </Button>
  );
}
