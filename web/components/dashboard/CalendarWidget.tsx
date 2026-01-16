'use client';

import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CalendarEvent {
    title: string;
    start: string;
    end: string;
    type: 'leave' | 'holiday';
}

interface CalendarWidgetProps {
    events: CalendarEvent[];
}

export const CalendarWidget = ({ events }: CalendarWidgetProps) => {
    const { t, currentLocale } = useLanguage();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    // Helper to check if a day has events
    const getEventsForDay = (day: Date) => {
        return events.filter(event => {
            const start = new Date(event.start);
            const end = new Date(event.end);
            // Simple check: is day within start and end range (inclusive)
            // Normalize times to compare dates only
            const check = new Date(day);
            check.setHours(0, 0, 0, 0);
            const s = new Date(start);
            s.setHours(0, 0, 0, 0);
            const e = new Date(end);
            e.setHours(23, 59, 59, 999);

            return check >= s && check <= e;
        });
    };

    return (
        <Card className="shadow-sm border-slate-200 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <span className="capitalize">{format(currentMonth, 'MMMM yyyy', { locale: currentLocale === 'id' ? id : undefined })}</span>
                </CardTitle>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={goToToday}>
                        {t.calendar.today}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-3">
                <div className="grid grid-cols-7 mb-2">
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
                        <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 h-full auto-rows-fr">
                    {days.map((day, idx) => {
                        const dayEvents = getEventsForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isDayToday = isToday(day);

                        return (
                            <div
                                key={idx}
                                className={`
                                    min-h-[40px] p-1 rounded-md border text-xs relative group flex flex-col justify-between
                                    ${isCurrentMonth ? 'bg-white' : 'bg-slate-50 text-slate-300'}
                                    ${isDayToday ? 'border-primary/50 bg-primary/5 font-semibold text-primary' : 'border-transparent hover:border-slate-200'}
                                `}
                            >
                                <span className={`block text-right ${!isCurrentMonth && 'opacity-30'}`}>{format(day, 'd')}</span>

                                {dayEvents.length > 0 && (
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        {dayEvents.slice(0, 2).map((ev, i) => (
                                            <TooltipProvider key={i}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="h-1.5 w-full rounded-full bg-orange-200 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-xs">{ev.title}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[8px] text-slate-400 text-center leading-none">+{dayEvents.length - 2}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
