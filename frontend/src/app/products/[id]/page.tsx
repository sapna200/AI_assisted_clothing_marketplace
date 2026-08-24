import { notFound } from "next/navigation";
import { getProductById } from "@/lib/api";
import ProductDetailClient from "@/components/product/ProductDetailClient";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  let product;
  try {
    product = await getProductById(id);
  } catch {
    notFound();
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ProductDetailClient product={product} />
    </div>
  );
}