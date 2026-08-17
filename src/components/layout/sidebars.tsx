"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Plug,
  Shield,
  Building2,
  KanbanSquare,
  CalendarClock,
  ListTodo,
  GitBranch,
  Radio,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/features/auth/actions";

const modules = [
  { href: "/dashboard", label: "Overview", color: "bg-[var(--ic-primary)]" },
  { href: "/leads", label: "Leads", color: "bg-[var(--ic-module-orange)]" },
  {
    href: "/settings/organization",
    label: "Organization",
    color: "bg-[var(--ic-module-purple)]",
  },
  {
    href: "/settings/integrations",
    label: "Integrations",
    color: "bg-[var(--ic-module-teal)]",
  },
] as const;

export function ModuleRail() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[72px] shrink-0 flex-col items-center gap-3 py-5">
      <Link
        href="/dashboard"
        className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white shadow-card"
        aria-label="IntraCore"
      >
        IC
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-2.5">
        {modules.map((mod) => {
          const active =
            pathname === mod.href || pathname.startsWith(`${mod.href}/`);
          return (
            <Link
              key={mod.href}
              href={mod.href}
              title={mod.label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition",
                mod.color,
                active
                  ? "ring-2 ring-offset-2 ring-offset-[var(--ic-canvas)] ring-black/10 scale-105"
                  : "opacity-90 hover:opacity-100",
              )}
            >
              <span className="sr-only">{mod.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2">
        <Link
          href="/settings/organization"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-muted shadow-sm hover:text-foreground"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-muted shadow-sm hover:text-danger"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

type NavGroup = { title: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    title: "MAIN",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/leads", label: "Lead Management", icon: KanbanSquare, exact: true },
      { href: "/leads/follow-ups", label: "Follow-ups", icon: CalendarClock },
      { href: "/leads/tasks", label: "Tasks", icon: ListTodo },
      { href: "/leads/import", label: "Import", icon: Upload },
    ],
  },
  {
    title: "MY ORGANIZATION",
    items: [
      { href: "/pipelines", label: "Pipelines", icon: GitBranch },
      { href: "/lead-sources", label: "Lead sources", icon: Radio },
      {
        href: "/settings/organization",
        label: "Organization",
        icon: Building2,
      },
      { href: "/settings/users", label: "Users", icon: Users },
      { href: "/settings/roles", label: "Roles", icon: Shield },
    ],
  },
  {
    title: "ADMINISTRATOR",
    items: [
      {
        href: "/settings/integrations",
        label: "Integrations",
        icon: Plug,
      },
    ],
  },
];

export function AppSidebar({
  userName,
  roleName,
  organizationName,
}: {
  userName: string;
  roleName: string;
  organizationName: string;
}) {
  const pathname = usePathname();
  const firstName = userName.split(" ")[0] || userName;

  return (
    <aside className="flex w-full max-w-[240px] shrink-0 flex-col py-5 pr-2 md:w-[240px]">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
          {firstName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            Hey, {firstName}
          </p>
          <p className="truncate text-2xs text-muted">{roleName}</p>
          <p className="truncate text-2xs text-subtle">{organizationName}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-1">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-2xs font-semibold tracking-wider text-subtle">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-pill px-3 py-2.5 text-sm transition",
                        active
                          ? "bg-nav-active font-medium text-white shadow-sm"
                          : "text-muted hover:bg-white/70 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-80" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
