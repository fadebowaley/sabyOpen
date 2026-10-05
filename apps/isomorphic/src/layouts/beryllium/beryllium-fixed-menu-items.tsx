import { routes } from '@/config/routes';
import { IconType } from 'react-icons/lib';

import { atom } from 'jotai';
import {
  PiPlugsConnected,
  PiKey,
  PiCloudDuotone,
  PiAirplaneTilt,
  PiCalendarPlus,
  PiChatCenteredDots,
  PiCodesandboxLogo,
  PiEnvelopeSimpleOpen,
  PiFeather,
  PiHouseLine,
  PiMagicWand,
  PiNetwork,
  PiPackage,
  PiShapes,
  PiSquaresFour,
  PiUser,
  PiBrainDuotone,
  PiBrain,
  PiChatBold,
  PiChartBar,
  PiFileText,
  PiNotePencil,
  PiTable,
  PiCalendar,
  PiClock,
  PiCurrencyDollar,
} from 'react-icons/pi';

export interface SubMenuItemType {
  name: string;
  description?: string;
  href: string;
  badge?: string;
}

export interface ItemType {
  name: string;
  icon: IconType;
  href?: string;
  description?: string;
  badge?: string;
  subMenuItems?: SubMenuItemType[];
}

export interface MenuItemsType {
  id: string;
  name: string;
  title: string;
  icon: IconType;
  menuItems: ItemType[];
}

export const berylliumMenuItems: MenuItemsType[] = [
  {
    id: '1',
    name: 'Saby',
    title: 'Saby Kits',
    icon: PiChatBold,
    menuItems: [
      {
        name: 'Sabychat',
        href: routes.intelligence,
        icon: PiChatCenteredDots,
      },
      {
        name: 'Studio',
        href: routes.studioV2.index,
        icon: PiMagicWand,
      },
      {
        name: 'In-Mail',
        href: routes.inmails,
        icon: PiEnvelopeSimpleOpen,
      },
      {
        name: 'Event Calendar',
        href: routes.eventCalendar,
        icon: PiCalendarPlus,
      },
    ],
  },

  {
    id: '2',
    name: 'Studio',
    title: 'Studio Workspace',
    icon: PiMagicWand,
    menuItems: [
      {
        name: 'Team',
        href: routes.studioV2.team,
        icon: PiUser,
      },
      {
        name: 'Integration',
        href: routes.studioV2.automations,
        icon: PiPlugsConnected,
      },
      {
        name: 'Vault',
        href: routes.studioV2.vault,
        icon: PiKey,
      },
    ],
  },

  {
    id: '3',
    name: 'Apps',
    title: 'Apps Kit',
    icon: PiBrainDuotone,
    menuItems: [
      {
        name: 'Users Access',
        description: '"View and Control Users and Structures with Ease!"',
        icon: PiUser,
        subMenuItems: [
          {
            name: 'Users',
            href: routes.users.usersTable,
          },
          {
            name: 'Roles',
            href: routes.users.rolesTable,
          },
          {
            name: 'User Settings',
            href: routes.apiUserSettings,
          },
        ],
      },
      {
        name: 'Network',
        description: '"View and Edit Organisation Structure and Level"',
        icon: PiNetwork,
        subMenuItems: [
          {
            name: 'Create',
            href: routes.networkCreate,
          },
          {
            name: 'Manage',
            href: routes.networkManage,
          },
        ],
      },
      {
        name: 'Node',
        description: '"View and manage Organisation Structure and Level"',
        icon: PiCodesandboxLogo,
        subMenuItems: [
          {
            name: 'Create',
            href: routes.node.create,
          },
          {
            name: 'Distribution',
            href: routes.node.distribution,
          },
        ],
      },
      {
        name: 'CMS',
        description: 'Manage public website content',
        icon: PiNotePencil,
        subMenuItems: [
          { name: 'Overview', href: routes.cms },
          { name: 'Product Updates', href: `${routes.cms}?type=product-updates` },
          { name: 'Documentation', href: `${routes.cms}?type=documentation` },
          { name: 'Partners', href: `${routes.cms}?type=partners` },
          { name: 'Privacy Policy', href: `${routes.cms}?type=privacy-policy` },
          { name: 'Terms of Service', href: `${routes.cms}?type=terms-of-service` },
          { name: 'Blog', href: `${routes.cms}?type=blog` },
        ],
      },
    ],
  },
  {
    id: '4',
    name: 'APIs',
    title: 'API Connections',
    icon: PiPlugsConnected,
    menuItems: [
      {
        name: 'Api Keys',
        icon: PiKey,
        description: 'Manage API keys and access',
        subMenuItems: [
          {
            name: 'API Center',
            href: routes.apis,
          },
          {
            name: 'Go Live',
            href: routes.apiGoLive,
          },
          {
            name: 'Approvals',
            href: routes.apiApprovals,
          },
        ],
      },
      {
        name: 'Projects',
        icon: PiAirplaneTilt,
        description: 'Manage modules and calendars',
        subMenuItems: [
          {
            name: 'Modules',
            href: routes.studioV2.index,
          },
          {
            name: 'Calendar Management',
            href: routes.calendarManagement,
          },
        ],
      },
    ],
  },
  {
    id: '5',
    name: 'Reports',
    title: 'Compliance & Data Reports',
    icon: PiChartBar,
    menuItems: [
      {
        name: 'PERM Dashboard',
        href: routes.permDashboard,
        icon: PiFileText,
        description: 'PERM compliance tracking and reporting',
      },
      {
        name: 'Submissions',
        href: routes.submissions,
        icon: PiTable,
        description: 'All module submissions and data',
      },
      {
        name: 'Baseline Intelligence',
        icon: PiBrain,
        description: 'Structural insights and analytics',
        subMenuItems: [
          {
            name: 'Dashboard',
            href: routes.baseline.dashboard,
          },
          {
            name: 'Network',
            href: routes.baseline.network,
          },
          {
            name: 'Users & Demographics',
            href: routes.baseline.usersDemographics,
          },
          {
            name: 'Networks & Geographics',
            href: routes.baseline.networksGeographics,
          },
          {
            name: 'Property Distributions',
            href: routes.baseline.propertyDistributions,
          },
          {
            name: 'Insights & Recommendations',
            href: routes.baseline.insightsRecommendations,
          },
          {
            name: 'Profile Compliance',
            href: routes.baseline.compliance,
          },
          {
            name: 'Update Leaderboard',
            href: routes.baseline.leaderboard,
          },
        ],
      },
      {
        name: 'Activity Logs',
        href: routes.logs,
        icon: PiCodesandboxLogo,
        description: 'System activity and audit logs',
      },
      {
        name: 'Audit Trail',
        href: routes.auditTrail,
        icon: PiClock,
        description: 'System audit trail and event history',
      },
      {
        name: 'Payments',
        href: routes.payments,
        icon: PiCurrencyDollar,
        description: 'Payment settlement and reconciliation flow',
      },
    ],
  },
  {
    id: '6',
    name: 'Storage',
    title: 'Drive',
    icon: PiCloudDuotone,
    menuItems: [
      {
        name: 'Files',
        href: routes.storage.files,
        icon: PiSquaresFour,
      },
      {
        name: 'Cloud Storage',
        href: routes.storage.manager,
        icon: PiSquaresFour,
      },
    ],
  },
];

export const berylliumMenuItemAtom = atom(berylliumMenuItems[0]);
