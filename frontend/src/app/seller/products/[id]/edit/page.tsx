"use client";

import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ProductForm } from "@/components/forms/product-form";
import { productService } from "@/services/product-service";
import type { Product } from "@/types/product";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await productService.getProductById(id);
        setProduct(data);
      } catch (err) {
        const error = err as Error;
        toast.error("Failed to load product details", { description: error.message });
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-sm text-muted-foreground">Loading listing records...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-muted-foreground border rounded-xl font-sans">
        Product not found or access denied.
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-6">
      <ProductForm initialData={product} />
    </div>
  );
}
