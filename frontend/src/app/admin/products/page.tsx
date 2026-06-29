"use client";

import { useState, useEffect } from "react";
import {
  Check,
  X as CloseIcon,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  Star,
  Trash2,
  Layers,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { productService } from "@/services/product-service";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Slide-over detail drawer state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Reject dialog configurations
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (err) {
      const error = err as Error;
      toast.error("Failed to load catalog products", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, []);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop row click trigger drawer
    try {
      await productService.approveProduct(id);
      toast.success("Listing approved successfully", { description: "The product status is now Active." });
      loadProducts();
      if (selectedProduct?.id === id) {
        setSelectedProduct((prev) => prev ? { ...prev, status: "active", rejection_reason: null } : null);
      }
    } catch (err) {
      const error = err as Error;
      toast.error("Approval failed", { description: error.message });
    }
  };

  const openRejectDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRejectReason("");
    setRejectingId(id);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId) return;
    if (!rejectReason.trim()) {
      toast.error("Rejection reason required", { description: "Please detail the audit failure guidelines." });
      return;
    }

    setSubmittingReject(true);
    try {
      await productService.rejectProduct(rejectingId, rejectReason);
      toast.success("Product listing rejected");
      setRejectingId(null);
      loadProducts();
      if (selectedProduct?.id === rejectingId) {
        setSelectedProduct((prev) => prev ? { ...prev, status: "rejected", rejection_reason: rejectReason } : null);
      }
    } catch (err) {
      const error = err as Error;
      toast.error("Rejection update failed", { description: error.message });
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleToggleFeature = async (id: string, current: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await productService.toggleFeatureProduct(id, !current);
      toast.success(!current ? "Product featured" : "Removed from featured lists");
      loadProducts();
      if (selectedProduct?.id === id) {
        setSelectedProduct((prev) => prev ? { ...prev, featured: !current } : null);
      }
    } catch (err) {
      const error = err as Error;
      toast.error("Feature toggle failed", { description: error.message });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to soft delete this product?")) return;

    try {
      await productService.deleteProduct(id);
      toast.success("Product deleted successfully");
      loadProducts();
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
      }
    } catch (err) {
      const error = err as Error;
      toast.error("Deletion failed", { description: error.message });
    }
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "image_url",
      header: "Photo",
      cell: ({ row }) => {
        const url = row.getValue("image_url") as string;
        const name = row.getValue("name") as string;
        return (
          <div className="h-10 w-10 border border-border bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={name} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Product Title",
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedProduct(row.original)}
          className="text-left font-bold text-foreground hover:text-indigo-600 line-clamp-1 cursor-pointer"
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: "seller_name",
      header: "Seller (Shop)",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-700 dark:text-slate-350 text-xs">
            {row.original.seller_name || "Merchant"}
          </p>
          <span className="text-[10px] text-muted-foreground font-mono">
            {row.original.seller_business_name || "Individual"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "category_name",
      header: "Category",
    },
    {
      accessorKey: "price",
      header: "Unit Price",
      cell: ({ row }) => <span className="font-bold">${Number(row.getValue("price")).toFixed(2)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "featured",
      header: "Featured",
      cell: ({ row }) => {
        const feat = !!row.getValue("featured");
        return (
          <button
            onClick={(e) => handleToggleFeature(row.original.id, feat, e)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <Star className={cn("h-4 w-4", feat ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
          </button>
        );
      },
    },
    {
      id: "actions",
      header: "Moderation Controls",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="flex items-center gap-1.5">
            {status !== "active" && (
              <Button
                onClick={(e) => handleApprove(row.original.id, e)}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 text-xs rounded h-7 gap-1 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                Approve
              </Button>
            )}
            {status !== "rejected" && (
              <Button
                onClick={(e) => openRejectDialog(row.original.id, e)}
                variant="outline"
                size="sm"
                className="px-2.5 py-1 text-xs border-red-200 text-red-650 hover:bg-red-50 hover:text-red-700 rounded h-7 gap-1 cursor-pointer"
              >
                <CloseIcon className="h-3.5 w-3.5" />
                Reject
              </Button>
            )}
            <Button
              onClick={(e) => handleDelete(row.original.id, e)}
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-red-600 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 font-sans pb-10 relative">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
          Product Moderation Cockpit
        </h2>
        <p className="text-sm text-muted-foreground">
          Audit listings, approve drafts, reject violating contents, and select featured items.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Seller Catalog Submissions</CardTitle>
          <CardDescription className="text-xs">
            Review product descriptions, pictures, prices, and quantities. Click any row title to preview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="text-sm text-muted-foreground">Loading submissions feed...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl">
              <Layers className="h-10 w-10 mx-auto text-slate-350 mb-3" />
              <p className="text-sm">No products found awaiting moderations.</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={products}
              searchKey="name"
              searchPlaceholder="Search products by title..."
            />
          )}
        </CardContent>
      </Card>

      {/* Slide-over Preview Panel Sheet */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setSelectedProduct(null)}
          />
          <div className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl h-full flex flex-col justify-between animate-in slide-in-from-right duration-350 z-10">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Product Details Preview
                </h3>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ID: {selectedProduct.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Image previews grid */}
              <div>
                <Label className="text-xs uppercase font-bold text-muted-foreground">Images Gallery</Label>
                {selectedProduct.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {selectedProduct.images.map((img) => (
                      <div key={img} className="relative aspect-video rounded-xl border border-border overflow-hidden bg-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="Gallery item" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground mt-2 bg-slate-50/50">
                    <ImageIcon className="h-8 w-8 text-slate-300 mb-1" />
                    <span className="text-xs">No listing photos uploaded</span>
                  </div>
                )}
              </div>

              {/* Title & Seller Info */}
              <div className="space-y-1">
                <h4 className="text-xl font-bold tracking-tight text-foreground">{selectedProduct.name}</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                    {selectedProduct.category_name}
                  </span>
                  <StatusBadge status={selectedProduct.status} />
                  {selectedProduct.featured && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Seller block */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Merchant Profile</span>
                <div className="text-xs">
                  <p className="font-bold text-foreground">{selectedProduct.seller_name || "Independent Merchant"}</p>
                  <p className="text-muted-foreground">{selectedProduct.seller_business_name || "N/A"}</p>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-4 border-y border-border py-4">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">List Price</span>
                  <p className="font-extrabold text-foreground text-sm">${Number(selectedProduct.price).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Discount</span>
                  <p className="font-extrabold text-red-500 text-sm">{selectedProduct.discount}% Off</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Warehouse Stock</span>
                  <p className="font-extrabold text-foreground text-sm">{selectedProduct.stock} units</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Listing Description</Label>
                <p className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed font-sans bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-border">
                  {selectedProduct.description}
                </p>
              </div>

              {/* Rejection notice details */}
              {selectedProduct.status === "rejected" && selectedProduct.rejection_reason && (
                <div className="p-4 border border-red-200 bg-red-50/20 text-red-800 rounded-xl space-y-1 dark:border-red-950/20 dark:text-red-400">
                  <span className="text-[10px] font-bold text-red-600 uppercase flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Rejection Audit Reason
                  </span>
                  <p className="text-xs leading-relaxed">{selectedProduct.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Quick Actions Footer inside Drawer */}
            <div className="p-6 border-t border-border bg-slate-50 dark:bg-slate-900/50 flex gap-2">
              {selectedProduct.status !== "active" && (
                <Button
                  onClick={(e) => handleApprove(selectedProduct.id, e)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer text-xs h-9.5"
                >
                  <Check className="h-4 w-4" />
                  Approve Publication
                </Button>
              )}
              {selectedProduct.status !== "rejected" && (
                <Button
                  onClick={(e) => openRejectDialog(selectedProduct.id, e)}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-650 hover:bg-red-50 hover:text-red-750 gap-1.5 cursor-pointer text-xs h-9.5"
                >
                  <CloseIcon className="h-4 w-4" />
                  Reject Submission
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audit Rejection Input Dialog Popup */}
      {rejectingId && (
        <div className="fixed inset-0 z-55 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-heading font-bold text-foreground">Specify Audit Rejection Reason</h3>
              <button
                onClick={() => setRejectingId(null)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-5 space-y-4">
              <div>
                <Label htmlFor="audit-reason" className="text-xs">Reason Detail (Required for Seller notifications)</Label>
                <textarea
                  id="audit-reason"
                  rows={4}
                  required
                  placeholder="e.g. Listing violates shop standards: pricing typo, blurry catalog thumbnails, or prohibited items guidelines."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                />
              </div>
              <div className="flex gap-2.5 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  variant="outline"
                  disabled={submittingReject}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingReject}
                  className="bg-red-650 hover:bg-red-700 text-white gap-2 cursor-pointer"
                >
                  {submittingReject && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
