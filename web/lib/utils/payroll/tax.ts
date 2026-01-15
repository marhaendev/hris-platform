/**
 * Payroll Utility for PPh21 and BPJS (Indonesian Standard)
 */

export interface PTKPStatus {
    [key: string]: number;
}

// PTKP 2024 (Annual)
const PTKP_VALUES: PTKPStatus = {
    'TK/0': 54000000,
    'TK/1': 58500000,
    'TK/2': 63000000,
    'TK/3': 67500000,
    'K/0': 58500000,
    'K/1': 63000000,
    'K/2': 67500000,
    'K/3': 72000000,
    'K/I/0': 112500000, // Status Kawin + Istri Bekerja
};

export interface PayrollSettings {
    pension_percent?: number;
    pension_percent_active?: boolean;
    tax_biaya_jabatan_percent?: number;
    tax_biaya_jabatan_percent_active?: boolean;
    tax_biaya_jabatan_max?: number;
    tax_pph21_layer1?: number;
    tax_pph21_layer1_active?: boolean;
    tax_pph21_layer2?: number;
    tax_pph21_layer2_active?: boolean;
    tax_pph21_layer3?: number;
    tax_pph21_layer3_active?: boolean;
    tax_pph21_layer4?: number;
    tax_pph21_layer4_active?: boolean;
    tax_pph21_layer5?: number;
    tax_pph21_layer5_active?: boolean;
    bpjs_health_percent?: number;
    bpjs_health_percent_active?: boolean;
    bpjs_employment_percent?: number;
    bpjs_employment_percent_active?: boolean;
    // legacy support
    tax_pph21_percent_tier1?: number;
}

/**
 * Calculate Monthly PPh21
 */
export function calculatePPh21(
    monthlyGross: number,
    ptkpStatus: string = 'TK/0',
    hasNpwp: boolean = true,
    settings?: PayrollSettings
) {
    if (monthlyGross <= 0) return 0;

    // Check if Biaya Jabatan is active
    const isBiayaJabatanActive = settings?.tax_biaya_jabatan_percent_active ?? true;
    const biayaJabatanRate = isBiayaJabatanActive ? ((settings?.tax_biaya_jabatan_percent ?? 5) / 100) : 0;
    const biayaJabatanMaxMonthly = settings?.tax_biaya_jabatan_max ?? 500000;

    // 1. Annual Gross
    const annualGross = monthlyGross * 12;

    // 2. Deductions
    const annualBiayaJabatan = Math.min(annualGross * biayaJabatanRate, biayaJabatanMaxMonthly * 12);

    // 3. Net Annual Income
    const annualNet = annualGross - annualBiayaJabatan;

    // 4. PTKP
    const ptkpValue = PTKP_VALUES[ptkpStatus] || 54000000;

    // 5. Taxable Annual Income (PKP)
    let pkp = Math.max(annualNet - ptkpValue, 0);
    pkp = Math.floor(pkp / 1000) * 1000;

    if (pkp <= 0) return 0;

    // 6. Progressive Tax Rates
    let annualTax = 0;

    const getRate = (key: keyof PayrollSettings, def: number) => {
        const activeKey = `${String(key)}_active` as keyof PayrollSettings;
        const isActive = settings?.[activeKey] ?? true;
        return isActive ? ((settings?.[key] as number ?? def) / 100) : 0;
    };

    const r1 = getRate('tax_pph21_layer1', 5);
    const r2 = getRate('tax_pph21_layer2', 15);
    const r3 = getRate('tax_pph21_layer3', 25);
    const r4 = getRate('tax_pph21_layer4', 30);
    const r5 = getRate('tax_pph21_layer5', 35);

    // Layer calculations
    if (pkp > 0) {
        const l1 = Math.min(pkp, 60000000);
        annualTax += l1 * r1;
        pkp -= l1;
    }
    if (pkp > 0) {
        const l2 = Math.min(pkp, 190000000);
        annualTax += l2 * r2;
        pkp -= l2;
    }
    if (pkp > 0) {
        const l3 = Math.min(pkp, 250000000);
        annualTax += l3 * r3;
        pkp -= l3;
    }
    if (pkp > 0) {
        const l4 = Math.min(pkp, 4500000000);
        annualTax += l4 * r4;
        pkp -= l4;
    }
    if (pkp > 0) {
        annualTax += pkp * r5;
    }

    if (!hasNpwp) annualTax *= 1.2;

    return Math.round(annualTax / 12);
}

/**
 * BPJS Calculation
 */
export function calculateBPJS(baseSalary: number, settings?: PayrollSettings) {
    if (baseSalary <= 0) return { kesehatan: 0, ketenagakerjaan: 0, pensiun: 0, total: 0 };

    const getRate = (key: keyof PayrollSettings, def: number) => {
        const activeKey = `${String(key)}_active` as keyof PayrollSettings;
        const isActive = settings?.[activeKey] ?? true;
        return isActive ? ((settings?.[key] as number ?? def) / 100) : 0;
    };

    const healthRate = getRate('bpjs_health_percent', 1);
    const employmentRate = getRate('bpjs_employment_percent', 2);
    const pensionRate = getRate('pension_percent', 1);

    // BPJS Plafons (Values for 2024 estimation)
    const MAX_HEALTH_BASE = 12000000;
    const MAX_PENSION_BASE = 10042300; // Estimated 2024 limit

    const employeeBPJSKes = Math.min(baseSalary, MAX_HEALTH_BASE) * healthRate;
    const employeeBPJSKert = baseSalary * employmentRate;
    const employeePension = Math.min(baseSalary, MAX_PENSION_BASE) * pensionRate;

    return {
        kesehatan: Math.round(employeeBPJSKes),
        ketenagakerjaan: Math.round(employeeBPJSKert),
        pensiun: Math.round(employeePension),
        total: Math.round(employeeBPJSKes + employeeBPJSKert + employeePension)
    };
}
