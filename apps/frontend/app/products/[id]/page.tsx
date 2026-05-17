'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Star, ShoppingCart, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi, reviewsApi } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    productsApi.getOne(id).then(setProduct);
    reviewsApi.byProduct(id).then((r: any) => {
      setReviews(r.reviews || []);
      setAvgRating(r.averageRating || 0);
    });
  }, [id]);

  if (!product) return <div className="flex justify-center py-24"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const handleAdd = () => {
    addItem({ productId: product.id, name: product.name, price: product.price, quantity: qty, imageUrl: product.imageUrl });
    toast.success('Added to cart!');
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await reviewsApi.create({ productId: id, ...reviewForm }) as any;
      setReviews([r, ...reviews]);
      toast.success('Review submitted!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="relative h-96 bg-gray-100 rounded-2xl overflow-hidden">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">📦</div>
          )}
        </div>

        <div className="flex flex-col">
          {product.category && <span className="text-primary text-sm font-medium">{product.category.name}</span>}
          <h1 className="text-3xl font-bold mt-2">{product.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex">
              {[1,2,3,4,5].map((s) => <Star key={s} size={16} className={s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />)}
            </div>
            <span className="text-sm text-gray-500">{avgRating} ({reviews.length} reviews)</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">${Number(product.price).toFixed(2)}</p>
          <p className="text-gray-600 mt-4">{product.description}</p>
          <p className="text-sm text-gray-500 mt-2">Stock: {product.stock} available</p>

          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-gray-100"><Minus size={16} /></button>
              <span className="px-4 font-medium">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-2 hover:bg-gray-100"><Plus size={16} /></button>
            </div>
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Reviews</h2>
        {user && (
          <form onSubmit={handleReview} className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h3 className="font-semibold mb-4">Write a review</h3>
            <div className="flex gap-2 mb-4">
              {[1,2,3,4,5].map((s) => (
                <button key={s} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: s })}>
                  <Star size={24} className={s <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Share your experience…"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-3"
            />
            <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors">
              Submit Review
            </button>
          </form>
        )}
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {r.user?.firstName?.[0] || 'U'}
                  </div>
                  <span className="font-medium">{r.user?.firstName} {r.user?.lastName}</span>
                  <div className="flex ml-auto">
                    {[1,2,3,4,5].map((s) => <Star key={s} size={14} className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />)}
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
