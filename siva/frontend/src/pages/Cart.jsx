import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCartItems, clearCartLocal } from '../redux/cartSlice.js';
import API from '../services/api.js';
import { ShoppingCart, Trash2, ArrowRight, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: cartItems } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);

  const fetchCart = async () => {
    try {
      const res = await API.get('/cart');
      dispatch(setCartItems(res.data.cart.items));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const updateQuantity = async (variantId, newQty) => {
    if (newQty < 1) return;
    try {
      const res = await API.put('/cart', { variantId, quantity: newQty });
      dispatch(setCartItems(res.data.cart.items));
      toast.success('Cart updated');
      
      // Reset coupon if items change to prevent calculation logic mismatch
      setAppliedCoupon(null);
      setDiscount(0);
    } catch (err) {
      toast.error('Could not update quantity');
    }
  };

  const removeItem = async (variantId) => {
    try {
      const res = await API.delete(`/cart/${variantId}`);
      dispatch(setCartItems(res.data.cart.items));
      toast.success('Removed item');
      setAppliedCoupon(null);
      setDiscount(0);
    } catch (err) {
      toast.error('Could not remove item');
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode) return;
    try {
      const res = await API.post('/coupons/apply', { code: couponCode, amount: itemsPrice });
      setAppliedCoupon(res.data.code);
      setDiscount(res.data.discount);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    }
  };

  if (loading) return <div className="text-center py-12">Loading Cart...</div>;

  if (cartItems.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-sm p-12 text-center shadow-sm max-w-2xl mx-auto dark:bg-zinc-900 dark:border-zinc-800">
        <ShoppingCart size={48} className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" />
        <h3 className="font-bold text-lg dark:text-white">Your Cart is Empty!</h3>
        <p className="text-xs text-gray-500 font-semibold mt-1">Explore our hot deals and add items to your cart.</p>
        <Link
          to="/products"
          className="inline-block bg-primary-500 text-white px-6 py-2.5 rounded-sm font-bold text-sm shadow hover:bg-primary-600 transition mt-6"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  // Calculate pricing breakdown
  const itemsPrice = cartItems.reduce((acc, curr) => acc + (curr.product?.variants.find(v => v._id === curr.variantId)?.offerPrice || 0) * curr.quantity, 0);
  const taxPrice = Number((itemsPrice * 0.18).toFixed(2));
  const shippingPrice = itemsPrice < 500 ? 40 : 0;
  const totalPrice = Number((itemsPrice + taxPrice + shippingPrice - discount).toFixed(2));

  const handleCheckout = () => {
    navigate('/checkout', {
      state: {
        couponCode: appliedCoupon,
        discount,
      },
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* Cart Items list */}
      <div className="flex-1 space-y-4">
        <div className="bg-white rounded-sm border border-gray-100 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="font-bold text-base border-b border-gray-100 dark:border-zinc-850 pb-4 dark:text-white">
            Flipkart Cart ({cartItems.length} Items)
          </h3>

          <div className="divide-y divide-gray-100 dark:divide-zinc-850">
            {cartItems.map((item) => {
              const product = item.product || {};
              const variant = product.variants?.find((v) => v._id === item.variantId) || {};
              const discountPercent =
                variant.price && variant.offerPrice
                  ? Math.round(((variant.price - variant.offerPrice) / variant.price) * 100)
                  : 0;

              return (
                <div key={item.variantId} className="flex gap-4 py-6 first:pt-4 last:pb-0 items-start">
                  <div className="h-24 w-24 bg-gray-50 flex items-center justify-center p-2 rounded-sm dark:bg-zinc-800 flex-shrink-0">
                    <img
                      src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'}
                      alt={product.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <Link to={`/product/${product._id}`} className="hover:text-primary-500">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                        {product.title}
                      </h4>
                    </Link>
                    <p className="text-[10px] text-gray-400 font-bold">
                      Seller: {product.seller?.name || 'Flipkart Seller'}
                    </p>
                    
                    {/* Size and Color badges */}
                    <div className="flex gap-2 text-[10px]">
                      {item.selectedSize && (
                        <span className="bg-gray-100 text-zinc-600 px-2 py-0.5 rounded-sm font-bold dark:bg-zinc-800 dark:text-zinc-300">
                          Size: {item.selectedSize}
                        </span>
                      )}
                      {item.selectedColor && (
                        <span className="bg-gray-100 text-zinc-600 px-2 py-0.5 rounded-sm font-bold dark:bg-zinc-800 dark:text-zinc-300">
                          Color: {item.selectedColor}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-base font-extrabold text-zinc-950 dark:text-white">
                        &#8377;{variant.offerPrice || 0}
                      </span>
                      {discountPercent > 0 && (
                        <>
                          <span className="text-xs text-gray-400 line-through">&#8377;{variant.price}</span>
                          <span className="text-green-600 font-bold text-xs">{discountPercent}% Off</span>
                        </>
                      )}
                    </div>

                    {/* Quantity selectors & remove triggers */}
                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-sm">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2.5 py-1 text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 font-bold"
                        >
                          -
                        </button>
                        <span className="px-3.5 py-1 text-xs font-bold border-l border-r border-gray-200 dark:border-zinc-700">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="px-2.5 py-1 text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="flex items-center gap-1 text-xs text-red-500 font-semibold hover:underline"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing Summary Column */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        
        {/* Coupon Drawer */}
        <div className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
          <h4 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1">
            <Tag size={12} /> Apply Coupon
          </h4>
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Promo Code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-sm focus:outline-none dark:border-zinc-800 bg-transparent uppercase"
            />
            <button
              type="submit"
              className="bg-primary-500 text-white font-bold text-xs px-4 rounded-sm hover:bg-primary-600 transition"
            >
              Apply
            </button>
          </form>
          {appliedCoupon && (
            <p className="text-[10px] text-green-600 font-bold">
              Coupon "{appliedCoupon}" active! (&#8377;{discount} discount applied)
            </p>
          )}
        </div>

        {/* Pricing details */}
        <div className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
          <h3 className="font-bold text-sm uppercase text-gray-400 border-b border-gray-100 dark:border-zinc-800 pb-3">
            Price Details
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between font-semibold text-zinc-600 dark:text-zinc-400">
              <span>Price ({cartItems.length} items)</span>
              <span>&#8377;{itemsPrice}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between font-semibold text-green-600">
                <span>Coupon Discount</span>
                <span>-&#8377;{discount}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-zinc-600 dark:text-zinc-400">
              <span>Tax (GST 18%)</span>
              <span>&#8377;{taxPrice}</span>
            </div>
            <div className="flex justify-between font-semibold text-zinc-600 dark:text-zinc-400">
              <span>Delivery Charges</span>
              {shippingPrice > 0 ? (
                <span>&#8377;{shippingPrice}</span>
              ) : (
                <span className="text-green-600">Free Delivery</span>
              )}
            </div>

            <div className="flex justify-between font-extrabold text-base border-t border-gray-100 pt-4 dark:border-zinc-800 text-zinc-900 dark:text-white">
              <span>Total Amount</span>
              <span>&#8377;{totalPrice}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-3 bg-secondary text-white font-bold rounded-sm text-sm uppercase shadow flex items-center justify-center gap-1.5 hover:bg-yellow-500 transition"
          >
            Place Order <ArrowRight size={16} />
          </button>
        </div>

      </div>

    </div>
  );
};

export default Cart;
