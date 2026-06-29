"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { categorySchema, type CategoryFormValues } from "@/lib/validators/category";
import { categoryService } from "@/services/category-service";
import type { Category } from "@/types/category";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // Modal configuration
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      parent_id: null,
      sort_order: 0,
      image: null,
    },
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      const error = err as Error;
      toast.error("Failed to load categories", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("name", val);
    // Generate simple slug auto-fill
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", slug, { shouldValidate: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File limit exceeded", { description: "Image size must be under 2MB" });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    reset({
      name: "",
      slug: "",
      parent_id: null,
      sort_order: 0,
      image: null,
    });
    setEditingId(null);
    setSelectedFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    reset({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id,
      sort_order: cat.sort_order,
      image: cat.image,
    });
    setEditingId(cat.id);
    setSelectedFile(null);
    setImagePreview(cat.image);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await categoryService.deleteCategory(id);
      toast.success("Category deleted");
      loadCategories();
    } catch (err) {
      const error = err as Error;
      toast.error("Deletion failed", { description: error.message });
    }
  };

  const onSubmitForm = async (values: CategoryFormValues) => {
    try {
      let finalImageUrl = values.image || null;

      // Handle image upload first if selected
      if (selectedFile) {
        setUploadingImage(true);
        try {
          finalImageUrl = await categoryService.uploadCategoryImage(selectedFile);
        } catch (uploadErr) {
          const uErr = uploadErr as Error;
          toast.error("Image upload failed", { description: uErr.message });
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      const formPayload = {
        ...values,
        image: finalImageUrl,
      };

      if (editingId) {
        await categoryService.updateCategory(editingId, formPayload);
        toast.success("Category updated successfully");
      } else {
        await categoryService.createCategory(formPayload);
        toast.success("Category created successfully");
      }

      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      const error = err as Error;
      toast.error("Operation failed", { description: error.message });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Restructure list to hierarchical child categories array
  const buildTree = (list: Category[]): Category[] => {
    const map: Record<string, Category & { children: Category[] }> = {};
    const roots: Category[] = [];

    list.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    list.forEach((item) => {
      const mapped = map[item.id];
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(mapped);
      } else {
        roots.push(mapped);
      }
    });

    return roots;
  };

  const categoryTree = buildTree(
    categories.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Recursive element tree node renderer
  const renderCategoryNode = (cat: Category & { children?: Category[] }, depth = 0) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = !!expandedCats[cat.id];

    return (
      <div key={cat.id} className="space-y-1">
        <div
          className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-border rounded-xl shadow-sm hover:border-purple-200 transition-colors"
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(cat.id)}
                className="p-1 text-slate-500 hover:text-purple-600 rounded hover:bg-slate-100 cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-6" /> // spacer
            )}

            {/* Thumbnail */}
            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-border overflow-hidden flex items-center justify-center shrink-0">
              {cat.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <div>
              <span className="font-sans font-bold text-foreground text-sm">
                {cat.name}
              </span>
              <span className="text-[10px] text-muted-foreground ml-2 font-mono bg-slate-50 dark:bg-slate-850 px-1.5 py-0.5 rounded">
                /{cat.slug}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              onClick={() => openEditModal(cat)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-purple-600 cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => handleDelete(cat.id)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-red-600 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {cat.children!.map((child) => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
            Category Manager
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure product catalog subcategories, listing routes, and banner images.
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg gap-2 cursor-pointer shadow-sm text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg font-bold">Categories Structure</CardTitle>
              <CardDescription className="text-xs">
                Manage top level categories and nested children categories.
              </CardDescription>
            </div>

            {/* Filter Search */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="text-sm text-muted-foreground">Loading tree hierarchy...</span>
            </div>
          ) : categoryTree.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl">
              <FolderTree className="h-10 w-10 mx-auto text-slate-350 mb-3" />
              <p className="text-sm">No categories found matching filters.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {categoryTree.map((node) => renderCategoryNode(node))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories CRUD Modals popup dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold">
                {editingId ? "Modify Category" : "Add New Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">
              <div>
                <Label htmlFor="cat-name">Category Name</Label>
                <Input
                  id="cat-name"
                  type="text"
                  placeholder="e.g. Home Appliances"
                  {...register("name")}
                  onChange={handleNameChange}
                  disabled={isSubmitting || uploadingImage}
                  className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cat-slug">URL Slug</Label>
                <Input
                  id="cat-slug"
                  type="text"
                  placeholder="e.g. home-appliances"
                  {...register("slug")}
                  disabled={isSubmitting || uploadingImage}
                  className={errors.slug ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.slug && (
                  <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cat-parent">Parent Category</Label>
                  <select
                    id="cat-parent"
                    {...register("parent_id")}
                    disabled={isSubmitting || uploadingImage}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">None (Top-Level)</option>
                    {categories
                      .filter((c) => c.id !== editingId && !c.parent_id) // Avoid recursion loops
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="cat-order">Sort Order</Label>
                  <Input
                    id="cat-order"
                    type="number"
                    {...register("sort_order", { valueAsNumber: true })}
                    disabled={isSubmitting || uploadingImage}
                  />
                </div>
              </div>

              {/* Category Image upload drop zone */}
              <div>
                <Label>Category Icon / Banner</Label>
                <div className="mt-1.5 flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative h-20 w-20 rounded-xl border border-border overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setImagePreview(null);
                          setValue("image", null);
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 cursor-pointer shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-20 w-full border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 cursor-pointer transition-colors p-4">
                      <div className="flex items-center gap-2 text-slate-500 hover:text-purple-600">
                        <UploadCloud className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs font-semibold">Drop or select file (Max 2MB)</span>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isSubmitting || uploadingImage}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="outline"
                  disabled={isSubmitting || uploadingImage}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || uploadingImage}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 cursor-pointer"
                >
                  {(isSubmitting || uploadingImage) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {editingId ? "Save Changes" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
