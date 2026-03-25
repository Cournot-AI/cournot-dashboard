"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Radar,
  FlaskConical,
  Code2,
  ChevronLeft,
  Shield,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRole } from "@/lib/role";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated, role } = useRole();

  const baseGroups = [
    {
      label: "Main",
      items: [
        { href: "/", label: "Overview", icon: LayoutDashboard },
        { href: "/cases", label: "Cases", icon: FileText },
        { href: "/monitoring", label: "Monitoring", icon: Radar },
        { href: "/playground", label: "Playground", icon: FlaskConical },
      ],
    },
  ];

  const adminGroup = {
    label: "Admin",
    items: [
      { href: "/admin/markets", label: "Market Monitor", icon: Shield },
      { href: "/admin/markets/new", label: "Add Market", icon: PlusCircle },
    ],
  };

  const devGroup = {
    label: "Developer",
    items: [
      { href: "/developer", label: "API Reference", icon: Code2 },
    ],
  };

  const groups = [
    ...baseGroups,
    ...(isAuthenticated && role === "admin" ? [adminGroup] : []),
    devGroup,
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] border-r border-border bg-background transition-all duration-200",
        collapsed ? "w-14" : "w-52"
      )}
    >
      <nav className="flex flex-col h-full p-2">
        <div className="flex-1 space-y-4">
          {groups.map((group) => {
            const isAdminGroup = group.label === "Admin";
            return (
              <div key={group.label}>
                {!collapsed && (
                  <p className={cn(
                    "mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider",
                    isAdminGroup ? "text-red-400/60" : "text-muted-foreground/60"
                  )}>
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                          isActive
                            ? isAdminGroup
                              ? "bg-red-500/10 text-red-400 font-medium"
                              : "bg-accent text-foreground font-medium"
                            : isAdminGroup
                              ? "text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </nav>
    </aside>
  );
}
