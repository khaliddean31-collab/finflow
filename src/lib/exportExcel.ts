import ExcelJS from "exceljs";
import { Transaction, formatCurrency } from "./data";

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
    brandBg: "1E293B",
    brandFg: "FFFFFF",
    accentBg: "0F172A",   // darker row for FinFlow credit line
    accentFg: "64748B",
    headerBg: "334155",
    headerFg: "F8FAFC",
    incomeBg: "F0FDF4",
    incomeFg: "15803D",
    incomeAmt: "16A34A",
    expenseBg: "FFF1F2",
    expenseFg: "BE123C",
    expenseAmt: "E11D48",
    altRow: "F8FAFC",
    white: "FFFFFF",
    summaryHeaderBg: "1E40AF",
    summaryHeaderFg: "FFFFFF",
    summaryIncomeBg: "DCFCE7",
    summaryExpenseBg: "FFE4E6",
    summaryNetPosBg: "D1FAE5",
    summaryNetNegBg: "FEE2E2",
    border: "CBD5E1",
};

const thin = { style: "thin" as const, color: { argb: COLORS.border } };
const allBorders = { top: thin, left: thin, bottom: thin, right: thin };

function applyBorders(cell: ExcelJS.Cell) { cell.border = allBorders; }
function fmt(amount: number, cur: string) { return formatCurrency(Math.abs(amount), cur); }

// ─── Translation Dictionary ───────────────────────────────────────────────────
type Lang = "id" | "en" | "zh";

const LABELS: Record<Lang, Record<string, string>> = {
    id: {
        reportTitle: "Laporan Keuangan",
        allTime: "Semua Waktu",
        exported: "Diekspor",
        totalIncome: "📈  TOTAL PENDAPATAN",
        totalExpense: "📉  TOTAL PENGELUARAN",
        netBalance: "💰  SALDO BERSIH",
        no: "No",
        date: "Tanggal",
        description: "Deskripsi",
        category: "Kategori",
        type: "Jenis",
        income: "↑ Pendapatan",
        incomeCol: "Pendapatan (+)",
        expense: "↓ Pengeluaran",
        expenseCol: "Pengeluaran (−)",
        notes: "Catatan",
        noData: "Tidak ada transaksi.",
        sheetTx: "Transaksi",
        sheetCat: "Ringkasan Kategori",
        catSummaryTitle: "Ringkasan per Kategori",
        catLabel: "Kategori",
        typeLabel: "Jenis",
        countLabel: "Jml Transaksi",
        totalLabel: "Total Jumlah",
        filterAll: "Semua Transaksi",
        filterIncome: "Hanya Pendapatan",
        filterExpense: "Hanya Pengeluaran",
        poweredBy: "FinFlow — Dibuat oleh Dean Khalid  |  finflow-dean.vercel.app",
    },
    en: {
        reportTitle: "Financial Report",
        allTime: "All Time",
        exported: "Exported",
        totalIncome: "📈  TOTAL INCOME",
        totalExpense: "📉  TOTAL EXPENSE",
        netBalance: "💰  NET BALANCE",
        no: "#",
        date: "Date",
        description: "Description",
        category: "Category",
        type: "Type",
        income: "↑ Income",
        incomeCol: "Income (+)",
        expense: "↓ Expense",
        expenseCol: "Expense (−)",
        notes: "Notes",
        noData: "No transactions found.",
        sheetTx: "Transactions",
        sheetCat: "Category Summary",
        catSummaryTitle: "Category Summary",
        catLabel: "Category",
        typeLabel: "Type",
        countLabel: "Transactions",
        totalLabel: "Total Amount",
        filterAll: "All Transactions",
        filterIncome: "Income Only",
        filterExpense: "Expense Only",
        poweredBy: "FinFlow — By Dean Khalid  |  finflow-dean.vercel.app",
    },
    zh: {
        reportTitle: "财务报告",
        allTime: "全部时间",
        exported: "导出时间",
        totalIncome: "📈  总收入",
        totalExpense: "📉  总支出",
        netBalance: "💰  净余额",
        no: "序号",
        date: "日期",
        description: "描述",
        category: "类别",
        type: "类型",
        income: "↑ 收入",
        incomeCol: "收入 (+)",
        expense: "↓ 支出",
        expenseCol: "支出 (−)",
        notes: "备注",
        noData: "暂无交易记录。",
        sheetTx: "交易记录",
        sheetCat: "类别汇总",
        catSummaryTitle: "类别汇总",
        catLabel: "类别",
        typeLabel: "类型",
        countLabel: "交易数",
        totalLabel: "总金额",
        filterAll: "所有交易",
        filterIncome: "仅收入",
        filterExpense: "仅支出",
        poweredBy: "FinFlow — 作者：Dean Khalid  |  finflow-dean.vercel.app",
    },
};

// Category name translations (same keys as i18n locale files)
const CAT_LABELS: Record<Lang, Record<string, string>> = {
    id: {
        "Product Sales": "Penjualan Produk",
        "Service Revenue": "Pendapatan Jasa",
        "Project Revenue": "Pendapatan Proyek",
        "Consulting": "Konsultasi",
        "Subscription": "Langganan",
        "Commission": "Komisi",
        "Royalty": "Royalti",
        "Investment Return": "Hasil Investasi",
        "Grant & Funding": "Hibah & Pendanaan",
        "Partnership Revenue": "Pendapatan Kemitraan",
        "Other Income": "Pendapatan Lainnya",
        "Operations": "Operasional",
        "Payroll & Benefits": "Gaji & Tunjangan",
        "Marketing & Ads": "Marketing & Iklan",
        "Software & Tools": "Perangkat Lunak",
        "Infrastructure": "Infrastruktur",
        "Office & Facilities": "Kantor & Fasilitas",
        "Business Travel": "Perjalanan Bisnis",
        "Legal & Compliance": "Hukum & Kepatuhan",
        "Research & Dev": "Riset & Pengembangan",
        "Training": "Pelatihan SDM",
        "Tax & Duties": "Pajak & Bea",
        "Vendor & Supplies": "Vendor & Perlengkapan",
        "Other Expense": "Pengeluaran Lainnya",
    },
    en: {},  // English keys are the same as source
    zh: {
        "Product Sales": "产品销售",
        "Service Revenue": "服务收入",
        "Project Revenue": "项目收入",
        "Consulting": "咨询收入",
        "Subscription": "订阅收入",
        "Commission": "佣金",
        "Royalty": "版税",
        "Investment Return": "投资回报",
        "Grant & Funding": "补贴与资助",
        "Partnership Revenue": "合作收入",
        "Other Income": "其他收入",
        "Operations": "运营",
        "Payroll & Benefits": "薪资与福利",
        "Marketing & Ads": "营销与广告",
        "Software & Tools": "软件与工具",
        "Infrastructure": "基础设施",
        "Office & Facilities": "办公与设施",
        "Business Travel": "商务出行",
        "Legal & Compliance": "法律与合规",
        "Research & Dev": "研发",
        "Training": "员工培训",
        "Tax & Duties": "税务",
        "Vendor & Supplies": "供应商与物料",
        "Other Expense": "其他支出",
    },
};

// ─── Main Export Function ─────────────────────────────────────────────────────

export async function exportTransactionsExcel(
    transactions: Transaction[],
    companyName: string,
    currencyCode: string,
    filterKey: "all" | "income" | "expense",
    lang: string = "en"
) {
    const L = LABELS[(lang as Lang) in LABELS ? (lang as Lang) : "en"];
    const C = CAT_LABELS[(lang as Lang) in CAT_LABELS ? (lang as Lang) : "en"];
    const tCat = (key: string) => C[key] ?? key;

    const filterLabel = filterKey === "income"
        ? L.filterIncome
        : filterKey === "expense"
            ? L.filterExpense
            : L.filterAll;

    const locales: Record<Lang, string> = { id: "id-ID", en: "en-US", zh: "zh-CN" };
    const locale = locales[(lang as Lang)] ?? "en-US";
    const exportDate = new Date().toLocaleDateString(locale, {
        day: "2-digit", month: "long", year: "numeric",
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "FinFlow — By Dean Khalid";
    wb.created = new Date();

    // ══════════════════════════════════════════════════════════════════════════
    // Sheet 1: Transactions
    // ══════════════════════════════════════════════════════════════════════════
    const ws = wb.addWorksheet(L.sheetTx, {
        views: [{ state: "frozen", ySplit: 8 }],
        pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    });

    ws.columns = [
        { key: "no", width: 6 },
        { key: "date", width: 14 },
        { key: "title", width: 32 },
        { key: "category", width: 24 },
        { key: "type", width: 14 },
        { key: "debit", width: 20 },
        { key: "credit", width: 20 },
        { key: "note", width: 28 },
    ];

    // ── Row 1: Company brand bar ──────────────────────────────────────────────
    ws.mergeCells("A1:H1");
    const r1 = ws.getCell("A1");
    r1.value = `🏢  ${companyName.toUpperCase()}`;
    r1.font = { name: "Calibri", size: 18, bold: true, color: { argb: COLORS.brandFg } };
    r1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.brandBg } };
    r1.alignment = { vertical: "middle", horizontal: "left", indent: 2 };
    ws.getRow(1).height = 44;

    // ── Row 2: Report subtitle ────────────────────────────────────────────────
    ws.mergeCells("A2:H2");
    const r2 = ws.getCell("A2");
    r2.value = `${L.reportTitle}  •  ${filterLabel}  •  ${L.exported}: ${exportDate}`;
    r2.font = { name: "Calibri", size: 10, italic: true, color: { argb: "94A3B8" } };
    r2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.brandBg } };
    r2.alignment = { vertical: "middle", horizontal: "left", indent: 2 };
    ws.getRow(2).height = 22;

    // ── Row 3: FinFlow credit bar ─────────────────────────────────────────────
    ws.mergeCells("A3:H3");
    const r3 = ws.getCell("A3");
    r3.value = L.poweredBy;
    r3.font = { name: "Calibri", size: 8.5, italic: true, color: { argb: "475569" } };
    r3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    r3.alignment = { vertical: "middle", horizontal: "right", indent: 2 };
    ws.getRow(3).height = 16;

    // ── Row 4: Spacer ─────────────────────────────────────────────────────────
    ws.getRow(4).height = 6;

    // ── Row 5-6: Summary Cards ────────────────────────────────────────────────
    const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const netBalance = totalIncome - totalExpense;

    ws.mergeCells("B5:C5"); ws.mergeCells("D5:E5"); ws.mergeCells("F5:H5");
    [ws.getCell("B5"), ws.getCell("D5"), ws.getCell("F5")].forEach((cell, i) => {
        cell.value = [L.totalIncome, L.totalExpense, L.netBalance][i];
        cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.summaryHeaderFg } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.summaryHeaderBg } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        ws.getRow(5).height = 20;
    });

    ws.mergeCells("B6:C6"); ws.mergeCells("D6:E6"); ws.mergeCells("F6:H6");
    const valIncome = ws.getCell("B6");
    const valExpense = ws.getCell("D6");
    const valNet = ws.getCell("F6");

    valIncome.value = fmt(totalIncome, currencyCode);
    valExpense.value = fmt(totalExpense, currencyCode);
    valNet.value = (netBalance >= 0 ? "+ " : "− ") + fmt(Math.abs(netBalance), currencyCode);

    valIncome.font = { name: "Calibri", size: 14, bold: true, color: { argb: COLORS.incomeAmt } };
    valExpense.font = { name: "Calibri", size: 14, bold: true, color: { argb: COLORS.expenseAmt } };
    valNet.font = { name: "Calibri", size: 14, bold: true, color: { argb: netBalance >= 0 ? COLORS.incomeAmt : COLORS.expenseAmt } };

    valIncome.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.summaryIncomeBg } };
    valExpense.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.summaryExpenseBg } };
    valNet.fill = { type: "pattern", pattern: "solid", fgColor: { argb: netBalance >= 0 ? COLORS.summaryNetPosBg : COLORS.summaryNetNegBg } };

    [valIncome, valExpense, valNet].forEach(c => {
        c.alignment = { horizontal: "center", vertical: "middle" };
        ws.getRow(6).height = 32;
    });

    // ── Row 7: Spacer ─────────────────────────────────────────────────────────
    ws.getRow(7).height = 6;

    // ── Row 8: Column Headers ─────────────────────────────────────────────────
    const headers = [L.no, L.date, L.description, L.category, L.type, L.incomeCol, L.expenseCol, L.notes];
    const hRow = ws.getRow(8);
    hRow.height = 26;
    headers.forEach((h, idx) => {
        const cell = hRow.getCell(idx + 1);
        cell.value = h;
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLORS.headerFg } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
        cell.alignment = { horizontal: idx >= 5 ? "right" : "left", vertical: "middle", indent: idx === 0 ? 0 : 1 };
        applyBorders(cell);
    });

    // ── Rows 9+: Data ─────────────────────────────────────────────────────────
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    sorted.forEach((tx, idx) => {
        const row = ws.getRow(idx + 9);
        row.height = 22;
        const isIncome = tx.type === "income";
        const rowBg = isIncome ? COLORS.incomeBg : (idx % 2 === 1 ? COLORS.altRow : COLORS.white);

        const values = [
            idx + 1,
            tx.date,
            tx.title,
            tCat(tx.category),
            isIncome ? L.income : L.expense,
            isIncome ? tx.amount : null,
            !isIncome ? tx.amount : null,
            tx.note ?? "",
        ];

        values.forEach((val, ci) => {
            const cell = row.getCell(ci + 1);
            cell.value = val;
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
            const isAmt = ci === 5 || ci === 6;
            cell.font = {
                name: "Calibri", size: 10, bold: isAmt,
                color: { argb: isAmt && isIncome ? COLORS.incomeAmt : isAmt && !isIncome ? COLORS.expenseAmt : ci === 4 ? (isIncome ? COLORS.incomeFg : COLORS.expenseFg) : "1E293B" },
            };
            cell.alignment = { horizontal: ci >= 5 ? "right" : ci === 0 ? "center" : "left", vertical: "middle", indent: ci > 0 && ci < 5 ? 1 : 0 };
            if (isAmt && val !== null) cell.numFmt = "#,##0.00";
            applyBorders(cell);
        });
    });

    if (sorted.length === 0) {
        ws.mergeCells("A9:H9");
        const empty = ws.getCell("A9");
        empty.value = L.noData;
        empty.font = { name: "Calibri", size: 11, italic: true, color: { argb: "94A3B8" } };
        empty.alignment = { horizontal: "center", vertical: "middle" };
        ws.getRow(9).height = 30;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Sheet 2: Category Summary
    // ══════════════════════════════════════════════════════════════════════════
    const ws2 = wb.addWorksheet(L.sheetCat);
    ws2.columns = [
        { key: "cat", width: 28 },
        { key: "type", width: 16 },
        { key: "count", width: 14 },
        { key: "total", width: 22 },
    ];

    // Title row
    ws2.mergeCells("A1:D1");
    const catTitle = ws2.getCell("A1");
    catTitle.value = `🏢  ${companyName.toUpperCase()}  —  ${L.catSummaryTitle}`;
    catTitle.font = { name: "Calibri", size: 14, bold: true, color: { argb: COLORS.brandFg } };
    catTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.brandBg } };
    catTitle.alignment = { horizontal: "left", vertical: "middle", indent: 2 };
    ws2.getRow(1).height = 38;

    // FinFlow credit
    ws2.mergeCells("A2:D2");
    const catCredit = ws2.getCell("A2");
    catCredit.value = L.poweredBy;
    catCredit.font = { name: "Calibri", size: 8.5, italic: true, color: { argb: "475569" } };
    catCredit.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    catCredit.alignment = { horizontal: "right", vertical: "middle", indent: 2 };
    ws2.getRow(2).height = 16;

    // Spacer
    ws2.getRow(3).height = 6;

    // Headers
    const hdrs2 = [L.catLabel, L.typeLabel, L.countLabel, L.totalLabel];
    const hRow2 = ws2.getRow(4);
    hRow2.height = 24;
    hdrs2.forEach((h, i) => {
        const cell = hRow2.getCell(i + 1);
        cell.value = h;
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLORS.headerFg } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
        cell.alignment = { horizontal: i >= 2 ? "right" : "left", vertical: "middle", indent: 1 };
        applyBorders(cell);
    });

    // Data rows
    const catMap = new Map<string, { type: string; count: number; total: number }>();
    transactions.forEach(tx => {
        const key = `${tx.category}||${tx.type}`;
        const ex = catMap.get(key) ?? { type: tx.type, count: 0, total: 0 };
        catMap.set(key, { ...ex, count: ex.count + 1, total: ex.total + tx.amount });
    });

    Array.from(catMap.entries())
        .sort(([, a], [, b]) => b.total - a.total)
        .forEach(([key, { type, count, total }], i) => {
            const [cat] = key.split("||");
            const row = ws2.getRow(i + 5);
            row.height = 22;
            const isInc = type === "income";
            const bg = i % 2 === 0 ? COLORS.white : COLORS.altRow;

            const vals = [tCat(cat), isInc ? L.income : L.expense, count, total];
            vals.forEach((v, ci) => {
                const cell = row.getCell(ci + 1);
                cell.value = v;
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ci === 3 ? (isInc ? COLORS.incomeBg : COLORS.expenseBg) : bg } };
                cell.font = { name: "Calibri", size: 10, bold: ci === 3, color: { argb: ci === 3 ? (isInc ? COLORS.incomeAmt : COLORS.expenseAmt) : "1E293B" } };
                cell.alignment = { horizontal: ci >= 2 ? "right" : "left", vertical: "middle", indent: 1 };
                if (ci === 3) cell.numFmt = "#,##0.00";
                applyBorders(cell);
            });
        });

    // ── Generate & Download ───────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${companyName.replace(/\s+/g, "-")}_${L.sheetTx}_${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
}
