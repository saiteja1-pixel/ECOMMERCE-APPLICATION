import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailsClient } from "./product-details-client";
import { productService } from "@/services/product-service";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await productService.getProductById(id);
    if (!product || product.status === "deleted") {
      return { title: "Product Not Found" };
    }
    return {
      title: `${product.name} | CommerceHub`,
      description: product.description.substring(0, 160),
      openGraph: {
        title: product.name,
        description: product.description.substring(0, 160),
        images: product.image_url ? [{ url: product.image_url }] : [],
      },
    };
  } catch {
    return { title: "Product Details" };
  }
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { id } = await params;

  let product = null;
  let relatedProducts = [];

  try {
    product = await productService.getProductById(id);
    if (!product || product.status === "deleted") {
      return notFound();
    }
    
    // Fetch related products from same category
    relatedProducts = await productService.getRelatedProducts(product.category_id, product.id, 4);
  } catch (err) {
    console.error("Product details SSR fetch failed:", err);
    return notFound();
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 font-sans">
      <ProductDetailsClient product={product} relatedProducts={relatedProducts} />
    </div>
  );
}
