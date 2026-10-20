"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowRight, ChartLine, LockKeyhole, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    icon: Wallet,
    title: "Доходы и расходы в одном месте",
    text: "Добавляйте операции за минуту и сразу видите баланс за месяц.",
  },
  {
    icon: ChartLine,
    title: "Графики без таблиц Excel",
    text: "Линии по дням и кольцо по категориям показывают, куда уходят деньги.",
  },
  {
    icon: LockKeyhole,
    title: "Свой аккаунт в облаке",
    text: "Данные хранятся в Neon и доступны с любого устройства после входа.",
  },
];

const steps = [
  { n: "01", title: "Создайте аккаунт", text: "Регистрация по email — без сложных настроек." },
  { n: "02", title: "Внесите операции", text: "Тип, сумма, категория и дата. Всё." },
  { n: "03", title: "Смотрите картину месяца", text: "Сводка, графики и список обновляются сразу." },
];

function ParallaxLayer({ y, className, children }) {
  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

export default function LandingPage({ signedIn = false }) {
  const heroRef = useRef(null);
  const showcaseRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const { scrollYProgress: showcaseProgress } = useScroll({
    target: showcaseRef,
    offset: ["start end", "end start"],
  });

  const glowY = useTransform(heroProgress, [0, 1], [0, 180]);
  const gridY = useTransform(heroProgress, [0, 1], [0, 120]);
  const titleY = useTransform(heroProgress, [0, 1], [0, 80]);
  const panelY = useTransform(showcaseProgress, [0, 1], [80, -80]);
  const floatSlow = useTransform(showcaseProgress, [0, 1], [40, -120]);
  const floatFast = useTransform(showcaseProgress, [0, 1], [20, -180]);

  const primaryHref = signedIn ? "/app" : "/register";
  const primaryLabel = signedIn ? "Открыть кассу" : "Начать бесплатно";
  const secondaryHref = signedIn ? "/app" : "/login";
  const secondaryLabel = signedIn ? "К операциям" : "Войти";

  return (
    <div className="landing relative overflow-x-hidden bg-[var(--shell)] text-white">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-[rgba(16,16,18,0.72)] backdrop-blur-md">
        <div className="mx-auto flex h-16 w-[min(1120px,calc(100%-2rem))] items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <span className="brand-mark" aria-hidden="true" />
            <span className="text-lg font-extrabold tracking-tight text-white">касса</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-white/70 hover:text-white">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
            <Button asChild variant="lime">
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section
        ref={heroRef}
        className="relative isolate min-h-[100svh] overflow-hidden pt-16"
      >
        <ParallaxLayer
          y={glowY}
          className="pointer-events-none absolute -left-24 top-10 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(214,243,74,0.22),transparent_62%)]"
        />
        <ParallaxLayer
          y={gridY}
          className="pointer-events-none absolute -right-16 top-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_60%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(circle at 40% 30%, black, transparent 70%)",
          }}
        />

        <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-[min(1120px,calc(100%-2rem))] flex-col justify-center py-16">
          <motion.div style={{ y: titleY }} className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <Badge variant="lime" className="mb-6">
                Личные финансы без хаоса
              </Badge>
            </motion.div>

            <motion.p
              className="mb-3 text-[clamp(3.4rem,11vw,8.5rem)] font-extrabold leading-[0.86] tracking-[-0.06em] text-white"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
            >
              касса
            </motion.p>

            <motion.h1
              className="max-w-2xl text-[clamp(1.45rem,3.4vw,2.35rem)] font-extrabold leading-tight tracking-[-0.03em] text-white"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12 }}
            >
              Трекер доходов и расходов, который читается с первого взгляда
            </motion.h1>

            <motion.p
              className="mt-4 max-w-xl text-base leading-relaxed text-white/65 md:text-lg"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Считайте баланс в сумах, смотрите графики за месяц и храните историю
              операций в своём аккаунте.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.28 }}
            >
              <Button asChild size="lg" variant="lime">
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/15 text-white">
                <Link href="#how">Как это работает</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-14 grid max-w-3xl grid-cols-3 gap-3 border-t border-white/10 pt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            {[
              ["Neon", "облачная база"],
              ["Vercel", "быстрый фронт"],
              ["Аккаунт", "личные данные"],
            ].map(([title, text]) => (
              <div key={title}>
                <p className="text-sm font-extrabold text-[var(--lime)]">{title}</p>
                <p className="mt-1 text-xs text-white/50">{text}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative bg-[var(--canvas)] py-24 text-[var(--ink)]">
        <div className="mx-auto w-[min(1120px,calc(100%-2rem))]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
            className="max-w-2xl"
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
              Возможности
            </p>
            <h2 className="mt-3 text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold tracking-[-0.04em]">
              Одна касса. Ясная картина месяца.
            </h2>
          </motion.div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ink-card)] text-[var(--lime)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-extrabold tracking-[-0.02em]">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{feature.text}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="how"
        className="relative overflow-hidden bg-[var(--shell)] py-24 text-white"
      >
        <div className="mx-auto w-[min(1120px,calc(100%-2rem))]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
            className="max-w-2xl"
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/45">
              Три шага
            </p>
            <h2 className="mt-3 text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold tracking-[-0.04em]">
              От регистрации до первого графика
            </h2>
          </motion.div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-6"
              >
                <p className="text-sm font-extrabold text-[var(--lime)]">{step.n}</p>
                <h3 className="mt-4 text-xl font-extrabold tracking-[-0.03em]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        ref={showcaseRef}
        className="relative overflow-hidden bg-[var(--canvas)] py-28 text-[var(--ink)]"
      >
        <ParallaxLayer
          y={floatSlow}
          className="pointer-events-none absolute left-[8%] top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(214,243,74,0.35),transparent_70%)]"
        />
        <ParallaxLayer
          y={floatFast}
          className="pointer-events-none absolute right-[10%] top-40 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(16,16,18,0.18),transparent_70%)]"
        />

        <div className="relative mx-auto w-[min(1120px,calc(100%-2rem))]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
              Интерфейс
            </p>
            <h2 className="mt-3 text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold tracking-[-0.04em]">
              Дашборд, который не выглядит как бухгалтерия
            </h2>
          </motion.div>

          <motion.div style={{ y: panelY }} className="relative mx-auto mt-14 max-w-4xl">
            <div className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--shell)] p-4 shadow-[0_30px_80px_rgba(16,16,18,0.28)] md:p-6">
              <div className="mb-4 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="brand-mark !h-7 !w-7 !rounded-lg" />
                  <span className="font-extrabold text-white">касса</span>
                </div>
                <Badge variant="muted">октябрь</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-[#1b1b1d] p-4">
                  <p className="text-xs text-white/45">Доход</p>
                  <p className="mt-2 text-xl font-extrabold text-[var(--lime)]">5 000 000 сум</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-[var(--ink)]">
                  <p className="text-xs text-[var(--muted)]">Расход</p>
                  <p className="mt-2 text-xl font-extrabold">800 000 сум</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-[var(--ink)]">
                  <p className="text-xs text-[var(--muted)]">Баланс</p>
                  <p className="mt-2 text-xl font-extrabold">4 200 000 сум</p>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr_0.8fr]">
                <div className="relative h-44 overflow-hidden rounded-2xl bg-white p-4">
                  <svg viewBox="0 0 360 120" className="h-full w-full" aria-hidden="true">
                    <path
                      d="M0 90 C 40 88, 70 40, 110 48 C 150 56, 170 20, 210 28 C 250 36, 280 70, 320 58 C 340 52, 350 44, 360 40"
                      fill="none"
                      stroke="#c6e23a"
                      strokeWidth="3"
                    />
                    <path
                      d="M0 90 C 40 88, 70 40, 110 48 C 150 56, 170 20, 210 28 C 250 36, 280 70, 320 58 C 340 52, 350 44, 360 40 L 360 120 L 0 120 Z"
                      fill="rgba(198,226,58,0.18)"
                    />
                  </svg>
                </div>
                <div className="flex items-center justify-center rounded-2xl bg-white p-4">
                  <div
                    className="h-28 w-28 rounded-full"
                    style={{
                      background:
                        "conic-gradient(#d6f34a 0 72%, #ececee 72% 100%)",
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[var(--shell)] py-24 text-white">
        <div className="mx-auto w-[min(900px,calc(100%-2rem))] text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.55 }}
          >
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-extrabold tracking-[-0.05em]">
              Начните вести кассу сегодня
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/60">
              Зарегистрируйтесь, внесите первую операцию и увидите, как месяц
              складывается в понятную картину.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="lime">
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/15 text-white">
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/8 bg-[var(--shell)] py-8 text-white/45">
        <div className="mx-auto flex w-[min(1120px,calc(100%-2rem))] flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="brand-mark !h-6 !w-6 !rounded-md" />
            <span className="font-extrabold text-white">касса</span>
          </div>
          <Separator className="md:hidden bg-white/10" />
          <p className="text-sm">Трекер доходов и расходов · суммы в сумах</p>
        </div>
      </footer>
    </div>
  );
}
