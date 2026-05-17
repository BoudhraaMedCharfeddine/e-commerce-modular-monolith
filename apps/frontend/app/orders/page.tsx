'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.myOrders().then((o: any) => setOrders(o)).finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await ordersApi.cancel(id);
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'CANCELLED' } : o));
      toast.success('Order cancelled');
    } catch (err: any) {
      toast.error(err.message || 'Cannot cancel order');
    }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-24">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No orders yet</p>
          <Link href="/products" className="bg-primary text-white px-6 py-3 rounded-lg">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-mono text-sm text-gray-500">#{order.id.split('-')[0].toUpperCase()}</p>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                  {order.status}
                </span>
              </div>
              <div className="space-y-1 mb-4">
                {order.items?.map((item: any) => (
                  <p key={item.id} className="text-sm text-gray-600">
                    {item.product?.name} × {item.quantity} — ${(item.unitPrice * item.quantity).toFixed(2)}
                  </p>
                ))}
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="font-bold">Total: ${Number(order.totalAmount).toFixed(2)}</span>
                {['PENDING', 'CONFIRMED'].includes(order.status) && (
                  <button
                    onClick={() => handleCancel(order.id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
