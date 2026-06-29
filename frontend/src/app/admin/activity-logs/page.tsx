"use client";

import { useState, useEffect, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Loader2,
  Search,
  Activity,
  User,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { activityLogService, type ActivityLog } from "@/services/activity-log-service";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const roleTabs = [
  { id: "all", label: "All Logs" },
  { id: "admin", label: "Admin" },
  { id: "seller", label: "Seller" },
  { id: "customer", label: "Customer" },
  { id: "system", label: "System" },
];

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeRole, setActiveRole] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await activityLogService.getActivityLogs({
        search: searchQuery,
        role: activeRole,
        page,
        limit: 25,
      });
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, activeRole, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs();
  }, [loadLogs]);

  const columns: ColumnDef<ActivityLog>[] = [
    {
      accessorKey: "created_at",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="font-mono text-slate-500 font-medium">
          {new Date(row.original.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "profiles.full_name",
      header: "Audited User",
      cell: ({ row }) => {
        const profile = row.original.profiles;
        const name = profile?.full_name || row.original.user_role === "system" || !row.original.user_id ? "System Process" : "Guest User";
        const avatar = profile?.avatar_url;

        return (
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 rounded-full overflow-hidden border border-border bg-slate-50 shrink-0 flex items-center justify-center">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="User Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-3.5 w-3.5 text-slate-400" />
              )}
            </div>
            <span className="font-semibold text-foreground truncate max-w-40">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "user_role",
      header: "Role Type",
      cell: ({ row }) => {
        const role = row.original.user_role || "system";
        let badgeClass = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700";
        if (role === "admin") {
          badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50";
        } else if (role === "seller") {
          badgeClass = "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50";
        } else if (role === "customer") {
          badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50";
        }

        return (
          <Badge
            variant="outline"
            className={cn(
              "font-sans font-semibold tracking-wide text-[9px] px-2.5 py-0.5 rounded-full select-none border uppercase shadow-none",
              badgeClass
            )}
          >
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "action",
      header: "Logged Activity Action",
      cell: ({ row }) => (
        <span className="font-medium text-foreground leading-normal">
          {row.original.action}
        </span>
      ),
    },
    {
      accessorKey: "entity_type",
      header: "Entity Scope",
      cell: ({ row }) => (
        <span className="inline-flex items-center bg-slate-50 dark:bg-slate-900 border border-border rounded-md px-2 py-0.5 font-bold font-mono text-[9px] uppercase tracking-wide">
          {row.original.entity_type || "N/A"}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 font-sans select-none pb-12">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
            <Activity className="h-6 w-6 text-purple-650" />
            Audit Trail logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Audit immutable activity logs from database events, product moderation changes, and merchant controls.
          </p>
        </div>

        {/* Filters and search section */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border p-4 rounded-2xl shadow-sm">
          {/* Tab buttons */}
          <div className="flex border-b border-border text-xs font-bold gap-4 w-full sm:w-auto">
            {roleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveRole(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "pb-2.5 cursor-pointer whitespace-nowrap",
                  activeRole === tab.id
                    ? "border-b-2 border-purple-600 text-purple-650"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs shrink-0">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-border dark:bg-slate-900 pl-9 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-purple-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={logs}
              searchKey="action"
              searchPlaceholder="Search logs..."
            />
          )}
        </div>

        {/* Simple Pagination Buttons */}
        <div className="flex items-center justify-between pt-3">
          <span className="text-[10px] text-muted-foreground font-semibold">
            Page {page} of entries history
          </span>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage((p) => p + 1)}
              disabled={logs.length < 25}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
