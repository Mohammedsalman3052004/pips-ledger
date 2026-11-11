import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable, { type CellInput } from 'jspdf-autotable';
import { buildSheet, summarize } from './sheet';
import { formatDate, formatPrice, formatTime, signedMoney } from './format';
import type { Trade } from './types';

export interface ExportMeta {
  title: string;
  subtitle: string;
}

const HEAD = [
  'Date',
  'Time',
  'Currency',
  'Lot size',
  'Buy / Sell',
  'Result',
  'Profit / Loss',
  'Entry price',
  'Exit price',
  'Entry source',
  'Traded by',
  'Total',
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------- CSV ---------------- */
export function toCsv(trades: Trade[]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [HEAD.join(',')];
  for (const it of buildSheet(trades)) {
    if (it.kind !== 'trade') continue;
    const t = it.trade;
    lines.push(
      [
        formatDate(t.trade_date),
        formatTime(t.trade_time),
        t.currency,
        t.lot_size.toFixed(2),
        cap(t.side),
        cap(t.result),
        it.pnl.toFixed(2),
        formatPrice(t.entry_price),
        formatPrice(t.exit_price),
        t.source ?? '',
        t.trader,
        it.total.toFixed(2),
      ]
        .map(esc)
        .join(',')
    );
  }
  return '\uFEFF' + lines.join('\r\n');
}

/* ---------------- XLSX ---------------- */
const BLUE = 'FF1A47B8';
const GREEN = 'FF0B7A3B';
const RED = 'FFBF2430';
const MONEY_FMT = '+$#,##0.00;-$#,##0.00;$0.00';

export async function toXlsx(trades: Trade[], meta: ExportMeta): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Pips Ledger';
  const ws = wb.addWorksheet('Trades', { views: [{ state: 'frozen', ySplit: 4 }] });

  ws.mergeCells('A1:L1');
  ws.getCell('A1').value = meta.title;
  ws.getCell('A1').font = { bold: true, size: 14, color: { argb: BLUE } };
  ws.mergeCells('A2:L2');
  ws.getCell('A2').value = meta.subtitle;
  ws.getCell('A2').font = { color: { argb: 'FF66707F' }, size: 10 };

  const header = ws.getRow(4);
  HEAD.forEach((h, i) => {
    const c = header.getCell(i + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
    c.alignment = { vertical: 'middle', horizontal: [3, 6, 7, 8, 11].includes(i) ? 'right' : 'left' };
  });
  header.height = 22;

  let rowNo = 5;
  for (const it of buildSheet(trades)) {
    const row = ws.getRow(rowNo++);
    if (it.kind === 'gap') {
      ws.mergeCells(rowNo - 1, 1, rowNo - 1, 12);
      const c = row.getCell(1);
      c.value = it.days === 1 ? '1 day gap' : `${it.days} days gap`;
      c.alignment = { horizontal: 'center' };
      c.font = { italic: true, color: { argb: 'FF66707F' }, size: 10 };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F4F9' } };
      continue;
    }
    const t = it.trade;
    const [y, m, d] = t.trade_date.split('-').map(Number);
    row.getCell(1).value = new Date(Date.UTC(y, m - 1, d));
    row.getCell(1).numFmt = 'dd/mm/yyyy';
    row.getCell(2).value = formatTime(t.trade_time);
    row.getCell(3).value = t.currency;
    row.getCell(4).value = t.lot_size;
    row.getCell(4).numFmt = '0.00';
    row.getCell(5).value = cap(t.side);
    row.getCell(5).font = { bold: true, color: { argb: t.side === 'buy' ? GREEN : RED } };
    row.getCell(6).value = cap(t.result);
    row.getCell(6).font = { bold: true, color: { argb: t.result === 'profit' ? GREEN : RED } };
    row.getCell(7).value = it.pnl;
    row.getCell(7).numFmt = MONEY_FMT;
    row.getCell(7).font = { bold: true, color: { argb: t.result === 'profit' ? GREEN : RED } };
    row.getCell(8).value = Number(t.entry_price);
    row.getCell(9).value = Number(t.exit_price);
    row.getCell(10).value = t.source ?? '';
    row.getCell(11).value = t.trader;
    row.getCell(12).value = it.total;
    row.getCell(12).numFmt = MONEY_FMT;
    row.getCell(12).font = { bold: true, color: { argb: it.total < 0 ? RED : it.total > 0 ? GREEN : 'FF66707F' } };
    for (let c = 1; c <= 12; c++) {
      row.getCell(c).border = { bottom: { style: 'thin', color: { argb: 'FFDDE3ED' } } };
      if ([4, 7, 8, 9, 12].includes(c)) row.getCell(c).alignment = { horizontal: 'right' };
    }
  }

  [12, 11, 11, 10, 11, 10, 14, 13, 13, 26, 13, 14].forEach((w, i) => (ws.getColumn(i + 1).width = w));

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}

/* ---------------- PDF ---------------- */
export function toPdf(trades: Trade[], meta: ExportMeta): Buffer {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pos: [number, number, number] = [11, 122, 59];
  const neg: [number, number, number] = [191, 36, 48];
  const grey: [number, number, number] = [102, 112, 127];
  const sum = summarize(trades);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(26, 71, 184);
  doc.text(meta.title, 40, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...grey);
  doc.text(meta.subtitle, 40, 62);
  doc.setTextColor(30, 30, 30);
  doc.text(
    `Trades: ${sum.count}     Win rate: ${sum.winRate.toFixed(0)}%     Net result: ${signedMoney(sum.net)}`,
    40,
    80
  );

  const colour = (n: number) => (n > 0 ? pos : n < 0 ? neg : grey);
  const body: CellInput[][] = [];

  for (const it of buildSheet(trades)) {
    if (it.kind === 'gap') {
      body.push([
        {
          content: it.days === 1 ? '1 day gap' : `${it.days} days gap`,
          colSpan: 12,
          styles: { halign: 'center', fontStyle: 'italic', textColor: grey, fillColor: [241, 244, 249] },
        },
      ]);
      continue;
    }
    const t = it.trade;
    const rc = t.result === 'profit' ? pos : neg;
    body.push([
      formatDate(t.trade_date),
      formatTime(t.trade_time),
      { content: t.currency, styles: { fontStyle: 'bold' } },
      { content: t.lot_size.toFixed(2), styles: { halign: 'right' } },
      { content: cap(t.side), styles: { textColor: t.side === 'buy' ? pos : neg, fontStyle: 'bold' } },
      { content: cap(t.result), styles: { textColor: rc, fontStyle: 'bold' } },
      { content: signedMoney(it.pnl), styles: { halign: 'right', textColor: rc, fontStyle: 'bold' } },
      { content: formatPrice(t.entry_price), styles: { halign: 'right' } },
      { content: formatPrice(t.exit_price), styles: { halign: 'right' } },
      t.source ?? '',
      t.trader,
      { content: signedMoney(it.total), styles: { halign: 'right', textColor: colour(it.total), fontStyle: 'bold' } },
    ]);
  }

  autoTable(doc, {
    startY: 94,
    head: [HEAD],
    body,
    theme: 'grid',
    margin: { left: 40, right: 40, bottom: 40 },
    styles: { fontSize: 8.5, cellPadding: 4.5, lineColor: [221, 227, 237], lineWidth: 0.5 },
    headStyles: { fillColor: [26, 71, 184], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 3: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 11: { halign: 'right' } },
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...grey);
    doc.text(`Page ${i} of ${pages}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 20, {
      align: 'right',
    });
  }
  return Buffer.from(doc.output('arraybuffer'));
}
