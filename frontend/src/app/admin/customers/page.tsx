"use client";

import { useState, useEffect, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { UserProfile } from "@/types/auth";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Loader2,
  AlertOctagon,
  RotateCcw,
  Trash2,
  User,
  ShoppingBag,
  DollarSign,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { SlideOverPanel } from "@/components/shared/slide-over-panel";
import { customerManagementService } from "@/services/customer-management-service";
import { cn } from "@/lib/utils";

// Dialogue imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<(UserProfile & { total_orders?: number; total_spent?: number })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Detail drawer states
  const [selectedCustomer, setSelectedCustomer] = useState<(UserProfile & { total_orders?: number; total_spent?: number }) | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<{ id: string; order_number: string; created_at: string; status: string; total: number; seller_business_name: string }[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  // Actions confirm dialogue states
  const [actionCustomer, setActionCustomer] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<"block" | "unblock" | "delete" | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await customerManagementService.fetchCustomers({
        search: searchQuery,
      });
      setCustomers(data);
    } catch {
      toast.error("Failed to load customer profiles.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCustomers();
  }, [loadCustomers]);

  const handleRowClick = async (customer: UserProfile & { total_orders?: number; total_spent?: number }) => {
    setSelectedCustomer(customer);
    setIsDrawerOpen(true);
    
    // Fetch customer recent orders
    setIsOrdersLoading(true);
    try {
      const orders = await customerManagementService.getCustomerRecentOrders(customer.id, 5);
      setRecentOrders(orders);
    } catch {
      toast.error("Failed to load customer purchase logs.");
    } finally {
      setIsOrdersLoading(false);
    }
  };

  const triggerAction = (customer: UserProfile, type: "block" | "unblock" | "delete") => {
    setActionCustomer(customer);
    setActionType(type);
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionCustomer || !actionType) return;

    setIsSubmittingAction(true);
    try {
      if (actionType === "block") {
        await customerManagementService.blockCustomer(actionCustomer.id);
        toast.success("Customer account blocked.");
      } else if (actionType === "unblock") {
        await customerManagementService.unblockCustomer(actionCustomer.id);
        toast.success("Customer account unblocked.");
      } else if (actionType === "delete") {
        await customerManagementService.deleteCustomer(actionCustomer.id);
        toast.success("Customer soft deleted successfully.");
      }

      // Close modals and reload
      setActionCustomer(null);
      setActionType(null);
      setIsDrawerOpen(false);
      await loadCustomers();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to process customer action.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const columns: ColumnDef<UserProfile & { total_orders?: number; total_spent?: number }>[] = [
    {
      accessorKey: "avatar_url",
      header: "Avatar",
      cell: ({ row }) => (
        <div className="relative h-10 w-10 rounded-full overflow-hidden border border-border bg-slate-50 shrink-0">
          {row.original.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.original.avatar_url} alt="Customer Avatar" className="h-full w-full object-cover" />
          ) : (
            <User className="h-4.5 w-4.5 text-slate-350 mx-auto mt-2.5" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "full_name",
      header: "Full Name",
      cell: ({ row }) => (
        <span className="font-bold text-foreground truncate max-w-xs block">
          {row.original.full_name}
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
      cell: ({ row }) => (
        <span className={cn(
          "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full select-none",
          row.original.status === "suspended" 
            ? "text-red-650 bg-red-50" 
            : "text-green-650 bg-green-50"
        )}>
          {row.original.status === "suspended" ? "Blocked" : "Active"}
        </span>
      ),
    },
    {
      accessorKey: "total_orders",
      header: "Total Orders",
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.total_orders || 0}</span>,
    },
    {
      accessorKey: "total_spent",
      header: "Total Spent",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-foreground">
          ${Number(row.original.total_spent || 0).toFixed(2)}
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
          Details
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 font-sans select-none pb-12">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Customer Profile Accounts
          </h1>
          <p className="text-sm text-muted-foreground">
            Auditing client registrations, review transaction logs, and enforce account blocks.
          </p>
        </div>

        {/* Filters and search triggers bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customer name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-border pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:border-purple-600"
            />
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
              data={customers}
              columns={columns}
              onRowClick={(row) => handleRowClick(row)}
            />
          </div>
        )}

        {/* Customer detail slide-over drawer */}
        <SlideOverPanel
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={`Customer Profile: ${selectedCustomer?.full_name}`}
        >
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Top summary details */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-border">
                <div className="relative h-14 w-14 rounded-full overflow-hidden border border-border bg-slate-100 shrink-0 flex items-center justify-center text-slate-500">
                  {selectedCustomer.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedCustomer.avatar_url} alt="Customer avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
                
                <div className="overflow-hidden space-y-1">
                  <h3 className="font-heading font-bold text-sm text-foreground truncate">
                    {selectedCustomer.full_name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full select-none",
                      selectedCustomer.status === "suspended" ? "text-red-650 bg-red-50" : "text-green-650 bg-green-50"
                    )}>
                      {selectedCustomer.status === "suspended" ? "Blocked" : "Active"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Joined: {new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Status context action panel buttons */}
              <div className="bg-slate-50/40 p-4 border border-border rounded-xl space-y-3">
                <h4 className="font-heading font-bold text-xs text-foreground uppercase tracking-wide border-b border-border pb-2 select-none">
                  Account Management Controls
                </h4>

                <div className="grid grid-cols-2 gap-3.5">
                  {selectedCustomer.status !== "suspended" ? (
                    <button
                      onClick={() => triggerAction(selectedCustomer, "block")}
                      className="col-span-2 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-750 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer transition-colors"
                    >
                      <AlertOctagon className="h-4 w-4" />
                      Block Customer Access
                    </button>
                  ) : (
                    <button
                      onClick={() => triggerAction(selectedCustomer, "unblock")}
                      className="col-span-2 flex items-center justify-center gap-1 bg-green-650 hover:bg-green-700 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Unblock Customer
                    </button>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => triggerAction(selectedCustomer, "delete")}
                    className="w-full flex items-center justify-center gap-1 border border-red-200 hover:bg-red-50 text-red-650 font-bold p-2.5 rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Terminate Profile (Soft Delete)
                  </button>
                </div>
              </div>

              {/* Quick stats grid */}
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="bg-slate-50/40 p-4 border border-border rounded-xl text-center">
                  <p className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 inline-block">
                    <ShoppingBag className="h-4.5 w-4.5" />
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-1">Total Orders</p>
                  <p className="text-lg font-bold text-foreground font-mono leading-none mt-1">{selectedCustomer.total_orders || 0}</p>
                </div>

                <div className="bg-slate-50/40 p-4 border border-border rounded-xl text-center">
                  <p className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 inline-block">
                    <DollarSign className="h-4.5 w-4.5" />
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-1">Total Spent</p>
                  <p className="text-lg font-bold text-foreground font-mono leading-none mt-1">
                    ${Number(selectedCustomer.total_spent || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Customer Credentials */}
              <div className="space-y-3 border-t border-border pt-4 text-xs text-muted-foreground">
                <h4 className="font-heading font-bold text-xs text-foreground uppercase tracking-wide select-none">
                  Customer Credentials
                </h4>

                <div className="space-y-2 bg-slate-50/20 p-4 border border-border rounded-xl">
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-slate-400" /><span className="font-semibold text-foreground">Email:</span> {selectedCustomer.email}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-slate-400" /><span className="font-semibold text-foreground">Phone:</span> {selectedCustomer.phone || "N/A"}</p>
                </div>
              </div>

              {/* Recent Orders logs */}
              <div className="space-y-2 border-t border-border pt-4 text-xs">
                <h4 className="font-heading font-bold text-xs text-foreground uppercase tracking-wide select-none flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-purple-650" />
                  Recent Purchases (Last 5)
                </h4>
                
                {isOrdersLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-650" />
                  </div>
                ) : recentOrders.length === 0 ? (
                  <p className="text-muted-foreground italic text-center py-3 select-none">No orders recorded.</p>
                ) : (
                  <div className="border border-border rounded-xl divide-y divide-border overflow-hidden bg-card shadow-sm">
                    {recentOrders.map((o) => (
                      <div key={o.id} className="p-3.5 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-foreground font-mono">{o.order_number}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2.5">
                            <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{new Date(o.created_at).toLocaleDateString()}</span>
                            <span>Store: {o.seller_business_name}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={o.status} />
                          <p className="font-bold text-foreground font-mono text-[11px] mt-0.5">${Number(o.total).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SlideOverPanel>

        {/* Action Confirm dialogue */}
        <Dialog open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
          <DialogContent className="max-w-md select-none font-sans">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-base text-foreground capitalize">
                {actionType} Customer Account
              </DialogTitle>
            </DialogHeader>

            {actionCustomer && actionType && (
              <form onSubmit={handleActionSubmit} className="space-y-4 pt-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to {actionType} client access for **{actionCustomer.full_name}**?
                </p>

                <DialogFooter className="pt-4 border-t border-border mt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setActionCustomer(null);
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
                      actionType === "block" || actionType === "delete"
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
