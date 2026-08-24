import { getProducts } from "@/lib/api";
import ProductGrid from "@/components/product/ProductGrid";
import { Product } from "@/lib/types";

export default async function Home() {
  let products: Product[] = [];
  let error = false;

  try {
    products = await getProducts();
  } catch {
    error = true;
  }

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">ShopKart</h1>
          <p className="text-xl text-indigo-100">
            Discover amazing products at unbeatable prices
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">All Products</h2>
        {error ? (
          <div className="text-center py-16">
            <p className="text-lg text-red-600 font-medium">
              Unable to load products right now
            </p>
            <p className="text-gray-500 mt-2">
              Please check that the backend server is running and try again.
            </p>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </section>
    </div>
  );
}