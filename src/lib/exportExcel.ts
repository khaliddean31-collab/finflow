import ExcelJS from "exceljs";
import { Transaction, formatCurrency } from "./data";

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
    // Header brand bar
    brandBg: "1E293B",       // dark slate
    brandFg: "FFFFFF",

    // Column header row
    headerBg: "334155",      // slate-700
    headerFg: "F8FAFC",

    // Income row
    incomeBg: "F0FDF4",      // green-50
    incomeFg: "15803D",      // green-700
    incomeAmt: "16A34A",     // green-600

    // Expense row
    expenseBg: "FFF1F2",     // rose-50
    expenseFg: "BE123C",     // rose-700
    expenseAmt: "E11D48",    // rose-600

    // Alternating row
    altRow: "F8FAFC",        // slate-50
    white: "FFFFFF",

    // Summary section
    summaryHeaderBg: "1E40AF", // blue-800
    summaryHeaderFg: "FFFFFF",
    summaryIncomeBg: "DCFCE7",
    summaryExpenseBg: "FFE4E6",
    summaryNetPosBg: "D1FAE5",
    summaryNetNegBg: "FEE2E2",

    // Border
    border: "CBD5E1",        // slate-300
};

const thin = { style: "thin" as const, color: { argb: COLORS.border } };
const allBorders = { top: thin, left: thin, bottom: thin, right: thin };

function applyBorders(cell: ExcelJS.Cell) {
    cell.border = allBorders;
}

function currency(amount: number, cur: string) {
    return formatCurrency(Math.abs(amount), cur);
}

// ─── Main Export Function ─────────────────────────────────────────────────────

export async function exportTransactionsExcel(
    transactions: Transaction[],
    companyName: string,
    currencyCode: string,
    filterLabel?: string
) {
    const wb = new ExcelJS.Workbook();
    wb.creator = "FinFlow";
    wb.created = new Date();

    // ── Sheet 1: Transactions ─────────────────────────────────────────────────
    const ws = wb.addWorksheet("Transactions", {
        views: [{ state: "frozen", ySplit: 7 }],
        pageSetup: {
            paperSize: 9, // A4
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
        },
    });

    // Column widths
    ws.columns = [
        { key: "no", width: 6 },
        { key: "date", width: 14 },
        { key: "title", width: 32 },
        { key: "category", width: 22 },
        { key: "type", width: 13 },
        { key: "debit", width: 18 },
        { key: "credit", width: 18 },
        { key: "note", width: 28 },
    ];

    const exportDate = new Date().toLocaleDateString("id-ID", {
        day: "2-digit", month: "long", year: "numeric",
    });

    // ── Row 1: Brand / Company Name ──────────────────────────────────────────
    ws.mergeCells("A1:H1");
    const brandCell = ws.getCell("A1");
    brandCell.value = `🏢  ${companyName.toUpperCase()}`;
    brandCell.font = { name: "Calibri", size: 18, bold: true, color: { argb: COLORS.brandFg } };
    brandCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.brandBg } };
    brandCell.alignment = { vertical: "middle", horizontal: "left", indent: 2 };
    ws.getRow(1).height = 42;

    // ── Row 2: Sub-title ─────────────────────────────────────────────────────
    ws.mergeCells("A2:H2");
    const subCell = ws.getCell("A2");
    subCell.value = `Financial Transaction Report  •  ${filterLabel ?? "All Time"}  •  Exported: ${exportDate}`;
    subCell.font = { name: "Calibri", size: 10, color: { argb: "94A3B8" }, italic: true };
    subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.brandBg } };
    subCell.alignment = { vertical: "middle", horizontal: "left", indent: 2 };
    ws.getRow(2).height = 22;

    // ── Row 3: Spacer ─────────────────────────────────────────────────────────
    ws.getRow(3).height = 6;

    // ── Row 4-6: Summary Cards ────────────────────────────────────────────────
    const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const netBalance = totalIncome - totalExpense;

    // Summary labels row
    ws.mergeCells("B4:C4"); ws.mergeCells("D4:E4"); ws.mergeCells("F4:H4");
    const lblIncome = ws.getCell("B4");
    const lblExpense = ws.getCell("D4");
    const lblNet = ws.getCell("F4");

    [lblIncome, lblExpense, lblNet].forEach((cell, i) => {
        const labels = ["📈  TOTAL INCOME", "📉  TOTAL EXPENSE", "💰  NET BALANCE"];
        cell.value = labels[i];
        cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: COLORS.summaryHeaderFg } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.summaryHeaderBg } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        ws.getRow(4).height = 20;
    });

    // Summary values row
    ws.mergeCells("B5:C5"); ws.mergeCells("D5:E5"); ws.mergeCells("F5:H5");
    const valIncome = ws.getCell("B5");
    const valExpense = ws.getCell("D5");
    const valNet = ws.getCell("F5");

    valIncome.value = currency(totalIncome, currencyCode);
    valExpense.value = currency(totalExpense, currencyCode);
    valNet.value = (netBalance >= 0 ? "+ " : "- ") + currency(netBalance, currencyCode);

    valIncome.font = { name: "Calibri", size: 14, bold: true, color: { argb: COLORS.incomeAmt } };
    valExpense.font = { name: "Calibri", size: 14, bold: true, color: { argb: COLORS.expenseAmt } };
    valNet.font = { name: "Calibri", size: 14, bold: true, color: { argb: netBalance >= 0 ? COLORS.incomeAmt : COLORS.expenseAmt } };

    valIncome.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.summaryIncomeBg } };
    valExpense.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.summaryExpenseBg } };
    valNet.fill = { type: "pattern", pattern: "solid", fgColor: { argb: netBalance >= 0 ? COLORS.summaryNetPosBg : COLORS.summaryNetNegBg } };

    [valIncome, valExpense, valNet].forEach(cell => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        ws.getRow(5).height = 32;
    });

    // ── Row 6: Spacer ─────────────────────────────────────────────────────────
    ws.getRow(6).height = 6;

    // ── Row 7: Column Headers ─────────────────────────────────────────────────
    const headers = ["#", "Date", "Description", "Category", "Type", "Income (+)", "Expense (−)", "Notes"];
    const headerRow = ws.getRow(7);
    headerRow.height = 26;
    headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLORS.headerFg } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
        cell.alignment = { horizontal: idx >= 5 ? "right" : "left", vertical: "middle", indent: idx === 0 ? 0 : 1 };
        applyBorders(cell);
    });

    // ── Rows 8+: Data ─────────────────────────────────────────────────────────
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

    sorted.forEach((tx, idx) => {
        const rowNum = idx + 8;
        const row = ws.getRow(rowNum);
        row.height = 22;

        const isIncome = tx.type === "income";
        const isAlt = idx % 2 === 1;
        const rowBg = isIncome
            ? COLORS.incomeBg
            : isAlt ? COLORS.altRow : COLORS.white;

        const values = [
            idx + 1,
            tx.date,
            tx.title,
            tx.category,
            isIncome ? "↑ Income" : "↓ Expense",
            isIncome ? tx.amount : null,
            !isIncome ? tx.amount : null,
            tx.note ?? "",
        ];

        values.forEach((val, colIdx) => {
            const cell = row.getCell(colIdx + 1);
            cell.value = val;

            // Background
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };

            // Font
            const isAmtCol = colIdx === 5 || colIdx === 6;
            cell.font = {
                name: "Calibri",
                size: 10,
                bold: isAmtCol,
                color: {
                    argb: isAmtCol && isIncome
                        ? COLORS.incomeAmt
                        : isAmtCol && !isIncome
                            ? COLORS.expenseAmt
                            : colIdx === 4
                                ? isIncome ? COLORS.incomeFg : COLORS.expenseFg
                                : "1E293B",
                },
            };

            // Alignment
            cell.alignment = {
                horizontal: colIdx >= 5 ? "right" : colIdx === 0 ? "center" : "left",
                vertical: "middle",
                indent: colIdx > 0 && colIdx < 5 ? 1 : 0,
            };

            // Number format for amount columns
            if (isAmtCol && val !== null) {
                cell.numFmt = "#,##0.00";
            }

            applyBorders(cell);
        });
    });

    // ── Empty state ───────────────────────────────────────────────────────────
    if (sorted.length === 0) {
        ws.mergeCells("A8:H8");
        const empty = ws.getCell("A8");
        empty.value = "No transactions found.";
        empty.font = { name: "Calibri", size: 11, italic: true, color: { argb: "94A3B8" } };
        empty.alignment = { horizontal: "center", vertical: "middle" };
        ws.getRow(8).height = 30;
    }

    // ── Sheet 2: Category Summary ─────────────────────────────────────────────
    const ws2 = wb.addWorksheet("Category Summary");
    ws2.columns = [
        { key: "cat", width: 26 },
        { key: "type", width: 14 },
        { key: "count", width: 10 },
        { key: "total", width: 20 },
    ];

    // Title
    ws2.mergeCells("A1:D1");
    const t2Title = ws2.getCell("A1");
    t2Title.value = `${companyName}  —  Category Summary`;
    t2Title.font = { name: "Calibri", size: 14, bold: true, color: { argb: COLORS.brandFg } };
    t2Title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.brandBg } };
    t2Title.alignment = { horizontal: "left", vertical: "middle", indent: 2 };
    ws2.getRow(1).height = 36;

    // Headers
    ws2.getRow(2).height = 6;
    const hdrs2 = ["Category", "Type", "Transactions", "Total Amount"];
    const hRow2 = ws2.getRow(3);
    hRow2.height = 24;
    hdrs2.forEach((h, i) => {
        const cell = hRow2.getCell(i + 1);
        cell.value = h;
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLORS.headerFg } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
        cell.alignment = { horizontal: i >= 2 ? "right" : "left", vertical: "middle", indent: 1 };
        applyBorders(cell);
    });

    // Group by category
    const catMap = new Map<string, { type: string; count: number; total: number }>();
    transactions.forEach(tx => {
        const key = `${tx.category}||${tx.type}`;
        const existing = catMap.get(key) ?? { type: tx.type, count: 0, total: 0 };
        catMap.set(key, { ...existing, count: existing.count + 1, total: existing.total + tx.amount });
    });

    const catRows = Array.from(catMap.entries())
        .sort(([, a], [, b]) => b.total - a.total);

    catRows.forEach(([key, { type, count, total }], i) => {
        const [cat] = key.split("||");
        const row = ws2.getRow(i + 4);
        row.height = 22;
        const isInc = type === "income";
        const bg = i % 2 === 0 ? COLORS.white : COLORS.altRow;

        const vals = [cat, isInc ? "↑ Income" : "↓ Expense", count, total];
        vals.forEach((v, ci) => {
            const cell = row.getCell(ci + 1);
            cell.value = v;
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ci === 3 ? (isInc ? COLORS.incomeBg : COLORS.expenseBg) : bg } };
            cell.font = {
                name: "Calibri", size: 10,
                bold: ci === 3,
                color: { argb: ci === 3 ? (isInc ? COLORS.incomeAmt : COLORS.expenseAmt) : "1E293B" },
            };
            cell.alignment = { horizontal: ci >= 2 ? "right" : "left", vertical: "middle", indent: 1 };
            if (ci === 3) cell.numFmt = "#,##0.00";
            applyBorders(cell);
        });
    });

    // ── Generate & Download ───────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${companyName.replace(/\s+/g, "-")}_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
}
