"use client"

import * as React from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { format, subDays, parseISO } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DateRange {
    from: Date | undefined
    to?: Date | undefined
}

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
    date: DateRange | undefined
    onDateChange: (date: DateRange | undefined) => void
}

export function DateRangePicker({
    className,
    date,
    onDateChange,
}: DateRangePickerProps) {
    const [open, setOpen] = React.useState(false)
    const [tempFrom, setTempFrom] = React.useState(date?.from ? format(date.from, "yyyy-MM-dd") : "")
    const [tempTo, setTempTo] = React.useState(date?.to ? format(date.to, "yyyy-MM-dd") : "")

    React.useEffect(() => {
        setTempFrom(date?.from ? format(date.from, "yyyy-MM-dd") : "")
        setTempTo(date?.to ? format(date.to, "yyyy-MM-dd") : "")
    }, [date])

    const handleApply = () => {
        const from = tempFrom ? parseISO(tempFrom) : undefined
        const to = tempTo ? parseISO(tempTo) : undefined
        onDateChange({ from, to })
        setOpen(false)
    }

    const handlePreset = (days: number) => {
        const to = new Date()
        const from = subDays(to, days)
        onDateChange({ from, to })
        setOpen(false)
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal bg-white h-10 border-slate-200 shadow-sm hover:bg-slate-50 transition-colors",
                            !date?.from && "text-slate-400"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                        {date?.from ? (
                            date.to ? (
                                <span className="text-slate-700 text-sm">
                                    {format(date.from, "dd MMM yyyy")} - {format(date.to, "dd MMM yyyy")}
                                </span>
                            ) : (
                                <span className="text-slate-700 text-sm">{format(date.from, "dd MMM yyyy")}</span>
                            )
                        ) : (
                            <span className="text-sm">Filter Berdasarkan Tanggal</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-white shadow-2xl border-slate-200 rounded-xl overflow-hidden" align="end">
                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Rentang</span>
                            {date?.from && (
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-slate-400 hover:text-red-500" onClick={() => onDateChange(undefined)}>
                                    Hapus Filter
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">Dari</label>
                                <Input
                                    type="date"
                                    className="h-9 text-xs border-slate-200 bg-slate-50/50 focus:bg-white"
                                    value={tempFrom}
                                    onChange={(e) => setTempFrom(e.target.value)}
                                    max={tempTo || format(new Date(), "yyyy-MM-dd")}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">Sampai</label>
                                <Input
                                    type="date"
                                    className="h-9 text-xs border-slate-200 bg-slate-50/50 focus:bg-white"
                                    value={tempTo}
                                    onChange={(e) => setTempTo(e.target.value)}
                                    min={tempFrom}
                                    max={format(new Date(), "yyyy-MM-dd")}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'Hari Ini', days: 0 },
                                { label: '7 Hari', days: 6 },
                                { label: '30 Hari', days: 29 },
                            ].map((p) => (
                                <Button
                                    key={p.label}
                                    variant="outline"
                                    size="sm"
                                    className="text-[10px] h-8 bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium"
                                    onClick={() => handlePreset(p.days)}
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </div>

                        <Button className="w-full text-xs font-bold h-10 shadow-lg shadow-primary/20" size="sm" onClick={handleApply}>
                            Terapkan Rentang Tanggal
                        </Button>
                    </div>
                    <div className="bg-slate-50 p-2 border-t border-slate-100 text-center">
                        <p className="text-[9px] text-slate-400 italic font-medium">Data absensi akan disaring sesuai tanggal di atas</p>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
