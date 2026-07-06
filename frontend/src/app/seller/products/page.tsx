"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Package, Edit2, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { productService } from "@/services/product-service";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getSellerProducts();
      setProducts(data);
    } catch (err) {
      const error = err as Error;
      toast.error("Failed to load products", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await productService.deleteProduct(id);
      toast.success("Product deleted successfully");
      loadProducts();
    } catch (err) {
      const error = err as Error;
      toast.error("Delete failed", { description: error.message });
    }
  };

  // TanStack columns definition mapping products
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
      header: "Product Name",
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-foreground line-clamp-1">{row.original.name}</p>
          <span className="text-[10px] text-muted-foreground font-mono">{row.original.sku || "NO-SKU"}</span>
        </div>
      ),
    },
    {
      accessorKey: "category_name",
      header: "Category",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const price = Number(row.getValue("price"));
        const discount = Number(row.original.discount);
        const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
        return (
          <div>
            <p className="font-bold text-foreground">₹{finalPrice.toFixed(2)}</p>
            {discount > 0 && (
              <span className="text-[10px] text-red-500 line-through">₹{price.toFixed(2)}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const stock = Number(row.getValue("stock"));
        return (
          <span className={cn("font-medium", stock === 0 ? "text-red-500 font-bold" : "text-foreground")}>
            {stock} units
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "created_at",
      header: "Date Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <span className="text-muted-foreground font-medium">{date.toLocaleDateString()}</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/seller/products/${row.original.id}/edit`}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-slate-500 hover:text-emerald-600")}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Link>
          <Button
            onClick={() => handleDelete(row.original.id)}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-red-650 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
            My Product Listing
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your store catalog listings, adjust item prices, and monitor warehouse inventories.
          </p>
        </div>
        {products.length > 0 && (
          <Link
            href="/seller/products/new"
            className={cn(buttonVariants({ variant: "default" }), "bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-2 cursor-pointer shadow-sm text-sm")}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        )}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Catalog Datagrid</CardTitle>
          <CardDescription className="text-xs">
            Search and filter through your products catalog list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="text-sm text-muted-foreground">Loading products catalog...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">You haven&apos;t added any products yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Create your first product listing to start selling to buyers across the CommerceHub store.
                </p>
              </div>
              <Link
                href="/seller/products/new"
                className={cn(buttonVariants({ variant: "default" }), "bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-2 cursor-pointer shadow-sm mt-2 text-sm")}
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={products}
              searchKey="name"
              searchPlaceholder="Search products by name..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
