import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Transaction, formatCurrency } from "@/lib/data";
import { useTranslation } from "react-i18next";


type Props = {
  transactions: Transaction[];
  currency: string;
  loading?: boolean;
};

const EXPENSE_COLORS = ["#10b981", "#f43f5e", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

const getCardAnim = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.4 },
});

export default function Dashboard({ transactions, currency, loading = false }: Props) {
  const { t } = useTranslation();
  const totalIncome = useMemo(() => transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [transactions]);
  const balance = totalIncome - totalExpense;

  const totalVolume = totalIncome + totalExpense;
  const cashFlowPieData = useMemo(() => {
    const data = [];
    if (totalIncome > 0) {
      data.push({
        name: t("dashboard.income", { defaultValue: "Pendapatan" }),
        value: totalIncome,
        color: "hsl(160,84%,39%)" // Green
      });
    }
    if (totalExpense > 0) {
      data.push({
        name: t("dashboard.expense", { defaultValue: "Pengeluaran" }),
        value: totalExpense,
        color: "hsl(0,84%,60%)" // Red
      });
    }
    return data;
  }, [totalIncome, totalExpense, t]);

  const monthlyChartData = useMemo(() => {
    if (transactions.length === 0) {
      const monthLabel = new Date().toLocaleString('default', { month: 'short' });
      return [{ month: monthLabel, income: 0, expense: 0 }];
    }

    const map = new Map<string, { month: string; income: number; expense: number }>();

    [...transactions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((tx) => {
        const d = new Date(tx.date);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        const key = `${d.getFullYear()}-${d.getMonth()}`;

        if (!map.has(key)) {
          map.set(key, { month: monthLabel, income: 0, expense: 0 });
        }

        const item = map.get(key)!;
        if (tx.type === "income") item.income += tx.amount;
        if (tx.type === "expense") item.expense += tx.amount;
      });

    return Array.from(map.values());
  }, [transactions]);

  const recentTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value, currency)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t("dashboard.subtitle")}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="h-3 rounded bg-muted animate-pulse w-1/2" />
                <div className="h-7 rounded bg-muted animate-pulse w-3/4" />
                <div className="h-3 rounded bg-muted animate-pulse w-1/3" />
              </CardContent>
            </Card>
          ))
        ) : (
          [
            {
              label: t("dashboard.netBalance"), value: balance, icon: Wallet,
              color: "text-[hsl(var(--primary))]", bg: "bg-[hsl(var(--primary)/0.08)]",
              change: "+12.5%", positive: true,
            },
            {
              label: t("dashboard.totalIncome"), value: totalIncome, icon: TrendingUp,
              color: "text-[hsl(var(--income))]", bg: "bg-[hsl(var(--income-light))]",
              change: "+8.2%", positive: true,
            },
            {
              label: t("dashboard.totalExpenses"), value: totalExpense, icon: TrendingDown,
              color: "text-[hsl(var(--expense))]", bg: "bg-[hsl(var(--expense-light))]",
              change: "+3.1%", positive: false,
            },
          ].map((card, i) => (
            <motion.div key={card.label} {...getCardAnim(i)}>
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
                      <p className={`text-2xl font-bold mt-1 font-mono-nums ${card.value < 0 ? "text-[hsl(var(--expense))]" : ""}`}>
                        {formatCurrency(Math.abs(card.value), currency)}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${card.bg}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    {card.positive ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-[hsl(var(--income))]" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-[hsl(var(--expense))]" />
                    )}
                    <span className={`text-xs font-medium ${card.positive ? "text-[hsl(var(--income))]" : "text-[hsl(var(--expense))]"}`}>
                      {card.change}
                    </span>
                    <span className="text-xs text-muted-foreground">{t("dashboard.vsLastMonth")}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card className="border shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{t("dashboard.incomeVsExpenses")}</CardTitle>
              <p className="text-xs text-muted-foreground">{t("dashboard.sixMonthTrend")}</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160,84%,39%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(160,84%,39%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0,84%,60%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(0,84%,60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220,10%,50%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(220,10%,50%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" name={t("dashboard.income")} stroke="hsl(160,84%,39%)" strokeWidth={2} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="expense" name={t("dashboard.expense")} stroke="hsl(0,84%,60%)" strokeWidth={2} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="border shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{t("dashboard.cashFlow", { defaultValue: "Ringkasan Arus Kas" })}</CardTitle>
              <p className="text-xs text-muted-foreground">{t("dashboard.incomeVsExpenseRatio", { defaultValue: "Pendapatan vs Pengeluaran" })}</p>
            </CardHeader>
            <CardContent>
              {cashFlowPieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={cashFlowPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        stroke="transparent"
                      >
                        {cashFlowPieData.map((item, i) => (
                          <Cell key={i} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => formatCurrency(val, currency)}
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 mt-4">
                    {cashFlowPieData.map((item) => {
                      const percent = totalVolume > 0 ? ((item.value / totalVolume) * 100).toFixed(1) : "0.0";
                      return (
                        <div key={item.name} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                            <span className="font-semibold text-muted-foreground">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-xs" style={{ color: item.color }}>{percent}%</span>
                            <span className="font-bold font-mono-nums text-right">{formatCurrency(item.value, currency)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="h-[240px] flex flex-col items-center justify-center text-center text-muted-foreground">
                  <PieChart className="h-12 w-12 opacity-20 mb-2" />
                  <p className="text-sm">{t("dashboard.noTransactions", { defaultValue: "Belum ada transaksi" })}</p>
                  <p className="text-xs opacity-70 mt-1">{t("dashboard.noTransactionsHint", { defaultValue: "Data grafik akan muncul setelah Anda menambahkan transaksi." })}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{t("dashboard.recentTransactions")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3 gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 rounded bg-muted animate-pulse w-1/2" />
                        <div className="h-2.5 rounded bg-muted animate-pulse w-1/3" />
                      </div>
                    </div>
                    <div className="h-3 rounded bg-muted animate-pulse w-20" />
                  </div>
                ))
              ) : recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <p className="text-sm font-medium text-muted-foreground">{t("dashboard.noTransactions")}</p>
                  <p className="text-xs text-muted-foreground/70">{t("dashboard.noTransactionsHint")}</p>
                </div>
              ) : (
                recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${t.type === "income" ? "income-badge" : "expense-badge"}`}>
                        {t.category[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{t.category} · {t.date}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold font-mono-nums ${t.type === "income" ? "text-[hsl(var(--income))]" : "text-[hsl(var(--expense))]"}`}>
                      {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount, currency)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
