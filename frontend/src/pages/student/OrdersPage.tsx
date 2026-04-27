
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 font-semibold text-slate-800">Available Meals</div>
            <div className="space-y-3">
              {loadingMeals ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading meals...
                </div>
              ) : meals.length === 0 ? (
                <div className="text-sm text-slate-500">No meals found for your filter.</div>
              ) : (
                meals.map((meal) => (
                  <div key={meal.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{meal.name}</p>
                      <p className="text-sm text-slate-500">
                        {meal.category} Â· ${meal.price.toFixed(2)} Â· Stock: {meal.quantity}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(meal)}
                      disabled={!meal.isAvailable || meal.quantity <= 0}
                      className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {!meal.isAvailable || meal.quantity <= 0 ? 'Out of Stock' : 'Add'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">Cart</div>
            <div className="space-y-3 p-4">
              {cart.length === 0 ? (
                <div className="text-sm text-slate-500">Your cart is empty.</div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-100 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-slate-500">${(item.price * item.quantity).toFixed(2)}</p>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateQuantity(item.id, -1)} className="rounded bg-slate-100 p-1 hover:bg-slate-200">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, 1)} className="rounded bg-slate-100 p-1 hover:bg-slate-200">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <p className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                </p>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Cash">Cash</option>
                  <option value="PayPal">PayPal</option>
                  <option value="QRCode">QRCode</option>
                </select>
                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={placingOrder}
                  className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {placingOrder ? 'Placing order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">My Orders</div>
            <div className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setStatusFilter('All')}
                  className={`rounded-lg px-2 py-1.5 font-semibold transition ${
                    statusFilter === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({orderCounts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('Pending')}
                  className={`rounded-lg px-2 py-1.5 font-semibold transition ${
                    statusFilter === 'Pending' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Pending ({orderCounts.pending})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('Completed')}
                  className={`rounded-lg px-2 py-1.5 font-semibold transition ${
                    statusFilter === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Completed ({orderCounts.completed})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('Cancelled')}
                  className={`rounded-lg px-2 py-1.5 font-semibold transition ${
                    statusFilter === 'Cancelled' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Cancelled ({orderCounts.cancelled})
                </button>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <ShoppingBag className="h-4 w-4" />
                  No orders available.
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={getOrderId(order)} className="rounded-xl border border-slate-100 px-3 py-3">
                    <p className="text-sm font-semibold text-slate-900">Order #{order.orderNumber || getOrderId(order)}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {new Date(order.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={`rounded-full px-2 py-1 font-medium ${getStatusClass(getOrderCategory(order))}`}>
                        {getOrderCategory(order)}
                      </span>
                      <span className="font-semibold text-slate-700">${Number(order.totalAmount || 0).toFixed(2)}</span>
                    </div>

                    {getOrderCategory(order) === 'Pending' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const orderId = getOrderId(order)
                          if (!orderId) return
                          navigate(`/payments?orderId=${orderId}&method=${order.paymentMethod || 'PayPal'}`)
                        }}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
                      >
                        <Clock3 className="h-3.5 w-3.5" />
                        Proceed to Payment
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}

export default OrdersPage

