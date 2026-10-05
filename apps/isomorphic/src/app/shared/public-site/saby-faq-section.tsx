'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { publicSiteTheme } from './public-theme-classes';

type SabyFaqSectionProps = {
  isLightTheme: boolean;
};

type SabyFaqItem = {
  id: string;
  question: string;
  answer: string;
};

type SabyFaqCategory = {
  id: string;
  label: string;
  items: SabyFaqItem[];
};

const faqCategories: SabyFaqCategory[] = [
  {
    id: 'general',
    label: 'General',
    items: [
      {
        id: 'what-is-saby',
        question: 'What is Saby?',
        answer:
          'Saby is an intelligence layer for multi-branch, compliance-heavy organizations. It helps teams collect operational data, enforce rules, monitor submissions, and generate executive-ready insight from the data already flowing through their workspace.',
      },
      {
        id: 'who-is-saby-for',
        question: 'Who is Saby built for?',
        answer:
          'Saby is built for organizations with distributed teams, branches, nodes, field officers, departments, or regulated reporting workflows. Typical users include owners, administrators, compliance teams, operations teams, finance teams, and executives who need reliable visibility across many locations.',
      },
      {
        id: 'different-from-dashboard',
        question: 'How is Saby different from a normal dashboard?',
        answer:
          'A dashboard shows what already happened. Saby goes further by structuring the data capture process, checking completion, enforcing workflow rules, detecting gaps, and helping leaders ask questions in natural language through Saby Intelligence.',
      },
      {
        id: 'industries',
        question: 'Which industries can use Saby?',
        answer:
          'Saby can support finance, healthcare, education, NGOs, faith-based organizations, government, retail, agriculture, energy, and other sectors where teams need structured data collection, approvals, audit trails, and reliable reporting across multiple operating units.',
      },
    ],
  },
  {
    id: 'plans-pricing',
    label: 'Plans & Pricing',
    items: [
      {
        id: 'plan-fit',
        question: 'Which Saby plan is right for my organization?',
        answer:
          'Start with the plan that matches your operating scale: number of users, branches or nodes, expected submissions, storage needs, and reporting requirements. Smaller teams can begin with a lower plan, while organizations running compliance, approvals, or executive reporting across many branches should use a higher plan or speak with Saby for a tailored setup.',
      },
      {
        id: 'limit-reached',
        question: 'What happens when I reach my response or usage limit?',
        answer:
          'Saby will not silently delete your data. If you approach a plan limit, the workspace will show usage signals and billing guidance. Depending on the feature, you may need to upgrade, add capacity, or contact support before additional usage is allowed.',
      },
      {
        id: 'currency-provider',
        question: 'Can I pay in different currencies or with different providers?',
        answer:
          'Saby supports configured checkout currencies and payment providers such as Paystack and Flutterwave where available. Provider availability can depend on your currency, country, and the payment environment enabled for your workspace.',
      },
      {
        id: 'zero-total',
        question: 'What happens if my coupon or credit makes the checkout total zero?',
        answer:
          'If the final amount is zero after valid credits, coupons, or promotions, Saby can activate the subscription without sending you through an external payment provider. The backend still validates the plan, tenant, user, and applied credit before activation.',
      },
      {
        id: 'billing-records',
        question: 'Where do I see invoices and receipts?',
        answer:
          'Workspace billing pages show your active subscription, billing status, invoices, receipts, and payment references. Saby can also send billing emails with attached receipts or invoices when payment events are completed or fail.',
      },
    ],
  },
  {
    id: 'account-workspace',
    label: 'Account & Workspace',
    items: [
      {
        id: 'workspace-owner',
        question: 'Who owns a Saby workspace?',
        answer:
          'A tenant owner owns the workspace and can invite team members, manage access, configure billing, and control workspace-level features. Invited administrators and team users can receive permissions based on their assigned role.',
      },
      {
        id: 'submitter-vs-user',
        question: 'What is the difference between a submitter and a workspace user?',
        answer:
          'A submitter may exist in Saby because they filled a form or authenticated to submit data. That does not automatically make them a workspace actor. Workspace users are tenant owners, admins, or invited team members with access to the main application. A workspace user can also be a submitter when they complete forms.',
      },
      {
        id: 'team-invite',
        question: 'Can I invite my team into Saby?',
        answer:
          'Yes. Workspace owners and authorized admins can invite team members, assign roles, and manage access to workspace features such as Studio, billing, vault, automations, and reports.',
      },
      {
        id: 'nodes-structures',
        question: 'Can Saby represent branches, nodes, levels, and structures?',
        answer:
          'Yes. Saby is designed for organizations with complex tenant structures, levels, nodes, roles, and assignments. This allows reporting and access to be scoped by the way the organization actually operates.',
      },
    ],
  },
  {
    id: 'data-forms-reports',
    label: 'Data, Forms & Reports',
    items: [
      {
        id: 'project-forms',
        question: 'What are project forms in Saby?',
        answer:
          'Project forms are structured data collection modules. They can capture submissions from branches, teams, customers, field officers, or public links, then store the results for reporting, compliance checks, and intelligence analysis.',
      },
      {
        id: 'existing-data',
        question: 'Can Saby generate reports from saved submissions?',
        answer:
          'Yes. Saby Intelligence can use selected project forms as query references and generate summaries, tables, trends, branch rankings, risks, and executive briefs from saved submission data while respecting backend permissions.',
      },
      {
        id: 'exports',
        question: 'Can I export reports or documents?',
        answer:
          'Saby supports report output workflows such as PDF and DOCX generation where enabled. These outputs are designed for leaders who need board-ready summaries, audit evidence, or operational reports from workspace data.',
      },
      {
        id: 'data-changing-actions',
        question: 'Can Saby Intelligence change my data automatically?',
        answer:
          'Saby Intelligence is designed to be safe by default. Read-only analysis can run without changing records. Any data-changing action should go through explicit permission checks, confirmation, and backend guardrails before execution.',
      },
    ],
  },
  {
    id: 'security-compliance',
    label: 'Security & Compliance',
    items: [
      {
        id: 'secure-data',
        question: 'How does Saby protect organization data?',
        answer:
          'Saby uses authenticated access, tenant scoping, role-based permissions, audit-aware workflows, and backend validation to keep workspace data separated and controlled. Sensitive operations are not trusted from the browser alone.',
      },
      {
        id: 'mfa-passkeys',
        question: 'Does Saby support MFA and passkeys?',
        answer:
          'Yes. Saby supports multi-factor authentication flows including authenticator codes and passkeys where configured. If both are enabled, passkey sign-in can be prioritized while authenticator code remains available as another verification method.',
      },
      {
        id: 'compliance-workflows',
        question: 'Can Saby enforce compliance workflows?',
        answer:
          'Yes. Saby can track required submissions, detect missing or late data, send reminders, route approvals, and generate compliance summaries for responsible users and executives.',
      },
      {
        id: 'data-visibility',
        question: 'Can users see all tenant data by default?',
        answer:
          'No. Access should be based on role, tenant, workspace, node, and assignment rules. Owners and authorized admins have broader visibility, while team users and submitters should only see what their role allows.',
      },
    ],
  },
  {
    id: 'integrations-intelligence',
    label: 'Integrations & Intelligence',
    items: [
      {
        id: 'integrations',
        question: 'What integrations can Saby connect to?',
        answer:
          'Saby is being designed to work with forms, databases, APIs, storage, workflow tools, payment providers, and productivity apps. The integration layer should expand over time without forcing each organization to rebuild its reporting setup.',
      },
      {
        id: 'saby-intelligence',
        question: 'What can Saby Intelligence do today?',
        answer:
          'Saby Intelligence can support executive-style analysis such as summaries, tables, trends, risk notes, branch comparisons, and report drafts from project form data. Advanced code and SQL execution should run only through controlled sandbox and read-only query layers.',
      },
      {
        id: 'custom-queries',
        question: 'Will Saby support custom questions over my data?',
        answer:
          'Yes. The goal is for leaders to ask natural-language questions like "show completion by branch" or "generate an executive brief for this form." Saby maps those requests to safe backend tools and semantic context instead of exposing raw database access to the client.',
      },
      {
        id: 'automation',
        question: 'Can Saby automate reminders and alerts?',
        answer:
          'Yes. Saby can support scheduled alerts, compliance reminders, anomaly notices, approval updates, and operational notifications where the workspace has configured the relevant schedules and recipients.',
      },
    ],
  },
  {
    id: 'support-community',
    label: 'Support & Community',
    items: [
      {
        id: 'support',
        question: 'How do I get support?',
        answer:
          'You can contact Saby at hello@saby.ai or use the support pages in the product. For urgent account, billing, security, or workspace issues, include your organization name, workspace email, and a short description of the problem.',
      },
      {
        id: 'lost-device',
        question: 'What if I lose access to my authenticator or passkey device?',
        answer:
          'Contact support so the team can verify ownership and help recover access safely. Saby should never disable security methods without proper identity and workspace checks.',
      },
      {
        id: 'feature-request',
        question: 'How do I request a feature or report a bug?',
        answer:
          'Send details to support with the affected page, workspace, screenshots if available, and the expected behavior. For workspace-specific issues, include the project form, node, or billing reference when relevant.',
      },
    ],
  },
];

export { faqCategories };

export default function SabyFaqSection({ isLightTheme }: SabyFaqSectionProps) {
  const [activeCategoryId, setActiveCategoryId] = useState(faqCategories[0].id);
  const [openItemId, setOpenItemId] = useState(faqCategories[0].items[0].id);

  const activeCategory = useMemo(
    () =>
      faqCategories.find((category) => category.id === activeCategoryId) ||
      faqCategories[0],
    [activeCategoryId]
  );

  const handleCategoryChange = (category: SabyFaqCategory) => {
    setActiveCategoryId(category.id);
    setOpenItemId(category.items[0]?.id || '');
  };

  return (
    <section
      id="faqs-section"
      className={`relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8 ${
        isLightTheme
          ? `${publicSiteTheme.light.pageBg} text-[#070707]`
          : 'bg-[#10141d] text-white'
      }`}
    >
      <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-16">
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <p
            className={`mb-6 text-xs font-semibold uppercase tracking-[0.28em] ${
              isLightTheme ? 'text-[#7f8a9c]' : 'text-white/45'
            }`}
          >
            Saby answers
          </p>
          <h2
            className={`max-w-[340px] text-[3.4rem] font-semibold leading-[0.92] tracking-[-0.07em] sm:text-[4.5rem] lg:text-[4.9rem] ${
              isLightTheme ? 'text-black' : 'text-white'
            }`}
          >
            Frequently
            <br />
            asked
            <br />
            <span className="font-light">questions</span>
          </h2>

          <nav className="mt-12 flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-3 lg:overflow-visible lg:pb-0">
            {faqCategories.map((category) => {
              const isActive = category.id === activeCategory.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryChange(category)}
                  className={`shrink-0 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition lg:block lg:w-fit lg:text-base ${
                    isActive
                      ? isLightTheme
                        ? 'bg-white text-black shadow-[0_0_0_2px_rgba(255,255,255,0.9)]'
                        : 'bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.16)]'
                      : isLightTheme
                        ? 'text-[#8a8a8a] hover:text-black'
                        : 'text-white/45 hover:text-white'
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <p className="mb-10 text-lg font-semibold text-[#6d35ff] sm:text-xl">
            {activeCategory.label}
          </p>

          <div>
            {activeCategory.items.map((item, index) => {
              const isOpen = item.id === openItemId;
              return (
                <article
                  key={item.id}
                  className={`border-b ${
                    index === 0 ? 'border-t' : ''
                  } ${isLightTheme ? 'border-[#e1e1de]' : 'border-white/10'}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenItemId((current) =>
                        current === item.id ? '' : item.id
                      )
                    }
                    className="flex w-full items-start justify-between gap-6 py-7 text-left sm:py-9"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`max-w-[920px] text-2xl font-semibold leading-[1.14] tracking-[-0.035em] sm:text-[1.75rem] lg:text-[2rem] ${
                        isLightTheme ? 'text-[#050505]' : 'text-white'
                      }`}
                    >
                      {item.question}
                    </span>
                    <span
                      className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl transition ${
                        isLightTheme
                          ? 'text-black hover:bg-black hover:text-white'
                          : 'text-white hover:bg-white hover:text-black'
                      }`}
                    >
                      {isOpen ? (
                        <Minus className="h-5 w-5" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="pb-8 pr-12 sm:pb-10">
                      <p
                        className={`max-w-[980px] text-lg leading-8 tracking-[-0.015em] sm:text-[1.35rem] sm:leading-9 ${
                          isLightTheme ? 'text-[#6d6d69]' : 'text-white/62'
                        }`}
                      >
                        {item.answer}
                      </p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
