"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Globe,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  Check,
  Search,
  Database,
  FileText,
  Activity,
  Layers,
  Building2,
  Sparkles,
  Key,
  Download,
} from "lucide-react";

type FilterTab = "all" | "verified" | "submitted" | "manual" | "blocked" | "not_relevant";

const platformSamples = [
  { name: "Wellfound (AngelList)", status: "verified", category: "Стартап-каталог", detail: "Подтверждено через публичный профиль стартапа и активный ID дашборда." },
  { name: "Bark.com", status: "verified", category: "Маркетплейс услуг", detail: "Подтвержден активный профессиональный профиль и список услуг." },
  { name: "Crunchbase", status: "verified", category: "Бизнес-база", detail: "Профиль организации верифицирован по ответу сервера." },
  { name: "DesignRush", status: "verified", category: "Каталог агентств", detail: "Портфолио агентства и верифицированный бэйдж подтверждены." },
  { name: "Shopify Partners", status: "verified", category: "Партнерский каталог", detail: "Статус партнера и листинг агентства верифицированы." },
  { name: "HubSpot Solutions", status: "submitted", category: "Партнерский каталог", detail: "Заявка отправлена с ID конверсии; ожидание редакционной модерации." },
  { name: "Clutch.co", status: "submitted", category: "Каталог агентств", detail: "Отправка профиля завершена, ожидает ручной проверки качества." },
  { name: "G2.com", status: "submitted", category: "SaaS-каталог", detail: "Профиль вендора отправлен, ожидание верификационного звонка/письма." },
  { name: "GoodFirms", status: "submitted", category: "Платформа отзывов", detail: "Данные листинга успешно переданы, в очереди модерации." },
  { name: "Capterra", status: "submitted", category: "Каталог софта", detail: "Заявка получена через API платформы." },
  { name: "Software Advice", status: "submitted", category: "Каталог", detail: "Заявка в редакционной очереди." },
  { name: "SourceForge", status: "submitted", category: "Каталог", detail: "Листинг проекта отправлен." },
  { name: "SmartCustomer", status: "manual", category: "Бизнес-каталог", detail: "Несовпадение корпоративного email. Остановлено во избежание фейковых данных." },
  { name: "TopSEOs", status: "manual", category: "Каталог", detail: "Требуется бизнес-авторизация через LinkedIn и подтверждение человека." },
  { name: "Semrush Agency Partners", status: "manual", category: "Партнерская программа", detail: "Требуется решение клиента по платному партнерскому уровню." },
  { name: "Alignable", status: "manual", category: "Локальная сеть", detail: "Требуется SMS-верификация личности бизнеса." },
  { name: "YellowPages", status: "blocked", category: "Каталог", detail: "Автоматизированный доступ предотвращен защитой Cloudflare." },
  { name: "Superpages", status: "blocked", category: "Каталог", detail: "Блокировка по репутации IP (bot protection)." },
  { name: "Hotfrog", status: "blocked", category: "Каталог", detail: "Строгое правило WAF заблокировало headless-сессию браузера." },
  { name: "Local.com", status: "blocked", category: "Каталог", detail: "Защитный экран против ботов." },
  { name: "Irrelevant Regional Directory A", status: "not_relevant", category: "Локальный", detail: "Платформа не соответствует целевому B2B IT-консалтингу." },
  { name: "Irrelevant Hobby Site B", status: "not_relevant", category: "Нишевый", detail: "Правило исключения: аудитория только B2C." },
];

export function CaseStudyClient() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filteredPlatforms =
    activeTab === "all"
      ? platformSamples
      : platformSamples.filter((p) => p.status === activeTab);

  return (
    <div className="space-y-24 pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.08),rgba(255,255,255,0))]" />
        
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/50 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            РЕАЛЬНАЯ КАМПАНИЯ · 77 ПЛАТФОРМ
          </div>

          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              РЕАЛЬНЫЙ КЕЙС SEOFLOW
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl sm:leading-[1.1]">
              77 платформ.<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Одна реальная кампания.
              </span>
            </h1>
          </div>

          <p className="mx-auto max-w-2xl text-lg text-zinc-600">
            "SEOFlow использовалась для выполнения реальной кампании по размещению бизнеса на 77 платформах — от автоматической регистрации и отправки заявок до верификации, сбора доказательств и эскалации на человека."
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#workflow"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-colors"
            >
              Исследовать воркфлоу
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <a
              href="#results"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors"
            >
              Посмотреть результаты
            </a>
          </div>
        </div>
      </section>

      {/* 2. RESULTS / NUMBERS */}
      <section id="results" className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
            <div className="text-center pt-4 sm:pt-0">
              <div className="text-4xl font-bold tracking-tight text-zinc-950">77</div>
              <div className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Проанализировано
              </div>
            </div>

            <div className="text-center pt-4 sm:pt-0">
              <div className="text-4xl font-bold tracking-tight text-emerald-600">5</div>
              <div className="mt-1 text-xs font-medium text-emerald-700 uppercase tracking-wider">
                Подтверждено
              </div>
            </div>

            <div className="text-center pt-4 sm:pt-0">
              <div className="text-4xl font-bold tracking-tight text-blue-600">7</div>
              <div className="mt-1 text-xs font-medium text-blue-700 uppercase tracking-wider">
                Отправлено
              </div>
            </div>

            <div className="text-center pt-4 sm:pt-0">
              <div className="text-4xl font-bold tracking-tight text-amber-600">23</div>
              <div className="mt-1 text-xs font-medium text-amber-700 uppercase tracking-wider">
                Требуют человека
              </div>
            </div>

            <div className="text-center pt-4 sm:pt-0">
              <div className="text-4xl font-bold tracking-tight text-rose-600">14</div>
              <div className="mt-1 text-xs font-medium text-rose-700 uppercase tracking-wider">
                Блокировка
              </div>
            </div>

            <div className="text-center pt-4 sm:pt-0">
              <div className="text-4xl font-bold tracking-tight text-zinc-400">28</div>
              <div className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Не релевантно
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CENTRAL IDEA */}
      <section className="mx-auto max-w-5xl px-4">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-900 p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
              Основная философия
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              "Каждая платформа получает результат."
            </h2>
            <div className="space-y-4 text-zinc-300 text-base leading-relaxed">
              <p>
                "Автоматизация каталогов в реальном мире — это редко простая задача заполнения форм. Платформы ведут себя по-разному, аутентификация может требовать участия человека, некоторые заявки уходят на модерацию, часть сайтов блокирует автоматический доступ, а некоторые площадки просто не подходят под цели кампании."
              </p>
              <p className="font-medium text-white">
                "SEOFlow превращает эти ситуации в четкие результаты, а не трактует всё как абсолютный успех или неудачу."
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                VERIFIED_SUCCESS
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                "Размещение подтверждено доказательствами."
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-5">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                <Clock className="h-4 w-4" />
                SUBMITTED
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                "Регистрация завершена. Ожидание модерации платформы."
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <AlertCircle className="h-4 w-4" />
                NEEDS_MANUAL
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                "Требуется участие человека или доступ клиента."
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-5">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <AlertCircle className="h-4 w-4" />
                EXTERNAL_BLOCK
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                "Доступ к платформе заблокировал дальнейшую автоматизацию."
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-5 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-zinc-400 font-semibold text-sm">
                <HelpCircle className="h-4 w-4" />
                NOT_RELEVANT
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                "Платформа не соответствует целям кампании."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW */}
      <section id="workflow" className="mx-auto max-w-5xl px-4 space-y-12">
        <div className="text-center space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-blue-600 font-semibold">
            Движок оркестрации
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
            От автоматизации браузера к подтвержденному результату.
          </h2>
          <p className="text-zinc-600 max-w-xl mx-auto text-sm">
            Систематический пайплайн из 6 шагов, созданный для сложных корпоративных каталогов.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              step: "01",
              title: "Обнаружение",
              desc: "Анализ платформы и определение ее соответствия целям кампании.",
              icon: Search,
            },
            {
              step: "02",
              title: "Выполнение",
              desc: "Навигация по реальному сайту и прохождение доступной регистрации или отправки формы.",
              icon: Activity,
            },
            {
              step: "03",
              title: "Верификация",
              desc: "Проверка серверных ответов, ID, дашбордов, URL и публичных профилей.",
              icon: CheckCircle2,
            },
            {
              step: "04",
              title: "Сбор доказательств",
              desc: "Сохранение скриншотов, URL, ответов сервера и других подтверждений результата.",
              icon: Database,
            },
            {
              step: "05",
              title: "Классификация",
              desc: "Превращение сырого результата в понятный статус кампании.",
              icon: Layers,
            },
            {
              step: "06",
              title: "Отчёт",
              desc: "Генерация структурированного отчёта для клиента.",
              icon: FileText,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    {item.step}
                  </span>
                  <item.icon className="h-5 w-5 text-zinc-400" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. REAL-WORLD COMPLEXITY */}
      <section className="mx-auto max-w-5xl px-4 space-y-12">
        <div className="text-center space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
            Реальность интернета
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
            Где реальный веб ломает идеальный сценарий.
          </h2>
          <p className="text-zinc-600 max-w-xl mx-auto text-sm">
            SEOFlow создана для работы с хаотичной реальностью продакшн веб-приложений.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Аутентификация",
              desc: "Некоторые платформы требуют существующий аккаунт или OAuth-вход.",
              icon: Key,
            },
            {
              title: "Модерация",
              desc: "Успешная отправка формы не всегда означает мгновенную публикацию.",
              icon: Clock,
            },
            {
              title: "Защита платформ",
              desc: "Некоторые сайты полностью блокируют автоматизированный доступ.",
              icon: CheckCircle2,
            },
            {
              title: "Платежи",
              desc: "Некоторые партнёрские программы требуют платную активацию.",
              icon: FileText,
            },
            {
              title: "Верификация человека",
              desc: "Некоторые проверки идентичности бизнеса невозможно пройти автоматически.",
              icon: CheckCircle2,
            },
            {
              title: "Неактуальные площадки",
              desc: "Некоторые ресурсы просто не представляют ценности для листинга бизнеса.",
              icon: Building2,
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-950">{card.title}</h3>
              <p className="text-sm text-zinc-600">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CASE EXAMPLES */}
      <section className="mx-auto max-w-5xl px-4 space-y-16">
        <div className="text-center space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-blue-600 font-semibold">
            Детальные разборы
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
            Как решались аномалии на конкретных платформах.
          </h2>
        </div>

        {/* Case 1: SmartCustomer */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                Кейс — SmartCustomer
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-950">
                Когда автоматизация должна остановиться.
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                "Платформа отклонила предоставленный регистрационный email, так как требовался адрес, совпадающий с доменом сайта."
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                "Вместо молчаливой подмены клиентских данных или создания дубликата аккаунта, SEOFlow остановила воркфлоу и классифицировала кейс как NEEDS_MANUAL."
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 font-mono text-xs space-y-3 text-zinc-700">
              <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-200 pb-2">
                <span>ЛОГ ВОРКФЛОУ</span>
                <span className="text-amber-600 font-semibold">NEEDS_MANUAL</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">→</span> Регистрационный email предоставлен
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">→</span> Требования платформы проверены
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-600">✕</span> Обнаружено несоответствие (требуется почта домена)
                </div>
                <div className="flex items-center gap-2 font-bold text-amber-700 bg-amber-100/50 p-2 rounded">
                  <span>⚡</span> Действие: Безопасная остановка и эскалация
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Case 2: HubSpot */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 font-mono text-xs space-y-3 text-zinc-700 order-2 lg:order-1">
              <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-200 pb-2">
                <span>ЛОГ ВОРКФЛОУ</span>
                <span className="text-blue-600 font-semibold">SUBMITTED</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">→</span> Форма успешно отправлена
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">→</span> Получен ответ сервера 200 OK
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">→</span> ID конверсии: #HS-99421
                </div>
                <div className="flex items-center gap-2 font-bold text-blue-700 bg-blue-100/50 p-2 rounded">
                  <span>⏳</span> Статус: Ожидание модерации платформы
                </div>
              </div>
            </div>
            <div className="space-y-4 order-1 lg:order-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                Кейс — HubSpot
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-950">
                Отправка не равна публикации.
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                "SEOFlow зафиксировала серверное подтверждение отправки заявки. Поскольку окончательная публикация зависит от проверки модераторами, результат был классифицирован как SUBMITTED, а не ошибочно отмечен как подтвержденный листинг."
              </p>
            </div>
          </div>
        </div>

        {/* Case 3: Wellfound / Bark */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                Кейс — Wellfound & Bark
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-950">
                Верификация за пределами кнопки.
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                "SEOFlow не считает успешный клик доказательством успеха. Где возможно, она верифицирует результирующий аккаунт, дашборд, публичный профиль или серверный идентификатор."
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 font-mono text-xs space-y-3 text-zinc-700">
              <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-200 pb-2">
                <span>ЛОГ ВОРКФЛОУ</span>
                <span className="text-emerald-600 font-semibold">VERIFIED_SUCCESS</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">→</span> Действие отправки формы выполнено
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">→</span> Сессия аккаунта инициализирована
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span> Прямая ссылка на публичный профиль проверена
                </div>
                <div className="flex items-center gap-2 font-bold text-emerald-700 bg-emerald-100/50 p-2 rounded">
                  <span>🎉</span> Статус: Размещение подтверждено
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. EVIDENCE STACK */}
      <section className="mx-auto max-w-5xl px-4">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 sm:p-12">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-semibold">
              Аудируемые доказательства
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
              Каждый результат оставляет следы.
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              "Вместо расплывчатого сообщения об успехе SEOFlow сохраняет доказательства, объясняющие, почему платформа получила именно такой финальный статус."
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Скриншот", type: "Визуальное подтверждение", val: "proof-screenshot.png" },
              { label: "URL", type: "Целевой адрес", val: "https://directory.com/listing" },
              { label: "Ответ сервера", type: "HTTP-статус", val: "HTTP 200 OK" },
              { label: "Время и статус", type: "Аудит-запись", val: "2026-08-11 VERIFIED" },
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-2">
                <div className="text-xs font-mono text-blue-600 font-medium">{item.type}</div>
                <div className="text-sm font-semibold text-zinc-950">{item.label}</div>
                <div className="text-xs font-mono text-zinc-500 bg-zinc-50 p-2 rounded border border-zinc-100 truncate">
                  {item.val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. HUMAN-IN-THE-LOOP */}
      <section className="mx-auto max-w-5xl px-4 space-y-12">
        <div className="text-center space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-amber-600 font-semibold">
            Плавная оркестрация
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
            Автоматизация знает, когда позвать человека.
          </h2>
          <p className="text-zinc-600 max-w-xl mx-auto text-sm">
            "Вмешательство человека не считается сбоем автоматизации. Это контролируемое состояние в воркфлоу."
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { platform: "Shopify Partners", reason: "Требуется логин клиента" },
            { platform: "TopSEOs", reason: "Требуется доступ к LinkedIn" },
            { platform: "Semrush", reason: "Решение по платной активации" },
            { platform: "Alignable", reason: "Верификация личности бизнеса" },
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">{item.platform}</span>
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              </div>
              <p className="text-xs text-zinc-600">{item.reason}</p>
              <div className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded">
                Переведено в NEEDS_MANUAL
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. THE 77-PLATFORM VIEW */}
      <section className="mx-auto max-w-6xl px-4 space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
            Полный аудит кампании
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
            Обзор кампании по 77 платформам.
          </h2>
          <p className="text-zinc-600 max-w-xl mx-auto text-sm">
            "Это делает масштабные кампании прозрачными и аудируемыми."
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-4">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === "all"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Все (77)
            </button>
            <button
              onClick={() => setActiveTab("verified")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === "verified"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Подтверждено (5)
            </button>
            <button
              onClick={() => setActiveTab("submitted")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === "submitted"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              Отправлено (7)
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === "manual"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              Вручную (23)
            </button>
            <button
              onClick={() => setActiveTab("blocked")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === "blocked"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              Заблокировано (14)
            </button>
            <button
              onClick={() => setActiveTab("not_relevant")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === "not_relevant"
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Не релевантно (28)
            </button>
          </div>

          {/* Platform List */}
          <div className="divide-y divide-zinc-100">
            {filteredPlatforms.map((p, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-2">
                <div>
                  <div className="text-sm font-semibold text-zinc-950">{p.name}</div>
                  <div className="text-xs text-zinc-500">{p.category} — {p.detail}</div>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                      p.status === "verified"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : p.status === "submitted"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : p.status === "manual"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : p.status === "blocked"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FULL CAMPAIGN REPORT DOWNLOAD */}
      <section className="mx-auto max-w-5xl px-4">
        <div className="rounded-2xl border border-zinc-200 bg-gradient-to-r from-zinc-900 to-zinc-950 p-8 sm:p-10 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              Аудируемый отчёт
            </span>
            <h3 className="text-2xl font-bold tracking-tight">
              Полный отчёт кампании
            </h3>
            <p className="text-sm text-zinc-400">
              77 платформ · Финальные результаты кампании
            </p>
          </div>
          <div>
            <a
              href="/SEOFlow-77-Platform-Campaign-Report.xlsx"
              download="SEOFlow-77-Platform-Campaign-Report.xlsx"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download full campaign report
            </a>
          </div>
        </div>
      </section>

      {/* 10. WHAT SEOFLOW LEARNED */}
      <section className="mx-auto max-w-5xl px-4 space-y-12">
        <div className="text-center space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-blue-600 font-semibold">
            Эволюция продукта
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
            От автоматизации к оркестрации.
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
            <div className="text-xs font-mono text-zinc-400">РАНЬШЕ</div>
            <h3 className="text-lg font-bold text-zinc-950">Автоматизируй форму.</h3>
            <p className="text-sm text-zinc-600">
              Отношение ко всем сайтам как к однотипным полям для выполнения кликов.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
            <div className="text-xs font-mono text-amber-600">РЕАЛЬНОСТЬ</div>
            <h3 className="text-lg font-bold text-zinc-950">Каждая платформа уникальна.</h3>
            <p className="text-sm text-zinc-600">
              Столкновение с защитой от ботов, ограничениями по почте, модерацией и входом через аккаунты.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-900 text-white p-6 shadow-md space-y-3">
            <div className="text-xs font-mono text-blue-400">ТЕПЕРЬ</div>
            <h3 className="text-lg font-bold">Оркестрация и верификация.</h3>
            <p className="text-sm text-zinc-300">
              Надежная валидация, сбор доказательств, четкая классификация статусов и умная эскалация.
            </p>
          </div>
        </div>
      </section>

      {/* 11. PRODUCT VALUE */}
      <section className="mx-auto max-w-5xl px-4 space-y-12">
        <div className="text-center space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
            Ценность для агентств
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
            Что это значит для SEO-команд.
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Меньше рутины", desc: "Автоматизация повторяющихся регистраций и заявок." },
            { title: "Полная прозрачность", desc: "Понимание того, что произошло на каждой платформе." },
            { title: "Безопасная автоматизация", desc: "Остановка вместо принятия необоснованных решений." },
            { title: "Аудируемые кампании", desc: "Сохранение доказательств для каждого результата." },
            { title: "Человек там, где нужно", desc: "Эскалация только тех кейсов, которые требуют внимания." },
            { title: "Готовые отчёты", desc: "Превращение активности кампании в структурированный отчёт." },
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-2">
              <h3 className="text-base font-semibold text-zinc-950">{item.title}</h3>
              <p className="text-sm text-zinc-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 12. FINAL CTA */}
      <section className="mx-auto max-w-4xl px-4 text-center">
        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-b from-zinc-900 to-zinc-950 p-12 text-white shadow-2xl space-y-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ваша следующая кампания не должна быть таблицей.
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-base">
            "Дайте SEOFlow список платформ. Пусть она исследует, выполнит, проверит и отчитается."
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500 transition-colors"
            >
              Запустить кампанию
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/directories"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-6 py-3 text-sm font-semibold text-zinc-200 shadow hover:bg-zinc-700 transition-colors"
            >
              Изучить SEOFlow
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
