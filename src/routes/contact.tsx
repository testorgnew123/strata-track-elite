import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — SingleStop Building Solutions" },
      {
        name: "description",
        content:
          "Book a consultation with SingleStop. Reach our team by email, phone, or our contact form.",
      },
      { property: "og:title", content: "Contact SingleStop" },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().min(7, "Phone is required").max(20),
  message: z.string().trim().min(10, "Tell us a bit more").max(1000),
});

type FormValues = z.infer<typeof schema>;

function ContactPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  const onSubmit = (values: FormValues) => {
    // Wired to backend in a later phase
    console.log("Contact submission:", values);
    toast.success("Thank you. Our team will reach out within 24 hours.");
    form.reset();
  };

  return (
    <MarketingLayout>
      <section className="border-b border-border bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Get In Touch
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-light leading-[1.05] text-navy-deep text-balance md:text-7xl">
            Let's design what's next.
          </h1>
          <div className="mt-6 gold-divider w-24" />
        </div>
      </section>

      <section className="bg-background py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-16 px-5 md:grid-cols-[1fr_1.4fr] md:px-8">
          <aside className="space-y-8">
            <div>
              <h3 className="font-display text-2xl text-navy-deep">Reach us</h3>
              <p className="mt-3 text-muted-foreground">
                Our consultations are by appointment. Tell us about your project —
                we'll respond within one business day.
              </p>
            </div>

            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-deep text-gold">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1 text-navy-deep">hello@singlestop.in</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-deep text-gold">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Phone
                  </p>
                  <p className="mt-1 text-navy-deep">+91 80 4567 8900</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-deep text-gold">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Studio
                  </p>
                  <p className="mt-1 text-navy-deep">
                    Indiranagar, Bengaluru — 560038
                  </p>
                </div>
              </li>
            </ul>
          </aside>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="rounded-2xl border border-border bg-card p-8 shadow-soft md:p-10"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+91" {...form.register("phone")} />
                {form.formState.errors.phone && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@email.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="mt-5 space-y-2">
              <Label htmlFor="message">Tell us about your project</Label>
              <Textarea
                id="message"
                placeholder="Site location, plot size, intended start, anything that would help..."
                rows={6}
                {...form.register("message")}
              />
              {form.formState.errors.message && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.message.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={form.formState.isSubmitting}
              className="mt-7 w-full bg-navy-deep text-ivory hover:bg-navy md:w-auto"
            >
              Send Enquiry
            </Button>
          </form>
        </div>
      </section>
    </MarketingLayout>
  );
}
