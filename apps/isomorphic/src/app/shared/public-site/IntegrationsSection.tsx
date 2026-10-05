'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Boxes,
  Braces,
  Cpu,
  CreditCard,
  Database,
  Globe,
  Mail,
  MessageCircle,
  MessageSquare,
  SendHorizontal,
  Smartphone,
  Webhook,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { publicSiteTheme } from './public-theme-classes';

type IntegrationsSectionProps = {
  isLightTheme: boolean;
};

type IntegrationItem = {
  name: string;
  icon: LucideIcon;
  accentClass: string;
  floatOffset: number;
};

type ConnectionLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const integrationItems: IntegrationItem[] = [
  {
    name: 'WhatsApp',
    icon: MessageCircle,
    accentClass:
      'hover:border-[#25D366]/70 hover:shadow-[0_0_30px_rgba(37,211,102,0.2)]',
    floatOffset: 6,
  },
  {
    name: 'Telegram',
    icon: SendHorizontal,
    accentClass:
      'hover:border-[#38bdf8]/70 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)]',
    floatOffset: 4,
  },
  {
    name: 'Webhook',
    icon: Webhook,
    accentClass:
      'hover:border-[#60a5fa]/70 hover:shadow-[0_0_30px_rgba(96,165,250,0.22)]',
    floatOffset: 7,
  },
  {
    name: 'Mobile Apps',
    icon: Smartphone,
    accentClass:
      'hover:border-[#f59e0b]/70 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]',
    floatOffset: 5,
  },
  {
    name: 'Web Portal',
    icon: Globe,
    accentClass:
      'hover:border-[#a78bfa]/70 hover:shadow-[0_0_30px_rgba(167,139,250,0.2)]',
    floatOffset: 6,
  },
  {
    name: 'Email',
    icon: Mail,
    accentClass:
      'hover:border-[#22d3ee]/70 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]',
    floatOffset: 5,
  },
  {
    name: 'SMS',
    icon: MessageSquare,
    accentClass:
      'hover:border-[#e879f9]/70 hover:shadow-[0_0_30px_rgba(232,121,249,0.2)]',
    floatOffset: 6,
  },
  {
    name: 'Sensors / IoT',
    icon: Cpu,
    accentClass:
      'hover:border-[#10b981]/70 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    floatOffset: 7,
  },
  {
    name: 'REST API',
    icon: Braces,
    accentClass:
      'hover:border-[#3b82f6]/70 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]',
    floatOffset: 5,
  },
  {
    name: 'Database',
    icon: Database,
    accentClass:
      'hover:border-[#14b8a6]/70 hover:shadow-[0_0_30px_rgba(20,184,166,0.2)]',
    floatOffset: 4,
  },
  {
    name: 'Stripe',
    icon: CreditCard,
    accentClass:
      'hover:border-[#818cf8]/70 hover:shadow-[0_0_30px_rgba(129,140,248,0.22)]',
    floatOffset: 6,
  },
  {
    name: 'Slack',
    icon: Boxes,
    accentClass:
      'hover:border-[#f472b6]/70 hover:shadow-[0_0_30px_rgba(244,114,182,0.2)]',
    floatOffset: 5,
  },
];

export default function IntegrationsSection({
  isLightTheme,
}: IntegrationsSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null);
  const [connectionLine, setConnectionLine] = useState<ConnectionLine | null>(
    null
  );

  const updateConnectionLine = useCallback((index: number) => {
    const panel = panelRef.current;
    const node = itemRefs.current[index];
    if (!panel || !node) return;

    const panelRect = panel.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();

    setConnectionLine({
      x1: nodeRect.left - panelRect.left + nodeRect.width / 2,
      y1: nodeRect.top - panelRect.top + nodeRect.height / 2,
      x2: panelRect.width / 2,
      y2: panelRect.height / 2,
    });
  }, []);

  const handleNodeEnter = useCallback(
    (index: number) => {
      setHoveredNodeIndex(index);
      updateConnectionLine(index);
    },
    [updateConnectionLine]
  );

  const clearNodeHover = useCallback(() => {
    setHoveredNodeIndex(null);
    setConnectionLine(null);
  }, []);

  useEffect(() => {
    if (hoveredNodeIndex === null) return;

    const syncLine = () => updateConnectionLine(hoveredNodeIndex);
    syncLine();

    window.addEventListener('resize', syncLine);
    window.addEventListener('scroll', syncLine, true);
    return () => {
      window.removeEventListener('resize', syncLine);
      window.removeEventListener('scroll', syncLine, true);
    };
  }, [hoveredNodeIndex, updateConnectionLine]);

  return (
    <section
      ref={sectionRef}
      className={`relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 ${
        isLightTheme ? publicSiteTheme.light.pageBg : 'bg-[#05070c]'
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isLightTheme
            ? 'bg-[radial-gradient(circle_at_70%_40%,rgba(59,130,246,0.12),rgba(245,245,243,0)_48%)]'
            : 'bg-[radial-gradient(circle_at_70%_40%,rgba(30,64,175,0.35),rgba(5,7,12,0)_48%)]'
        }`}
      />

      <div className="relative mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[1fr_1.12fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <p
            className={`text-sm uppercase tracking-[0.2em] ${
              isLightTheme ? 'text-[#5f6f8d]' : 'text-[#8ea0c8]'
            }`}
          >
            Integrations
          </p>
          <h2
            className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl ${
              isLightTheme ? 'text-[#101828]' : 'text-white'
            }`}
          >
            Connect every operational signal in one command layer
          </h2>
          <p
            className={`mt-4 max-w-[600px] text-base leading-relaxed sm:text-lg ${
              isLightTheme ? 'text-[#5c6d8a]' : 'text-[#b8bfd2]'
            }`}
          >
            Capture inputs from forms, messaging, payments, APIs, and field
            systems, then turn them into accountable workflows and real-time
            executive insight.
          </p>

          <Link
            href="/documentation"
            className={`mt-7 inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
              isLightTheme
                ? 'border-[#d0dbef] bg-white text-[#19315f] hover:bg-[#eef3ff]'
                : 'border-white/20 bg-[#101725] text-[#dbe5fb] hover:bg-[#17233b]'
            }`}
          >
            View integration docs
          </Link>
        </motion.div>

        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
          className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 ${
            isLightTheme
              ? 'border-[#d8e2f4] bg-white'
              : 'border-white/10 bg-[#0d121d]'
          }`}
        >
          <div
            className={`pointer-events-none absolute inset-0 ${
              isLightTheme
                ? 'bg-[radial-gradient(circle_at_52%_50%,rgba(59,130,246,0.16),rgba(255,255,255,0)_52%)]'
                : 'bg-[radial-gradient(circle_at_52%_50%,rgba(37,99,235,0.25),rgba(13,18,29,0)_52%)]'
            }`}
          />

          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 md:block">
            {[0, 30, 60, 90, 120, 150].map((angle) => (
              <span
                key={angle}
                className={`absolute left-1/2 top-1/2 h-px w-[130px] origin-left -translate-y-1/2 ${
                  isLightTheme ? 'bg-[#9ec0ff]/45' : 'bg-[#3d65b7]/45'
                }`}
                style={{ transform: `rotate(${angle}deg)` }}
              />
            ))}
          </div>

          <div
            className={`pointer-events-none absolute left-1/2 top-1/2 z-[1] hidden h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xs font-semibold tracking-[0.08em] md:flex ${
              isLightTheme
                ? 'border-[#a8c2f0] bg-[#edf4ff] text-[#1c3a6a]'
                : 'border-[#31579f] bg-[#13213b] text-[#c5d5f2]'
            }`}
          >
            Operational Data Hub
          </div>

          {connectionLine ? (
            <svg
              className="pointer-events-none absolute inset-0 z-[2] hidden md:block"
              width="100%"
              height="100%"
              viewBox={`0 0 ${panelRef.current?.offsetWidth ?? 100} ${
                panelRef.current?.offsetHeight ?? 100
              }`}
              preserveAspectRatio="none"
              aria-hidden
            >
              <motion.line
                x1={connectionLine.x1}
                y1={connectionLine.y1}
                x2={connectionLine.x2}
                y2={connectionLine.y2}
                stroke={isLightTheme ? '#3b82f6' : '#7aa8ff'}
                strokeWidth="1.75"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
              />
              <motion.circle
                cx={connectionLine.x1}
                cy={connectionLine.y1}
                r="3"
                fill={isLightTheme ? '#3b82f6' : '#93c5fd'}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
              <motion.circle
                cx={connectionLine.x2}
                cy={connectionLine.y2}
                r="4"
                fill={isLightTheme ? '#1d4ed8' : '#60a5fa'}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.95 }}
                transition={{ duration: 0.2, delay: 0.06, ease: 'easeOut' }}
              />
            </svg>
          ) : null}

          <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3">
            {integrationItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
                  }
                  transition={{
                    duration: 0.42,
                    delay: 0.04 * index,
                    ease: 'easeOut',
                  }}
                >
                  <motion.div
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    animate={{
                      y: [0, -item.floatOffset, 0, item.floatOffset, 0],
                    }}
                    transition={{
                      duration: 8 + (index % 4),
                      ease: 'easeInOut',
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    whileHover={{ scale: 1.04 }}
                    onMouseEnter={() => handleNodeEnter(index)}
                    onFocus={() => handleNodeEnter(index)}
                    onMouseLeave={clearNodeHover}
                    onBlur={clearNodeHover}
                    tabIndex={0}
                    className="will-change-transform"
                  >
                    <div
                      className={`group rounded-2xl border px-3 py-4 transition duration-300 ${item.accentClass} ${
                        isLightTheme
                          ? 'border-[#d8e2f4] bg-[#f8fbff] hover:bg-white'
                          : 'border-white/10 bg-[#11182a] hover:bg-[#172139]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                            isLightTheme
                              ? 'bg-[#eaf2ff] text-[#244887]'
                              : 'bg-[#1a2845] text-[#bcd1f8]'
                          } relative`}
                        >
                          <motion.span
                            aria-hidden
                            className="bg-current/20 absolute inset-0 rounded-xl"
                            animate={{
                              opacity:
                                hoveredNodeIndex === index
                                  ? [0.24, 0.42, 0.24]
                                  : [0.12, 0.24, 0.12],
                              scale:
                                hoveredNodeIndex === index
                                  ? [1, 1.22, 1]
                                  : [1, 1.12, 1],
                            }}
                            transition={{
                              duration: 2.4 + (index % 3) * 0.2,
                              ease: 'easeInOut',
                              repeat: Number.POSITIVE_INFINITY,
                            }}
                          />
                          <Icon className="h-4.5 w-4.5 relative z-[1]" />
                        </span>
                        <p
                          className={`text-sm font-medium leading-snug ${
                          isLightTheme ? 'text-[#182644]' : 'text-[#d9e4fb]'
                          }`}
                        >
                          {item.name}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
