import { routes } from "@core/config/routes";
import { DUMMY_ID } from "@core/config/constants";

// Note: do not add href in the label object, it is rendering as label
export const pageLinks = [
  // label start
  {
    name: "Overview",
  },
  // label end
  {
    name: "Analytics",
    href: routes.analytics,
  },
  {
    name: "Event Calendar",
    href: routes.eventCalendar,
  },
  {
    name: "Intelligence",
    href: "/intelligence",
  },
  {
    name: "Studio",
    href: "/studio",
  },
  {
    name: "In-mails",
    href: routes.inmails,
  },
  // label start
  {
    name: "Apps",
  },
  // label end
  {
    name: "APIs Dashboard",
    href: routes.apis,
  },
  {
    name: "API Center",
    href: routes.apiCenter,
  },
  {
    name: "Users Table",
    href: routes.users.usersTable,
  },
  {
    name: "Roles Table",
    href: routes.users.rolesTable,
  },
  {
    name: "Levels Table",
    href: routes.users.levelsTable,
  },
  {
    name: "Network Level",
    href: routes.network.level,
  },
  {
    name: "Network Structure",
    href: routes.network.structure,
  },
  {
    name: "Node Create",
    href: routes.node.create,
  },
  {
    name: "Node Manage",
    href: routes.node.manage,
  },
  {
    name: "Invoice List",
    href: routes.invoice.home,
  },
  {
    name: "Invoice Details",
    href: routes.invoice.details(DUMMY_ID),
  },
  {
    name: "Create Invoice",
    href: routes.invoice.create,
  },
  {
    name: "Edit Invoice",
    href: routes.invoice.edit(DUMMY_ID),
  },
  {
    name: "Invoice Builder",
    href: routes.invoice.builder,
  },
  {
    name: "Image Viewer",
    href: routes.imageViewer,
  },
  {
    name: "Roles & Permissions",
    href: routes.rolesPermissions,
  },
  // label start
  {
    name: "Widgets",
  },
  // label end
  {
    name: "Cards",
    href: routes.widgets.cards,
  },
  {
    name: "Icons",
    href: routes.widgets.icons,
  },
  {
    name: "Charts",
    href: routes.widgets.charts,
  },
  {
    name: "Maps",
    href: routes.widgets.maps,
  },

  // label start
  {
    name: "Pages",
  },
  // label end
  {
    name: "Profile",
    href: routes.profile,
  },
  {
    name: "Welcome",
    href: routes.welcome,
  },
  {
    name: "Coming soon",
    href: routes.comingSoon,
  },
  {
    name: "Access Denied",
    href: routes.accessDenied,
  },
  {
    name: "Not Found",
    href: routes.notFound,
  },
  {
    name: "Maintenance",
    href: routes.maintenance,
  },
  {
    name: "Blank",
    href: routes.blank,
  },
  // label start
  {
    name: "Authentication",
  },
  // label end
  {
    name: "Modern Sign Up",
    href: routes.auth.signUp1,
  },
  {
    name: "Vintage Sign Up",
    href: routes.auth.signUp2,
  },
  {
    name: "Modern Sign In",
    href: routes.auth.signIn1,
  },
  {
    name: "Vintage Sign In",
    href: routes.auth.signIn2,
  },
  {
    name: "Modern Forgot Password",
    href: routes.auth.forgotPassword1,
  },
  {
    name: "Vintage Forgot Password",
    href: routes.auth.forgotPassword,
  },
  {
    name: "Modern OTP Page",
    href: routes.auth.otp1,
  },
  {
    name: "Vintage OTP Page",
    href: routes.auth.otp2,
  },
];
