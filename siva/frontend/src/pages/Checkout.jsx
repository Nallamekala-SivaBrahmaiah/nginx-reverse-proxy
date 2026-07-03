import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCartLocal } from '../redux/cartSlice.js';
import API from '../services/api.js';
import Modal from '../components/Modal.jsx';
import { Plus, Check, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const { items: cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  // States
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);

  // New Address Form
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressName, setAddressName] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressPincode, setAddressPincode] = useState('');
  const [addressType, setAddressType] = useState('Home');

  const couponCode = location.state?.couponCode || null;
  const discount = location.state?.discount || 0;

  const fetchAddresses = async () => {
    try {
      const res = await API.get('/addresses');
      setAddresses(res.data.addresses);
      // Select default address if present
      const def = res.data.addresses.find((a) => a.isDefault);
      if (def) setSelectedAddressId(def._id);
      else if (res.data.addresses.length > 0) setSelectedAddressId(res.data.addresses[0]._id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!addressName || !addressPhone || !addressLine || !addressCity || !addressState || !addressPincode) {
      return toast.error('Please enter all fields');
    }

    try {
      const res = await API.post('/addresses', {
        name: addressName,
        phone: addressPhone,
        addressLine,
        city: addressCity,
        state: addressState,
        pincode: addressPincode,
        addressType,
        isDefault: addresses.length === 0,
      });

      toast.success('Address saved successfully!');
      setShowAddressModal(false);
      
      // Clear inputs
      setAddressName('');
      setAddressPhone('');
      setAddressLine('');
      setAddressCity('');
      setAddressState('');
      setAddressPincode('');

      fetchAddresses();
    } catch (err) {
      toast.error('Could not save address');
    }
  };

  // Pricing calculations
  const itemsPrice = cartItems.reduce((acc, curr) => acc + (curr.product?.variants.find(v => v._id === curr.variantId)?.offerPrice || 0) * curr.quantity, 0);
  const taxPrice = Number((itemsPrice * 0.18).toFixed(2));
  const shippingPrice = itemsPrice < 500 ? 40 : 0;
  const totalPrice = Number((itemsPrice + taxPrice + shippingPrice - discount).toFixed(2));

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      return toast.error('Please select a delivery address');
    }

    const shippingAddress = addresses.find((a) => a._id === selectedAddressId);
    if (!shippingAddress) return;

    setLoading(true);
    try {
      const orderPayload = {
        cartItems: cartItems.map((item) => ({
          product: item.product._id,
          variantId: item.variantId,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
        })),
        shippingAddress: {
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          addressLine: shippingAddress.addressLine,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
          addressType: shippingAddress.addressType,
        },
        couponCode,
        paymentMethod,
      };

      const res = await API.post('/orders', orderPayload);
      const { order, gatewayPayload } = res.data;

      // Handle Mock Transaction validations
      const transactionId = gatewayPayload.transactionId || gatewayPayload.razorpayOrderId || `cod_${Math.random().toString(36).substr(2, 9)}`;
      
      // Confirm payment update on server
      await API.post('/orders/confirm-payment', {
        orderId: order._id,
        transactionId,
        status: paymentMethod === 'COD' ? 'Pending' : 'succeeded',
      });

      // Clear local cart
      await API.delete('/cart'); // Clear cart on backend
      dispatch(clearCartLocal());

      toast.success('Order placed successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* Checkout Steps */}
      <div className="flex-1 space-y-6">
        
        {/* Step 1: Address Selection */}
        <div className="bg-white rounded-sm border border-gray-100 p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-850 pb-3">
            <h3 className="font-bold text-base flex items-center gap-2 dark:text-white">
              <MapPin size={18} className="text-primary-500" /> Delivery Address
            </h3>
            <button
              onClick={() => setShowAddressModal(true)}
              className="text-xs font-bold text-primary-500 border border-gray-200 dark:border-zinc-700 px-3 py-1.5 rounded-sm flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              <Plus size={14} /> Add Address
            </button>
          </div>

          {addresses.length === 0 ? (
            <p className="text-xs text-gray-500 font-semibold py-4">No saved addresses found. Please add one to continue checkout.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  onClick={() => setSelectedAddressId(addr._id)}
                  className={`border p-4 rounded-sm cursor-pointer transition relative flex flex-col justify-between ${
                    selectedAddressId === addr._id
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-zinc-850'
                      : 'border-gray-200 dark:border-zinc-800'
                  }`}
                >
                  {selectedAddressId === addr._id && (
                    <span className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-0.5">
                      <Check size={10} />
                    </span>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white">{addr.name}</span>
                      <span className="bg-gray-100 text-zinc-600 dark:bg-zinc-750 dark:text-zinc-400 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                        {addr.addressType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 leading-5">
                      {addr.addressLine}, {addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold">Phone: {addr.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Payment Choices */}
        <div className="bg-white rounded-sm border border-gray-100 p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
          <h3 className="font-bold text-base border-b border-gray-105 pb-3 dark:border-zinc-850 flex items-center gap-2 dark:text-white">
            <CreditCard size={18} className="text-primary-500" /> Payment Options
          </h3>

          <div className="space-y-3">
            {[
              { id: 'COD', name: 'Cash On Delivery (COD)', desc: 'Pay with cash upon order arrival.' },
              { id: 'Stripe', name: 'Stripe Payment Gateway', desc: 'Secure card-based sandbox processor.' },
              { id: 'Razorpay', name: 'Razorpay Instant Checkout', desc: 'UPI, Wallet and bank checkout portal.' },
            ].map((method) => (
              <label
                key={method.id}
                className={`border p-4 rounded-sm flex items-start gap-3 cursor-pointer transition ${
                  paymentMethod === method.id
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-zinc-850'
                    : 'border-gray-200 dark:border-zinc-800'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                  className="text-primary-500 focus:ring-primary-500 border-gray-300 mt-0.5"
                />
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{method.name}</p>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">{method.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* Right Column: Summary */}
      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
          <h3 className="font-bold text-sm uppercase text-gray-400 border-b border-gray-100 pb-3 dark:border-zinc-800">
            Order Summary
          </h3>

          <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
            {cartItems.map((item) => (
              <div key={item.variantId} className="flex justify-between items-center text-xs">
                <span className="truncate w-3/4 text-zinc-700 dark:text-zinc-300 font-semibold">
                  {item.product?.title} (x{item.quantity})
                </span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  &#8377;{(item.product?.variants?.find(v => v._id === item.variantId)?.offerPrice || 0) * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2 text-xs font-semibold dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Items Total</span>
              <span>&#8377;{itemsPrice}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-&#8377;{discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (GST 18%)</span>
              <span>&#8377;{taxPrice}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Charges</span>
              {shippingPrice > 0 ? (
                <span>&#8377;{shippingPrice}</span>
              ) : (
                <span className="text-green-600">Free</span>
              )}
            </div>
            <div className="flex justify-between text-zinc-900 dark:text-white font-extrabold text-sm border-t border-gray-100 pt-3 dark:border-zinc-800">
              <span>Amount Payable</span>
              <span>&#8377;{totalPrice}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full py-3 bg-secondary text-white font-bold rounded-sm text-sm uppercase shadow hover:bg-yellow-500 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm Order'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-gray-400 text-[10px] font-bold uppercase">
          <ShieldCheck size={16} /> <span>100% Secure Transaction Guarantee</span>
        </div>
      </div>

      {/* Address Form Modal */}
      <Modal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} title="Create New Address">
        <form onSubmit={handleCreateAddress} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Contact Name</label>
            <input
              type="text"
              required
              value={addressName}
              onChange={(e) => setAddressName(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-sm focus:outline-none dark:border-zinc-800 bg-transparent"
              placeholder="E.g., John Doe"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Contact Phone</label>
            <input
              type="tel"
              required
              value={addressPhone}
              onChange={(e) => setAddressPhone(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-sm focus:outline-none dark:border-zinc-800 bg-transparent"
              placeholder="10-digit number"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Address Details (Street/Building)</label>
            <input
              type="text"
              required
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-sm focus:outline-none dark:border-zinc-800 bg-transparent"
              placeholder="Flat, House no., Building, Company"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">City</label>
              <input
                type="text"
                required
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-sm focus:outline-none dark:border-zinc-800 bg-transparent"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">State</label>
              <input
                type="text"
                required
                value={addressState}
                onChange={(e) => setAddressState(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-sm focus:outline-none dark:border-zinc-800 bg-transparent"
                placeholder="State"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Pincode</label>
            <input
              type="text"
              required
              value={addressPincode}
              onChange={(e) => setAddressPincode(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-sm focus:outline-none dark:border-zinc-800 bg-transparent"
              placeholder="6-digit ZIP code"
            />
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-500 mb-1">Address Type</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="addrtype"
                  value="Home"
                  checked={addressType === 'Home'}
                  onChange={() => setAddressType('Home')}
                />
                Home (All day delivery)
              </label>
              <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="addrtype"
                  value="Work"
                  checked={addressType === 'Work'}
                  onChange={() => setAddressType('Work')}
                />
                Work (10 AM - 5 PM)
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-primary-500 text-white font-bold rounded-sm text-sm hover:bg-primary-600 transition shadow"
          >
            Save Address
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default Checkout;
