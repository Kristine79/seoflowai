export const AUDIT_URL = "/ai-search/cmst1p1gk0000dwutci61bh6b?tab=overview";

export const PROMPT_SET = "v1 · hash 9db15516";

export interface RunRow {
  n: string;
  mode: string;
  provider: string;
  success: string;
  date: string;
}

export const RUNS: RunRow[] = [
  { n: "Run #1", mode: "chat", provider: "gpt-4o-mini", success: "34/34", date: "2026-08-14" },
  { n: "Run #2", mode: "web_search", provider: "perplexity/sonar", success: "34/34", date: "2026-08-14" },
  { n: "Run #3", mode: "web_search", provider: "perplexity/sonar", success: "34/34", date: "2026-08-14" },
];

export interface MetricRow {
  metric: string;
  run1: string;
  run2: string;
  run3: string;
}

export const CORE_METRICS: MetricRow[] = [
  { metric: "Mention Rate", run1: "47.1%", run2: "67.6%", run3: "70.6%" },
  { metric: "Recommendation Rate", run1: "5.9%", run2: "20.6%", run3: "17.6%" },
  { metric: "Top-3 Rate", run1: "2.9%", run2: "20.6%", run3: "17.6%" },
  { metric: "Citation Rate", run1: "0%", run2: "100%", run3: "100%" },
];

export interface IntentRow {
  category: string;
  label: string;
  prompts: number;
  run2: string;
  run3: string;
  gap?: string;
}

export const INTENT_COVERAGE: IntentRow[] = [
  { category: "Marketing", label: "Brand", prompts: 2, run2: "2/2", run3: "2/2" },
  { category: "Marketing", label: "Product", prompts: 4, run2: "4/4", run3: "4/4" },
  { category: "Marketing", label: "Category", prompts: 2, run2: "2/2", run3: "2/2" },
  { category: "Sales", label: "Buyer Intent", prompts: 3, run2: "1/3", run3: "0/3", gap: "2 prompts (Run #2)" },
  { category: "Sales", label: "Use Case", prompts: 3, run2: "0/3", run3: "1/3", gap: "3 prompts (Run #2)" },
  { category: "Competitive", label: "Comparison", prompts: 6, run2: "6/6", run3: "6/6" },
  { category: "Competitive", label: "Alternatives", prompts: 4, run2: "3/4", run3: "4/4", gap: "1 prompt (Run #2)" },
  { category: "Competitive", label: "Competitor", prompts: 5, run2: "5/5", run3: "5/5" },
  { category: "Support", label: "Problem / Solution", prompts: 3, run2: "0/3", run3: "0/3", gap: "3 prompts" },
  { category: "Support", label: "Expert / Technical", prompts: 2, run2: "0/2", run3: "0/2", gap: "2 prompts" },
];

export const OFFICIAL_DOMAINS: { domain: string; mentions: number }[] = [
  { domain: "bolid.ru", mentions: 19 },
  { domain: "antares.bolid.ru", mentions: 2 },
  { domain: "partners.bolid.ru", mentions: 1 },
];

export interface SourceTypeRow {
  type: string;
  mentions: number;
  share: string;
}

export const SOURCE_TYPES: SourceTypeRow[] = [
  { type: "Official (BOLID domains)", mentions: 21, share: "7.6%" },
  { type: "Industry", mentions: 55, share: "19.9%" },
  { type: "Community", mentions: 20, share: "7.2%" },
  { type: "Media", mentions: 12, share: "4.3%" },
  { type: "Competitor domains", mentions: 10, share: "3.6%" },
  { type: "Documentation", mentions: 2, share: "0.7%" },
  { type: "Review platforms", mentions: 0, share: "0%" },
  { type: "Other", mentions: 157, share: "56.7%" },
];

export const TOP_DOMAINS: { domain: string; mentions: number }[] = [
  { domain: "rusprofile.ru", mentions: 9 },
  { domain: "cyclowiki.org", mentions: 9 },
  { domain: "kontragent.vbr.ru", mentions: 8 },
  { domain: "t-save.ru", mentions: 8 },
  { domain: "companies.rbc.ru", mentions: 7 },
  { domain: "stroimprosto.mos.ru", mentions: 6 },
  { domain: "habr.com", mentions: 6 },
];

export interface CompetitorRow {
  name: string;
  run2: number;
  run3: number;
}

export const COMPETITORS: CompetitorRow[] = [
  { name: "PERCo", run2: 5, run3: 8 },
  { name: "Parsec", run2: 5, run3: 7 },
  { name: "Sigur", run2: 4, run3: 6 },
  { name: "RusGuard", run2: 4, run3: 6 },
  { name: "RUBEZH", run2: 3, run3: 6 },
];

export const COMPETITOR_CASES: { title: string; detail: string }[] = [
  {
    title: "Use Case prompt",
    detail:
      "«Какое решение для систем охранно-пожарной сигнализации и безопасности подходит для охраны промышленных объектов?» — RUBEZH был упомянут и рекомендован, БОЛИД не был упомянут.",
  },
  {
    title: "Alternatives prompt",
    detail:
      "«Какие есть альтернативы PERCo?» — были перечислены Sigur, Parsec, RusGuard; БОЛИД отсутствовал.",
  },
];

export const POSITIONING = {
  brand: [
    { phrase: "«АО НВП \"Болид\"»", count: 12 },
    { phrase: "«российская компания из Королёва»", count: 1 },
    { phrase: "«разрабатывает, производит и поставляет оборудование и программное обеспечение»", count: 1 },
  ],
  product: [
    { phrase: "СКУД", count: 8 },
    { phrase: "пожарная сигнализация", count: 5 },
    { phrase: "видеонаблюдение", count: 4 },
    { phrase: "диспетчеризация", count: 3 },
    { phrase: "контроллеры", count: 3 },
  ],
  category: [
    { phrase: "системы безопасности", count: 8 },
    { phrase: "автоматизация", count: 5 },
    { phrase: "диспетчеризация", count: 4 },
    { phrase: "контроль доступа", count: 4 },
  ],
  differentiators: [
    "интеграция с другими системами (3)",
    "900+ сотрудников",
    "400+ позиций номенклатуры",
    "поддержка до 600 000 элементов и 65 535 зон",
    "контроллеры двухпроводной линии связи",
  ],
  buyerCriteria: ["цена (4)", "масштабируемость (3)", "стоимость владения (3)", "интеграции (3)"],
};

export interface VerificationRow {
  metric: string;
  before: string;
  after: string;
  change: string;
}

export const VERIFICATION_RUN2_RUN3: VerificationRow[] = [
  { metric: "Mention Rate", before: "67.6%", after: "70.6%", change: "+3 pp" },
  { metric: "Recommendation Rate", before: "20.6%", after: "17.6%", change: "−3 pp" },
  { metric: "Top-3 Rate", before: "20.6%", after: "17.6%", change: "−3 pp" },
  { metric: "Citation Rate", before: "100%", after: "100%", change: "0 pp" },
  { metric: "Official Source Rate", before: "7.9%", after: "7.3%", change: "−0.6 pp" },
  { metric: "Official source mentions", before: "22", after: "21", change: "−1" },
  { metric: "Competitor-only responses", before: "2", after: "0", change: "−2" },
];

export const VERIFICATION_SOURCES = {
  domains: "157 → 163 (новых 22, исчезло 16, повторяющихся 141)",
  positioning: "25 новых фраз, 25 удалённых, 20 выросли, 20 снизились — нормальная волатильность формулировок AI",
};

export interface Gap {
  id: string;
  title: string;
  coverage: string;
  evidence: string;
  hypothesis: string;
  action: string;
  verification: string;
}

export const GAPS: Gap[] = [
  {
    id: "GAP 1",
    title: "Use Case промпты",
    coverage: "0/3 во всех запусках",
    evidence:
      "«Какое решение … подходит для охраны промышленных объектов?», «…для пожарной безопасности торговых центров», «Как компании на практике внедряют…?» — БОЛИД не упоминался; в первом промпте рекомендован RUBEZH.",
    hypothesis:
      "Возможна возможность усилить извлекаемую (retrievable) информацию о решениях БОЛИД для конкретных типов объектов (гипотеза, требующая проверки, а не установленная причина).",
    action:
      "Опубликовать / расширить use-case материалы по типам объектов (промышленные объекты, торговые центры, офисы, ЖКХ) с описанием решений и кейсов внедрения на официальных доменах.",
    verification: "Повторный запуск тех же 34 промптов (Run #4) через 2–4 недели и сравнение покрытия Use Case.",
  },
  {
    id: "GAP 2",
    title: "Problem / Solution промпты",
    coverage: "0/3 во всех запусках",
    evidence:
      "«Как решить проблему: противопожарная защита объектов…», «…организация контроля доступа…», «Какие типовые проблемы возникают…» — БОЛИД не упоминался ни в одном запуске.",
    hypothesis:
      "Возможна возможность усилить нарративы «проблема — решение», связывающие решения БОЛИД со сценариями интеграции и защиты (гипотеза, требующая проверки).",
    action:
      "Создать материалы формата problem/solution (гайды по интеграции, сценарии модернизации, кейсы соответствия) на официальных доменах и отраслевых площадках (habr.com и профильные порталы) — среди топовых источников.",
    verification: "Повторное измерение Run #4.",
  },
  {
    id: "GAP 3",
    title: "Expert / Technical промпты",
    coverage: "0/2 во всех запусках",
    evidence:
      "«Какие технические требования предъявляются…», «Какие технические характеристики наиболее важны…» — БОЛИД не упоминался; только общие технические ответы. Документационные источники цитировались редко — лишь 2 упоминания источников в Run #2.",
    hypothesis:
      "Возможна возможность усилить извлекаемую техническую документацию и справочные материалы (гипотеза, требующая проверки).",
    action:
      "Опубликовать материалы о технических требованиях и характеристиках (параметры линий связи, сертификаты, таблицы соответствия ГОСТ) на bolid.ru / antares.bolid.ru, чтобы их можно было цитировать.",
    verification: "Повторное измерение Run #4.",
  },
];

export const ABOUT_CAPABILITIES: { title: string; detail: string }[] = [
  { title: "Prompt management", detail: "набор промптов по 10 интент-категориям, версии и хэши промпт-сетов" },
  { title: "AI Search runs", detail: "запуски по провайдерам (chat / web_search), 34/34 успешных ответов в каждом" },
  { title: "Source intelligence", detail: "277 упоминаний источников, 157 доменов, классификация по типам" },
  { title: "Competitor intelligence", detail: "упоминания конкурентов по промптам и позициям" },
  { title: "AI positioning", detail: "как AI описывает бренд: ассоциации, категории, отличия" },
  { title: "Gap detection", detail: "интент-уровневые гэпы по измеренным запускам" },
  { title: "Action planning", detail: "гипотезы и действия по каждому гэпу с проверкой" },
  { title: "Verification runs", detail: "повторные запуски того же промпт-сета и сравнение метрик" },
];