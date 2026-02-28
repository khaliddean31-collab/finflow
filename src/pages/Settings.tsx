import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Save, Copy, Check, Languages } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Company } from "@/lib/data";
import { useTranslation } from "react-i18next";


type Props = {
  company: Company;
  onUpdate: (c: Company) => void;
};

const CURRENCIES: { code: string; label: string }[] = [
  { code: "IDR", label: "IDR — Indonesian Rupiah" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "CHF", label: "CHF — Swiss Franc" },
];

export default function Settings({ company, onUpdate }: Props) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({ name: company.name, currency: company.currency });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    onUpdate({ ...company, ...form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(company.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t("settings.subtitle")}</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">{t("settings.companyProfile")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>{t("settings.companyName")}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.currency")}</Label>
              <select
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full h-10 rounded-md bg-background border border-input text-foreground px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("settings.joinCode")}</Label>
              <div className="flex gap-2">
                <Input value={company.joinCode} readOnly className="font-mono text-muted-foreground" />
                <Button variant="outline" size="sm" onClick={copyCode} className="shrink-0 gap-2">
                  {copied ? <><Check className="h-3.5 w-3.5 text-[hsl(var(--income))]" /> {t("common.copied")}</> : <><Copy className="h-3.5 w-3.5" /> {t("common.copy")}</>}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t("settings.joinCodeHint")}</p>
            </div>
            <Button onClick={handleSave} className="gap-2">
              {saved ? <><Check className="h-4 w-4" /> {t("common.saved")}</> : <><Save className="h-4 w-4" /> {t("common.save")}</>}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
        <Card className="border shadow-sm">
          <CardHeader className="p-5 pb-0">
            <div className="flex items-center gap-3 flex-row">
              <div className="p-2 rounded-lg bg-primary/10">
                <Languages className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold">{t("settings.languageSection")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-2">
              <Label>{t("settings.language")}</Label>
              <select
                value={i18n.language.split("-")[0]}
                onChange={e => changeLanguage(e.target.value)}
                className="w-full h-10 rounded-md bg-background border border-input text-foreground px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="en">{t("languages.en")}</option>
                <option value="id">{t("languages.id")}</option>
                <option value="zh">{t("languages.zh")}</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1.5">{t("settings.languageHint")}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold font-mono-nums">1</p>
                <p className="text-xs text-muted-foreground mt-1">{t("settings.teamMembers")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono-nums">{form.currency}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("settings.baseCurrency")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono-nums">Pro</p>
                <p className="text-xs text-muted-foreground mt-1">{t("settings.plan")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
