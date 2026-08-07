import ExcelJS from "exceljs";
import { CLIENT_RESULT_TABLE, CLIENT_IMPORTANT_INFO, CLIENT_NEXT_STEPS } from "./client-data";

export function styleTable(ws: ExcelJS.Worksheet, headerRow: number, headerCount: number, widths: number[]) {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
  for (let i = 1; i <= headerCount; i++) {
    const cell = ws.getCell(headerRow, i);
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DDEBF7" } };
  }
  ws.getRow(headerRow).height = 18;
  ws.getRow(headerRow).eachCell({ includeEmpty: false }, (c) => {
    c.font = { bold: true };
  });
}

export function buildClientSummarySheet(wb: ExcelJS.Workbook): ExcelJS.Worksheet {
  const ws = wb.addWorksheet("Сводка для клиента");
  ws.getColumn(1).width = 42;
  ws.getColumn(2).width = 16;
  ws.getColumn(3).width = 110;

  const title = ws.getCell("A1");
  title.value = "Отчёт по размещению компании в каталогах";
  title.font = { bold: true, size: 16 };
  ws.mergeCells("A1:C1");
  ws.getRow(1).height = 26;

  const hdr = ws.getCell("A3");
  hdr.value = "Общая информация";
  hdr.font = { bold: true, size: 12 };
  ws.getRow(3).height = 20;

  ws.getCell("A4").value = "Исходный список:";
  ws.getCell("B4").value = "87 записей";
  ws.getCell("A5").value = "Проверено реальных площадок:";
  ws.getCell("B5").value = "75";
  ws.getCell("A6").value = "Пояснение:";
  const note = ws.getCell("B6");
  note.value = "Из исходного списка 87 URL часть являлась заголовками/разделами, поэтому фактически проверено 75 площадок.";
  note.alignment = { wrapText: true };
  ws.mergeCells("B6:C6");
  ws.getRow(6).height = 30;
  ws.getRow(4).height = 18;
  ws.getRow(5).height = 18;

  const resHdr = ws.getCell("A8");
  resHdr.value = "Текущий результат";
  resHdr.font = { bold: true, size: 12 };
  ws.getRow(8).height = 20;

  const cols = ["Статус", "Количество", "Описание"];
  cols.forEach((c, i) => {
    const cell = ws.getCell(9, i + 1);
    cell.value = c;
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DDEBF7" } };
    cell.border = { bottom: { style: "thin" } };
  });
  ws.getRow(9).height = 18;

  CLIENT_RESULT_TABLE.forEach((row, idx) => {
    const r = 10 + idx;
    ws.getCell(r, 1).value = row.status;
    ws.getCell(r, 2).value = row.count;
    const desc = ws.getCell(r, 3);
    desc.value = row.description;
    desc.alignment = { wrapText: true };
    ws.getRow(r).height = 22;
  });

  const impHdr = ws.getCell("A17");
  impHdr.value = "Важная информация";
  impHdr.font = { bold: true, size: 12 };
  ws.getRow(17).height = 20;

  const impText = ws.getCell("A18");
  impText.value = CLIENT_IMPORTANT_INFO;
  impText.alignment = { wrapText: true, vertical: "top" };
  ws.mergeCells("A18:C21");
  ws.getRow(18).height = 60;
  ws.getRow(19).height = 16;
  ws.getRow(20).height = 16;
  ws.getRow(21).height = 16;

  const nextHdr = ws.getCell("A23");
  nextHdr.value = "Следующие шаги";
  nextHdr.font = { bold: true, size: 12 };
  ws.getRow(23).height = 20;

  const nextText = ws.getCell("A24");
  nextText.value = CLIENT_NEXT_STEPS;
  nextText.alignment = { wrapText: true, vertical: "top" };
  ws.mergeCells("A24:C27");
  ws.getRow(24).height = 60;
  ws.getRow(25).height = 16;
  ws.getRow(26).height = 16;
  ws.getRow(27).height = 16;

  return ws;
}
