'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSwitcherProps {
    mode?: 'mobile' | 'desktop';
    className?: string;
    size?: 'default' | 'small';
    isCollapsed?: boolean; // Add isCollapsed prop
}

export function LanguageSwitcher({ mode = 'desktop', className, size = 'default', isCollapsed = false }: LanguageSwitcherProps) {
    const { locale, setLocale } = useLanguage();

    const languageName = locale === 'id' ? 'Indonesia' : 'English';
    const flag = locale === 'id' ? '🇮🇩' : '🇬🇧';

    const iconSize = size === 'small' ? 'h-3 w-3' : 'h-4 w-4';
    const textSize = size === 'small' ? 'text-xs' : 'text-sm';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2 rounded-full transition-colors group cursor-pointer outline-none",
                        mode === 'mobile'
                            ? 'text-sm font-bold text-slate-700 hover:text-primary justify-start px-0 w-full'
                            : isCollapsed ? 'p-2 hover:bg-slate-100 justify-center' : 'px-3 py-1.5 hover:bg-slate-100',
                        className
                    )}
                >
                    {mode === 'desktop' ? (
                        <>
                            <Globe className={cn(iconSize, "text-slate-600 group-hover:text-primary transition-colors")} />
                            {!isCollapsed && (
                                <span className={cn(textSize, "font-semibold text-slate-700 group-hover:text-primary transition-colors")}>
                                    {languageName}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="flex items-center gap-2">
                            <span className="text-lg leading-none">{flag}</span>
                            <span className="font-semibold">{languageName}</span>
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isCollapsed ? 'end' : (mode === 'mobile' ? 'start' : 'start')} sideOffset={8}>
                <DropdownMenuItem onClick={() => setLocale('id')} className="cursor-pointer font-medium">
                    {mode === 'mobile' ? '🇮🇩 ' : ''}Indonesia
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale('en')} className="cursor-pointer font-medium">
                    {mode === 'mobile' ? '🇬🇧 ' : ''}English
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
