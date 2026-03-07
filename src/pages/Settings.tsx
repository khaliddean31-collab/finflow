import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Building2, Save, Copy, Check, Languages, Users, Crown,
  ShieldCheck, User, MoreVertical, Loader2, RefreshCw,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Company } from "@/lib/data";
import { useTranslation } from "react-i18next";
import {
  getCompanyMembers, updateMemberRole, MemberRow, updateCompany,
} from "@/lib/database";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
  company: Company;
  onUpdate: (c: Company) => void;
  currentUserId: string;
  currentUserRole: "admin" | "member";
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

// ─── Context Menu ─────────────────────────────────────────────────────────────

type ContextMenuState = {
  x: number;
  y: number;
  member: MemberRow;
} | null;

// ─── Component ────────────────────────────────────────────────────────────────

export default function Settings({ company, onUpdate, currentUserId, currentUserRole }: Props) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({ name: company.name, currency: company.currency });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Members
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // ── Load members ─────────────────────────────────────────────────────────

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    const { members: rows } = await getCompanyMembers(company.id);
    setMembers(rows);
    setMembersLoading(false);
  }, [company.id]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  // ── Close context menu when clicking outside ──────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contextMenu]);

  // ── Save company profile ──────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    const { company: updated, error } = await updateCompany(company.id, {
      name: form.name,
      currency: form.currency,
    });
    if (!error && updated) {
      onUpdate({
        ...company,
        name: updated.name,
        currency: updated.currency,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(company.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const changeLanguage = (lng: string) => i18n.changeLanguage(lng);

  // ── Role management ───────────────────────────────────────────────────────

  const handleRightClick = (e: React.MouseEvent, member: MemberRow) => {
    e.preventDefault();
    // Only admins can right-click other members (not self)
    if (currentUserRole !== "admin") return;
    if (member.user_id === currentUserId) return;
    setContextMenu({ x: e.clientX, y: e.clientY, member });
  };

  const handlePromoteOrDemote = async (member: MemberRow, newRole: "admin" | "member") => {
    setContextMenu(null);
    setRoleUpdating(member.user_id);
    const { error } = await updateMemberRole(member.user_id, company.id, newRole);
    if (!error) {
      setMembers((prev) =>
        prev.map((m) => m.user_id === member.user_id ? { ...m, role: newRole } : m)
      );
    }
    setRoleUpdating(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const isAdmin = currentUserRole === "admin";

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto" onClick={() => setContextMenu(null)}>
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t("settings.subtitle")}</p>
      </div>

      {/* ── Company Profile ── */}
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
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Acme Corp"
                disabled={!isAdmin && false /* both roles can edit name & currency */}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.currency")}</Label>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="w-full h-10 rounded-md bg-background border border-input text-foreground px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            {/* Join code — visible to everyone so they can share */}
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
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading")}</>
                : saved
                  ? <><Check className="h-4 w-4" /> {t("common.saved")}</>
                  : <><Save className="h-4 w-4" /> {t("common.save")}</>
              }
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Team Members ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{t("settings.teamMembers")}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={loadMembers} disabled={membersLoading} className="h-8 w-8 p-0">
                <RefreshCw className={`h-3.5 w-3.5 ${membersLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t("settings.noMembers")}</p>
            ) : (
              <div className="space-y-1">
                {/* Header */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span>{t("settings.memberName")}</span>
                  <span className="text-center">{t("settings.memberRole")}</span>
                  {isAdmin && <span className="w-6" />}
                </div>
                {/* Rows */}
                {members.map((member) => {
                  const isCurrentUser = member.user_id === currentUserId;
                  const displayName = member.profiles?.full_name || t("settings.unknownMember");

                  return (
                    <div
                      key={member.user_id}
                      onContextMenu={(e) => handleRightClick(e, member)}
                      className={`grid grid-cols-[1fr_auto_auto] gap-3 items-center px-3 py-2.5 rounded-lg transition-colors
                        ${isAdmin && !isCurrentUser ? "cursor-context-menu hover:bg-muted/50" : ""}
                        ${isCurrentUser ? "bg-primary/5 ring-1 ring-primary/20" : ""}
                      `}
                    >
                      {/* Name */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                          ${member.role === "admin"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                          }`}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {displayName}
                            {isCurrentUser && (
                              <span className="ml-1.5 text-xs text-primary font-normal">({t("settings.you")})</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Role badge */}
                      <div>
                        {roleUpdating === member.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : member.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                            <Crown className="h-3 w-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                            <User className="h-3 w-3" />
                            Member
                          </span>
                        )}
                      </div>

                      {/* Context menu trigger (visible hint for admin) */}
                      {isAdmin && !isCurrentUser && (
                        <button
                          className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setContextMenu({ x: rect.left, y: rect.bottom + 4, member });
                          }}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {(!isAdmin || isCurrentUser) && <span className="w-6" />}
                    </div>
                  );
                })}
              </div>
            )}
            {isAdmin && members.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3 px-1">{t("settings.rightClickHint")}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Language ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
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
                onChange={(e) => changeLanguage(e.target.value)}
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

      {/* ── Stats ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold font-mono-nums">{members.length || company.memberCount || 1}</p>
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

      {/* ── Context Menu (Right Click) ── */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 min-w-[180px] rounded-lg border bg-popover shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 py-1.5 text-xs text-muted-foreground font-medium truncate">
            {contextMenu.member.profiles?.full_name || t("settings.unknownMember")}
          </p>
          <div className="h-px bg-border mx-1 my-1" />
          {contextMenu.member.role === "member" ? (
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 transition-colors text-left"
              onClick={() => handlePromoteOrDemote(contextMenu.member, "admin")}
            >
              <ShieldCheck className="h-4 w-4" />
              {t("settings.promoteToAdmin")}
            </button>
          ) : (
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
              onClick={() => handlePromoteOrDemote(contextMenu.member, "member")}
            >
              <User className="h-4 w-4" />
              {t("settings.demoteToMember")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
