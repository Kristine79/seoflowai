/**
 * generate-client-report-final.ts — финальный клиентский отчёт по заказу размещения ITllect.
 * Выход: client-report/client-directory-report-final.{xlsx,csv,md}
 * Не изменяет оригинальный client-directory-report.xlsx.
 */

import { writeFileSync, mkdirNames, mkdirSync, existsSync } from "fs";
import ExcelJS from "exceljs";
import { MASTER_LIST } from "../src/lib/directories/MASTER_LIST";
import {
  loadQueue,
  loadProbes,
  shortReason,
  techStatusOf,
  techResultOf,
  clientStatusOf,
  clientResultOf,
  clientNextOf,
  clientReasonOf,
  NA_CATEGORY,
  NA_CATEGORY_LABELS,
  NA_CATEGORY_SHORT,
  NA_COMMENTS,
  PROFILE_URL_TEXT,
} from "./lib/client-data";
import { buildClientSummarySheet, styleTable } from "./lib/client-excel";

const OUT_DIR = "client-report";
const queue = loadQueue();
const probes = loadProbes();

interface Row {
  Directory: string;
  URL: string;
  Type: string;
  Category: string;
  Priority: string;
  Status: string;
  Result: string;
  Next: string;
  Reason: string;
  ProfileURL: string;
  techStatus: string;
  queueStatus: string;
  techResult: string;
  techReason: string;
  notes: string;
}

const CLIENT_COLS = [
  "Каталог",
  "URL",
  "Категория",
  "Тип",
  "Приоритет",
  "Статус",
  "Результат",
  "Следующий шаг",
  "Причина статуса",
  "Ссылка на профиль",
];

function buildRows(): Row[] {
  return MASTER_LIST.map((m) => {
    const q = queue.find((e) => e.name === m.name);
    if (!q) return null;
    const status = clientStatusOf(q);
    return {
      Directory: m.name,
      URL: m.url,
      Type: m.type,
      Category: m.clientCategory,
      Priority: m.priority,
      Status: status,
      Result: clientResultOf(q, probes),
      Next: clientNextOf(status),
      Reason: clientReasonOf(status),
      ProfileURL: PROFILE_URL_TEXT[m.name] || "—",
      techStatus: techStatusOf(q),
      queueStatus: q.status,
      techResult: techResultOf(q, probes),
      techReason: shortReason(q, probes),
      notes: q.notes || "",
    };
  }).filter(Boolean) as Row[];
}

function summarize(rows: Row[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.Status] = (counts[r.Status] || 0) + 1;
  return counts;
}

function buildMd(rows: Row[], counts: Record<string, number>): string {
  return `# Финальный отчёт по размещению ITllect в каталогах

> Дата отчёта: 2026-08-11
> Компания: ITllect (https://itllect.com)
> Статус: Финальная версия отчёта перед сдачей заказа

## Сводка

| Статус | Кол-во |
|---|---|
| Всего площадок | **${rows.length}** |
| Размещено (подтверждено) | **${counts["Размещено (подтверждено)"] || 0}** |
| Заявка отправлена / ожидает модерации | **${counts["Заявка отправлена / ожидает модерации"] || 0}** |
| Требуется действие клиента | **${counts["Требуется действие клиента"] || 0}** |
| Площадка недоступна | **${counts["Площадка недоступна"] || 0}** |
| Не подходит для текущей задачи | **${counts["Не подходит для текущей задачи"] || 0}** |

> Примечание: По заявкам, отправленным на модерацию, проверка появления публичных профилей может быть выполнена дополнительно после публикации, ориентировочно через две недели. Это отдельный этап после сдачи текущей работы.

## Все площадки

| Каталог | URL | Категория | Статус | Результат | Следующий шаг | Причина статуса |
|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.Directory} | ${r.URL} | ${r.Category} | ${r.Status} | ${r.Result} | ${r.Next} | ${r.Reason} |`).join("\n")}
`;
}

function buildXlsx(rows: Row[]): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SEOFlow AI";
  wb.created = new Date();

  const counts = summarize(rows);
  const wsSummary = wb.addWorksheet("Сводка для клиента");
  wsSummary.columns = [{ width: 45 }, { width: 15 }];
  wsSummary.addRow(["Показатель", "Значение"]);
  wsSummary.addRow(["Всего площадок в работе", rows.length]);
  wsSummary.addRow(["Размещено (подтверждено)", counts["Размещено (подтверждено)"] || 0]);
  wsSummary.addRow(["Заявка отправлена / ожидает модерации", counts["Заявка отправлена / ожидает модерации"] || 0]);
  wsSummary.addRow(["Требуется действие клиента", counts["Требуется действие клиента"] || 0]);
  wsSummary.addRow(["Площадка недоступна", counts["Площадка недоступна"] || 0]);
  wsSummary.addRow(["Не подходит для текущей задачи", counts["Не подходит для текущей задачи"] || 0]);
  wsSummary.addRow(["", ""]);
  wsSummary.addRow(["Примечание", "По заявкам, отправленным на модерацию, проверка появления публичных профилей может быть выполнена дополнительно после публикации, ориентировочно через две недели. Это отдельный этап после сдачи текущей работы."]);
  styleTable(wsSummary, 1, 2, [45, 15]);

  const wsAll = wb.addWorksheet("Все площадки");
  wsAll.addRows([
    CLIENT_COLS,
    ...rows.map((r) => [
      r.Directory,
      r.URL,
      r.Category,
      r.Type,
      r.Priority,
      r.Status,
      r.Result,
      r.Next,
      r.Reason,
      r.ProfileURL,
    ]),
  ]);
  styleTable(wsAll, 1, CLIENT_COLS.length, [26, 50, 34, 6, 10, 32, 70, 40, 60, 34]);

  const wsAction = wb.addWorksheet("Требуется действие");
  const actionCols = ["Каталог", "URL", "Статус", "Результат", "Следующий шаг"];
  wsAction.addRows([
    actionCols,
    ...rows
      .filter((r) => r.Status === "Требуется действие клиента")
      .map((r) => [r.Directory, r.URL, r.Status, r.Result, r.Next]),
  ]);
  styleTable(wsAction, 1, actionCols.length, [26, 50, 32, 70, 40]);

  const wsNA = wb.addWorksheet("Не подходит для размещения");
  const naCols = ["Каталог", "URL", "Причина", "Пояснение"];
  wsNA.addRows([
    naCols,
    ...rows
      .filter((r) => r.Status === "Не подходит для текущей задачи")
      .map((r) => {
        const cat = NA_CATEGORY[r.Directory] || 4;
        return [
          r.Directory,
          r.URL,
          NA_CATEGORY_SHORT[cat],
          NA_COMMENTS[r.Directory] || NA_CATEGORY_LABELS[cat].explanation,
        ];
      }),
  ]);
  styleTable(wsNA, 1, naCols.length, [26, 50, 34, 90]);

  const wsTech = wb.addWorksheet("Технические данные");
  const techCols = ["Каталог", "URL", "Системный статус", "Статус в очереди", "Результат (технический)", "Причина", "Примечания"];
  wsTech.addRows([
    techCols,
    ...rows.map((r) => [r.Directory, r.URL, r.techStatus, r.queueStatus, r.techResult, r.techReason, r.notes]),
  ]);
  styleTable(wsTech, 1, techCols.length, [26, 50, 20, 16, 90, 26, 40]);

  return wb;
}

function buildCsv(rows: Row[]): string {
  const header = CLIENT_COLS.join(",");
  const lines = rows.map((r) =>
    [r.Directory, r.URL, r.Category, r.Type, r.Priority, r.Status, r.Result, r.Next, r.Reason, r.ProfileURL]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header, ...lines].join("\n");
}

function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const rows = buildRows();
  if (rows.length !== MASTER_LIST.length) {
    console.error(`Ожидалось ${MASTER_LIST.length} строк, получено ${rows.length} — есть расхождения с human-queue.json`);
  }
  const counts = summarize(rows);

  writeFileSync(`${OUT_DIR}/client-directory-report-final.csv`, buildCsv(rows), "utf8");
  writeFileSync(`${OUT_DIR}/client-directory-report-final.md`, buildMd(rows, counts), "utf8");

  const wb = buildXlsx(rows);
  const outFile = `${OUT_DIR}/client-directory-report-final.xlsx`;
  wb.xlsx.writeFile(outFile).then(
    () => {
      console.log("=== FINAL CLIENT DIRECTORY REPORT ===");
      console.log(`Rows: ${rows.length} (${MASTER_LIST.length} в MASTER_LIST)`);
      for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
      console.log("Sheets: " + wb.worksheets.map((s) => s.name).join(", "));
      console.log("Files generated:");
      console.log(`  ${OUT_DIR}/client-directory-report-final.csv`);
      console.log(`  ${OUT_DIR}/client-directory-report-final.xlsx`);
      console.log(`  ${OUT_DIR}/client-directory-report-final.md`);
    },
    (err: Error) => {
      console.error("Не удалось записать XLSX:", err.message);
      process.exitCode = 1;
    }
  );
}

main();
