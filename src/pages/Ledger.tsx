import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Download, Search, ArrowUpCircle, ArrowDownCircle, Trash2, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Transaction, CATEGORIES, formatCurrency } from "@/lib/data";
import { useTranslation } from "react-i18next";
import { exportTransactionsExcel } from "@/lib/exportExcel";

type Props = {
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, "id">) => void;
  onDelete: (id: string) => void;
  currency: string;
  companyName: string;
  loading?: boolean;
};

type FormState = { title: string; amount: string; category: string; type: "income" | "expense"; date: string; note: string };
const EMPTY_FORM: FormState = { title: "", amount: "", category: "", type: "expense" as "income" | "expense", date: new Date().toISOString().split("T")[0], note: "" };

export default function Ledger({ transactions, onAdd, onDelete, currency, companyName, loading = false }: Props) {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allCategories = [...CATEGORIES.income, ...CATEGORIES.expense];

  const filtered = useMemo(() => transactions
    .filter(t => filterType === "all" || t.type === filterType)
    .filter(t => filterCategory === "all" || t.category === filterCategory)
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, filterType, filterCategory, search]
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = t("ledger.required");
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = t("ledger.validAmount");
    if (!form.category) e.category = t("ledger.required");
    if (!form.date) e.date = t("ledger.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onAdd({ title: form.title, amount: Number(form.amount), category: form.category, type: form.type, date: form.date, note: form.note });
    setForm(EMPTY_FORM);
    setErrors({});
    setOpen(false);
  };

  const exportExcel = async () => {
    const lang = i18n.language.split("-")[0] as "id" | "en" | "zh";
    await exportTransactionsExcel(filtered, companyName, currency, filterType, lang);
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("ledger.title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? t("common.loading") : `${filtered.length} ${t(filtered.length === 1 ? "ledger.transaction" : "ledger.transactions")}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel} className="gap-2">
            <Download className="h-4 w-4" /> {t("ledger.exportExcel")}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> {t("ledger.addTransaction")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("ledger.newTransaction")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {/* Type Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  {(["income", "expense"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => { setForm(f => ({ ...f, type, category: "" })); }}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${form.type === type
                        ? type === "income"
                          ? "bg-[hsl(var(--income-light))] border-[hsl(var(--income))] text-[hsl(var(--income-foreground))]"
                          : "bg-[hsl(var(--expense-light))] border-[hsl(var(--expense))] text-[hsl(var(--expense-foreground))]"
                        : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                    >
                      {type === "income" ? t("ledger.incomeLabel") : t("ledger.expenseLabel")}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">{t("ledger.titleField")} *</Label>
                    <Input placeholder={t("ledger.titlePlaceholder")} value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(v => ({ ...v, title: "" })); }} />
                    {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">{t("ledger.amountField")} *</Label>
                    <Input type="number" placeholder="0.00" value={form.amount} onChange={e => { setForm(f => ({ ...f, amount: e.target.value })); setErrors(v => ({ ...v, amount: "" })); }} />
                    {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">{t("ledger.category")} *</Label>
                    <Select value={form.category} onValueChange={v => { setForm(f => ({ ...f, category: v })); setErrors(e => ({ ...e, category: "" })); }}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("ledger.selectCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES[form.type].map(c => <SelectItem key={c} value={c}>{t(`categories.${c}`, { defaultValue: c })}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">{t("ledger.dateField")} *</Label>
                    <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                    {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("ledger.noteField")}</Label>
                  <Input placeholder={t("ledger.notePlaceholder")} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => { setOpen(false); setErrors({}); }} className="flex-1">{t("common.cancel")}</Button>
                  <Button onClick={handleSubmit} className="flex-1">{t("ledger.addTransaction")}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("ledger.searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("ledger.allTypes")}</SelectItem>
                <SelectItem value="income">{t("ledger.income")}</SelectItem>
                <SelectItem value="expense">{t("ledger.expense")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("ledger.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("ledger.allCategories")}</SelectItem>
                {allCategories.map(c => <SelectItem key={c} value={c}>{t(`categories.${c}`, { defaultValue: c })}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <Card className="border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("ledger.date")}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("ledger.title_col")}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("ledger.category")}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("ledger.type")}</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">{t("ledger.amount")}</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">{t("ledger.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  // Skeleton rows while DB data is loading
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-3 rounded bg-muted animate-pulse" style={{ width: `${60 + (j * 10) % 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <div className="p-4 rounded-full bg-muted">
                          <Receipt className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-muted-foreground">
                          {transactions.length === 0 ? t("ledger.noTransactionsYet") : t("ledger.noResultsFilter")}
                        </p>
                        <p className="text-sm text-muted-foreground/70">
                          {transactions.length === 0
                            ? t("ledger.noTransactionsHint")
                            : t("ledger.noResultsFilterHint")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(tx => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-muted-foreground font-mono-nums text-xs">{tx.date}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium">{tx.title}</span>
                        {tx.note && <p className="text-xs text-muted-foreground">{tx.note}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          {t(`categories.${tx.category}`, { defaultValue: tx.category })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`flex items-center gap-1.5 text-xs font-medium w-fit ${tx.type === "income" ? "text-[hsl(var(--income))]" : "text-[hsl(var(--expense))]"}`}>
                          {tx.type === "income"
                            ? <ArrowUpCircle className="h-3.5 w-3.5" />
                            : <ArrowDownCircle className="h-3.5 w-3.5" />}
                          {tx.type === "income" ? t("ledger.income") : t("ledger.expense")}
                        </span>
                      </td>
                      <td className={`px-5 py-3.5 text-right font-semibold font-mono-nums ${tx.type === "income" ? "text-[hsl(var(--income))]" : "text-[hsl(var(--expense))]"}`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount, currency)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => onDelete(tx.id)} className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
