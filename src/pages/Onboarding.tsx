import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Company, MOCK_COMPANY } from "@/lib/data";
import { createCompany, findCompanyByJoinCode, joinCompany, upsertProfile } from "@/lib/database";
import { useTranslation } from "react-i18next";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  onComplete: (company: Company, userName: string) => void;
  /** The Supabase user ID — passed from App when the user is authenticated */
  userId?: string;
};

type Step = "choice" | "create" | "join";

// ─── Component ────────────────────────────────────────────────────────────────

export default function Onboarding({ onComplete, userId }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("choice");
  const [companyName, setCompanyName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ─── Create Company ───────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!companyName.trim()) { setError(t("onboarding.companyNameRequired")); return; }
    setLoading(true);
    setError("");

    const joinCode = companyName.toUpperCase().replace(/\s+/g, "-").slice(0, 8) + "-" + Date.now().toString().slice(-4);

    // If connected to Supabase, persist to DB
    if (userId) {
      const { company: row, error: dbErr } = await createCompany(userId, {
        name: companyName,
        currency,
        joinCode,
      });

      if (dbErr) {
        setError(dbErr.message);
        setLoading(false);
        return;
      }

      // Also store the display name in profiles table (pull from auth metadata)
      await upsertProfile(userId, "");

      onComplete(
        { id: row!.id, name: row!.name, currency: row!.currency, joinCode: row!.join_code },
        ""
      );
    } else {
      // Fallback: local only (no Supabase)
      const company: Company = {
        id: `co_${Date.now()}`,
        name: companyName,
        currency,
        joinCode,
      };
      onComplete(company, "User");
    }

    setLoading(false);
  };

  // ─── Join Company ─────────────────────────────────────────────────────────

  const handleJoin = async () => {
    if (!joinCode.trim()) { setError(t("onboarding.enterJoinCode")); return; }
    setLoading(true);
    setError("");

    if (userId) {
      const { company: row, error: dbErr } = await findCompanyByJoinCode(joinCode);

      if (dbErr || !row) {
        setError(t("onboarding.invalidJoinCode"));
        setLoading(false);
        return;
      }

      // Record membership in DB so it persists across logins
      const { error: joinErr } = await joinCompany(userId, row.id);
      if (joinErr) {
        setError(t("onboarding.joinFailed") + joinErr.message);
        setLoading(false);
        return;
      }

      onComplete(
        { id: row.id, name: row.name, currency: row.currency, joinCode: row.join_code },
        ""
      );
    } else {
      // Fallback demo mode
      if (joinCode.trim().toUpperCase() === MOCK_COMPANY.joinCode) {
        onComplete(MOCK_COMPANY, "User");
      } else {
        setError("Invalid join code. Try: ACME-2024");
      }
    }

    setLoading(false);
  };

  // ─── Animation variants ───────────────────────────────────────────────────

  const variants = {
    enter: { opacity: 0, y: 20 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[hsl(var(--sidebar-background))] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[hsl(var(--primary)/0.08)] blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[hsl(var(--income)/0.06)] blur-3xl" />
      </div>

      <motion.div
        key={step}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        {/* Logo mark */}
        <div className="flex items-center justify-center gap-2 text-[hsl(var(--primary))] mb-8">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium tracking-widest uppercase text-[hsl(var(--sidebar-foreground))]">FinFlow</span>
        </div>

        {/* ── Step: choice ── */}
        {step === "choice" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">{t("onboarding.setupWorkspace")}</h2>
              <p className="text-[hsl(var(--sidebar-foreground))]">{t("onboarding.setupSubtitle")}</p>
            </div>
            <div className="grid gap-4">
              <Card
                className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] hover:border-[hsl(var(--primary))] cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.15)]"
                onClick={() => setStep("create")}
              >
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="rounded-xl bg-[hsl(var(--primary)/0.15)] p-3">
                    <Building2 className="h-6 w-6 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{t("onboarding.createCompany")}</h3>
                    <p className="text-sm text-[hsl(var(--sidebar-foreground))]">{t("onboarding.createCompanyDesc")}</p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] hover:border-[hsl(var(--income))] cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-[hsl(var(--income)/0.15)]"
                onClick={() => setStep("join")}
              >
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="rounded-xl bg-[hsl(var(--income)/0.15)] p-3">
                    <Users className="h-6 w-6 text-[hsl(var(--income))]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{t("onboarding.joinCompany")}</h3>
                    <p className="text-sm text-[hsl(var(--sidebar-foreground))]">{t("onboarding.joinCompanyDesc")}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Step: create ── */}
        {step === "create" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{t("onboarding.createYourCompany")}</h2>
              <p className="text-[hsl(var(--sidebar-foreground))]">{t("onboarding.createSubtitle")}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[hsl(var(--sidebar-foreground))]">{t("onboarding.companyName")} *</Label>
                <Input
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => { setCompanyName(e.target.value); setError(""); }}
                  className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] text-white placeholder:text-[hsl(var(--sidebar-foreground))] h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[hsl(var(--sidebar-foreground))]">{t("onboarding.currency")}</Label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-12 rounded-md bg-[hsl(var(--sidebar-accent))] border border-[hsl(var(--sidebar-border))] text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                >
                  <option value="IDR">IDR — Indonesian Rupiah</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="SGD">SGD — Singapore Dollar</option>
                  <option value="CAD">CAD — Canadian Dollar</option>
                  <option value="AUD">AUD — Australian Dollar</option>
                  <option value="JPY">JPY — Japanese Yen</option>
                  <option value="CHF">CHF — Swiss Franc</option>
                </select>
              </div>
              {error && <p className="text-[hsl(var(--expense))] text-sm">{error}</p>}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("choice")} className="flex-1 h-12 border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white bg-transparent">
                {t("common.back")}
              </Button>
              <Button onClick={handleCreate} disabled={loading} className="flex-1 h-12">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t("onboarding.createBtn")} <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: join ── */}
        {step === "join" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{t("onboarding.joinACompany")}</h2>
              <p className="text-[hsl(var(--sidebar-foreground))]">{t("onboarding.joinSubtitle")}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[hsl(var(--sidebar-foreground))]">{t("onboarding.joinCode")}</Label>
                <Input
                  placeholder="e.g. ACME-2024"
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value); setError(""); }}
                  className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] text-white placeholder:text-[hsl(var(--sidebar-foreground))] h-12 uppercase tracking-widest"
                />
              </div>
              {error && <p className="text-[hsl(var(--expense))] text-sm">{error}</p>}
              {!userId && (
                <p className="text-xs text-[hsl(var(--sidebar-foreground))]">
                  Demo code: <span className="text-[hsl(var(--primary))] font-mono">ACME-2024</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("choice")} className="flex-1 h-12 border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white bg-transparent">
                {t("common.back")}
              </Button>
              <Button onClick={handleJoin} disabled={loading} className="flex-1 h-12">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t("onboarding.joinBtn")} <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
