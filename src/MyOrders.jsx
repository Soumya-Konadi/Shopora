
import { useCallback, useEffect, useState } from 'react'
import './MyOrders.css'

const API_BASE = 'http://localhost:8080/Shopora/api'

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value.replace(' ', 'T'))

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function statusClass(status) {
  const normalized = String(status || '').toLowerCase()

  if (normalized.includes('deliver')) return 'delivered'
  if (normalized.includes('cancel')) return 'cancelled'
  if (normalized.includes('ship')) return 'shipped'
  if (normalized.includes('confirm')) return 'confirmed'
  return 'placed'
}

async function readResponse(response) {
  const text = await response.text()
  let data

  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error('The server returned an invalid response.')
  }

  if (!response.ok) {
    throw new Error(
      data.error || data.message || `Request failed (${response.status})`
    )
  }

  return data
}

export default function MyOrders({ user, onBack }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'GET',
        credentials: 'include',
      })

      const data = await readResponse(response)

      if (!Array.isArray(data)) {
        throw new Error('The orders API returned unexpected data.')
      }

      setOrders(data)
    } catch (err) {
      console.error('Loading orders failed:', err)
      setError(
        err.message === 'Failed to fetch'
          ? 'Could not connect to Shopora. Check that Tomcat is running.'
          : err.message || 'Unable to load your orders.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  return (
    <section className="my-orders-page">
      <div className="my-orders-top">
        <button className="orders-back-button" onClick={onBack}>
          ← Back to shopping
        </button>

        <div className="orders-title-row">
          <div>
            <span className="orders-eyebrow">YOUR SHOPORA ACCOUNT</span>
            <h1>My Orders</h1>
            <p>
              Hi{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!
              Here are your purchases and order details.
            </p>
          </div>

          <div className="orders-title-icon" aria-hidden="true">
            🛍️
          </div>
        </div>

        {!loading && !error && (
          <div className="orders-count">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </div>
        )}
      </div>

      {loading ? (
        <div className="orders-state">
          <div className="orders-state-icon">⌛</div>
          <h2>Finding your orders...</h2>
          <p>Please wait while we load your order history.</p>
        </div>
      ) : error ? (
        <div className="orders-state orders-error">
          <div className="orders-state-icon">♡</div>
          <h2>We couldn't load your orders</h2>
          <p>{error}</p>
          <div className="orders-state-actions">
            <button className="orders-primary-button" onClick={loadOrders}>
              Try again
            </button>
            <button className="orders-secondary-button" onClick={onBack}>
              Back to shopping
            </button>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-state">
          <div className="orders-state-icon">📦</div>
          <h2>No orders yet</h2>
          <p>
            When you place an order with Shopora, it will appear here.
          </p>
          <button className="orders-primary-button" onClick={onBack}>
            Explore products
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.orderId}>
              <div className="order-card-header">
                <div>
                  <span className="order-label">ORDER NUMBER</span>
                  <h2>#{order.orderId}</h2>
                  <p className="order-date">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>

                <span
                  className={`order-status ${statusClass(order.orderStatus)}`}
                >
                  {String(order.orderStatus || 'PLACED').replaceAll('_', ' ')}
                </span>
              </div>

              <div className="order-items-list">
                {(order.items || []).map((item, index) => (
                  <div
                    className="order-product-row"
                    key={`${order.orderId}-${item.productId}-${index}`}
                  >
                    <div className="order-product-icon">🛍️</div>

                    <div className="order-product-info">
                      <h3>{item.productName}</h3>
                      <p>
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>

                    <strong className="order-product-subtotal">
                      {formatPrice(item.subtotal)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="order-card-bottom">
                <div className="order-delivery-info">
                  <span>PAYMENT</span>
                  <strong>{order.paymentMethod || 'COD'}</strong>
                  <span>DELIVERY ADDRESS</span>
                  <p>
                    {[
                      order.address,
                      order.city,
                      order.state,
                      order.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Address unavailable'}
                  </p>
                </div>

                <div className="order-total">
                  <span>ORDER TOTAL</span>
                  <strong>{formatPrice(order.totalAmount)}</strong>
                  <small>
                    {(order.items || []).reduce(
                      (total, item) => total + Number(item.quantity || 0),
                      0
                    )}{' '}
                    {(order.items || []).reduce(
                      (total, item) => total + Number(item.quantity || 0),
                      0
                    ) === 1
                      ? 'item'
                      : 'items'}
                  </small>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
