'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { ordersApi, paymentsApi } from '@/lib/api';

export default function CheckoutPage() {
  const { items, total, clear } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const order = await ordersApi.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: address,
      }) as any;

      const payment = await paymentsApi.initiate(order.id) as any;
      await paymentsApi.process(payment.id);

      clear();
      toast.success('Order placed successfully!');
      router.push('/orders');
    } catch (err: any) {
      toast.error(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleCheckout} className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Shipping Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
              <textarea
                required value={address} onChange={(e) => setAddress(e.target.value)}
                rows={3} placeholder="Enter your full address…"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Payment</h2>
            <p className="text-sm text-gray-500">💳 Payment is simulated for demo purposes</p>
          </div>
          <button
            type="submit" disabled={loading || items.length === 0}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {loading ? 'Processing…' : `Place Order · $${total().toFixed(2)}`}
          </button>
        </form>

        <div className="bg-white rounded-xl p-6 shadow-sm h-fit">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {items.map((i) => (
              <div key={i.productId} className="flex justify-between text-sm">
                <span className="text-gray-600">{i.name} × {i.quantity}</span>
                <span>${(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 flex justify-between font-bold">
            <span>Total</span><span>${total().toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
