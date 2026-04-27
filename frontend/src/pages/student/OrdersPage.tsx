import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../../api/order.api";
import { getMeals } from "../../api/meals.api";

const FALLBACK_MENU = [
  { id: "meal-1", name: "Rice & Curry", description: "Fresh plate with spicy curry and vegetables.", price: 350, emoji: "🍛" },
  { id: "meal-2", name: "Chicken Kottu", description: "Hot shredded roti mixed with veggies and chicken.", price: 450, emoji: "🥘" },
  { id: "meal-3", name: "Egg Hopper Set", description: "Crispy hopper with egg, sambol and lentil curry.", price: 300, emoji: "🍳" },
  { id: "meal-4", name: "Fruit Smoothie", description: "Seasonal fruit shake to refresh your day.", price: 320, emoji: "🥤" },
];

const CATEGORY_EMOJI = {
  breakfast: "🍳",
  lunch: "🍛",
  dinner: "🍽️",
  snack: "🥪",
  beverage: "🥤",
};

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700", Pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700", Processing: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  ready: "bg-emerald-100 text-emerald-700", Ready: "bg-emerald-100 text-emerald-700",
  delivered: "bg-emerald-200 text-emerald-900", Completed: "bg-emerald-200 text-emerald-900",
  cancelled: "bg-red-100 text-red-700", Cancelled: "bg-red-100 text-red-700",
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState(FALLBACK_MENU);
  const [menuLoading, setMenuLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [cart, setCart] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [editingOrderId, setEditingOrderId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewOrder, setViewOrder] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [activeTab, setActiveTab] = useState("menu");
  const navigate = useNavigate();

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  useEffect(() => {
    fetchOrders();
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setMenuLoading(true);
    try {
      const res = await getMeals({ availability: "available" });
      const rows = res?.data?.data?.meals ?? [];
      const mapped = rows
        .filter((meal) => meal?.isAvailable !== false && Number(meal?.quantity ?? 0) > 0)
        .map((meal) => ({
          id: meal.id,
          name: meal.name,
          description: meal.description || "Fresh meal prepared by admin.",
          price: Number(meal.discountedPrice ?? meal.price ?? 0),
          emoji: CATEGORY_EMOJI[meal.category] || "🍽️",
        }));

      setMenuItems(mapped.length ? mapped : FALLBACK_MENU);
    } catch {
      setMenuItems(FALLBACK_MENU);
    } finally {
      setMenuLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getMyOrders();
      const data = res.data?.data ?? res.data ?? [];
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id);
      if (exists) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id, qty) => setCart(prev => qty <= 0 ? prev.filter(c => c.id !== id) : prev.map(c => c.id === id ? { ...c, quantity: qty } : c));
  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.id !== id));

  const resetOrderForm = () => {
    setCart([]);
    setDeliveryAddress("");
    setSpecialInstructions("");
    setPaymentMethod("cash");
    setEditingOrderId("");
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) { setError("Please add at least one item"); return; }
    if (!deliveryAddress.trim()) { setError("Please enter delivery address"); return; }
    setCreating(true); setError("");
    try {
      const payload = {
        items: cart.map(({ name, price, quantity }) => ({ name, price, quantity })),
        deliveryAddress,
        specialInstructions,
        paymentMethod,
      };

      if (editingOrderId) {
        await orderApi.updateOrder(editingOrderId, payload);
        setSuccess("Order updated successfully!");
      } else {
        await orderApi.createOrder(payload);
        setSuccess("Order placed successfully!");
      }

      resetOrderForm();
      setActiveTab("history");
      fetchOrders();
    } catch (e) {
      setError(e?.response?.data?.message || (editingOrderId ? "Failed to update order" : "Failed to place order"));
    } finally { setCreating(false); }
  };

  const handleEdit = (order) => {
    if (order.status !== "Pending" || order.paymentStatus !== "Pending") {
      setError("Only pending orders can be edited");
      return;
    }

    const editCart = (order.items || []).map((item, index) => ({
      id: `edit-${order._id}-${index}`,
      name: item.name,
      price: Number(item.price || 0),
      quantity: Math.max(1, Number(item.quantity || 1)),
      description: "",
      emoji: "🍽️",
    }));

    setCart(editCart);
    setDeliveryAddress(order.deliveryAddress || "");
    setSpecialInstructions(order.specialInstructions || "");
    setPaymentMethod(order.paymentMethod || "cash");
    setEditingOrderId(order._id);
    setViewOrder(null);
    setActiveTab("menu");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirm = async (orderId) => {
    setConfirming(orderId);
    try {
      const res = await orderApi.confirmOrder(orderId);
      const orderData = res.data?.data ?? res.data;
      setSuccess("Order confirmed. You can now proceed to payment.");
      fetchOrders();
      if (orderData?._id) {
        const preferredMethod = orderData?.paymentMethod === "QRCode" ? "QRCode" : "PayPal";
        navigate(`/payments?orderId=${orderData._id}&amount=${orderData.totalAmount}&method=${preferredMethod}`);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to confirm order");
    } finally {
      setConfirming(null);
    }
  };

  const handleViewQR = async (orderId) => {
    try {
      const res = await orderApi.getQRCode(orderId);
      const d = res.data?.data ?? res.data;
      if (d?.qrCode) setQrCode({ qrCode: d.qrCode, orderNumber: d.orderNumber ?? "" });
      else setError("QR code not available");
    } catch {
      setError("Failed to load QR code");
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(orderId);
    try {
      await orderApi.cancelOrder(orderId);
      setSuccess("Order cancelled successfully");
      setViewOrder(null);
      fetchOrders();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(null);
    }
  };

  const activeOrders = orders.filter(o => o.status !== "cancelled" && o.status !== "Cancelled");
  const totalSpent = orders.filter(o => o.status !== "cancelled" && o.status !== "Cancelled").reduce((s, o) => s + o.totalAmount, 0);
  const thisMonthSpent = orders.filter(o => o.status !== "cancelled" && o.status !== "Cancelled" && new Date(o.createdAt).getMonth() === new Date().getMonth()).reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-orange-900 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/20 blur-2xl" />
        <div className="absolute -bottom-10 left-20 h-32 w-32 rounded-full bg-orange-400/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-300">Food Orders</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Order Booking</h1>
            <p className="mt-1 text-sm text-slate-300">Browse meals, build your cart, and pay securely.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab("menu")} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "menu" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-white/10 text-white hover:bg-white/20"}`}>
              Menu {cartCount > 0 && <span className="ml-1 bg-white text-orange-600 rounded-full px-2 py-0.5 text-xs font-black">{cartCount}</span>}
            </button>
            <button onClick={() => setActiveTab("history")} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "history" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-white/10 text-white hover:bg-white/20"}`}>
              My Orders
            </button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between items-center">{error}<button onClick={() => setError("")} className="font-bold ml-4">x</button></div>}
      {success && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex justify-between items-center">{success}<button onClick={() => setSuccess("")} className="font-bold ml-4">x</button></div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: orders.length, icon: "📦", color: "bg-blue-50 border-blue-100" },
          { label: "Active Orders", value: activeOrders.length, icon: "⏳", color: "bg-amber-50 border-amber-100" },
          { label: "Total Spent", value: `Rs. ${totalSpent.toFixed(2)}`, icon: "💰", color: "bg-emerald-50 border-emerald-100" },
          { label: "This Month", value: `Rs. ${thisMonthSpent.toFixed(2)}`, icon: "📅", color: "bg-purple-50 border-purple-100" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border ${s.color} p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{s.icon}</span>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
            </div>
            <p className="text-xl font-black text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {activeTab === "menu" && (
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-900">Available Menu</h2>
            </div>
            <div className="p-4 grid gap-3">
              {menuLoading ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Loading menu...
                </div>
              ) : menuItems.length === 0 ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No meals available right now.
                </div>
              ) : menuItems.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <div key={item.id} className="rounded-xl border border-slate-100 p-4 flex items-center justify-between gap-4 hover:border-orange-300 hover:bg-orange-50/30 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{item.emoji}</span>
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                        <p className="text-sm font-black text-orange-600 mt-1">Rs. {item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, inCart.quantity - 1)} className="w-8 h-8 rounded-full bg-slate-100 font-bold flex items-center justify-center hover:bg-slate-200">-</button>
                        <span className="w-8 text-center font-black text-slate-900">{inCart.quantity}</span>
                        <button onClick={() => updateQty(item.id, inCart.quantity + 1)} className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center hover:bg-orange-600">+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition">Add</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-slate-900">Your Cart</h2>
                  <p className="text-xs text-slate-500">{cartCount} item{cartCount !== 1 ? "s" : ""}</p>
                </div>
                {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-600 font-semibold">Clear all</button>}
              </div>
              <div className="p-4">
                {cart.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-4xl mb-2">🛒</p>
                    <p className="text-sm text-slate-400">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-xs text-slate-500">Rs. {item.price.toFixed(2)} x {item.quantity} = <span className="font-bold text-orange-600">Rs. {(item.price * item.quantity).toFixed(2)}</span></p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-white border border-slate-200 text-sm flex items-center justify-center">-</button>
                          <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center">+</button>
                          <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-full bg-red-50 text-red-400 text-sm flex items-center justify-center ml-1">x</button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                      <span className="font-bold text-slate-700">Total</span>
                      <span className="text-xl font-black text-orange-600">Rs. {cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-slate-900">{editingOrderId ? "Edit Order" : "Order Details"}</h2>
                {editingOrderId && (
                  <button onClick={resetOrderForm} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200">
                    Cancel Edit
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Delivery Address *</label>
                <input type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="e.g. Room 204, Block A" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Special Instructions</label>
                <textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} rows={2} placeholder="Any special requests..." className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="PayPal">PayPal</option>
                  <option value="QRCode">QR Code</option>
                </select>
              </div>
              <button onClick={handleCreateOrder} disabled={creating || cart.length === 0} className="w-full py-3.5 rounded-xl bg-linear-to-r from-orange-500 to-orange-600 text-white font-black text-sm hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition shadow-lg shadow-orange-200">
                {creating ? (editingOrderId ? "Saving Changes..." : "Placing Order...") : (editingOrderId ? `Save Changes - Rs. ${cartTotal.toFixed(2)}` : `Place Order - Rs. ${cartTotal.toFixed(2)}`)}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-900">Order History</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : activeOrders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-slate-500 font-semibold">No orders yet</p>
              <button onClick={() => setActiveTab("menu")} className="mt-4 px-5 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600">Browse Menu</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                  <tr>{["Order #", "Date", "Items", "Total", "Status", "Payment", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left font-bold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeOrders.map(order => (
                    <tr key={order._id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600">{order.orderNumber ?? order._id.slice(-8)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="px-4 py-3 font-semibold">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</td>
                      <td className="px-4 py-3 font-black text-orange-600">Rs. {order.totalAmount.toFixed(2)}</td>
                      <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600"}`}>{order.status}</span></td>
                      <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{order.paymentStatus}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={() => setViewOrder(order)} className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold">View</button>
                          <button onClick={() => handleViewQR(order._id)} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold">QR</button>
                          {order.status === "Pending" && order.paymentStatus === "Pending" && (
                            <button onClick={() => handleEdit(order)} className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold">Edit</button>
                          )}
                          {order.status === "Pending" && order.paymentStatus === "Pending" && (
                            <button onClick={() => handleConfirm(order._id)} disabled={confirming === order._id} className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold disabled:opacity-50">
                              {confirming === order._id ? "Confirming..." : "Confirm Order"}
                            </button>
                          )}
                          {order.status === "Processing" && order.paymentStatus !== "Paid" && (
                            <button onClick={() => navigate(`/payments?orderId=${order._id}&amount=${order.totalAmount}&method=${order.paymentMethod === "QRCode" ? "QRCode" : "PayPal"}`)} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold">Pay Now</button>
                          )}
                          {order.status === "Pending" && (
                            <button onClick={() => handleCancel(order._id)} disabled={cancelling === order._id} className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold disabled:opacity-50">
                              {cancelling === order._id ? "..." : "Cancel"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-black">Order Details</h2>
              <button onClick={() => setViewOrder(null)} className="text-slate-400 text-xl">x</button>
            </div>
            <div className="px-6 py-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold">Order #</p><p className="font-mono font-black mt-0.5">{viewOrder.orderNumber ?? viewOrder._id.slice(-8)}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold">Date</p><p className="font-semibold mt-0.5">{new Date(viewOrder.createdAt).toLocaleDateString()}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold">Status</p><span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[viewOrder.status]}`}>{viewOrder.status}</span></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold">Payment</p><p className="font-semibold mt-0.5">{viewOrder.paymentStatus}</p></div>
                {viewOrder.deliveryAddress && <div className="col-span-2 rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold">Delivery Address</p><p className="font-semibold mt-0.5">{viewOrder.deliveryAddress}</p></div>}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Items</p>
                <div className="space-y-2">
                  {viewOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="font-semibold text-slate-700">{item.quantity}x {item.name}</span>
                      <span className="font-black text-orange-600">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between font-black text-base pt-2 border-t border-slate-100">
                <span>Total</span><span className="text-orange-600">Rs. {viewOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
              {viewOrder.status === "Pending" && viewOrder.paymentStatus === "Pending" && (
                <button onClick={() => handleEdit(viewOrder)} className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-sm font-bold hover:bg-amber-100">Edit Order</button>
              )}
              {viewOrder.status === "Pending" && (
                <button onClick={() => handleCancel(viewOrder._id)} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100">Cancel Order</button>
              )}
              <button onClick={() => setViewOrder(null)} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">Close</button>
            </div>
          </div>
        </div>
      )}

      {qrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-black">Order QR Code</h2>
              <button onClick={() => setQrCode(null)} className="text-slate-400 text-xl">x</button>
            </div>
            <div className="px-6 py-6 text-center space-y-4">
              <div className="inline-block p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <img src={qrCode.qrCode} alt="QR Code" className="w-52 h-52 rounded-xl" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Order: <span className="font-mono font-black">{qrCode.orderNumber}</span></p>
              <p className="text-xs text-slate-400">Show this QR code when collecting your order</p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
              <button onClick={() => window.print()} className="px-4 py-2 text-sm rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold">Print</button>
              <button onClick={() => setQrCode(null)} className="px-4 py-2 text-sm rounded-xl bg-slate-900 text-white font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;