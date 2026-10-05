'use client';

import SabyLegalTemplate, {
  type LegalSection,
} from '@/app/shared/public-site/saby-legal-template';
import { getCmsEntries } from '@/app/shared/public-site/cms-entry-utils';
import {
  cmsText,
  findCmsSection,
  type PublicCmsPage,
} from '@/app/shared/public-site/cms-page-types';
import type { PublicThemeMode } from '@/app/shared/public-site/use-public-theme';

const termsSections: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Agreement to Terms',
    paragraphs: [
      'By accessing or using Saby (the "Service"), you agree to be bound by these Terms of Service (the "Terms"). If you do not agree to any part of these Terms, you may not access or use the Service.',
      'These Terms apply to all users, visitors, organizations, and others who access or use the Service.',
    ],
  },
  {
    id: 'description',
    title: 'Description of Service',
    paragraphs: [
      'Saby provides AI-assisted tools for workflow automation, reporting, internal operations, and connected business applications.',
      'The Service may include dashboards, integrations, analytics, automation workflows, and collaboration features.',
      'We may modify, improve, suspend, or discontinue features at any time, with notice where practical.',
    ],
    bullets: [
      'AI-powered insights and recommendations.',
      'Data unification and visualization.',
      'Operational automation and approvals.',
      'Integrations with third-party systems.',
    ],
  },
  {
    id: 'accounts',
    title: 'User Accounts and Registration',
    paragraphs: [
      'Certain features require account registration. You agree to provide accurate, current, and complete information and to keep it updated.',
      'You are responsible for maintaining confidentiality of credentials and for all activity under your account.',
      'If you use Saby on behalf of an organization, you confirm you are authorized to bind that organization to these Terms.',
    ],
    bullets: [
      'Maintain account security and access controls.',
      'Promptly report unauthorized access or security incidents.',
      'Use appropriate role and permission settings for your team.',
    ],
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    paragraphs: ['You must use the Service lawfully and responsibly.'],
    bullets: [
      'Do not violate laws, regulations, or third-party rights.',
      'Do not upload malicious code, malware, or harmful payloads.',
      'Do not attempt unauthorized access to systems, networks, or user data.',
      'Do not abuse, scrape, or overload the Service in ways that degrade reliability.',
      'Do not attempt to reverse engineer protected components except where permitted by law.',
    ],
  },
  {
    id: 'customer-data',
    title: 'Data and Content',
    paragraphs: [
      'You retain ownership of your submitted data and content. You grant Saby a limited license to host, process, transmit, secure, and display your content solely to provide and improve the Service.',
      'You are responsible for the legality, quality, and rights clearance of the content you submit.',
      'Saby and its software, models, code, and service materials remain our intellectual property unless expressly stated otherwise.',
    ],
  },
  {
    id: 'ai-output',
    title: 'AI and Machine Learning',
    paragraphs: [
      'Saby may provide AI-generated suggestions, analysis, and outputs. AI outputs may be incomplete or inaccurate and should be reviewed before business-critical use.',
      'You remain responsible for operational decisions, compliance, and verification of generated insights and automations.',
      'We continuously improve models and may update output behavior over time.',
    ],
  },
  {
    id: 'availability',
    title: 'Service Availability',
    paragraphs: [
      'We target high service reliability but do not guarantee uninterrupted availability.',
      'Temporary interruptions may occur due to maintenance, upgrades, incidents, provider dependencies, or force majeure events.',
      'When practical, planned maintenance notices will be provided in advance.',
    ],
  },
  {
    id: 'fees',
    title: 'Fees and Payment',
    paragraphs: [
      'Paid features are billed according to your selected plan, contract, and billing cycle.',
      'Recurring subscriptions renew automatically unless canceled before renewal.',
      'Usage-based charges may apply where your plan includes metered usage.',
    ],
    bullets: [
      'Fees are non-refundable unless required by law.',
      'Taxes may apply and are your responsibility where required.',
      'We may suspend paid functionality for overdue balances after notice.',
      'Pricing may change for future billing periods with reasonable notice.',
    ],
  },
  {
    id: 'third-party',
    title: 'Third-Party Services',
    paragraphs: [
      'The Service may integrate with third-party systems, APIs, or providers. Those services are governed by their own terms and privacy policies.',
      'Saby is not responsible for third-party service outages, policies, or functionality outside our control.',
    ],
  },
  {
    id: 'termination',
    title: 'Termination',
    paragraphs: [
      'You may stop using the Service at any time. We may suspend or terminate access for violations of these Terms, legal risk, or security threats.',
      'Upon termination, your right to use the Service ends, and data handling follows applicable retention and legal requirements.',
    ],
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    paragraphs: [
      'To the maximum extent permitted by law, the Service is provided "as is" and "as available" without warranties of any kind, whether express or implied.',
      'We do not warrant uninterrupted operation, specific outcomes, or error-free outputs.',
    ],
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    paragraphs: [
      'To the maximum extent permitted by law, Saby is not liable for indirect, incidental, special, consequential, exemplary, or punitive damages, including loss of profits, goodwill, data, or business interruption.',
      'Our aggregate liability for claims related to the Service is limited to the amount paid by you for the Service in the 12 months preceding the claim, unless a different limit is required by applicable law.',
    ],
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    paragraphs: [
      'You agree to defend, indemnify, and hold harmless Saby and its affiliates, officers, employees, and agents from claims, damages, liabilities, and costs arising from your use of the Service, your content, or your breach of these Terms.',
    ],
  },
  {
    id: 'law',
    title: 'Governing Law',
    paragraphs: [
      'These Terms are governed by the laws identified in your governing agreement, order form, or contracting entity terms, without regard to conflict of law principles.',
      'Disputes are resolved through the applicable forum and jurisdiction specified in the governing agreement.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to Terms',
    paragraphs: [
      'We may revise these Terms from time to time. When material updates are made, we will post the revised version and update the effective date.',
      'Continued use of the Service after the effective date of revised Terms constitutes acceptance of those changes.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact Information',
    paragraphs: [
      'For legal questions or notices regarding these Terms, contact support@saby.ai.',
      'You may also reach us through official support channels listed in the Service.',
    ],
  },
  {
    id: 'severability',
    title: 'Severability',
    paragraphs: [
      'If any part of these Terms is held invalid or unenforceable, the remaining provisions remain in full force and effect.',
    ],
  },
  {
    id: 'entire-agreement',
    title: 'Entire Agreement',
    paragraphs: [
      'These Terms, together with incorporated policies and any applicable order form, constitute the entire agreement between you and Saby regarding the Service and supersede prior understandings on the same subject.',
    ],
  },
];

type SabyTermsOfServicePageProps = {
  initialTheme?: PublicThemeMode;
  cmsPage?: PublicCmsPage | null;
};

export default function SabyTermsOfServicePage({
  initialTheme = 'dark',
  cmsPage = null,
}: SabyTermsOfServicePageProps) {
  const heroSection = findCmsSection(cmsPage, 'hero');
  const cmsEntries = getCmsEntries(cmsPage, 'terms-of-service');
  const legalSection = findCmsSection(cmsPage, 'legal-sections');
  const sourceSections = cmsEntries.length ? cmsEntries : legalSection?.items || [];
  const cmsSections = sourceSections
    ?.filter((item) => item.title)
    .map((item, index) => ({
      id: item.id || `terms-section-${index + 1}`,
      title: cmsText(item.title, `Section ${index + 1}`),
      href: item.slug ? `/terms-of-service/${item.slug}` : undefined,
      paragraphs: Array.isArray(item.paragraphs) && item.paragraphs.length
        ? item.paragraphs
        : [cmsText(item.body || item.description || item.summary, '')].filter(Boolean),
      bullets: Array.isArray(item.bullets) ? item.bullets : [],
    }));

  return (
    <SabyLegalTemplate
      label={cmsText(heroSection?.subtitle, 'Legal')}
      title={cmsText(heroSection?.title, 'Terms of Service')}
      description={cmsText(
        heroSection?.body,
        'These terms explain your rights and responsibilities when using Saby products, APIs, and related services.'
      )}
      updatedOn="February 18, 2026"
      sections={cmsSections?.length ? cmsSections : termsSections}
      modalDescription="Sign in to contact support about terms and account agreements."
      callbackPath="/terms-of-service"
      initialTheme={initialTheme}
    />
  );
}
