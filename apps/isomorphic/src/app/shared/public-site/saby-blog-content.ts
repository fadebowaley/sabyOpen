export type BlogArticleSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogArticleImage = {
  url?: string | null;
  alt?: string;
  caption?: string;
};

export type SabyBlogArticle = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  author: string;
  publishedOn: string;
  readTime: string;
  lead: string;
  image?: BlogArticleImage | null;
  contentHtml?: string;
  contentText?: string;
  sections: BlogArticleSection[];
};

export const sabyBlogArticles: SabyBlogArticle[] = [
  {
    slug: 'how-to-maintain-brand-control-with-saby',
    category: 'inside saby',
    title: 'How to maintain brand control when building with Saby',
    summary:
      'Set standards, templates, and governance that keep every team aligned as your apps scale.',
    author: 'Talia Moyal',
    publishedOn: 'February 17, 2026',
    readTime: '5 min read',
    lead: 'As marketing and operations teams build directly with AI, brand consistency can drift fast. A solid governance model keeps quality high while still moving quickly.',
    sections: [
      {
        heading: '1. Build from Shared Foundations',
        paragraphs: [
          'Start with a single design-token and component library for typography, color, spacing, and interaction patterns. Every workspace should inherit these defaults automatically.',
          'When teams create new projects, they begin from approved templates rather than blank canvases. This simple constraint prevents most visual drift early.',
        ],
      },
      {
        heading: '2. Define Project Guardrails',
        paragraphs: [
          'Guardrails should be visible and practical: naming conventions, content tone, accessibility checks, and QA requirements before publish.',
        ],
        bullets: [
          'Use mandatory review rules for production environments.',
          'Require owner assignment for each project before release.',
          'Track deviations and classify them as intentional or accidental.',
        ],
      },
      {
        heading: '3. Standardize Cross-Team Collaboration',
        paragraphs: [
          'Brand control is not only design. Engineering, product, and operations need a common workflow for proposing and approving updates.',
          'Saby workflow approvals help route changes through the right stakeholders without slowing down development.',
        ],
      },
      {
        heading: '4. Measure and Improve Continuously',
        paragraphs: [
          'Set measurable standards: accessibility score, brand-compliance score, and release quality checks. Review these metrics weekly to identify where teams need support.',
          'Consistency is a process, not a one-time setup. Tight feedback loops keep standards current as the product evolves.',
        ],
      },
    ],
  },
  {
    slug: 'designing-llm-load-balancing-for-agent-workflows',
    category: 'inside saby',
    title: 'Designing LLM provider load balancing for agent workflows',
    summary:
      'How Saby built a robust provider load balancer to manage high-throughput agent execution.',
    author: 'Marten Wiman',
    publishedOn: 'February 8, 2026',
    readTime: '9 min read',
    lead: 'Agentic systems demand more than a single model endpoint. Reliable orchestration needs routing logic that balances quality, latency, and cost in real time.',
    sections: [
      {
        heading: '1. Route by Workload Type',
        paragraphs: [
          'Instead of sending every request to the same model, classify workload intent first. Summarization, extraction, and reasoning tasks often perform best on different providers.',
          'Intent-based routing reduces latency spikes and improves answer quality across mixed workloads.',
        ],
      },
      {
        heading: '2. Score Providers Continuously',
        paragraphs: [
          'Provider score should combine p95 latency, error rate, and token cost. A weighted scoring model allows real-time traffic shifts when one provider degrades.',
        ],
        bullets: [
          'Update scores at short intervals to avoid stale routing decisions.',
          'Use health thresholds for automatic fallback and traffic draining.',
          'Store score history for incident post-mortems and tuning.',
        ],
      },
      {
        heading: '3. Add Prompt Cache and Replay',
        paragraphs: [
          'Caching normalized prompts handles repeated traffic efficiently and lowers costs. Replay queues absorb burst traffic during release windows.',
          'Combined with smart TTL rules, cache hit rates can stay high without serving stale responses.',
        ],
      },
      {
        heading: '4. Enforce Operational Guardrails',
        paragraphs: [
          'Timeout envelopes, retry caps, and budget ceilings should be enforced before each dispatch. These controls prevent runaway costs and noisy-failure loops.',
          'Treat guardrails as configuration, not code. Teams should tune them by environment safely.',
        ],
      },
    ],
  },
  {
    slug: 'building-approval-workflows-with-node-ownership',
    category: 'development 101',
    title: 'Building approval workflows with node ownership',
    summary:
      'Practical patterns for routing approvals by branch, function, and escalation level.',
    author: 'Saby Product',
    publishedOn: 'January 28, 2026',
    readTime: '7 min read',
    lead: 'Clear ownership models are the difference between reliable approvals and stalled operations. Node-based workflows let every decision map to accountable teams.',
    sections: [
      {
        heading: '1. Assign Explicit Owners Per Node',
        paragraphs: [
          'Every approval node needs a named owner and backup owner. Ownership metadata should be maintained centrally and used by workflow rules at runtime.',
        ],
      },
      {
        heading: '2. Define Escalation Paths',
        paragraphs: [
          'Escalation is required for business continuity. If a task remains untouched beyond SLA, route automatically to the next approver tier.',
        ],
        bullets: [
          'Use time-based escalation for urgent submissions.',
          'Support functional escalation for specialized reviews.',
          'Notify initiators whenever escalation occurs.',
        ],
      },
      {
        heading: '3. Add Context to Every Approval',
        paragraphs: [
          'Approvers need full context: prior history, supporting documents, and policy references. Rich context improves decision speed and consistency.',
        ],
      },
      {
        heading: '4. Audit Every Transition',
        paragraphs: [
          'Capture each status change with actor, timestamp, and rationale. This creates a complete audit trail for compliance and process optimization.',
        ],
      },
    ],
  },
  {
    slug: 'from-spreadsheets-to-operational-intelligence',
    category: 'stories',
    title: 'From spreadsheets to operational intelligence in 30 days',
    summary:
      'A rollout playbook for teams migrating manual reporting into connected workflows.',
    author: 'Saby Team',
    publishedOn: 'January 20, 2026',
    readTime: '6 min read',
    lead: 'Teams that depend on spreadsheet-heavy operations can transition faster than expected. A phased rollout strategy minimizes disruption while improving visibility.',
    sections: [
      {
        heading: '1. Baseline the Current Process',
        paragraphs: [
          'Document every source spreadsheet, owner, and reporting handoff. This creates a realistic migration map and highlights immediate pain points.',
        ],
      },
      {
        heading: '2. Migrate in Weekly Waves',
        paragraphs: [
          'Move one workflow family at a time: ingestion first, then validation, then reporting. Weekly waves keep teams focused and reduce rollout risk.',
        ],
        bullets: [
          'Week 1: Data intake and validation rules',
          'Week 2: Approvals and role-based access',
          'Week 3: Dashboards and recurring reports',
          'Week 4: Optimization and team enablement',
        ],
      },
      {
        heading: '3. Train Teams with Live Scenarios',
        paragraphs: [
          'Hands-on training with real operational examples accelerates adoption. Users should practice end-to-end flows before full cutover.',
        ],
      },
      {
        heading: '4. Track Outcomes and Iterate',
        paragraphs: [
          'Measure time saved, error-rate reduction, and reporting cycle speed. Use the first 30 days to tune forms, policies, and dashboards for long-term scale.',
        ],
      },
    ],
  },
];

export const getSabyBlogArticle = (slug: string) =>
  sabyBlogArticles.find((article) => article.slug === slug);
