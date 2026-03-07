import { useEffect, useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Company, Transaction } from "@/lib/data";
import {
  getProfile,
  getUserCompany,
  getTransactions,
  getCompanyMemberCount,
  getCurrentUserRole,
  addTransaction as dbAddTransaction,
  deleteTransaction as dbDeleteTransaction,
} from "@/lib/database";
import AuthPage from "@/pages/AuthPage";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Ledger from "@/pages/Ledger";
import Settings from "@/pages/Settings";
import AppSidebar from "@/components/AppSidebar";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[hsl(var(--sidebar-background))] flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-[hsl(var(--primary))] animate-spin" />
    </div>
  );
}

// ─── Main App Shell (authenticated) ──────────────────────────────────────────

function AppShell() {
  const { user, loading: authLoading, signOut } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [userName, setUserName] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "member">("member");
  const [appLoading, setAppLoading] = useState(true);

  // Transactions: start empty, loaded from DB after company is known
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // ── Load profile + company when user auth is established ──────────────────
  useEffect(() => {
    if (!user) {
      setAppLoading(false);
      return;
    }

    async function loadUserData() {
      setAppLoading(true);
      try {
        // Load display name from profiles table
        const { profile } = await getProfile(user!.id);
        if (profile?.full_name) setUserName(profile.full_name);

        // Load the company the user owns or is a member of
        const { company: companyRow } = await getUserCompany(user!.id);
        if (companyRow) {
          const [{ count }, { role }] = await Promise.all([
            getCompanyMemberCount(companyRow.id),
            getCurrentUserRole(user!.id, companyRow.id),
          ]);
          setCurrentUserRole(role);
          setCompany({
            id: companyRow.id,
            name: companyRow.name,
            currency: companyRow.currency,
            joinCode: companyRow.join_code,
            memberCount: count ?? 1,
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setAppLoading(false);
      }
    }

    loadUserData();
  }, [user]);

  // ── Load transactions from DB whenever company changes ────────────────────
  useEffect(() => {
    if (!company) {
      setTransactions([]);
      return;
    }

    async function loadTransactions() {
      setTxLoading(true);
      const { transactions: rows } = await getTransactions(company!.id);
      setTransactions(
        rows.map((r) => ({
          id: r.id,
          title: r.title,
          amount: r.amount,
          category: r.category,
          type: r.type,
          date: r.date,
          note: r.note,
        }))
      );
      setTxLoading(false);
    }

    loadTransactions();
  }, [company]);

  // ── Add transaction → persist to DB, then push to local state ────────────
  const addTransaction = useCallback(
    async (t: Omit<Transaction, "id">) => {
      if (!company || !user) return;

      const { transaction, error } = await dbAddTransaction(company.id, user.id, t);

      if (error || !transaction) {
        console.error("Failed to save transaction:", error?.message);
        return;
      }

      setTransactions((prev) => [
        {
          id: transaction.id,
          title: transaction.title,
          amount: transaction.amount,
          category: transaction.category,
          type: transaction.type,
          date: transaction.date,
          note: transaction.note,
        },
        ...prev,
      ]);
    },
    [company, user]
  );

  // ── Delete transaction → remove from DB, then from local state ───────────
  const deleteTransaction = useCallback(
    async (id: string) => {
      const { error } = await dbDeleteTransaction(id);
      if (error) {
        console.error("Failed to delete transaction:", error.message);
        return;
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    []
  );

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut();
    setCompany(null);
    setUserName("");
    setCurrentUserRole("member");
    setTransactions([]);
  };

  // ─── Render logic ──────────────────────────────────────────────────────────

  if (authLoading || appLoading) return <LoadingScreen />;

  if (!user) {
    return <AuthPage onSuccess={() => {/* Auth context updates automatically */ }} />;
  }

  if (!company) {
    return (
      <Onboarding
        onComplete={(c, u) => {
          setCompany(c);
          setUserName(u || userName || user.email?.split("@")[0] || "User");
        }}
        userId={user.id}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        company={company}
        userName={userName || user.email?.split("@")[0] || "User"}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                transactions={transactions}
                currency={company.currency}
                loading={txLoading}
              />
            }
          />
          <Route
            path="/ledger"
            element={
              <Ledger
                transactions={transactions}
                onAdd={addTransaction}
                onDelete={deleteTransaction}
                currency={company.currency}
                loading={txLoading}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <Settings
                company={company}
                onUpdate={setCompany}
                currentUserId={user.id}
                currentUserRole={currentUserRole}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
