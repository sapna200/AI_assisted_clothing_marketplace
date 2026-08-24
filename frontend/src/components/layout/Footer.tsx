import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-lg font-bold text-white">ShopKart</p>
            <p className="text-sm text-gray-400 mt-1">
              Your one-stop shop for amazing products
            </p>
          </div>
          <div className="flex space-x-6">
            <Link href="/" className="text-sm hover:text-white">
              Home
            </Link>
            <Link href="/wishlist" className="text-sm hover:text-white">
              Wishlist
            </Link>
            <Link href="/cart" className="text-sm hover:text-white">
              Cart
            </Link>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-700 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} ShopKart. All rights reserved.
        </div>
      </div>
    </footer>
  );
}