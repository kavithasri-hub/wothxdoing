import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createFirestoreOrder } from '../services/orderService';
import { formatINR } from '../utils/currency';
import { getMaterialImageUrl, getCategoryPlaceholderSvg } from '../utils/materialImages';
import { Order } from '../types';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Truck,
  MapPin,
  Building2,
  Phone,
  User,
  ArrowRight,
  Package,
  Clock,
  Sparkles,
  CreditCard,
  Check,
} from 'lucide-react';

interface CheckoutModalProps {
  onOrderSuccess: (order: Order) => void;
  onNavigateToOrders: () => void;
  onOpenLogin: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  onOrderSuccess,
  onNavigateToOrders,
  onOpenLogin,
}) => {
  const { isCheckoutOpen, setIsCheckoutOpen, checkoutItems, clearCart } = useCart();
  const { user, profile } = useAuth();

  // Form State
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState(profile?.location?.split(',')[0]?.trim() || 'Chennai');
  const [stateName, setStateName] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('600001');
  const [contactName, setContactName] = useState(profile?.fullName || '');
  const [contactPhone, setContactPhone] = useState(profile?.phone || '+91 98765 43210');
  const [companyName, setCompanyName] = useState(profile?.companyName || '');
  const [notes, setNotes] = useState('');

  // Process State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isCheckoutOpen) return null;

  const items = checkoutItems.length > 0 ? checkoutItems : [];
  const primaryItem = items[0];

  const totalAmount = items.reduce((sum, item) => sum + item.totalINR, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const primaryUnit = primaryItem?.listing.unit || 'kg';

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setIsCheckoutOpen(false);
      onOpenLogin();
      return;
    }

    if (items.length === 0) {
      setErrorMessage('No items in checkout.');
      return;
    }

    // Validate quantity for every checkout item before placing order
    for (const item of items) {
      const avail = parseFloat(item.listing.quantity.replace(/,/g, '')) || 1000;
      if (item.quantity < 1) {
        setErrorMessage('Minimum purchase quantity is 1 kg.');
        return;
      }
      if (item.quantity > avail) {
        setErrorMessage(`Only ${item.listing.quantity} ${item.listing.unit || 'kg'} is currently available.`);
        return;
      }
    }

    if (!streetAddress.trim() || !city.trim() || !contactName.trim() || !contactPhone.trim()) {
      setErrorMessage('Please provide complete delivery and contact information.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const fullDeliveryLocation = `${streetAddress.trim()}, ${city.trim()}, ${stateName.trim()} - ${pincode.trim()}`;
      
      const newOrder = await createFirestoreOrder({
        listingId: primaryItem?.listing.id,
        buyerId: user.uid,
        buyerName: contactName.trim() || profile?.fullName || user.email?.split('@')[0] || 'Buyer',
        buyerEmail: user.email || undefined,
        buyerPhone: contactPhone.trim(),
        sellerId: primaryItem?.listing.sellerId || 'verified-producer',
        sellerName: primaryItem?.listing.sellerName || 'Verified Producer',
        materialName: items.length === 1 ? primaryItem.listing.materialName : `${primaryItem.listing.materialName} + ${items.length - 1} more items`,
        category: primaryItem?.listing.category || 'Agro & Organic',
        quantity: totalQuantity,
        unit: primaryUnit,
        pricePerUnit: primaryItem?.listing.price || `₹${primaryItem.unitPriceNum}/${primaryUnit}`,
        pricePerUnitNumber: primaryItem?.unitPriceNum || 0,
        totalAmountINR: totalAmount,
        status: 'Order Placed',
        deliveryLocation: fullDeliveryLocation,
        shippingAddress: {
          street: streetAddress.trim(),
          city: city.trim(),
          state: stateName.trim(),
          pincode: pincode.trim(),
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          notes: notes.trim() || undefined,
        },
        notes: notes.trim(),
        items: items.map((i) => ({
          listingId: i.listing.id,
          materialName: i.listing.materialName,
          category: i.listing.category,
          quantity: i.quantity,
          unit: i.listing.unit || 'kg',
          pricePerUnit: i.listing.price,
          pricePerUnitNumber: i.unitPriceNum,
          totalAmountINR: i.totalINR,
          sellerId: i.listing.sellerId || 'seller',
          sellerName: i.listing.sellerName || 'Verified Seller',
          imageUrl: i.listing.imageUrl,
        })),
        materialImage: primaryItem?.listing.imageUrl,
      });

      // Clear cart on successful order
      clearCart();
      setConfirmedOrder(newOrder);
      onOrderSuccess(newOrder);
    } catch (err: any) {
      console.error('Error placing order:', err);
      setErrorMessage('Failed to submit order. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setConfirmedOrder(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-slate-950">
                {confirmedOrder ? 'Order Confirmed' : 'B2B Procurement Checkout'}
              </h3>
              <p className="text-xs text-slate-500">
                {confirmedOrder
                  ? 'Your order has been officially placed on WORTHX'
                  : 'Review order specifications & delivery destination'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">

          {/* ================= ORDER CONFIRMATION SCREEN (Requirement 7) ================= */}
          {confirmedOrder ? (
            <div className="space-y-6 py-2">
              <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-black text-emerald-950">
                  Order Successfully Placed!
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
                  A digital procurement agreement has been dispatched to the seller. You can monitor the real-time status as the seller confirms and processes your dispatch.
                </p>
              </div>

              {/* Order Confirmation Details Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Official Order ID:
                  </span>
                  <span className="font-mono text-sm font-black text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    {confirmedOrder.orderId}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Material Product</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                      {confirmedOrder.materialName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Quantity</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {confirmedOrder.quantity} {confirmedOrder.unit}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Total Amount</span>
                    <span className="font-extrabold text-emerald-900 text-sm mt-0.5 block">
                      {formatINR(confirmedOrder.totalAmountINR)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Seller</span>
                    <span className="font-bold text-slate-900 mt-0.5 block truncate">
                      {confirmedOrder.sellerName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Buyer</span>
                    <span className="font-bold text-slate-900 mt-0.5 block truncate">
                      {confirmedOrder.buyerName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Order Status</span>
                    <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-950 bg-emerald-100/90 px-2.5 py-1 rounded-md mt-0.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      {confirmedOrder.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Digital Agreement</span>
                    <span className="font-mono text-emerald-900 font-bold block mt-0.5 truncate">
                      {confirmedOrder.agreementId || 'WX-AGR-VERIFIED'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">ChainCraft Protocol</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-800 text-[11px] mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      SHA-256 Stamped
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-700">Delivery Destination: </span>
                    {confirmedOrder.deliveryLocation}
                  </div>
                  {confirmedOrder.latestHash && (
                    <div className="font-mono text-[10px] text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Digest: #{confirmedOrder.latestHash.slice(0, 12)}...
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onNavigateToOrders();
                  }}
                  className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Package className="w-4 h-4 text-emerald-300" />
                  <span>Track Order in My Orders</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  Continue Sourcing
                </button>
              </div>
            </div>
          ) : (
            /* ================= CHECKOUT INPUT FORM ================= */
            <form onSubmit={handlePlaceOrder} className="space-y-6">

              {/* Items Summary Table */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-800" />
                  Selected Material Feedstocks ({items.length})
                </h4>

                <div className="space-y-2">
                  {items.map((item) => {
                    const listing = item.listing;
                    const displayImg = getMaterialImageUrl(listing.materialName, listing.category, listing.imageUrl);
                    const fallbackSvg = getCategoryPlaceholderSvg(listing.materialName, listing.category);

                    return (
                      <div
                        key={item.id}
                        className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={displayImg}
                            alt={listing.materialName}
                            onError={(e) => {
                              e.currentTarget.src = fallbackSvg;
                            }}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-slate-900 truncate">
                              {listing.materialName}
                            </h5>
                            <p className="text-[11px] text-slate-500 truncate">
                              Seller: {listing.sellerName || 'Verified Producer'} • {listing.location}
                            </p>
                            <span className="text-[11px] text-slate-600 font-medium">
                              Rate: {listing.price}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-800 block">
                            {item.quantity} {listing.unit || 'kg'}
                          </span>
                          <span className="font-black text-emerald-900 block text-sm">
                            {formatINR(item.totalINR)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Total Quantity:</span>
                  <span className="text-slate-900 font-extrabold">{totalQuantity} {primaryUnit}</span>
                </div>
              </div>

              {/* Delivery / Location Information Form (Requirement 6) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-800" />
                  Delivery & Logistics Destination
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">
                      Facility / Delivery Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. Plot No. 42, SIPCOT Industrial Park, Oragadam"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      City / District *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Chennai"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="e.g. Tamil Nadu"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 600001"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Company / Organization (Optional)
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. BioTex Circular Ltd"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Contact Person Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 Phone Number"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">
                      Dispatch Notes / Special Unloading Instructions
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Forklift required, batch test certificate on arrival, GST number..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* B2B Payment & Settlement Mode (Safe Mock State) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-800" />
                    <span className="text-xs font-bold text-slate-900">
                      Settlement Mode: B2B Escrow Covenant
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Safe Demo Settlement
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  No direct credit card charge is required at this stage. Orders create an official digital supply covenant recorded on the platform with settlement upon delivery verification.
                </p>
              </div>

              {/* Order Summary Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Procurement Subtotal ({totalQuantity} {primaryUnit}):</span>
                  <span className="font-bold text-slate-900">{formatINR(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Logistics & Freight:</span>
                  <span className="text-emerald-700 font-semibold">Included / Coordinated</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="font-black text-slate-900">Total Order Value:</span>
                  <span className="font-black text-emerald-950 text-xl">
                    {formatINR(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Registering Order...</span>
                  ) : (
                    <>
                      <span>Place Order • {formatINR(totalAmount)}</span>
                      <ArrowRight className="w-4 h-4 text-emerald-300" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
