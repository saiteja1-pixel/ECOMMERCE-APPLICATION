import { ProductForm } from "@/components/forms/product-form";

export default function NewProductPage() {
  return (
    <div className="container max-w-5xl mx-auto py-6">
      <ProductForm initialData={null} />
    </div>
  );
}
