'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart.store';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  stock: number;
  category?: { name: string };
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore();

  const handleAdd = () => {
    addItem({ productId: product.id, name: product.name, price: product.price, quantity: 1, imageUrl: product.imageUrl });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      <Link href={`/products/${product.id}`}>
        <div className="relative h-52 bg-gray-100">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">📦</div>
          )}
          {product.stock === 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Out of stock</span>
          )}
        </div>
      </Link>
      <div className="p-4">
        {product.category && (
          <span className="text-xs text-primary font-medium">{product.category.name}</span>
        )}
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-800 mt-1 hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
        </Link>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-gray-900">${Number(product.price).toFixed(2)}</span>
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="bg-primary text-white p-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
