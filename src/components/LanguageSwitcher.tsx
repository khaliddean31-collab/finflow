import { useTranslation } from "react-i18next";
import { Languages, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
    const { t, i18n } = useTranslation();

    const languages = [
        { code: "en", name: t("languages.en") },
        { code: "id", name: t("languages.id") },
        { code: "zh", name: t("languages.zh") },
    ];

    const currentLanguage = i18n.language.split("-")[0];

    const handleLanguageChange = (code: string) => {
        i18n.changeLanguage(code);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-[hsl(var(--sidebar-accent))]">
                    <Languages className="h-4 w-4 text-[hsl(var(--sidebar-foreground))] hover:text-white transition-colors" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] text-white">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`flex items-center justify-between cursor-pointer focus:bg-[hsl(var(--primary)/0.2)] focus:text-white ${currentLanguage === lang.code ? "bg-[hsl(var(--primary)/0.1)] text-white" : "text-[hsl(var(--sidebar-foreground))]"
                            }`}
                    >
                        <span>{lang.name}</span>
                        {currentLanguage === lang.code && (
                            <Check className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
