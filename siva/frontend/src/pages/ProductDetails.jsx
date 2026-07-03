import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { setCartItems } from '../redux/cartSlice.js';
import API from '../services/api.js';
import { ProductDetailsSkeleton } from '../components/Skeletons.jsx';
import StarRating from '../components/StarRating.jsx';
import { ShoppingCart, Zap, Heart, Star, CheckCircle, ThumbsUp, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // States
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [replyText, setReplyText] = useState({});

  // Product Query
  const { data: productRes, isLoading: productLoading } = useQuery({
    queryKey: ['productDetails', id],
    queryFn: () => API.get(`/products/${id}`),
  });

  // Reviews Query
  const { data: reviewsRes, isLoading: reviewsLoading } = useQuery({
    queryKey: ['productReviews', id],
    queryFn: () => API.get(`/reviews/product/${id}`),
  });

  // Similar Products Query
  const { data: similarRes } = useQuery({
    queryKey: ['similarProducts', id],
    queryFn: () => API.get(`/products/similar/${id}`),
  });

  const product = productRes?.data?.product;
  const reviews = reviewsRes?.data?.reviews || [];
  const stats = reviewsRes?.data?.stats || { avgRating: 0, totalReviews: 0, distribution: {} };
  const similarProducts = similarRes?.data?.products || [];

  // Mutations
  const addToCartMutation = useMutation({
    mutationFn: (payload) => API.post('/cart', payload),
    onSuccess: (res) => {
      dispatch(setCartItems(res.data.cart.items));
      toast.success('Product added to cart!');
    },
    onError: () => {
      toast.error('Could not add to cart.');
    },
  });

  const addToWishlistMutation = useMutation({
    mutationFn: () => API.post('/wishlist', { productId: product._id }),
    onSuccess: () => {
      toast.success('Added to wishlist!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add to wishlist');
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: (payload) => API.post('/reviews', payload),
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      setReviewTitle('');
      setReviewComment('');
      queryClient.invalidateQueries(['productReviews', id]);
      queryClient.invalidateQueries(['productDetails', id]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    },
  });

  const likeReviewMutation = useMutation({
    mutationFn: (revId) => API.post(`/reviews/${revId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries(['productReviews', id]);
    },
  });

  const replyReviewMutation = useMutation({
    mutationFn: ({ revId, comment }) => API.post(`/reviews/${revId}/reply`, { comment }),
    onSuccess: () => {
      toast.success('Reply submitted');
      setReplyText({});
      queryClient.invalidateQueries(['productReviews', id]);
    },
    onError: () => {
      toast.error('Unauthorized or failed to reply');
    },
  });

  if (productLoading) return <ProductDetailsSkeleton />;
  if (!product) return <div className="text-center py-12">Product not found.</div>;

  const currentVariant = product.variants[0] || {};
  const hasVariants = product.variants.length > 0;
  const sizes = Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean)));
  const colors = Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean)));

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please log in first');
      return navigate('/login');
    }
    const variant = product.variants.find(
      (v) => (selectedSize ? v.size === selectedSize : true) && (selectedColor ? v.color === selectedColor : true)
    );

    if (!variant) {
      return toast.error('Selected variant not available');
    }

    addToCartMutation.mutate({
      product: product._id,
      variantId: variant._id,
      selectedSize,
      selectedColor,
      quantity: 1,
    });
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error('Please log in first');
      return navigate('/login');
    }
    handleAddToCart();
    navigate('/cart');
  };

  const submitReview = (e) => {
    e.preventDefault();
    if (!reviewComment) return toast.error('Please enter comment');
    createReviewMutation.mutate({
      product: product._id,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
    });
  };

  const submitReply = (revId) => {
    const text = replyText[revId];
    if (!text) return;
    replyReviewMutation.mutate({ revId, comment: text });
  };

  const discount =
    currentVariant.price && currentVariant.offerPrice
      ? Math.round(((currentVariant.price - currentVariant.offerPrice) / currentVariant.price) * 100)
      : 0;

  return (
    <div className="space-y-12">
      
      {/* Product Split details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left image column */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-150 p-4 rounded-sm flex items-center justify-center min-h-[400px] max-h-[400px] relative dark:bg-zinc-900 dark:border-zinc-800">
            <img
              src={product.images[activeImageIdx]?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'}
              alt={product.title}
              className="max-h-full max-w-full object-contain"
            />
            <button
              onClick={() => addToWishlistMutation.mutate()}
              className="absolute top-4 right-4 p-2 bg-white rounded-full border border-gray-200 text-gray-400 hover:text-red-500 transition shadow-sm dark:bg-zinc-850 dark:border-zinc-700"
            >
              <Heart size={18} />
            </button>
          </div>

          {/* Image gallery selection strip */}
          {product.images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto py-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 h-20 p-1 border rounded-sm flex items-center justify-center bg-white flex-shrink-0 dark:bg-zinc-900 ${
                    idx === activeImageIdx ? 'border-primary-500 border-2 shadow-inner' : 'border-gray-200 dark:border-zinc-850'
                  }`}
                >
                  <img src={img.url} alt="" className="max-h-full max-w-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={handleAddToCart}
              className="py-3 bg-secondary text-white font-bold rounded-sm text-sm uppercase shadow flex items-center justify-center gap-2 hover:bg-yellow-500 transition"
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="py-3 bg-primary-500 text-white font-bold rounded-sm text-sm uppercase shadow flex items-center justify-center gap-2 hover:bg-primary-600 transition"
            >
              <Zap size={18} /> Buy Now
            </button>
          </div>
        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
              {product.brand?.name || 'Generic'}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white leading-7">
              {product.title}
            </h2>
            {product.ratings > 0 && (
              <div className="flex items-center gap-2">
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                  {product.ratings.toFixed(1)} <Star size={10} className="fill-white" />
                </span>
                <span className="text-xs text-gray-500 font-semibold">{product.numOfReviews} Reviews</span>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="border-t border-b border-gray-100 py-4 space-y-1.5 dark:border-zinc-800">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                &#8377;{currentVariant.offerPrice}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-sm text-gray-400 line-through">&#8377;{currentVariant.price}</span>
                  <span className="text-green-600 font-bold text-sm">{discount}% Off</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 font-bold">Inclusive of all taxes</p>
          </div>

          {/* Variant select dropdowns */}
          <div className="space-y-4">
            {sizes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Select Size</span>
                <div className="flex gap-2">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-1.5 border text-xs font-bold rounded-sm transition ${
                        selectedSize === sz
                          ? 'border-primary-500 bg-primary-50 text-primary-500 dark:bg-zinc-800'
                          : 'border-gray-200 hover:border-gray-300 dark:border-zinc-850'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {colors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Select Color</span>
                <div className="flex gap-2">
                  {colors.map((col) => (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(col)}
                      className={`px-4 py-1.5 border text-xs font-bold rounded-sm transition ${
                        selectedColor === col
                          ? 'border-primary-500 bg-primary-50 text-primary-500 dark:bg-zinc-800'
                          : 'border-gray-200 hover:border-gray-300 dark:border-zinc-850'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm dark:text-white">Product Description</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400 leading-6">{product.description}</p>
          </div>

          <div className="space-y-3 bg-white p-6 border border-gray-100 rounded-sm shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="font-bold text-sm dark:text-white">Delivery & Warranty</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-400 font-bold">Return Policy</p>
                <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">{product.returnPolicy}</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold">Warranty</p>
                <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">{product.warranty}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Reviews Dashboard section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Stats and Write Form */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-base dark:text-white">Customer Reviews</h3>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-extrabold">{stats.avgRating.toFixed(1)}</span>
              <div>
                <StarRating rating={stats.avgRating} size={18} />
                <p className="text-xs text-gray-500 font-semibold mt-1">{stats.totalReviews} customer ratings</p>
              </div>
            </div>

            {/* Star distributions */}
            <div className="space-y-2 pt-2 text-xs">
              {[5, 4, 3, 2, 1].map((val) => {
                const count = stats.distribution[val] || 0;
                const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={val} className="flex items-center gap-3">
                    <span className="font-bold w-3">{val}</span>
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 bg-gray-150 h-2 rounded-full overflow-hidden dark:bg-zinc-800">
                      <div className="bg-green-600 h-full" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-6 text-right text-gray-400 font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Write review form */}
          {isAuthenticated && (
            <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
              <h3 className="font-bold text-sm dark:text-white">Write a Review</h3>
              <form onSubmit={submitReview} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Your Rating</span>
                  <StarRating rating={reviewRating} onChange={setReviewRating} size={22} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Review Title</label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-sm focus:outline-none dark:border-zinc-800 bg-transparent"
                    placeholder="E.g., Great value, Good product"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Comments</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-sm focus:outline-none dark:border-zinc-800 bg-transparent"
                    placeholder="Tell us what you liked or disliked"
                  />
                </div>
                <button
                  type="submit"
                  disabled={createReviewMutation.isPending}
                  className="w-full py-2 bg-primary-500 text-white font-bold rounded-sm text-xs hover:bg-primary-600 transition shadow"
                >
                  Submit Feedback
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Side: Reviews listing */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-base dark:text-white pb-2 border-b border-gray-100 dark:border-zinc-800">
            Reviews Feed
          </h3>

          {reviewsLoading ? (
            <p className="text-xs text-gray-400">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-sm p-6 text-center text-xs text-gray-500 dark:bg-zinc-900 dark:border-zinc-800">
              No reviews yet for this product. Be the first to share your thoughts!
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev._id}
                className="bg-white border border-gray-100 rounded-sm p-6 space-y-4 shadow-sm dark:bg-zinc-900 dark:border-zinc-800"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                        {rev.rating} <Star size={8} className="fill-white" />
                      </span>
                      <span className="font-bold text-sm text-zinc-900 dark:text-white">{rev.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">{rev.comment}</p>
                  </div>

                  <button
                    onClick={() => likeReviewMutation.mutate(rev._id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-primary-500"
                  >
                    <ThumbsUp size={14} /> <span>{rev.likes.length}</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-gray-400 border-b border-gray-50 pb-3 dark:border-zinc-850">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">
                    {rev.user?.name || 'Anonymous User'}
                  </span>
                  {rev.isVerifiedPurchase && (
                    <span className="text-green-600 font-bold flex items-center gap-0.5">
                      <CheckCircle size={10} /> Certified Purchase
                    </span>
                  )}
                  <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Replies Feed */}
                {rev.replies.length > 0 && (
                  <div className="pl-6 border-l-2 border-gray-100 space-y-3 dark:border-zinc-800">
                    {rev.replies.map((rep) => (
                      <div key={rep._id} className="text-xs bg-gray-50/50 p-2.5 rounded-sm dark:bg-zinc-850">
                        <p className="font-bold text-zinc-800 dark:text-zinc-200">
                          {rep.user?.name || 'Merchant'}
                          <span className="text-[9px] text-gray-400 font-normal ml-2">
                            ({rep.user?.role})
                          </span>
                        </p>
                        <p className="text-gray-600 dark:text-zinc-400 mt-0.5">{rep.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Write a Merchant reply */}
                {isAuthenticated && (user.role === 'admin' || (product.seller === user._id)) && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Post a reply as Merchant..."
                      value={replyText[rev._id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [rev._id]: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-xs focus:outline-none dark:border-zinc-850 bg-transparent"
                    />
                    <button
                      onClick={() => submitReply(rev._id)}
                      className="px-4 bg-gray-100 hover:bg-gray-200 text-zinc-800 rounded-sm dark:bg-zinc-800 dark:text-white"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                )}

              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
};

export default ProductDetails;
