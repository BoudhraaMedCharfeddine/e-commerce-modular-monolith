import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, CreditCard } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-blue-700 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">Shop Smarter, Live Better</h1>
          <p className="text-xl text-blue-100 mb-8">
            Discover thousands of products at unbeatable prices
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors"
          >
            Shop Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Truck size={32} className="text-primary" />, title: 'Free Shipping', desc: 'On all orders over $50' },
            { icon: <ShieldCheck size={32} className="text-primary" />, title: 'Secure Payments', desc: 'Your data is protected' },
            { icon: <CreditCard size={32} className="text-primary" />, title: 'Easy Returns', desc: '30-day return policy' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="flex justify-center mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-100 py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to start shopping?</h2>
        <p className="text-gray-500 mb-6">Join thousands of happy customers today</p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors">
            Create Account
          </Link>
          <Link href="/products" className="bg-white border border-gray-200 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
            Browse Products
          </Link>
        </div>
      </section>
    </div>
  );
}
