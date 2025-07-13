import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, Package, CreditCard, MapPin } from 'lucide-react';
import type { Order, OrderItem } from '../../types';

interface OrderSystemProps {
  cartItems: OrderItem[];
  onUpdateCart: (items: OrderItem[]) => void;
  onPlaceOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
}

export default function OrderSystem({ cartItems, onUpdateCart, onPlaceOrder }: OrderSystemProps) {
  const [selectedVendor, setSelectedVendor] = useState<'amazon' | 'walmart' | 'local'>('amazon');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    const updatedItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    onUpdateCart(updatedItems);
  };

  const removeItem = (itemId: string) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    onUpdateCart(updatedItems);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0 || !deliveryAddress.trim()) return;

    const order: Omit<Order, 'id' | 'createdAt'> = {
      userId: 'user-1', // In real app, this would come from auth
      items: cartItems,
      total: getTotalPrice(),
      status: 'pending',
      vendor: selectedVendor
    };

    onPlaceOrder(order);
    onUpdateCart([]); // Clear cart after order
  };

  const vendors = [
    {
      id: 'amazon' as const,
      name: 'Amazon Fresh',
      logo: '📦',
      deliveryTime: '2-4 hours',
      deliveryFee: 5.99
    },
    {
      id: 'walmart' as const,
      name: 'Walmart Grocery',
      logo: '🛒',
      deliveryTime: '1-3 hours',
      deliveryFee: 3.95
    },
    {
      id: 'local' as const,
      name: 'Local Stores',
      logo: '🏪',
      deliveryTime: '30-60 min',
      deliveryFee: 2.99
    }
  ];

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Cart is Empty</h3>
          <p className="text-gray-600">Add items from your diet plan to get started with ordering.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.type === 'supplement' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.type}
                      </span>
                      <span className="text-sm text-gray-500">${item.price.toFixed(2)} each</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h3>

            {/* Vendor Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Vendor
              </label>
              <div className="space-y-3">
                {vendors.map((vendor) => (
                  <label key={vendor.id} className="flex items-center">
                    <input
                      type="radio"
                      name="vendor"
                      value={vendor.id}
                      checked={selectedVendor === vendor.id}
                      onChange={(e) => setSelectedVendor(e.target.value as any)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{vendor.logo}</span>
                          <span className="font-medium text-gray-900">{vendor.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">${vendor.deliveryFee}</span>
                      </div>
                      <div className="text-sm text-gray-500">{vendor.deliveryTime}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Delivery Address
              </label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                rows={3}
                placeholder="Enter your delivery address..."
              />
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <CreditCard className="w-4 h-4 inline mr-1" />
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              >
                <option value="card">Credit/Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="apple-pay">Apple Pay</option>
                <option value="google-pay">Google Pay</option>
              </select>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">
                  ${vendors.find(v => v.id === selectedVendor)?.deliveryFee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${(getTotalPrice() * 0.08).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-semibold mb-6">
              <span>Total</span>
              <span className="text-emerald-600">
                ${(getTotalPrice() + (vendors.find(v => v.id === selectedVendor)?.deliveryFee || 0) + (getTotalPrice() * 0.08)).toFixed(2)}
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={!deliveryAddress.trim()}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
                deliveryAddress.trim()
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Package className="w-5 h-5 mr-2" />
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}