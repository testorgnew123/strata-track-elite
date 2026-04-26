import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserPrimaryProject } from "@/lib/portal-data";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, refresh } = useAuth();
  const { lang, setLang } = useI18n();
  const [project, setProject] = useState<any>(null);
  const [rated, setRated] = useState<any>(null);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [mobile, setMobile] = useState(profile?.mobile ?? "");
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [refName, setRefName] = useState("");
  const [refContact, setRefContact] = useState("");
  const [refNote, setRefNote] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setMobile(profile?.mobile ?? "");
  }, [profile]);

  useEffect(() => {
    (async () => {
      const p = await fetchUserPrimaryProject();
      setProject(p);
      if (!p) return;
      const { data } = await supabase
        .from("project_ratings")
        .select("*")
        .eq("project_id", p.id)
        .maybeSingle();
      setRated(data);
    })();
  }, []);

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, mobile, language: lang })
      .eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    refresh();
  };

  const submitRating = async () => {
    if (!user || !project || !stars) return;
    const { error } = await supabase
      .from("project_ratings")
      .insert({ project_id: project.id, client_id: user.id, stars, feedback });
    if (error) return toast.error(error.message);
    toast.success("Thank you for your feedback");
    setRated({ stars, feedback });
  };

  const submitReferral = async () => {
    if (!user || !project) return;
    const { error } = await supabase.from("referrals").insert({
      project_id: project.id,
      referrer_id: user.id,
      referee_name: refName,
      referee_contact: refContact,
      note: refNote,
    });
    if (error) return toast.error(error.message);
    toast.success("Referral shared — thank you!");
    setRefName("");
    setRefContact("");
    setRefNote("");
  };

  const showHandover = project && (project.status === "completed" || project.status === "handover");

  return (
    <div className="space-y-6 animate-rise-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Settings</p>
        <h1 className="mt-2 font-display text-3xl font-light text-navy-deep">Profile & preferences</h1>
      </header>

      <Card className="p-6">
        <h2 className="font-display text-lg text-navy-deep">Your details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <div className="flex gap-2">
              <Button
                variant={lang === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLang("en")}
                className={lang === "en" ? "bg-navy-deep text-ivory hover:bg-navy" : ""}
              >
                English
              </Button>
              <Button
                variant={lang === "hi" ? "default" : "outline"}
                size="sm"
                onClick={() => setLang("hi")}
                className={lang === "hi" ? "bg-navy-deep text-ivory hover:bg-navy" : ""}
              >
                हिंदी
              </Button>
            </div>
          </div>
        </div>
        <Button onClick={saveProfile} className="mt-5 bg-navy-deep text-ivory hover:bg-navy">
          Save changes
        </Button>
      </Card>

      {showHandover && (
        <>
          <Card className="border-gold/30 bg-gold/5 p-6">
            <h2 className="font-display text-lg text-navy-deep">Rate this project</h2>
            {rated ? (
              <div className="mt-3">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < rated.stars ? "fill-gold text-gold" : "text-muted-foreground"}
                    />
                  ))}
                </div>
                {rated.feedback && (
                  <p className="mt-3 text-sm italic text-navy-deep">"{rated.feedback}"</p>
                )}
              </div>
            ) : (
              <>
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} onClick={() => setStars(i + 1)}>
                      <Star
                        size={28}
                        className={i < stars ? "fill-gold text-gold" : "text-muted-foreground"}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  className="mt-4"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What stood out about working with SingleStop?"
                />
                <Button
                  onClick={submitRating}
                  disabled={!stars}
                  className="mt-4 bg-navy-deep text-ivory hover:bg-navy"
                >
                  Submit rating
                </Button>
              </>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg text-navy-deep">Refer a friend</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Know someone planning a build? Share their details and we'll reach out personally.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="refName">Name</Label>
                <Input id="refName" value={refName} onChange={(e) => setRefName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refContact">Phone or email</Label>
                <Input id="refContact" value={refContact} onChange={(e) => setRefContact(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="refNote">A short note (optional)</Label>
                <Textarea id="refNote" rows={2} value={refNote} onChange={(e) => setRefNote(e.target.value)} />
              </div>
            </div>
            <Button
              onClick={submitReferral}
              disabled={!refName || !refContact}
              className="mt-4 bg-navy-deep text-ivory hover:bg-navy"
            >
              Share referral
            </Button>
          </Card>
        </>
      )}
    </div>
  );
}
