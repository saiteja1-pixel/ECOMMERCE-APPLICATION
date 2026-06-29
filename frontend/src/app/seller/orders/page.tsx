"use client";

import { useState, useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Loader2,
  Calendar,
  User,
  ShoppingBag,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { SlideOverPanel } from "@/components/shared/slide-over-panel";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { orderService } from "@/services/order-service";
import type { Order, OrderStatusHistory } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Detail drawer states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [timeline, setTimeline] = useState<OrderStatusHistory[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  // Status transition states
  const [newStatus, setNewStatus] = useState("");
  const [transitionNote, setTransitionNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      try {
        const data = await orderService.getSellerOrders({
          status: activeTab,
          search: searchQuery,
        });
        setOrders(data);
      } catch (err: unknown) {
        console.error("Failed to load seller orders:", err);
        toast.error("Failed to load seller orders.");
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, [activeTab, searchQuery]);

  const handleRowClick = async (order: Order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
    setNewStatus("");
    setTransitionNote("");
    
    // Fetch timeline logs
    setIsTimelineLoading(true);
    try {
      const logs = await orderService.getOrderTimeline(order.id);
      setTimeline(logs);
    } catch {
      toast.error("Failed to load order status history timeline.");
    } finally {
      setIsTimelineLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus) return;

    // Check if cancellation reason note is supplied
    if (newStatus === "cancelled" && !transitionNote.trim()) {
      toast.error("Please enter a cancellation reason note.");
      return;
    }

    const confirmChange = window.confirm(`Update order status to "${newStatus.toUpperCase()}"?`);
    if (!confirmChange) return;

    setIsUpdatingStatus(true);
    try {
      await orderService.updateOrderStatus(selectedOrder.id, newStatus, transitionNote);
      toast.success("Order status updated!");

      // Refresh order list details
      const updatedOrders = await orderService.getSellerOrders({ status: activeTab, search: searchQuery });
      setOrders(updatedOrders);

      // Refresh drawer details
      const freshOrder = await orderService.getOrderById(selectedOrder.id);
      setSelectedOrder(freshOrder);

      const logs = await orderService.getOrderTimeline(selectedOrder.id);
      setTimeline(logs);

      // Clean transition values
      setNewStatus("");
      setTransitionNote("");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update order status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Formulate valid transition options based on current state
  const getNextTransitions = (status: string) => {
    switch (status) {
      case "pending":
        return [
          { value: "confirmed", label: "Confirm Order" },
          { value: "cancelled", label: "Cancel Order" },
        ];
      case "confirmed":
        return [
          { value: "packed", label: "Mark as Packed" },
          { value: "cancelled", label: "Cancel Order" },
        ];
      case "packed":
        return [{ value: "shipped", label: "Ship Order / Dispatch" }];
      case "shipped":
        return [{ value: "delivered", label: "Mark as Delivered" }];
      default:
        return []; // terminal state
    }
  };

  // Datagrid columns definition
  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "order_number",
      header: "Order Number",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-foreground">
          {row.getValue("order_number")}
        </span>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Customer Name",
    },
    {
      accessorKey: "items",
      header: "Items Qty",
      cell: ({ row }) => {
        const items = row.original.items || [];
        return items.reduce((sum, item) => sum + item.quantity, 0);
      },
    },
    {
      accessorKey: "total",
      header: "Total Total",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-foreground">
          ${Number(row.getValue("total")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "created_at",
      header: "Date Placed",
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

  const transitionsOptions = selectedOrder ? getNextTransitions(selectedOrder.status) : [];

  return (
    <>
      <div className="space-y-6 font-sans select-none pb-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
              Order Submissions
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor incoming invoices, handle dispatches, and trigger shipment status.
            </p>
          </div>
        </div>

        {/* Filters and search triggers bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search order ID..."
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
                    isActive ? "bg-purple-600 text-white hover:bg-purple-700" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders data table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <DataTable
              data={orders}
              columns={columns}
            />
          </div>
        )}

        {/* Slide-over details management drawer */}
        <SlideOverPanel
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={`Order ID: ${selectedOrder?.order_number}`}
        >
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order status headers */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-border">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground font-bold">Status Badge</p>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Order Date</p>
                  <p className="text-xs font-bold text-foreground">
                    {new Date(selectedOrder.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Status Update Transition block */}
              {transitionsOptions.length > 0 && (
                <div className="bg-purple-50/20 dark:bg-purple-950/5 border border-purple-200 dark:border-purple-900/50 p-4 rounded-xl space-y-4">
                  <h4 className="font-heading font-bold text-xs text-purple-650 flex items-center gap-1.5 uppercase select-none">
                    <ClipboardList className="h-4 w-4" />
                    Dispatch Status Controls
                  </h4>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="next-status" className="text-[10px] font-semibold text-muted-foreground">Next Stage</Label>
                      <select
                        id="next-status"
                        value={newStatus}
                        onChange={(e) => {
                          setNewStatus(e.target.value);
                          setTransitionNote("");
                        }}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 border-border"
                      >
                        <option value="">-- Choose Status Update --</option>
                        {transitionsOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Show transition description/cancellation note fields */}
                    {newStatus && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <Label htmlFor="transition-note" className="text-[10px] font-semibold text-muted-foreground">
                          {newStatus === "cancelled" ? "Reason for Cancellation *" : "Add note details (Optional)"}
                        </Label>
                        <textarea
                          id="transition-note"
                          rows={2}
                          placeholder={newStatus === "cancelled" ? "Enter cancellation details..." : "Enter notes for history tracking..."}
                          value={transitionNote}
                          onChange={(e) => setTransitionNote(e.target.value)}
                          className="flex w-full rounded-md border border-input bg-background px-3.5 py-2 text-xs shadow-sm focus-visible:outline-none border-border"
                        />
                      </div>
                    )}

                    {newStatus && (
                      <Button
                        onClick={handleStatusChange}
                        disabled={isUpdatingStatus}
                        className="w-full bg-purple-600 hover:bg-purple-750 text-white rounded-lg h-9 text-xs font-bold cursor-pointer"
                      >
                        {isUpdatingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Update Order Status
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Customer info card */}
              <div className="space-y-2 border-t border-border pt-4">
                <h4 className="font-heading font-bold text-xs text-foreground uppercase tracking-wider select-none flex items-center gap-1.5">
                  <User className="h-4 w-4 text-purple-600" />
                  Buyer Information
                </h4>
                <div className="text-xs text-muted-foreground space-y-1 bg-slate-50/40 p-4 border border-border rounded-xl">
                  <p><span className="font-semibold text-foreground">Name:</span> {selectedOrder.customer_name}</p>
                  <p><span className="font-semibold text-foreground">Contact:</span> {selectedOrder.address.phone}</p>
                  <p><span className="font-semibold text-foreground">Ship To:</span></p>
                  <p className="pl-3 border-l border-border italic text-[11px] leading-relaxed">
                    {selectedOrder.address.address_line_1}
                    {selectedOrder.address.address_line_2 && `, ${selectedOrder.address.address_line_2}`}
                    <br />
                    {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}
                  </p>
                </div>
              </div>

              {/* Items details list */}
              <div className="space-y-2 border-t border-border pt-4">
                <h4 className="font-heading font-bold text-xs text-foreground uppercase tracking-wider select-none flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-purple-600" />
                  Order Inclusions
                </h4>
                <div className="border border-border rounded-xl divide-y divide-border overflow-hidden bg-card shadow-sm">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-border bg-slate-50 shrink-0">
                          {item.product_image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-xs text-foreground truncate max-w-[200px]">{item.product_name}</p>
                          <p className="text-[10px] text-muted-foreground">Qty: {item.quantity} x ${Number(item.price).toFixed(2)}</p>
                        </div>
                      </div>
                      <span className="font-sans font-bold text-xs text-foreground shrink-0 font-mono">
                        ${Number(item.total).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/10 text-xs text-muted-foreground flex justify-between font-bold text-foreground">
                    <span>Order Total Invoice</span>
                    <span className="font-mono flex items-center">
                      <DollarSign className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      {Number(selectedOrder.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery logs timeline history */}
              <div className="space-y-2 border-t border-border pt-4">
                <h4 className="font-heading font-bold text-xs text-foreground uppercase tracking-wider select-none flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  Dispatch History Logs
                </h4>
                <div className="bg-slate-50/30 border border-border p-4 rounded-xl">
                  {isTimelineLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-650" />
                    </div>
                  ) : (
                    <OrderTimeline timeline={timeline} />
                  )}
                </div>
              </div>
            </div>
          )}
        </SlideOverPanel>
      </div>
    </>
  );
}
