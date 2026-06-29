"use client";

import { useState, useEffect, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  AlertOctagon,
  RotateCcw,
  Trash2,
  User,
  ShoppingBag,
  DollarSign,
  Building,
  Mail,
  Phone,
  ClipboardList,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { SlideOverPanel } from "@/components/shared/slide-over-panel";
import { sellerManagementService } from "@/services/seller-management-service";
import type { UserProfile } from "@/types/auth";
import { cn } from "@/lib/utils";

// Dialogue imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const tabs = [
  { id: "all", label: "All Sellers" },
  { id: "pending", label: "Pending Approval" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
];

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<(UserProfile & { total_products?: number; total_orders?: number; total_revenue?: number })[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Detail drawer states
  const [selectedSeller, setSelectedSeller] = useState<(UserProfile & { total_products?: number; total_orders?: number; total_revenue?: number }) | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Contextual action dialog states
  const [actionSeller, setActionSeller] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "suspend" | "reactivate" | "delete" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const loadSellers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await sellerManagementService.fetchSellers({
        status: activeTab,
        search: searchQuery,
      });
      setSellers(data);
    } catch {
      toast.error("Failed to load seller accounts.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSellers();
  }, [loadSellers]);

  const handleRowClick = (seller: UserProfile & { total_products?: number; total_orders?: number; total_revenue?: number }) => {
    setSelectedSeller(seller);
    setIsDrawerOpen(true);
  };

  const triggerAction = (seller: UserProfile, type: "approve" | "reject" | "suspend" | "reactivate" | "delete") => {
    setActionSeller(seller);
    setActionType(type);
    setActionReason("");
    setDeleteConfirmName("");
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionSeller || !actionType) return;

    // Reason validation
    if ((actionType === "reject" || actionType === "suspend") && !actionReason.trim()) {
      toast.error("Reason is required.");
      return;
    }

    // Delete name validation
    if (actionType === "delete") {
      const expectedName = actionSeller.business_name || actionSeller.full_name;
      if (deleteConfirmName.trim() !== expectedName) {
        toast.error("Business name does not match.");
        return;
      }
    }

    setIsSubmittingAction(true);
    try {
      if (actionType === "approve") {
        await sellerManagementService.approveSeller(actionSeller.id);
        toast.success("Seller approved successfully!");
      } else if (actionType === "reject") {
        await sellerManagementService.rejectSeller(actionSeller.id, actionReason);
        toast.success("Seller account rejected.");
      } else if (actionType === "suspend") {
        await sellerManagementService.suspendSeller(actionSeller.id, actionReason);
        toast.success("Seller suspended. All their listings are now inactive.");
      } else if (actionType === "reactivate") {
        await sellerManagementService.reactivateSeller(actionSeller.id);
        toast.success("Seller reactivated. Note: Listings remain inactive until enabled manually.");
      } else if (actionType === "delete") {
        await sellerManagementService.deleteSeller(actionSeller.id);
        toast.success("Seller soft deleted successfully.");
      }

      // Close modals and reload data
      setActionSeller(null);
      setActionType(null);
      setIsDrawerOpen(false);
      await loadSellers();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to process seller action.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const columns: ColumnDef<UserProfile & { total_products?: number; total_orders?: number; total_revenue?: number }>[] = [
    {
      accessorKey: "avatar_url",
      header: "Avatar",
      cell: ({ row }) => (
        <div className="relative h-10 w-10 rounded-full overflow-hidden border border-border bg-slate-50 shrink-0">
          {row.original.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.original.avatar_url} alt="Seller Avatar" className="h-full w-full object-cover" />
          ) : (
            <User className="h-4.5 w-4.5 text-slate-350 mx-auto mt-2.5" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "business_name",
      header: "Business Name",
      cell: ({ row }) => (
        <span className="font-bold text-foreground truncate max-w-xs block">
          {row.original.business_name || row.original.full_name}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email Address",
    },
    {
      accessorKey: "phone",
      header: "Contact Phone",
      cell: ({ row }) => row.original.phone || "N/A",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "total_products",
      header: "Active Products",
      cell: ({ row }) => (
        <span className="font-mono font-semibold">{row.original.total_products || 0}</span>
      ),
    },
    {
      accessorKey: "total_revenue",
      header: "Total Revenue",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-foreground">
          ${Number(row.original.total_revenue || 0).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Joined Date",
      cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row.original);
          }}
          className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-650 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          Manage
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 font-sans select-none pb-12">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Seller Store Accounts
          </h1>
          <p className="text-sm text-muted-foreground">
            Approve new merchant applications, manage store accounts, or suspend seller access.
          </p>
        </div>

        {/* Filters and search triggers bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search business or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-border pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:border-purple-600"
            />
          </div>

          <div className="flex border border-border rounded-lg overflow-hidden bg-white dark:bg-slate-950 divide-x divide-border w-full sm:w-auto overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "text-xs font-semibold px-4 py-2 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer",
                    isActive ? "bg-purple-650 text-white hover:bg-purple-700" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* DataTable */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-655" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <DataTable
              data={sellers}
              columns={columns}
              onRowClick={(row) => handleRowClick(row)}
            />
          </div>
        )}

        {/* Seller detail slide-over drawer */}
        <SlideOverPanel
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={`Merchant Profile: ${selectedSeller?.business_name || selectedSeller?.full_name}`}
        >
          {selectedSeller && (
            <div className="space-y-6">
              {/* Top summary avatar details */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-border">
                <div className="relative h-14 w-14 rounded-full overflow-hidden border border-border bg-slate-100 shrink-0 flex items-center justify-center text-slate-500">
                  {selectedSeller.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedSeller.avatar_url} alt="Merchant avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
                
                <div className="overflow-hidden space-y-1">
                  <h3 className="font-heading font-bold text-sm text-foreground truncate">
                    {selectedSeller.business_name || selectedSeller.full_name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedSeller.status} />
                    <span className="text-[10px] text-muted-foreground">Joined: {new Date(selectedSeller.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Status context action panel buttons */}
              <div className="bg-slate-50/40 p-4 border border-border rounded-xl space-y-3">
                <h4 className="font-heading font-bold text-xs text-foreground uppercase tracking-wide border-b border-border pb-2 select-none">
                  Account Management Controls
                </h4>

                <div className="grid grid-cols-2 gap-3.5">
                  {selectedSeller.status === "pending" && (
                    <>
                      <button
                        onClick={() => triggerAction(selectedSeller, "approve")}
                        className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve Seller
                      </button>
                      <button
                        onClick={() => triggerAction(selectedSeller, "reject")}
                        className="flex items-center justify-center gap-1 bg-red-650 hover:bg-red-750 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Application
                      </button>
                    </>
                  )}

                  {selectedSeller.status === "active" && (
                    <button
                      onClick={() => triggerAction(selectedSeller, "suspend")}
                      className="col-span-2 flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer transition-colors"
                    >
                      <AlertOctagon className="h-4 w-4" />
                      Suspend Merchant Account
                    </button>
                  )}

                  {selectedSeller.status === "suspended" && (
                    <button
                      onClick={() => triggerAction(selectedSeller, "reactivate")}
                      className="col-span-2 flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-750 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reactivate Merchant
                    </button>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => triggerAction(selectedSeller, "delete")}
                    className="w-full flex items-center justify-center gap-1 border border-red-200 hover:bg-red-50 text-red-650 font-bold p-2.5 rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Terminate Store Account (Soft Delete)
                  </button>
                </div>
              </div>

              {/* Quick stats grid */}
              <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
                <div className="bg-slate-50/40 p-4 border border-border rounded-xl text-center">
                  <p className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 inline-block">
                    <ShoppingBag className="h-4.5 w-4.5" />
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-1">Products</p>
                  <p className="text-lg font-bold text-foreground font-mono leading-none mt-1">{selectedSeller.total_products || 0}</p>
                </div>

                <div className="bg-slate-50/40 p-4 border border-border rounded-xl text-center">
                  <p className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 inline-block">
                    <ClipboardList className="h-4.5 w-4.5" />
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-1">Invoices</p>
                  <p className="text-lg font-bold text-foreground font-mono leading-none mt-1">
                    {selectedSeller.total_orders || 0}
                  </p>
                </div>

                <div className="bg-slate-50/40 p-4 border border-border rounded-xl text-center">
                  <p className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 inline-block">
                    <DollarSign className="h-4.5 w-4.5" />
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-1">Revenue</p>
                  <p className="text-sm font-extrabold text-foreground font-mono leading-none mt-1.5 truncate">
                    ${Number(selectedSeller.total_revenue || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Merchant details grid list info */}
              <div className="space-y-3 border-t border-border pt-4 text-xs text-muted-foreground">
                <h4 className="font-heading font-bold text-xs text-foreground uppercase tracking-wide select-none">
                  Merchant Credentials
                </h4>

                <div className="space-y-2 bg-slate-50/20 p-4 border border-border rounded-xl">
                  <p className="flex items-center gap-2"><Building className="h-4 w-4 shrink-0 text-slate-400" /><span className="font-semibold text-foreground">Name:</span> {selectedSeller.full_name}</p>
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-slate-400" /><span className="font-semibold text-foreground">Email:</span> {selectedSeller.email}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-slate-400" /><span className="font-semibold text-foreground">Phone:</span> {selectedSeller.phone || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
        </SlideOverPanel>

        {/* Action Dialog Confirm Overlay */}
        <Dialog open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
          <DialogContent className="max-w-md select-none font-sans">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-base text-foreground capitalize">
                {actionType} Merchant Account
              </DialogTitle>
            </DialogHeader>

            {actionSeller && actionType && (
              <form onSubmit={handleActionSubmit} className="space-y-4 pt-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to {actionType} the merchant store account for **{actionSeller.business_name || actionSeller.full_name}**?
                </p>

                {/* Reason fields for Reject/Suspend */}
                {(actionType === "reject" || actionType === "suspend") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="action-reason" className="text-xs font-semibold text-muted-foreground">
                      Reason for {actionType} *
                    </Label>
                    <textarea
                      id="action-reason"
                      rows={3}
                      placeholder={`Enter the reason for ${actionType} account...`}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none border-border"
                      required
                    />
                  </div>
                )}

                {/* Double confirmation block for Delete */}
                {actionType === "delete" && (
                  <div className="space-y-2.5 p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                    <p className="text-[10px] text-red-650 font-bold uppercase flex items-center gap-1">
                      <AlertOctagon className="h-4 w-4 shrink-0" />
                      Critical Account Termination Warning
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      This action will soft-delete the store merchant and block future logs. To proceed, please type the store business name exactly: **{actionSeller.business_name || actionSeller.full_name}**
                    </p>
                    <Input
                      placeholder="Type store name..."
                      value={deleteConfirmName}
                      onChange={(e) => setDeleteConfirmName(e.target.value)}
                      className="border-red-250 bg-white text-xs text-red-650"
                      required
                    />
                  </div>
                )}

                <DialogFooter className="pt-4 border-t border-border mt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setActionSeller(null);
                      setActionType(null);
                    }}
                    variant="ghost"
                    className="text-xs cursor-pointer h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingAction}
                    className={cn(
                      "rounded-lg h-9 text-xs font-bold cursor-pointer text-white",
                      actionType === "delete" || actionType === "reject" || actionType === "suspend"
                        ? "bg-red-650 hover:bg-red-750"
                        : "bg-purple-650 hover:bg-purple-750"
                    )}
                  >
                    {isSubmittingAction && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm {actionType}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
