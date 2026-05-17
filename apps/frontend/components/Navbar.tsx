'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';

export default function Navbar() {
  const { items } = useCartStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const count = items.reduce((s, i) => s + i.quantity, 0);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary">EShop</Link>

        <div className="flex items-center gap-6">
          <Link href="/products" className="text-gray-600 hover:text-primary transition-colors">
            Products
          </Link>

          {user?.role === 'ADMIN' && (
            <Link href="/admin/products" className="text-gray-600 hover:text-primary transition-colors flex items-center gap-1">
              <LayoutDashboard size={16} /> Admin
            </Link>
          )}

          <Link href="/cart" className="relative text-gray-600 hover:text-primary">
            <ShoppingCart size={22} />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/orders" className="text-gray-600 hover:text-primary flex items-center gap-1">
                <User size={18} /> Orders
              </Link>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-gray-600 hover:text-primary">Login</Link>
              <Link href="/register" className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm hover:bg-primary-dark transition-colors">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
