'use client';

import { Menu, User } from "lucide-react";

import { useLanguage } from "@/lib/contexts/LanguageContext";

interface BottomNavProps {
    onMenuClick: () => void;
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
    const { t } = useLanguage();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden block">
            <div className="flex justify-around items-center h-16">
                <button
                    onClick={onMenuClick}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-700"
                >
                    <Menu className="h-5 w-5" />
                    <span className="text-xs font-medium">Menu</span>
                </button>
                <button
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-700"
                >
                    <User className="h-5 w-5" />
                    <span className="text-xs font-medium">{t.user.profile}</span>
                </button>
            </div>
        </div>
    );
}
