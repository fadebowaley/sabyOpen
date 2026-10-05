import { CustomField } from '../api/tenantConfig';
import { CustomFieldConfig } from '../api/baselineIntelligence';

/**
 * Maps Tenant Config field types to Analytics Config field types
 * 
 * This ensures that when a field is created in Tenant Config,
 * it gets the correct analytics type for baseline intelligence.
 * 
 * Supports metadata for enhanced type mapping:
 * - number + format: 'currency' → currency
 * - number + format: 'percentage' → percentage
 * - date + includeTime: true → datetime
 */
export function mapTenantTypeToAnalyticsType(
  tenantType: CustomField['type'],
  analytics?: CustomField['analytics']
): CustomFieldConfig['fields'][0]['type'] {
  // Handle number with format metadata
  if (tenantType === 'number' && analytics?.format) {
    if (analytics.format === 'currency') {
      return 'currency';
    }
    if (analytics.format === 'percentage') {
      return 'percentage';
    }
  }

  // Handle date with includeTime metadata
  if (tenantType === 'date' && analytics?.includeTime) {
    return 'datetime';
  }

  // Default mapping
  const mapping: Record<
    CustomField['type'],
    CustomFieldConfig['fields'][0]['type']
  > = {
    text: 'text',
    textarea: 'text', // Textarea treated as text in analytics
    number: 'number',
    date: 'date',
    boolean: 'boolean',
    select: 'select',
    'multi-select': 'multi-select',
    attachment: 'text', // Attachments not analyzed, fallback to text
  };

  return mapping[tenantType] || 'text';
}

/**
 * Checks if a field type is analyzable in baseline intelligence
 * 
 * Some field types (like attachments) are not suitable for analytics.
 * Also checks metadata for explicit exclusion.
 */
export function isAnalyzableType(
  tenantType: CustomField['type'],
  analytics?: CustomField['analytics']
): boolean {
  // Attachments are not analyzed
  if (tenantType === 'attachment') {
    return false;
  }

  // Check if explicitly excluded from analytics
  if (analytics?.excludeFromAnalytics === true) {
    return false;
  }

  return true;
}

