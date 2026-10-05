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

const privacySections: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    paragraphs: [
      'Saby ("we", "our", or "us") is committed to protecting your privacy. This policy explains how we collect, use, share, and protect information when you use our products and services.',
      'By using the Service, you acknowledge this policy and the processing practices described here.',
    ],
  },
  {
    id: 'information-collect',
    title: 'Information We Collect',
    paragraphs: [
      'We collect information you provide directly, information collected automatically, and information from connected third-party services.',
    ],
    bullets: [
      'Account details: name, email, organization, role, authentication credentials.',
      'Profile and communication data: support interactions, preferences, and feedback.',
      'Business content: workspace entries, uploaded files, form submissions, and reports.',
      'Billing data: payment and invoice records processed through approved providers.',
      'Device and usage data: browser, IP, logs, interaction analytics, and diagnostics.',
      'Connected service data: information from integrations you authorize.',
    ],
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    paragraphs: [
      'We process information to operate, secure, and improve the Service.',
    ],
    bullets: [
      'Provide core functionality and account access.',
      'Support analytics, reporting, and product performance monitoring.',
      'Detect abuse, prevent fraud, and enforce service security.',
      'Provide customer support and service communications.',
      'Comply with legal obligations and enforce agreements.',
    ],
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing and Disclosure',
    paragraphs: [
      'We do not sell personal information. We share data only where needed to operate the Service, fulfill legal duties, or with your direction.',
      'Data may be shared with infrastructure, analytics, communications, support, and payment service providers under contractual safeguards.',
      'We may disclose data to comply with law, legal process, or to protect rights, safety, and platform integrity.',
    ],
  },
  {
    id: 'data-security',
    title: 'Data Security',
    paragraphs: [
      'We maintain technical and organizational safeguards intended to protect personal data, including access controls, encryption in transit, and monitoring.',
      'No security method is perfect. You are responsible for keeping account credentials secure and for using appropriate permission controls.',
    ],
  },
  {
    id: 'retention',
    title: 'Data Retention',
    paragraphs: [
      'We retain personal data only as long as needed to provide services, meet legal obligations, resolve disputes, and enforce agreements.',
      'Retention periods may vary based on account status, legal requirements, and data category.',
    ],
  },
  {
    id: 'your-rights',
    title: 'Your Rights and Choices',
    paragraphs: [
      'Depending on your jurisdiction, you may have rights to access, correct, delete, restrict, or object to processing of your personal data.',
      'You may request account export, data portability, or deletion where applicable. We may need to verify identity before completing requests.',
    ],
  },
  {
    id: 'ai-ml',
    title: 'AI and Machine Learning',
    paragraphs: [
      'Saby uses AI and machine learning capabilities to provide insights and automation features.',
      'Where possible, model improvement is performed using aggregated or de-identified signals, with controls aligned to service and legal requirements.',
    ],
  },
  {
    id: 'international-transfers',
    title: 'International Data Transfers',
    paragraphs: [
      'Your information may be processed in countries other than your own. When required, we use suitable transfer safeguards such as contractual protections and equivalent legal mechanisms.',
    ],
  },
  {
    id: 'children-privacy',
    title: "Children's Privacy",
    paragraphs: [
      'Saby is not intended for children under 13 (or the equivalent minimum age in your jurisdiction), and we do not knowingly collect personal data from children.',
      'If you believe we collected such information, contact us so we can investigate and remove it where appropriate.',
    ],
  },
  {
    id: 'third-party-links',
    title: 'Third-Party Links',
    paragraphs: [
      'Our Service may include links or integrations to third-party services. Their privacy practices are governed by their own policies, not this one.',
    ],
  },
  {
    id: 'california-rights',
    title: 'California Privacy Rights',
    paragraphs: [
      'California residents may have rights under applicable California privacy laws, including rights to know, access, delete, and correct personal information, and rights related to sharing and use of personal data.',
      'You may exercise these rights by contacting us through the channels listed below.',
    ],
  },
  {
    id: 'gdpr',
    title: 'European Privacy Rights (GDPR)',
    paragraphs: [
      'Users in the EEA, UK, and similar jurisdictions may have rights under GDPR or equivalent laws, including access, rectification, erasure, restriction, objection, and portability rights.',
      'You may also have the right to lodge a complaint with a supervisory authority.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to This Privacy Policy',
    paragraphs: [
      'We may update this policy from time to time. If material changes are made, we will provide notice through the Service or other appropriate channels and update the effective date.',
      'Your continued use of the Service after the updated policy takes effect constitutes acceptance of the revised policy.',
    ],
  },
  {
    id: 'data-controller',
    title: 'Data Controller Information',
    paragraphs: [
      'Saby acts as a controller for personal data processed for account administration, billing, product security, and service operations.',
      'For customer workspace content, Saby may act as a processor depending on contract and data flow context.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact Us',
    paragraphs: [
      'For privacy questions or requests, contact privacy@saby.ai or support@saby.ai.',
      'You can also contact us through official support channels available in the Service.',
    ],
  },
  {
    id: 'consent',
    title: 'Consent',
    paragraphs: [
      'Where processing is based on consent, you may withdraw consent at any time. Withdrawal does not affect processing already performed on a lawful basis before withdrawal.',
    ],
  },
];

type SabyPrivacyPolicyPageProps = {
  initialTheme?: PublicThemeMode;
  cmsPage?: PublicCmsPage | null;
};

export default function SabyPrivacyPolicyPage({
  initialTheme = 'dark',
  cmsPage = null,
}: SabyPrivacyPolicyPageProps) {
  const heroSection = findCmsSection(cmsPage, 'hero');
  const cmsEntries = getCmsEntries(cmsPage, 'privacy-policy');
  const legalSection = findCmsSection(cmsPage, 'legal-sections');
  const sourceSections = cmsEntries.length ? cmsEntries : legalSection?.items || [];
  const cmsSections = sourceSections
    ?.filter((item) => item.title)
    .map((item, index) => ({
      id: item.id || `privacy-section-${index + 1}`,
      title: cmsText(item.title, `Section ${index + 1}`),
      href: item.slug ? `/privacy-policy/${item.slug}` : undefined,
      paragraphs: Array.isArray(item.paragraphs) && item.paragraphs.length
        ? item.paragraphs
        : [cmsText(item.body || item.description || item.summary, '')].filter(Boolean),
      bullets: Array.isArray(item.bullets) ? item.bullets : [],
    }));

  return (
    <SabyLegalTemplate
      label={cmsText(heroSection?.subtitle, 'Legal')}
      title={cmsText(heroSection?.title, 'Privacy Policy')}
      description={cmsText(
        heroSection?.body,
        'This policy describes what data Saby collects, why it is processed, and the controls available to your team.'
      )}
      updatedOn="February 18, 2026"
      sections={cmsSections?.length ? cmsSections : privacySections}
      modalDescription="Sign in to contact support about privacy and data processing."
      callbackPath="/privacy-policy"
      initialTheme={initialTheme}
    />
  );
}
