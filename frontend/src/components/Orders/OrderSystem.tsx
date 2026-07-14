import { useCallback, useEffect, useMemo, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  CreditCard,
  MapPin,
  History,
  RefreshCw,
} from 'lucide-react';
import type { Order, OrderItem } from '../../types';
import { ordersAPI, getApiErrorMessage } from '../../services/api';
import StripeCheckoutForm from './StripeCheckoutForm';

interface OrderSystemProps {
  cartItems: OrderItem[];
  onUpdateCart: (items: OrderItem[]) => void;
  userId: string;
  onOrderComplete: (order: Order) => void;
}

interface PendingPayment {
  orderId: number;
  clientSecret: string;
  publishableKey: string;
  paymentIntentId: string;
  orderDraft: Omit<Order, 'id' | 'createdAt'>;
}

let stripePromiseCache: Promise<Stripe | null> | null = null;

function getStripe(publishableKey: string) {
  if (!stripePromiseCache) {
    stripePromiseCache = loadStripe(publishableKey);
  }
  return stripePromiseCache;
}

function formatDate(value: Date | string | undefined) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function statusBadgeClass(status?: string) {
  switch (status) {
    case 'paid':
    case 'processing':
    case 'delivered':
    case 'shipped':
      return 'bg-emerald-100 text-emerald-800';
    case 'failed':
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-amber-100 text-amber-800';
  }
}

export default function OrderSystem({ cartItems, onUpdateCart, userId, onOrderComplete }: OrderSystemProps) {
  const [activeTab, setActiveTab] = useState<'cart' | 'history'>('cart');
  const [selectedVendor, setSelectedVendor] = useState<'amazon' | 'walmart' | 'local'>('amazon');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [paymentMode, setPaymentMode] = useState<'demo' | 'stripe'>('demo');
  const [orders, setOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await ordersAPI.getOrders();
      setOrders(data);
    } catch (err) {
      setHistoryError(getApiErrorMessage(err, 'Failed to load order history'));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    ordersAPI
      .getPaymentConfig()
      .then((config) => setPaymentMode(config.stripeEnabled ? 'stripe' : 'demo'))
      .catch(() => setPaymentMode('demo'));
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updatedItems = cartItems.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    onUpdateCart(updatedItems);
  };

  const removeItem = (itemId: string) => {
    onUpdateCart(cartItems.filter((item) => item.id !== itemId));
  };

  const getSubtotal = () =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const getTotalItems = () =>
    cartItems.reduce((total, item) => total + item.quantity, 0);

  const vendors = [
    { id: 'amazon' as const, name: 'Amazon Fresh', logo: '📦', deliveryTime: '2-4 hours', deliveryFee: 5.99 },
    { id: 'walmart' as const, name: 'Walmart Grocery', logo: '🛒', deliveryTime: '1-3 hours', deliveryFee: 3.95 },
    { id: 'local' as const, name: 'Local Stores', logo: '🏪', deliveryTime: '30-60 min', deliveryFee: 2.99 },
  ];

  const deliveryFee = vendors.find((v) => v.id === selectedVendor)?.deliveryFee || 0;
  const taxAmount = Math.round(getSubtotal() * 0.08 * 100) / 100;
  const grandTotal = Math.round((getSubtotal() + deliveryFee + taxAmount) * 100) / 100;

  const finalizePaidOrder = async (
    orderId: number,
    paymentIntentId: string,
    orderDraft: Omit<Order, 'id' | 'createdAt'>
  ) => {
    const paid = await ordersAPI.payOrder(orderId, paymentIntentId);
    const completed: Order = {
      ...orderDraft,
      id: orderId,
      createdAt: new Date(),
      status: (paid.status as Order['status']) || 'processing',
      paymentStatus: paid.paymentStatus || 'paid',
      paymentIntentId: paid.paymentIntentId,
      paymentProvider: paid.paymentProvider,
    };
    onOrderComplete(completed);
    setOrders((prev) => [completed, ...prev.filter((o) => o.id !== orderId)]);
    onUpdateCart([]);
    setPendingPayment(null);
    setActiveTab('history');
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !deliveryAddress.trim()) return;

    const orderDraft: Omit<Order, 'id' | 'createdAt'> = {
      userId,
      items: cartItems,
      total: grandTotal,
      status: 'pending',
      vendor: selectedVendor,
      deliveryAddress: deliveryAddress.trim(),
      paymentMethod,
    };

    setIsPlacing(true);
    setError(null);
    try {
      const created = await ordersAPI.createOrder({
        items: orderDraft.items,
        total: orderDraft.total,
        vendor: orderDraft.vendor,
        deliveryAddress: orderDraft.deliveryAddress,
        paymentMethod: orderDraft.paymentMethod,
      });

      if (created.payment.provider === 'demo' || !created.payment.client_secret || !created.payment.publishable_key) {
        await finalizePaidOrder(created.order_id, created.payment.payment_intent_id, orderDraft);
      } else {
        setPendingPayment({
          orderId: created.order_id,
          clientSecret: created.payment.client_secret,
          publishableKey: created.payment.publishable_key,
          paymentIntentId: created.payment.payment_intent_id,
          orderDraft,
        });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to place order'));
    } finally {
      setIsPlacing(false);
    }
  };

  const stripeOptions = useMemo(() => {
    if (!pendingPayment) return undefined;
    return {
      clientSecret: pendingPayment.clientSecret,
      appearance: { theme: 'stripe' as const },
    };
  }, [pendingPayment]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setActiveTab('cart')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'cart' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Cart
            {getTotalItems() > 0 && (
              <span className="bg-emerald-500 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                {getTotalItems()}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'history' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Past orders</h2>
            <button
              type="button"
              onClick={loadHistory}
              className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
            >
              <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {historyLoading && <p className="text-gray-500 text-sm">Loading orders...</p>}
          {historyError && <p className="text-sm text-red-600 mb-3">{historyError}</p>}

          {!historyLoading && orders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No orders yet. Checkout from your cart to see them here.</p>
            </div>
          )}

          <div className="space-y-4">
            {orders.map((order) => (
              <div key={String(order.id)} className="border border-gray-200 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.id}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(order.status)}`}>
                      {order.status || 'pending'}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(order.paymentStatus)}`}
                    >
                      {order.paymentStatus || 'unpaid'}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <p>
                    Vendor: <span className="font-medium text-gray-800 capitalize">{order.vendor}</span>
                  </p>
                  {order.deliveryAddress && <p>Ship to: {order.deliveryAddress}</p>}
                  <p>
                    Total:{' '}
                    <span className="font-semibold text-emerald-600">${Number(order.total || 0).toFixed(2)}</span>
                  </p>
                </div>
                <ul className="text-sm text-gray-700 space-y-1 border-t border-gray-100 pt-3">
                  {(order.items || []).map((item) => (
                    <li key={item.id} className="flex justify-between gap-4">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : cartItems.length === 0 && !pendingPayment ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Cart is Empty</h3>
          <p className="text-gray-600 mb-4">Add items from your diet plan to get started with ordering.</p>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className="text-emerald-600 font-medium hover:underline"
          >
            View order history
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
                <span className="text-sm text-gray-500">{getTotalItems()} items</span>
              </div>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === 'supplement' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="text-sm text-gray-500">${item.price.toFixed(2)} each</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-md hover:bg-gray-100">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-md hover:bg-gray-100">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                      <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 mt-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Delivery Options
              </h3>
              <div className="space-y-3">
                {vendors.map((vendor) => (
                  <label
                    key={vendor.id}
                    className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${
                      selectedVendor === vendor.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="vendor"
                      value={vendor.id}
                      checked={selectedVendor === vendor.id}
                      onChange={() => setSelectedVendor(vendor.id)}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-3">{vendor.logo}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{vendor.name}</div>
                      <div className="text-sm text-gray-500">{vendor.deliveryTime}</div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">${vendor.deliveryFee.toFixed(2)}</div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Delivery Address
              </h3>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter your delivery address..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={3}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment
              </h3>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 mb-4"
              >
                <option value="card">Credit/Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="apple-pay">Apple Pay</option>
              </select>

              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-semibold mb-6">
                <span>Total</span>
                <span className="text-emerald-600">${grandTotal.toFixed(2)}</span>
              </div>

              {pendingPayment && stripeOptions ? (
                <Elements stripe={getStripe(pendingPayment.publishableKey)} options={stripeOptions}>
                  <StripeCheckoutForm
                    onCancel={() => setPendingPayment(null)}
                    onSuccess={async () => {
                      try {
                        await finalizePaidOrder(
                          pendingPayment.orderId,
                          pendingPayment.paymentIntentId,
                          pendingPayment.orderDraft
                        );
                      } catch (err) {
                        setError(getApiErrorMessage(err, 'Payment succeeded but order confirmation failed'));
                      }
                    }}
                  />
                </Elements>
              ) : (
                <>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={!deliveryAddress.trim() || isPlacing}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
                      deliveryAddress.trim() && !isPlacing
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Package className="w-5 h-5 mr-2" />
                    {isPlacing ? 'Creating order...' : paymentMode === 'stripe' ? 'Continue to Stripe' : 'Place Order & Pay'}
                  </button>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    {paymentMode === 'stripe'
                      ? 'Secure card payment powered by Stripe Elements. Webhooks finalize payment if the browser disconnects.'
                      : 'Demo payments confirm instantly. Set Stripe keys for live Elements checkout.'}
                  </p>
                </>
              )}
              {error && <p className="text-sm text-red-600 mt-3 text-center">{error}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
