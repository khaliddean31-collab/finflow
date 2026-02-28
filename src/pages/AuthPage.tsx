import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register, login } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";


// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "login" | "register";

type Props = {
    onSuccess: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuthPage({ onSuccess }: Props) {
    const { t } = useTranslation();
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const resetForm = () => {
        setEmail("");
        setPassword("");
        setFullName("");
        setError("");
        setSuccessMsg("");
    };

    const switchMode = (newMode: Mode) => {
        resetForm();
        setMode(newMode);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setLoading(true);

        if (mode === "register") {
            if (!fullName.trim()) {
                setError(t("auth.fullNameRequired"));
                setLoading(false);
                return;
            }
            if (password.length < 6) {
                setError(t("auth.passwordTooShort"));
                setLoading(false);
                return;
            }

            const { error } = await register({ email, password, fullName });
            setLoading(false);

            if (error) {
                setError(error.message);
            } else {
                setSuccessMsg(t("auth.accountCreated"));
                setTimeout(() => switchMode("login"), 3000);
            }
        } else {
            const { error } = await login({ email, password });
            setLoading(false);

            if (error) {
                setError(
                    error.message === "Invalid login credentials"
                        ? t("auth.incorrectCredentials")
                        : error.message
                );
            } else {
                onSuccess();
            }
        }
    };

    const variants = {
        enter: { opacity: 0, y: 24 },
        center: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -24 },
    };

    return (
        <div className="min-h-screen bg-[hsl(var(--sidebar-background))] flex items-center justify-center p-4">
            {/* Background glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[hsl(var(--primary)/0.08)] blur-3xl" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[hsl(var(--income)/0.06)] blur-3xl" />
            </div>

            {/* Top Toolbar */}
            <div className="absolute top-4 right-4 z-20">
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-md z-10">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 mb-10"
                >
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[hsl(var(--primary))]">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">FinFlow</span>
                </motion.div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[hsl(var(--sidebar-accent)/0.6)] backdrop-blur-xl border border-[hsl(var(--sidebar-border))] rounded-2xl p-8 shadow-2xl"
                >
                    {/* Tab switcher */}
                    <div className="flex bg-[hsl(var(--sidebar-background)/0.5)] rounded-xl p-1 mb-8">
                        {(["login", "register"] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => switchMode(m)}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${mode === m
                                    ? "bg-[hsl(var(--primary))] text-white shadow-md"
                                    : "text-[hsl(var(--sidebar-foreground))] hover:text-white"
                                    }`}
                            >
                                {m === "login" ? t("auth.signIn") : t("auth.register")}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                            {/* Heading */}
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-white mb-1">
                                    {mode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}
                                </h1>
                                <p className="text-sm text-[hsl(var(--sidebar-foreground))]">
                                    {mode === "login"
                                        ? t("auth.signInSubtitle")
                                        : t("auth.registerSubtitle")}
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Full name (register only) */}
                                <AnimatePresence>
                                    {mode === "register" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-2 overflow-hidden"
                                        >
                                            <Label className="text-[hsl(var(--sidebar-foreground))] text-sm">
                                                {t("auth.fullName")}
                                            </Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--sidebar-foreground))]" />
                                                <Input
                                                    id="auth-fullname"
                                                    type="text"
                                                    placeholder={t("auth.fullNamePlaceholder")}
                                                    value={fullName}
                                                    onChange={(e) => { setFullName(e.target.value); setError(""); }}
                                                    className="pl-10 bg-[hsl(var(--sidebar-background)/0.5)] border-[hsl(var(--sidebar-border))] text-white placeholder:text-[hsl(var(--sidebar-foreground))] h-11 focus:border-[hsl(var(--primary))]"
                                                    required={mode === "register"}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label className="text-[hsl(var(--sidebar-foreground))] text-sm">{t("auth.email")}</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--sidebar-foreground))]" />
                                        <Input
                                            id="auth-email"
                                            type="email"
                                            placeholder={t("auth.emailPlaceholder")}
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                            className="pl-10 bg-[hsl(var(--sidebar-background)/0.5)] border-[hsl(var(--sidebar-border))] text-white placeholder:text-[hsl(var(--sidebar-foreground))] h-11 focus:border-[hsl(var(--primary))]"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <Label className="text-[hsl(var(--sidebar-foreground))] text-sm">{t("auth.password")}</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--sidebar-foreground))]" />
                                        <Input
                                            id="auth-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder={mode === "register" ? t("auth.passwordMinLength") : t("auth.passwordPlaceholder")}
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                            className="pl-10 pr-10 bg-[hsl(var(--sidebar-background)/0.5)] border-[hsl(var(--sidebar-border))] text-white placeholder:text-[hsl(var(--sidebar-foreground))] h-11 focus:border-[hsl(var(--primary))]"
                                            required
                                            autoComplete={mode === "register" ? "new-password" : "current-password"}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--sidebar-foreground))] hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-[hsl(var(--expense))] text-sm bg-[hsl(var(--expense)/0.1)] border border-[hsl(var(--expense)/0.3)] rounded-lg px-3 py-2"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                {/* Success */}
                                {successMsg && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-[hsl(var(--income))] text-sm bg-[hsl(var(--income)/0.1)] border border-[hsl(var(--income)/0.3)] rounded-lg px-3 py-2"
                                    >
                                        {successMsg}
                                    </motion.p>
                                )}

                                {/* Submit */}
                                <Button
                                    type="submit"
                                    id="auth-submit"
                                    disabled={loading}
                                    className="w-full h-11 text-sm font-medium mt-2"
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : mode === "login" ? (
                                        <>{t("auth.signIn")} <ArrowRight className="ml-2 h-4 w-4" /></>
                                    ) : (
                                        <>{t("auth.createAccountBtn")} <ArrowRight className="ml-2 h-4 w-4" /></>
                                    )}
                                </Button>
                            </form>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                {/* Footer note */}
                <p className="text-center text-xs text-[hsl(var(--sidebar-foreground))] mt-6">
                    {t("common.appTagline")}
                </p>
            </div>
        </div>
    );
}
