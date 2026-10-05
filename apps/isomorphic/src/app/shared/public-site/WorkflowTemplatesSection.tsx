'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  BadgeDollarSign,
  Factory,
  GraduationCap,
  HandHeart,
  HeartPulse,
  RadioTower,
  Truck,
  Users2,
  type LucideIcon,
} from 'lucide-react';
import { useRef } from 'react';
import { publicSiteTheme } from './public-theme-classes';

type WorkflowTemplatesSectionProps = {
  isLightTheme: boolean;
};

type WorkflowCategory = {
  name: string;
  icon: LucideIcon;
  templates: string[];
};

const workflowCategories: WorkflowCategory[] = [
  {
    name: 'Finance and Treasury',
    icon: BadgeDollarSign,
    templates: [
      'Expense Approval',
      'Budget Submission',
      'Invoice Processing',
      'Payment Authorization',
      'Financial Reporting',
    ],
  },
  {
    name: 'People Operations',
    icon: Users2,
    templates: [
      'Employee Onboarding',
      'Leave Requests',
      'Performance Reviews',
      'Payroll Submission',
      'Exit Clearance',
    ],
  },
  {
    name: 'Healthcare',
    icon: HeartPulse,
    templates: [
      'Patient Intake',
      'Medical Reporting',
      'Lab Result Submission',
      'Incident Reporting',
      'Equipment Tracking',
    ],
  },
  {
    name: 'Education',
    icon: GraduationCap,
    templates: [
      'Student Enrollment',
      'Attendance Tracking',
      'Result Submission',
      'Staff Evaluation',
      'Course Feedback',
    ],
  },
  {
    name: 'Logistics and Operations',
    icon: Truck,
    templates: [
      'Delivery Confirmation',
      'Fleet Inspection',
      'Inventory Tracking',
      'Incident Reporting',
      'Maintenance Requests',
    ],
  },
  {
    name: 'Faith and Nonprofit Networks',
    icon: HandHeart,
    templates: [
      'Membership Registration',
      'Attendance Reports',
      'Financial Returns',
      'Event Reporting',
      'Compliance Submission',
    ],
  },
  {
    name: 'Manufacturing',
    icon: Factory,
    templates: [
      'Quality Control Forms',
      'Production Reports',
      'Safety Inspection',
      'Equipment Monitoring',
      'Incident Reports',
    ],
  },
  {
    name: 'Field and Monitoring Ops',
    icon: RadioTower,
    templates: [
      'Sensor Monitoring',
      'Site Inspection',
      'Field Reports',
      'Asset Tracking',
      'Compliance Logging',
    ],
  },
];

export default function WorkflowTemplatesSection({
  isLightTheme,
}: WorkflowTemplatesSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.18 });
  const prefersReducedMotion = useReducedMotion();
  const introOffsetY = prefersReducedMotion ? 0 : 22;
  const cardOffsetY = prefersReducedMotion ? 0 : 26;

  return (
    <section
      ref={sectionRef}
      className={`relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 ${
        isLightTheme ? publicSiteTheme.light.pageBg : 'bg-[#070b12]'
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isLightTheme
            ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),rgba(245,245,243,0)_54%)]'
            : 'bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.2),rgba(7,11,18,0)_54%)]'
        }`}
      />

      <div className="relative mx-auto max-w-[1180px]">
        <motion.div
          initial={{ opacity: 0, y: introOffsetY }}
          animate={
            isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: introOffsetY }
          }
          transition={{
            duration: prefersReducedMotion ? 0.2 : 0.55,
            ease: 'easeOut',
          }}
          className="mx-auto max-w-[930px] text-center"
        >
          <h2
            className={`text-3xl font-semibold tracking-tight sm:text-4xl ${
              isLightTheme ? 'text-[#101828]' : 'text-white'
            }`}
          >
            Prebuilt workflows for compliance, finance, and field execution
          </h2>
          <p
            className={`mx-auto mt-4 max-w-[760px] text-base leading-relaxed sm:text-lg ${
              isLightTheme ? 'text-[#5c6d8a]' : 'text-[#b8bfd2]'
            }`}
          >
            Deploy standardized templates across branches in minutes and
            enforce accountability from submission to escalation.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflowCategories.map((category, index) => {
            const Icon = category.icon;

            return (
              <motion.article
                key={category.name}
                initial={{ opacity: 0, y: cardOffsetY }}
                animate={
                  isInView
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: cardOffsetY }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.2 : 0.46,
                  delay: prefersReducedMotion ? 0 : index * 0.06,
                  ease: 'easeOut',
                }}
                whileHover={
                  prefersReducedMotion ? undefined : { y: -6, scale: 1.01 }
                }
                className={`group rounded-2xl border p-5 transition ${
                  isLightTheme
                    ? 'border-[#d8e2f4] bg-white hover:border-[#94b8ef] hover:shadow-[0_12px_38px_rgba(30,64,175,0.13)]'
                    : 'border-white/10 bg-[#111827]/85 hover:border-[#3b82f6]/60 hover:shadow-[0_14px_42px_rgba(30,64,175,0.25)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      isLightTheme
                        ? 'bg-[#eaf2ff] text-[#1f427d]'
                        : 'bg-[#1a2a49] text-[#b8ccf2]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3
                    className={`text-lg font-semibold leading-tight ${
                      isLightTheme ? 'text-[#111f3b]' : 'text-white'
                    }`}
                  >
                    {category.name}
                  </h3>
                </div>

                <ul
                  className={`mt-4 space-y-1.5 text-sm ${
                    isLightTheme ? 'text-[#4e5f7f]' : 'text-[#c2ccde]'
                  }`}
                >
                  {category.templates.map((template) => (
                    <li
                      key={`${category.name}-${template}`}
                      className="flex gap-2"
                    >
                      <span
                        className={`mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full ${
                          isLightTheme ? 'bg-[#3b82f6]' : 'bg-[#7aa8ff]'
                        }`}
                      />
                      <span>{template}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
