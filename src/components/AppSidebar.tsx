import { NavLink } from "@/components/NavLink";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Receipt, Settings, ChevronLeft, ChevronRight,
  Building2, Sparkles, LogOut,
} from "lucide-react";
import { useState } from "react";
import { Company } from "@/lib/data";
import { useTranslation } from "react-i18next";


type Props = {
  company: Company;
  userName: string;
  onLogout: () => void;
};

const navItems = [
  { to: "/", icon: LayoutDashboard, key: "sidebar.dashboard", end: true },
  { to: "/ledger", icon: Receipt, key: "sidebar.ledger" },
  { to: "/settings", icon: Settings, key: "sidebar.settings" },
];

export default function AppSidebar({ company, userName, onLogout }: Props) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-screen bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(var(--primary))] shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-bold text-white text-lg overflow-hidden whitespace-nowrap"
            >
              FinFlow
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Company badge */}
      <div className="px-3 py-3 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3 rounded-lg bg-[hsl(var(--sidebar-accent))] px-3 py-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[hsl(var(--primary)/0.2)] shrink-0">
            <Building2 className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-xs font-semibold text-white truncate max-w-[130px]">{company.name}</p>
                <p className="text-xs text-[hsl(var(--sidebar-foreground))]">{company.currency}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, key, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white group`}
            activeClassName="bg-[hsl(var(--sidebar-accent))] text-white shadow-sm"
          >
            <Icon className="h-4 w-4 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {t(key)}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[hsl(var(--sidebar-border))] space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{(userName || "U")[0].toUpperCase()}</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-white truncate max-w-[110px]"
              >
                {userName || "User"}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-[hsl(var(--sidebar-foreground))] hover:text-white hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {t("Sign Out")}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(var(--sidebar-background))] border border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </motion.aside>
  );
}
