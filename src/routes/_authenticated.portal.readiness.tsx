import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Star, Send, UserPlus } from "lucide-react";
import { rpc } from "@/lib/rpc";
import { fetchUserPrimaryProject } from "@/lib/portal-data";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/readiness")({
  component: ReadinessPage,
});

function ReadinessPage() {
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [rating, setRating] = useState<any>(null);
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [refName, setRefName] = useState("");
  const [refContact, setRefContact] = useState("");
  const [refNote, setRefNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await fetchUserPrimaryProject();
      setProject(p);
      if (!p) return setLoading(false);
      const [ri, r] = await Promise.all([
        rpc("readiness.list", { projectId: p.id }),
        rpc("ratings.get", { projectId: p.id }),
      ]);
      setItems(ri);
      setRating(r);
      if (r) setStars(r.stars);
      setLoading(false);
    })();
  }, []);

  const done = items.filter((i) => i.status === "done").length;
  const total = items.length || 1;
  const pct = Math.round((done / total) * 100);
  const isHandover = project?.status === "handover" || project?.status === "completed";

  const submitRating = async () => {
    if (!user || !project || stars < 1) return toast.error("Pick a star rating");
    setBusy(true);
    try {
      await rpc("ratings.create", { projectId: project.id, stars, feedback });
      toast.success("Thank you for your feedback");
      setRating({ stars, feedback });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitReferral = async () => {
    if (!user || !project || !refName || !refContact) return toast.error("Name and contact required");
    setBusy(true);
    try {
      await rpc("referrals.create", {
        projectId: project.id,
        refereeName: refName,
        refereeContact: refContact,
        note: refNote || undefined,
      });
      toast.success("Referral sent — thank you!");
      setRefName("");
      setRefContact("");
      setRefNote("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Readiness</p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">Handover checklist</h1>
      </header>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-2xl font-light text-navy-deep">{pct}%</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {done} of {items.length} ready
              </p>
            </div>
            <Progress value={pct} className="mt-3 h-1.5" />
          </Card>

          <div className="space-y-2">
            {items.map((i) => (
              <Card key={i.id} className="flex items-center gap-4 p-4">
                {i.status === "done" ? (
                  <CheckCircle2 size={20} className="text-gold" />
                ) : (
                  <Circle size={20} className="text-muted-foreground" />
                )}
                <p
                  className={`flex-1 text-sm ${i.status === "done" ? "text-navy-deep line-through opacity-60" : "text-navy-deep"}`}
                >
                  {i.title}
                </p>
              </Card>
            ))}
          </div>

          {isHandover && (
            <>
              <Card className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Your experience</p>
                <h2 className="mt-2 font-display text-xl text-navy-deep">
                  {rating ? "Thanks for rating us" : "Rate your project"}
                </h2>
                <div className="mt-4 flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={!!rating}
                      onClick={() => setStars(n)}
                      className="transition-transform hover:scale-110 disabled:cursor-default disabled:hover:scale-100"
                      aria-label={`${n} stars`}
                    >
                      <Star
                        size={32}
                        className={n <= stars ? "fill-gold text-gold" : "text-muted-foreground"}
                      />
                    </button>
                  ))}
                </div>
                {!rating && (
                  <>
                    <Textarea
                      className="mt-4"
                      rows={3}
                      placeholder="Optional feedback…"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                    <Button
                      onClick={submitRating}
                      disabled={busy || stars < 1}
                      className="mt-3 bg-navy-deep text-ivory hover:bg-navy"
                    >
                      <Send size={14} /> Submit rating
                    </Button>
                  </>
                )}
                {rating?.feedback && (
                  <p className="mt-3 text-sm italic text-muted-foreground">"{rating.feedback}"</p>
                )}
              </Card>

              <Card className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Refer a friend</p>
                <h2 className="mt-2 font-display text-xl text-navy-deep">
                  Know someone building?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share their details — we'll reach out gently and you'll receive a thank-you reward
                  on their project sign-off.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="rn">Name</Label>
                    <Input id="rn" value={refName} onChange={(e) => setRefName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rc">Phone or email</Label>
                    <Input id="rc" value={refContact} onChange={(e) => setRefContact(e.target.value)} />
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="rno">Note (optional)</Label>
                  <Textarea
                    id="rno"
                    rows={3}
                    value={refNote}
                    onChange={(e) => setRefNote(e.target.value)}
                  />
                </div>
                <Button
                  onClick={submitReferral}
                  disabled={busy}
                  className="mt-3 bg-navy-deep text-ivory hover:bg-navy"
                >
                  <UserPlus size={14} /> Send referral
                </Button>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
