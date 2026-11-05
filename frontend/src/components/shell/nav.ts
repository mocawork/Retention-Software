/** Primary navigation (design.md §2). Only Home and Settings have content in M0. */
import {
  Activity,
  ChartColumn,
  House,
  Lightbulb,
  ListFilter,
  MessageCircle,
  Newspaper,
  Send,
  Settings,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { key: "home", label: "Home", icon: House },
  { key: "briefing", label: "Briefing", icon: Newspaper },
  { key: "opportunities", label: "Opportunities", icon: Lightbulb },
  { key: "customers", label: "Customers", icon: Users },
  { key: "audiences", label: "Audiences", icon: ListFilter },
  { key: "intelligence", label: "Intelligence", icon: Activity },
  { key: "campaigns", label: "Campaigns", icon: Send },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "analytics", label: "Analytics", icon: ChartColumn },
  { key: "brand", label: "Brand", icon: Store },
  { key: "settings", label: "Settings", icon: Settings },
];

/** Phone bottom tab bar: Home, Briefing, Opportunities, Campaigns, More (design.md §2). */
export const MOBILE_TAB_KEYS = ["home", "briefing", "opportunities", "campaigns"] as const;

/** Sections that arrive in later milestones, with an honest one-line promise. */
export const COMING_LATER: Record<string, { label: string; description: string }> = {
  briefing: {
    label: "Briefing",
    description:
      "A daily feed of what happened and what changed: alerts, campaign results, savings and ideas.",
  },
  opportunities: {
    label: "Opportunities",
    description: "Ranked opportunities: which customers to message, why, and what it could earn.",
  },
  customers: {
    label: "Customers",
    description: "Every customer with their orders, health and what they're likely to do next.",
  },
  audiences: {
    label: "Audiences",
    description: "Saved groups of customers you can send campaigns to.",
  },
  intelligence: {
    label: "Intelligence",
    description: "How your customers behave: retention, cohorts, lifetime value, churn and timing.",
  },
  campaigns: {
    label: "Campaigns",
    description: "Create, review and launch WhatsApp campaigns, then follow their results.",
  },
  whatsapp: {
    label: "WhatsApp",
    description: "Connect your WhatsApp Business account and manage your message templates.",
  },
  analytics: {
    label: "Analytics",
    description:
      "Business and campaign performance: extra revenue from campaigns, ROI and history.",
  },
  brand: {
    label: "Brand",
    description: "Your brand profile, guardrails and the settings behind every recommendation.",
  },
};

/** Which nav item a path belongs to ("/brd_1/settings/team" → "settings"). */
export function activeSection(pathname: string, brandId: string): string | null {
  const prefix = `/${brandId}/`;
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split("/")[0] || null;
}
