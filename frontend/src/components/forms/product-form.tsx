"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  UploadCloud,
  X,
  Loader2,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { productSchema, type ProductFormValues } from "@/lib/validators/product";
import { productService } from "@/services/product-service";
import { categoryService } from "@/services/category-service";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductFormProps {
  initialData?: Product | null;
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Images upload status
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.images || []);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description,
          category_id: initialData.category_id,
          price: initialData.price,
          discount: initialData.discount,
          sku: initialData.sku,
          stock: initialData.stock,
          featured: initialData.featured,
          status: initialData.status,
          image_url: initialData.image_url,
          images: initialData.images,
          configuration: initialData.configuration || "",
        }
      : {
          name: "",
          description: "",
          category_id: "",
          price: 0,
          discount: 0,
          sku: "",
          stock: 0,
          featured: false,
          status: "draft",
          image_url: null,
          images: [],
          configuration: "",
        },
  });

  // Load category options from DB
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (err) {
        const error = err as Error;
        toast.error("Failed to load category categories selector dropdown", {
          description: error.message,
        });
      }
    };
    fetchCats();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    if (imageFiles.length + existingImages.length + selected.length > 5) {
      toast.error("Image limit reached", { description: "Maximum of 5 images allowed per product" });
      return;
    }

    selected.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large`, { description: "Must be under 5MB" });
        return;
      }
      validFiles.push(file);
    });

    setImageFiles((prev) => [...prev, ...validFiles]);
  };

  const removeNewFile = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingFile = (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url));
  };

  const onSubmit = async (values: ProductFormValues) => {
    try {
      setUploading(true);
      
      // Determine final product id. If new, create one using crypto.randomUUID()
      const productId = initialData?.id || crypto.randomUUID();
      let uploadedUrls: string[] = [];

      if (imageFiles.length > 0) {
        // Upload images to Supabase storage
        uploadedUrls = await productService.uploadProductImages(
          productId,
          imageFiles,
          (index, progress) => {
            setUploadProgress((prev) => ({ ...prev, [index]: progress }));
          }
        );
      }

      const allImages = [...existingImages, ...uploadedUrls];
      
      const payload: ProductFormValues = {
        ...values,
        image_url: allImages[0] || null, // First image as main thumbnail cover
        images: allImages,
        // If they toggle featured or active status:
        status: values.status,
      };

      if (initialData) {
        await productService.updateProduct(productId, payload);
        toast.success("Product updated successfully");
      } else {
        // Actually, we can simply execute via database insert directly!
        // Wait, let's check: productService.createProduct can take an optional ID or handle it. Let's look at the parameters of `productService.createProduct`.
        // It takes `ProductFormValues`. Let's extend it or do raw supabase inside the service or form.
        // Let's check if we can do the insert directly using createClient() browser instance here:
        const { createClient } = await import("@/lib/supabase/client");
        const client = createClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) throw new Error("Unauthorized.");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (client.from("products") as any).insert({
          id: productId,
          seller_id: user.id,
          category_id: payload.category_id,
          name: payload.name,
          description: payload.description,
          configuration: payload.configuration || null,
          sku: payload.sku || null,
          price: payload.price,
          discount: payload.discount,
          stock: payload.stock,
          featured: payload.featured,
          status: payload.status,
          image_url: payload.image_url,
          images: payload.images,
        });

        if (error) throw new Error(error.message);
        toast.success("Product created successfully");
      }

      router.push("/seller/products");
      router.refresh();
    } catch (err) {
      const error = err as Error;
      toast.error("Form submission failed", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-16 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          onClick={() => router.push("/seller/products")}
          variant="outline"
          size="icon"
          className="rounded-full shrink-0 h-9 w-9 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            {initialData ? `Edit Listing: ${initialData.name}` : "Create New Listing"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete the inventory forms to publish or draft items.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Basic Info */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold">1. Primary Information</CardTitle>
              <CardDescription className="text-xs">
                Provide public name labels and editorial details of your product.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prod-name">Product Title</Label>
                <Input
                  id="prod-name"
                  type="text"
                  placeholder="e.g. Wireless Ergonomic Mouse"
                  {...register("name")}
                  className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="prod-desc">Detailed Description</Label>
                <textarea
                  id="prod-desc"
                  rows={6}
                  placeholder="Explain listing specs, materials, user guides, or shipping weights..."
                  {...register("description")}
                  className={cn(
                    "flex min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    errors.description ? "border-red-500 focus:ring-red-500" : ""
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="prod-config">Product Configuration</Label>
                <textarea
                  id="prod-config"
                  rows={4}
                  placeholder="Explain options, e.g., Color: Blue, RAM: 16GB, Storage: 512GB SSD..."
                  {...register("configuration")}
                  className={cn(
                    "flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    errors.configuration ? "border-red-500 focus:ring-red-500" : ""
                  )}
                />
                {errors.configuration && (
                  <p className="mt-1 text-xs text-red-500">{errors.configuration.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="prod-cat">Select Catalog Category</Label>
                <div className="mt-1">
                  <select
                    id="prod-cat"
                    {...register("category_id")}
                    className={cn(
                      "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                      errors.category_id ? "border-red-500" : ""
                    )}
                  >
                    <option value="">Choose Catalog Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <p className="mt-1 text-xs text-red-500">{errors.category_id.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Pricing & Inventory */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold">2. Pricing & Storage Inventory</CardTitle>
              <CardDescription className="text-xs">
                Set sales prices, discounts, serial SKUs, and stock quantities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prod-price">Unit Price ($)</Label>
                  <Input
                    id="prod-price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("price")}
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && (
                    <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="prod-discount">Discount Off (%)</Label>
                  <Input
                    id="prod-discount"
                    type="number"
                    placeholder="0"
                    {...register("discount")}
                    className={errors.discount ? "border-red-500" : ""}
                  />
                  {errors.discount && (
                    <p className="mt-1 text-xs text-red-500">{errors.discount.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prod-stock">Initial Warehouse Stock</Label>
                  <Input
                    id="prod-stock"
                    type="number"
                    placeholder="10"
                    {...register("stock")}
                    className={errors.stock ? "border-red-500" : ""}
                  />
                  {errors.stock && (
                    <p className="mt-1 text-xs text-red-500">{errors.stock.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="prod-sku">Stock Keeping Unit (SKU)</Label>
                  <Input
                    id="prod-sku"
                    type="text"
                    placeholder="e.g. ELEC-WRMOUSE-01"
                    {...register("sku")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Photo Galleries */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold">3. Product Galleries (Max 5)</CardTitle>
              <CardDescription className="text-xs">
                Drag or select up to 5 clear retail photos. Supported formats: JPEG, PNG, WebP (Max 5MB/file).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop Zone Box */}
              {(existingImages.length + imageFiles.length) < 5 && (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-350 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded-xl p-8 cursor-pointer transition-colors duration-200">
                  <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-foreground">Click to select files or drop here</span>
                  <span className="text-[10px] text-muted-foreground mt-1">Accepts multiple images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              )}

              {/* Progress Strips / Previews */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                {/* Existing URLs preview */}
                {existingImages.map((url) => (
                  <div key={url} className="relative aspect-square border border-border rounded-lg bg-muted overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Existing" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingFile(url)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 cursor-pointer shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1 bg-slate-950/70 text-white text-[8px] rounded uppercase font-bold tracking-wider select-none">
                      Cover
                    </span>
                  </div>
                ))}

                {/* Upload file preview with progress overlay */}
                {imageFiles.map((file, idx) => {
                  const progress = uploadProgress[idx] || 0;
                  return (
                    <div key={idx} className="relative aspect-square border border-border rounded-lg bg-muted overflow-hidden flex flex-col items-center justify-center">
                      <div className="absolute inset-0 bg-slate-900/40 z-10 flex items-center justify-center">
                        <span className="text-white text-xs font-bold font-mono">
                          {progress === 100 ? "Ready" : `${progress}%`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewFile(idx)}
                        className="absolute top-1 right-1 bg-red-650 text-white rounded-full p-1 z-25 cursor-pointer shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <span className="text-[10px] text-muted-foreground font-semibold px-2 truncate w-full text-center">
                        {file.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Setting toggles & Submissions */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold">Publish & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="featured-toggle" className="font-bold text-foreground cursor-pointer">
                    Featured Item
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Display item in front page carousel rows.
                  </p>
                </div>
                <input
                  id="featured-toggle"
                  type="checkbox"
                  {...register("featured")}
                  disabled={uploading}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              <div className="border-t border-border pt-4">
                <Label htmlFor="status-select" className="font-bold">Catalog Status</Label>
                <select
                  id="status-select"
                  {...register("status")}
                  disabled={uploading}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                >
                  <option value="draft">Draft (Private)</option>
                  {/* Active listings must be approved, so default new entries can be sent to pending_approval */}
                  <option value="pending_approval">Submit for Approval</option>
                  <option value="active">Publish Direct (Active)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button
                  type="submit"
                  disabled={isSubmitting || uploading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer"
                >
                  {(isSubmitting || uploading) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {initialData ? "Save Update" : "Publish Listing"}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push("/seller/products")}
                  variant="outline"
                  disabled={isSubmitting || uploading}
                  className="w-full cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help box for guidelines */}
          <Card className="border-emerald-100 bg-emerald-50/20 dark:border-emerald-950/20">
            <CardContent className="p-4 space-y-2">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 animate-pulse" />
                Store Policies
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Approved listings are visible instantly on the public shop catalog. Direct publication defaults to admin audit moderation pipelines if your store status rating drops.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
