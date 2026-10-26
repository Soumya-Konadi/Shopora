import { useEffect, useMemo, useState } from 'react'
import './App.css'
import MyOrders from './MyOrders'

const API_BASE = 'http://localhost:8080/Shopora/api'
const GUEST_CART_KEY = 'shopora_guest_cart'

const categories = [
  'All',
  'Women',
  'Men',
  'Beauty',
  'Home',
  'Accessories',
  'Footwear',
]

const presentation = {
  'Women Kurti': {
    name: 'Floral Printed Kurti',
    category: 'Women',
    oldPrice: 899,
    rating: 4.4,
    image: '/products/kurti.jpg',
  },
  'Men Shirt': {
    name: 'Everyday Casual Shirt',
    category: 'Men',
    oldPrice: 699,
    rating: 4.2,
    image: '/products/shirt.jpg',
  },
  'Gold Earrings': {
    name: 'Minimal Gold Earrings',
    category: 'Accessories',
    oldPrice: 599,
    rating: 4.5,
    emoji: '✨',
  },
  Handbag: {
    name: 'Soft Everyday Handbag',
    category: 'Accessories',
    oldPrice: 999,
    rating: 4.3,
    image: '/products/handbag.jpg',
  },
  'Skincare Set': {
    name: 'Daily Skincare Set',
    category: 'Beauty',
    oldPrice: 549,
    rating: 4.1,
    image: '/products/skincare.jpg',
  },
  Cushion: {
    name: 'Decorative Cushion Set',
    category: 'Home',
    oldPrice: 799,
    rating: 4.6,
    image: '/products/cushion.jpg',
  },
  Sneakers: {
    name: 'Classic Sports Sneakers',
    category: 'Footwear',
    oldPrice: 1299,
    rating: 4.3,
    image: '/products/sneakers.jpg',
  },
  'Coffee Mug': {
    name: 'Pastel Ceramic Mug',
    category: 'Home',
    oldPrice: 349,
    rating: 4.2,
    image: '/products/mug.jpg',
  },
  Watch: {
    name: 'Everyday Wrist Watch',
    category: 'Accessories',
    oldPrice: 1199,
    rating: 4.4,
    image: '/products/watch.jpg',
  },
  'Makeup Kit': {
    name: 'Beauty Makeup Kit',
    category: 'Beauty',
    oldPrice: 799,
    rating: 4.5,
    image: '/products/makeup.jpg',
  },
  'T-Shirt': {
    name: 'Comfortable Cotton Tee',
    category: 'Men',
    oldPrice: 499,
    rating: 4.1,
    image: '/products/tshirt.jpg',
  },
  Flats: {
    name: 'Elegant Flats',
    category: 'Footwear',
    oldPrice: 649,
    rating: 4.3,
    image: '/products/flats.jpg',
  },
}

function formatPrice(price) {
  return `₹${Number(price || 0).toLocaleString('en-IN')}`
}

function readGuestCart() {
  try {
    const saved = localStorage.getItem(GUEST_CART_KEY)
    const parsed = saved ? JSON.parse(saved) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveGuestCart(items) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
  } catch (error) {
    console.error('Could not save guest cart:', error)
  }
}

async function readResponse(response) {
  const text = await response.text()
  let data = {}

  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(
      'The server returned an invalid response. Check Tomcat and the API URL.'
    )
  }

  if (!response.ok) {
    throw new Error(
      data.error || data.message || `Request failed (${response.status})`
    )
  }

  return data
}

function App() {
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('featured')

  const [user, setUser] = useState(null)

  const [cart, setCart] = useState(() => readGuestCart())
  const [cartLoading, setCartLoading] = useState(false)
  const [cartError, setCartError] = useState('')
  const [cartOpen, setCartOpen] = useState(false)

  const [wishlist, setWishlist] = useState([])
  const [wishlistOpen, setWishlistOpen] = useState(false)

  const [accountOpen, setAccountOpen] = useState(false)
  const [showMyOrders, setShowMyOrders] = useState(false)
  const [authMode, setAuthMode] = useState(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Checkout state
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [orderConfirmation, setOrderConfirmation] = useState(null)

  const [checkoutForm, setCheckoutForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  })

  // Load products from the Java servlet.
  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setProductsLoading(true)
      setProductsError('')

      try {
        const response = await fetch(`${API_BASE}/products`)
        const data = await readResponse(response)

        if (!Array.isArray(data)) {
          throw new Error('The products API did not return a product list.')
        }

        const normalized = data.map((item) => {
          const display = presentation[item.product_name] || {}

          return {
            id: Number(item.product_id),
            databaseName: item.product_name,
            name: display.name || item.product_name,
            description: item.description || '',
            category: display.category || item.category || 'Other',
            price: Number(item.price),
            oldPrice: display.oldPrice || null,
            rating: display.rating || 4.5,
            image: display.image || item.image_url || '',
            emoji: display.emoji || '',
            stockQuantity: Number(item.stock_quantity ?? 0),
          }
        })

        if (!cancelled) {
          setProducts(normalized)
        }
      } catch (error) {
        console.error('Products loading error:', error)

        if (!cancelled) {
          setProductsError(
            error.message || 'Unable to load products. Check that Tomcat is running.'
          )
        }
      } finally {
        if (!cancelled) setProductsLoading(false)
      }
    }

    loadProducts()

    return () => {
      cancelled = true
    }
  }, [])

  // Restore the logged-in user from the server session.
  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const response = await fetch(`${API_BASE}/session`, {
          method: 'GET',
          credentials: 'include',
        })

        const data = await readResponse(response)

        if (cancelled) return

        if (data.loggedIn) {
          setUser({
            userId: data.userId,
            fullName: data.fullName,
            email: data.email,
          })
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Session check error:', error)
      }
    }

    checkSession()

    return () => {
      cancelled = true
    }
  }, [])

  // Normalize a database cart item.
  function normalizeCartItem(item, sourceProducts = products) {
    const product = sourceProducts.find(
      (entry) => entry.id === Number(item.productId ?? item.id)
    )

    return {
      id: Number(item.productId ?? item.id),
      name: product?.name || item.name || 'Product',
      databaseName:
        product?.databaseName || item.databaseName || item.name || '',
      description: product?.description || item.description || '',
      category: product?.category || item.category || '',
      price: Number(product?.price ?? item.price ?? 0),
      image: product?.image || item.image || item.imageUrl || '',
      emoji: product?.emoji || item.emoji || '',
      stockQuantity: Number(
        product?.stockQuantity ?? item.stockQuantity ?? 0
      ),
      quantity: Number(item.quantity ?? 1),
    }
  }

  // Load the database cart and merge guest items after login.
  useEffect(() => {
    let cancelled = false

    async function loadCart() {
      if (!user) {
        setCart(readGuestCart())
        setCartError('')
        setCartLoading(false)
        return
      }

      setCartLoading(true)
      setCartError('')

      try {
        const response = await fetch(`${API_BASE}/cart`, {
          method: 'GET',
          credentials: 'include',
        })

        const data = await readResponse(response)

        if (!Array.isArray(data)) {
          throw new Error('The cart API returned unexpected data.')
        }

        let databaseCart = data.map((item) => normalizeCartItem(item))
        const guestItems = readGuestCart()

        for (const guestItem of guestItems) {
          const product = products.find(
            (entry) => entry.id === Number(guestItem.id)
          )

          if (!product || product.stockQuantity <= 0) continue

          const existing = databaseCart.find(
            (item) => item.id === product.id
          )

          const currentQuantity = existing?.quantity || 0
          const requestedQuantity = Number(guestItem.quantity || 1)

          const nextQuantity = Math.min(
            currentQuantity + requestedQuantity,
            product.stockQuantity
          )

          if (nextQuantity <= currentQuantity) continue

          const method = existing ? 'PUT' : 'POST'

          const saveResponse = await fetch(`${API_BASE}/cart`, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              productId: product.id,
              quantity: nextQuantity,
            }),
          })

          await readResponse(saveResponse)

          if (existing) {
            existing.quantity = nextQuantity
          } else {
            databaseCart.push({
              ...product,
              quantity: nextQuantity,
            })
          }
        }

        if (guestItems.length > 0) {
          const refreshedResponse = await fetch(`${API_BASE}/cart`, {
            credentials: 'include',
          })

          const refreshedData = await readResponse(refreshedResponse)

          if (!Array.isArray(refreshedData)) {
            throw new Error('The cart API returned unexpected data.')
          }

          databaseCart = refreshedData.map((item) =>
            normalizeCartItem(item)
          )

          saveGuestCart([])
        }

        if (!cancelled) {
          setCart(databaseCart)
        }
      } catch (error) {
        console.error('Cart loading error:', error)

        if (!cancelled) {
          setCartError(error.message || 'Unable to load your cart.')
        }
      } finally {
        if (!cancelled) setCartLoading(false)
      }
    }

    loadCart()

    return () => {
      cancelled = true
    }
  }, [user, products])

  // Preserve the guest cart across refreshes.
  useEffect(() => {
    if (!user) {
      saveGuestCart(cart)
    }
  }, [cart, user])

  // Filter and sort products.
  const visibleProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        product.category === selectedCategory

      const term = searchQuery.trim().toLowerCase()

      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.databaseName.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)

      return matchesCategory && matchesSearch
    })

    if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => b.price - a.price)
    } else if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [products, selectedCategory, searchQuery, sortBy])

  const displayedProducts = wishlistOpen
    ? visibleProducts.filter((product) => wishlist.includes(product.id))
    : visibleProducts

  const cartCount = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  )

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  )

  function openAuth(mode) {
    setAuthMode(mode)
    setAuthMessage('')
    setFullName('')
    setEmail('')
    setPassword('')
    setAccountOpen(false)
    setCartOpen(false)
  }

  function closeAuth() {
    setAuthMode(null)
    setAuthMessage('')
    setPassword('')
  }

  // Open the checkout form.
  function openCheckout() {
    if (!user) {
      setCartOpen(false)
      openAuth('login')
      setAuthMessage(
        'Please log in before checkout. Your guest cart will be synced after login.'
      )
      return
    }

    if (cart.length === 0) {
      setCartError('Your cart is empty.')
      return
    }

    setCartOpen(false)
    setCheckoutError('')
    setOrderConfirmation(null)

    setCheckoutForm({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    })

    setCheckoutOpen(true)
  }

  function updateCheckoutField(event) {
    const { name, value } = event.target

    setCheckoutForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  // Submit the delivery form to CheckoutServlet.
  async function handleCheckoutSubmit(event) {
    event.preventDefault()

    if (checkoutLoading) return

    if (!user) {
      setCheckoutOpen(false)
      openAuth('login')
      setAuthMessage('Please log in before placing your order.')
      return
    }

    if (cart.length === 0) {
      setCheckoutError(
        'Your cart is empty. Add products before placing an order.'
      )
      return
    }

    setCheckoutLoading(true)
    setCheckoutError('')

    try {
      // CheckoutServlet reads request parameters.
      // Therefore, submit application/x-www-form-urlencoded data.
      const formData = new URLSearchParams()

      Object.entries(checkoutForm).forEach(([key, value]) => {
        formData.append(key, value.trim())
      })

      const response = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: formData.toString(),
      })

      const data = await readResponse(response)

      if (!data.success || !data.orderId) {
        throw new Error(
          data.error || 'The server did not confirm the order.'
        )
      }

      // Clear the local cart only after the server confirms success.
      setOrderConfirmation(data)
      setCheckoutOpen(false)
      setCart([])
      saveGuestCart([])
      setCartError('')
    } catch (error) {
      console.error('Checkout error:', error)

      setCheckoutError(
        error.message || 'Unable to place your order. Please try again.'
      )
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Register a new user or log in an existing user.
  async function handleAuthSubmit(event) {
    event.preventDefault()

    if (authLoading) return

    setAuthLoading(true)
    setAuthMessage('')

    const isRegister = authMode === 'register'

    try {
      const formData = new URLSearchParams()

      if (isRegister) {
        formData.append('fullName', fullName.trim())
      }

      formData.append('email', email.trim())
      formData.append('password', password)

      const response = await fetch(
        `${API_BASE}/${isRegister ? 'register' : 'login'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: formData.toString(),
        }
      )

      const data = await readResponse(response)

      if (isRegister) {
        setAuthMode('login')
        setPassword('')
        setAuthMessage(
          'Account created successfully! Please log in.'
        )
      } else {
        setUser({
          userId: data.userId,
          fullName: data.fullName,
          email: data.email,
        })

        setPassword('')
        setAuthMessage('')
        setAuthMode(null)
      }
    } catch (error) {
      console.error('Authentication error:', error)

      setAuthMessage(
        error.message === 'Failed to fetch'
          ? 'Could not connect to the server. Check Tomcat and CORS.'
          : error.message
      )
    } finally {
      setAuthLoading(false)
    }
  }

  // Reload the logged-in user's database cart.
  async function refreshCart() {
    if (!user) {
      setCart(readGuestCart())
      return
    }

    setCartLoading(true)
    setCartError('')

    try {
      const response = await fetch(`${API_BASE}/cart`, {
        method: 'GET',
        credentials: 'include',
      })

      const data = await readResponse(response)

      if (!Array.isArray(data)) {
        throw new Error('The cart API returned unexpected data.')
      }

      const normalized = data.map((item) =>
        normalizeCartItem(item)
      )

      setCart(normalized)
    } catch (error) {
      console.error('Cart refresh error:', error)
      setCartError(error.message || 'Unable to refresh cart.')
    } finally {
      setCartLoading(false)
    }
  }

  // Add to guest cart or database cart.
  async function addToCart(product) {
    if (product.stockQuantity <= 0) {
      window.alert('Sorry, this product is currently out of stock.')
      return
    }

    const existing = cart.find((item) => item.id === product.id)

    if (existing && existing.quantity >= product.stockQuantity) {
      window.alert('You have reached the available stock for this item.')
      return
    }

    setCartError('')

    if (!user) {
      const nextCart = existing
        ? cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...cart, { ...product, quantity: 1 }]

      setCart(nextCart)
      saveGuestCart(nextCart)
      setCartOpen(true)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      })

      await readResponse(response)
      await refreshCart()
      setCartOpen(true)
    } catch (error) {
      console.error('Add to cart error:', error)
      setCartError(error.message || 'Unable to add product.')
      window.alert(error.message || 'Unable to add product.')
    }
  }

  // Change quantity in the guest or database cart.
  async function updateQuantity(productId, change) {
    const item = cart.find((entry) => entry.id === productId)

    if (!item) return

    const nextQuantity = item.quantity + change

    if (nextQuantity > item.stockQuantity) {
      window.alert('You have reached the available stock for this item.')
      return
    }

    if (!user) {
      const nextCart =
        nextQuantity <= 0
          ? cart.filter((entry) => entry.id !== productId)
          : cart.map((entry) =>
              entry.id === productId
                ? { ...entry, quantity: nextQuantity }
                : entry
            )

      setCart(nextCart)
      saveGuestCart(nextCart)
      return
    }

    try {
      if (nextQuantity <= 0) {
        await removeFromCart(productId)
        return
      }

      const response = await fetch(`${API_BASE}/cart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          quantity: nextQuantity,
        }),
      })

      await readResponse(response)
      await refreshCart()
    } catch (error) {
      console.error('Quantity update error:', error)
      setCartError(error.message || 'Unable to update quantity.')
    }
  }

  async function removeFromCart(productId) {
    if (!user) {
      const nextCart = cart.filter((item) => item.id !== productId)
      setCart(nextCart)
      saveGuestCart(nextCart)
      return
    }

    try {
      const response = await fetch(
        `${API_BASE}/cart?productId=${encodeURIComponent(productId)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      await readResponse(response)
      await refreshCart()
    } catch (error) {
      console.error('Remove from cart error:', error)
      setCartError(error.message || 'Unable to remove item.')
    }
  }

  function toggleWishlist(productId) {
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    )
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      setUser(null)
      setWishlist([])
      setCartError('')
      setCartOpen(false)
      setAccountOpen(false)
      setAuthMode(null)
      setPassword('')
      setShowMyOrders(false)
    }
  }

  return (
    <div className="shopora-page">
      <div className="announcement-bar">
        ✨ Discover something lovely today — Shopora makes shopping simple!
      </div>

      <header className="main-header">
        <div className="header-top">
          <button
            className="brand-logo"
            onClick={() => {
              setSelectedCategory('All')
              setSearchQuery('')
              setWishlistOpen(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <span className="brand-icon">S</span>
            <span>shopora</span>
          </button>

          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search for products, brands and more..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />

            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="header-actions">
            <button
              className="header-action"
              onClick={() => {
                if (!user) {
                  openAuth('login')
                  setAuthMessage('Please log in to view your account.')
                } else {
                  setAccountOpen((current) => !current)
                }
              }}
            >
              <span className="action-icon">♙</span>
              <span>{user ? user.fullName?.split(' ')[0] : 'Profile'}</span>
            </button>

            <button
              className="header-action wishlist-header"
              onClick={() => {
                setWishlistOpen((current) => !current)
                document
                  .getElementById('products-section')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span className="action-icon">♡</span>
              <span>Wishlist</span>

              {wishlist.length > 0 && (
                <span className="small-count">{wishlist.length}</span>
              )}
            </button>

            <button
              className="header-action cart-header"
              onClick={() => setCartOpen(true)}
            >
              <span className="action-icon">🛍</span>
              <span>Cart</span>
              <span className="cart-count">{cartCount}</span>
            </button>

            {user && (
              <button className="logout-button" onClick={logout}>
                Log out
              </button>
            )}
          </div>
        </div>

        {accountOpen && user && (
          <div className="account-dropdown">
            <strong>{user.fullName}</strong>
            <span>{user.email}</span>

            <button
              onClick={() => {
                setAccountOpen(false)
                setCartOpen(true)
              }}
            >
              View my cart
            </button>

            <button
              onClick={() => {
                setAccountOpen(false)
                setShowMyOrders(true)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              My Orders
            </button>

            <button onClick={logout}>Log out</button>
          </div>
        )}

        <nav className="category-nav">
          {categories.map((category) => (
            <button
              key={category}
              className={
                selectedCategory === category
                  ? 'category-link active'
                  : 'category-link'
              }
              onClick={() => {
                setSelectedCategory(category)
                setWishlistOpen(false)
              }}
            >
              {category}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {showMyOrders ? (
          <MyOrders
            user={user}
            onBack={() => {
              setShowMyOrders(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        ) : (
          <>
        <section
          className="shopora-ambassador-section"
          style={{
            margin: '34px auto',
            padding: '32px 24px',
            maxWidth: '1100px',
            width: 'calc(100% - 48px)',
            boxSizing: 'border-box',
            textAlign: 'center',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #faf5ff 0%, #f0e7ff 100%)',
            border: '1px solid #e7d8fa',
          }}
        >
          <span
            style={{
              display: 'block',
              marginBottom: '10px',
              color: '#8964ad',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            Brand Ambassador
          </span>
          <h2
            style={{
              margin: '0 0 8px',
              color: '#5e3b7d',
              fontSize: 'clamp(26px, 4vw, 36px)',
              fontWeight: 700,
            }}
          >
            Soumya Konadi
          </h2>
          <p style={{ margin: 0, color: '#75578f', fontSize: '15px' }}>
            Style. Confidence. You.
          </p>
        </section>

                <section className="hero-section">
          <div className="hero-content">
            <span className="hero-eyebrow">
              YOUR EVERYDAY SHOPPING DESTINATION
            </span>

            <h1>
              Little things.
              <br />
              <span>Lovely finds.</span>
            </h1>

            <p>
              Find your favourites, explore new styles, and make every day
              a little more special with Shopora.
            </p>

            <button
              className="primary-button"
              onClick={() => {
                setSelectedCategory('All')
                setWishlistOpen(false)
                document
                  .getElementById('products-section')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Explore collection <span>→</span>
            </button>

            <div className="hero-trust">
              <span>♡ Thoughtful picks</span>
              <span>✦ Everyday essentials</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-decoration decoration-one">✦</div>
            <div className="hero-decoration decoration-two">♡</div>

            <div className="hero-circle">
              <div className="hero-shopping-bag">🛍️</div>
              <div className="hero-note">
                <span>made for</span>
                <strong>your style</strong>
              </div>
            </div>

            <div className="floating-card floating-card-top">
              <span className="floating-card-icon">🌷</span>
              <div>
                <strong>Lovely choices</strong>
                <small>Picked for you</small>
              </div>
            </div>

            <div className="floating-card floating-card-bottom">
              <span className="floating-card-icon">💜</span>
              <div>
                <strong>A little joy</strong>
                <small>In every order</small>
              </div>
            </div>
          </div>
        </section>

        <section className="benefits-section">
          <div className="benefit-item">
            <span className="benefit-icon">♡</span>
            <div>
              <strong>Handpicked finds</strong>
              <p>Everyday favourites for you</p>
            </div>
          </div>

          <div className="benefit-item">
            <span className="benefit-icon">✦</span>
            <div>
              <strong>Something for everyone</strong>
              <p>Explore styles and essentials</p>
            </div>
          </div>

          <div className="benefit-item">
            <span className="benefit-icon">♧</span>
            <div>
              <strong>Simple shopping</strong>
              <p>A smoother shopping experience</p>
            </div>
          </div>
        </section>



        <section className="products-section" id="products-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                A LITTLE SOMETHING FOR YOU
              </span>

              <h2>
                {wishlistOpen
                  ? 'Your wishlist'
                  : selectedCategory !== 'All'
                    ? selectedCategory
                    : 'Explore our collection'}
              </h2>

              <p>
                {wishlistOpen
                  ? 'Your saved favourites, all in one place.'
                  : 'Everyday essentials and lovely finds to brighten your day.'}
              </p>
            </div>

            <div className="product-controls">
              <label htmlFor="sort-products">Sort by</label>
              <select
                id="sort-products"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          {productsLoading ? (
            <div className="empty-state">
              <div className="empty-state-icon">⌛</div>
              <h3>Finding lovely things...</h3>
              <p>Please wait while we load the collection.</p>
            </div>
          ) : productsError ? (
            <div className="empty-state">
              <div className="empty-state-icon">♡</div>
              <h3>We couldn't load the products</h3>
              <p>{productsError}</p>

              <button
                className="primary-button"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {displayedProducts.map((product) => {
                  const isWishlisted = wishlist.includes(product.id)

                  const cartItem = cart.find(
                    (item) => item.id === product.id
                  )

                  return (
                    <article className="product-card" key={product.id}>
                      <div className="product-image-wrap">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="product-image"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none'
                              event.currentTarget.parentElement.classList.add(
                                'image-not-found'
                              )
                            }}
                          />
                        ) : (
                          <div className="product-emoji">
                            {product.emoji || '🛍️'}
                          </div>
                        )}

                        <button
                          className={
                            isWishlisted
                              ? 'wishlist-button wishlisted'
                              : 'wishlist-button'
                          }
                          onClick={() => toggleWishlist(product.id)}
                          aria-label={
                            isWishlisted
                              ? 'Remove from wishlist'
                              : 'Add to wishlist'
                          }
                        >
                          {isWishlisted ? '♥' : '♡'}
                        </button>
                      </div>

                      <div className="product-info">
                        <span className="product-category">
                          {product.category}
                        </span>

                        <h3>{product.name}</h3>

                        <div className="product-rating">
                          <span>★</span>
                          <strong>{product.rating}</strong>
                        </div>

                        <div className="product-price-row">
                          <strong className="product-price">
                            {formatPrice(product.price)}
                          </strong>

                          {product.oldPrice &&
                            product.oldPrice > product.price && (
                              <span className="old-price">
                                {formatPrice(product.oldPrice)}
                              </span>
                            )}
                        </div>

                        {product.stockQuantity <= 0 && (
                          <p className="stock-message">
                            Currently out of stock
                          </p>
                        )}

                        <button
                          className={
                            cartItem
                              ? 'add-to-cart-button added'
                              : 'add-to-cart-button'
                          }
                          onClick={() => addToCart(product)}
                          disabled={product.stockQuantity <= 0}
                        >
                          {cartItem
                            ? `✓ In cart (${cartItem.quantity})`
                            : '＋ Add to cart'}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>

              {displayedProducts.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    {wishlistOpen ? '♡' : '⌕'}
                  </div>

                  <h3>
                    {wishlistOpen
                      ? 'Your wishlist is waiting'
                      : 'No products found'}
                  </h3>

                  <p>
                    {wishlistOpen
                      ? 'Tap the heart on a product to save it here.'
                      : 'Try a different search or category.'}
                  </p>

                  <button
                    className="primary-button"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('All')
                      setWishlistOpen(false)
                    }}
                  >
                    Explore products
                  </button>
                </div>
              )}
            </>
          )}
        </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="brand-logo footer-logo">
              <span className="brand-icon">S</span>
              <span>shopora</span>
            </div>

            <p>
              Lovely finds for everyday life. Discover your next favourite
              thing with Shopora.
            </p>
          </div>

          <div className="footer-column">
            <h4>Explore</h4>

            {['All', 'Women', 'Men', 'Beauty'].map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category)
                  setWishlistOpen(false)

                  document
                    .getElementById('products-section')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                {category === 'All' ? 'All products' : category}
              </button>
            ))}
          </div>

          <div className="footer-column">
            <h4>Your Shopora</h4>

            <button onClick={() => setCartOpen(true)}>My cart</button>

            <button
              onClick={() => {
                setWishlistOpen(true)

                document
                  .getElementById('products-section')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              My wishlist
            </button>

            <button
              onClick={() => {
                if (user) {
                  setShowMyOrders(true)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                } else {
                  openAuth('login')
                  setAuthMessage('Please log in to view your orders.')
                }
              }}
            >
              My Orders
            </button>

            <button onClick={() => openAuth(user ? 'login' : 'register')}>
              {user ? 'Account' : 'Create an account'}
            </button>
          </div>

          <div className="footer-column footer-contact">
            <h4>Stay in the loop</h4>
            <p>Keep exploring and find something you love.</p>

            <button
              className="footer-explore-button"
              onClick={() => {
                setSelectedCategory('All')
                setWishlistOpen(false)

                document
                  .getElementById('products-section')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Shop the collection →
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Shopora. All rights reserved.
          </span>
          <span>Made with ♡ for your everyday finds</span>
        </div>
      </footer>

      {/* Shopping cart drawer */}
      {cartOpen && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCartOpen(false)
            }
          }}
        >
          <aside className="cart-drawer">
            <div className="drawer-header">
              <div>
                <h2>Your cart</h2>
                <p>
                  {cartCount} {cartCount === 1 ? 'item' : 'items'} in your bag
                </p>
              </div>

              <button
                className="close-button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                ×
              </button>
            </div>

            {cartLoading ? (
              <div className="empty-state cart-empty">
                <h3>Loading your cart...</h3>
              </div>
            ) : cartError ? (
              <div className="empty-state cart-empty">
                <h3>Couldn't load your cart</h3>
                <p>{cartError}</p>

                <button className="primary-button" onClick={refreshCart}>
                  Try again
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="empty-state cart-empty">
                <div className="empty-state-icon">♡</div>
                <h3>Your cart is feeling lonely</h3>
                <p>Explore the collection and add something lovely.</p>

                <button
                  className="primary-button"
                  onClick={() => {
                    setCartOpen(false)

                    document
                      .getElementById('products-section')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Start shopping
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="cart-item-image"
                        />
                      ) : (
                        <div className="cart-item-image product-emoji">
                          {item.emoji || '🛍️'}
                        </div>
                      )}

                      <div className="cart-item-details">
                        <h3>{item.name}</h3>

                        <p className="cart-item-price">
                          {formatPrice(item.price)}
                        </p>

                        <div className="quantity-control">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            −
                          </button>

                          <span>{item.quantity}</span>

                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={
                              item.quantity >= item.stockQuantity
                            }
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-side">
                        <strong>
                          {formatPrice(item.price * item.quantity)}
                        </strong>

                        <button
                          className="remove-item-button"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <strong>{formatPrice(cartTotal)}</strong>
                  </div>

                  <p className="cart-note">
                    {user
                      ? 'Your cart is saved to your Shopora account.'
                      : 'Guest cart: your items are saved in this browser. Log in to sync them with your account.'}
                  </p>

                  {!user && (
                    <button
                      className="checkout-button"
                      onClick={() => {
                        setCartOpen(false)
                        openAuth('login')
                        setAuthMessage(
                          'Log in to sync your cart with your Shopora account.'
                        )
                      }}
                    >
                      Log in and sync cart →
                    </button>
                  )}

                  {user && (
                    <button
                      className="checkout-button"
                      onClick={openCheckout}
                      disabled={cartLoading || cart.length === 0}
                    >
                      Proceed to checkout →
                    </button>
                  )}

                  <button
                    className="continue-shopping-button"
                    onClick={() => setCartOpen(false)}
                  >
                    Continue shopping
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* Checkout form */}
      {checkoutOpen && (
        <div
          className="overlay auth-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !checkoutLoading
            ) {
              setCheckoutOpen(false)
              setCheckoutError('')
            }
          }}
        >
          <div className="auth-modal checkout-modal">
            <button
              className="close-button auth-close"
              onClick={() => {
                if (!checkoutLoading) {
                  setCheckoutOpen(false)
                  setCheckoutError('')
                }
              }}
              aria-label="Close checkout"
              disabled={checkoutLoading}
            >
              ×
            </button>

            <div className="auth-brand">
              <span className="brand-icon">S</span>
              <span>shopora</span>
            </div>

            <div className="auth-heading">
              <h2>Checkout</h2>
              <p>Where should we deliver your lovely finds?</p>
            </div>

            <div className="checkout-total-preview">
              <span>
                {cartCount} {cartCount === 1 ? 'item' : 'items'} · Cash on
                Delivery
              </span>
              <strong>{formatPrice(cartTotal)}</strong>
            </div>

            <form
              onSubmit={handleCheckoutSubmit}
              className="auth-form checkout-form"
            >
              <div className="form-group">
                <label htmlFor="checkout-fullName">Full name</label>
                <input
                  id="checkout-fullName"
                  name="fullName"
                  value={checkoutForm.fullName}
                  onChange={updateCheckoutField}
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="checkout-email">Email address</label>
                <input
                  id="checkout-email"
                  name="email"
                  type="email"
                  value={checkoutForm.email}
                  onChange={updateCheckoutField}
                  autoComplete="email"
                  maxLength={150}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="checkout-phone">Phone number</label>
                <input
                  id="checkout-phone"
                  name="phone"
                  type="tel"
                  value={checkoutForm.phone}
                  onChange={updateCheckoutField}
                  placeholder="Enter contact number"
                  autoComplete="tel"
                  minLength={7}
                  maxLength={20}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="checkout-address">Delivery address</label>
                <textarea
                  id="checkout-address"
                  name="address"
                  value={checkoutForm.address}
                  onChange={updateCheckoutField}
                  placeholder="House number, street, area"
                  autoComplete="street-address"
                  maxLength={255}
                  rows={3}
                  required
                />
              </div>

              <div className="checkout-field-row">
                <div className="form-group">
                  <label htmlFor="checkout-city">City</label>
                  <input
                    id="checkout-city"
                    name="city"
                    value={checkoutForm.city}
                    onChange={updateCheckoutField}
                    autoComplete="address-level2"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="checkout-state">State</label>
                  <input
                    id="checkout-state"
                    name="state"
                    value={checkoutForm.state}
                    onChange={updateCheckoutField}
                    autoComplete="address-level1"
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="checkout-pincode">PIN code</label>
                <input
                  id="checkout-pincode"
                  name="pincode"
                  inputMode="numeric"
                  value={checkoutForm.pincode}
                  onChange={updateCheckoutField}
                  autoComplete="postal-code"
                  minLength={5}
                  maxLength={10}
                  pattern="[0-9]{5,10}"
                  placeholder="Enter PIN code"
                  required
                />
              </div>

              <div className="checkout-payment-note">
                <strong>Payment method</strong>
                <span>Cash on Delivery (COD)</span>
                <small>
                  Pay when your order arrives. Online payments are not enabled
                  yet.
                </small>
              </div>

              {checkoutError && (
                <div className="auth-message">{checkoutError}</div>
              )}

              <button
                type="submit"
                className="auth-submit-button"
                disabled={checkoutLoading || cart.length === 0}
              >
                {checkoutLoading
                  ? 'Placing your order...'
                  : `Place order · ${formatPrice(cartTotal)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Successful order confirmation */}
      {orderConfirmation && (
        <div
          className="overlay auth-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOrderConfirmation(null)
            }
          }}
        >
          <div className="auth-modal order-confirmation-modal">
            <div className="order-success-icon">✓</div>

            <div className="auth-heading">
              <h2>Order placed successfully!</h2>
              <p>Thank you for shopping with Shopora.</p>
            </div>

            <div className="order-confirmation-details">
              <div>
                <span>Order ID</span>
                <strong>#{orderConfirmation.orderId}</strong>
              </div>

              <div>
                <span>Order total</span>
                <strong>
                  {formatPrice(orderConfirmation.totalAmount)}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {orderConfirmation.orderStatus || 'PLACED'}
                </strong>
              </div>

              <div>
                <span>Payment</span>
                <strong>Cash on Delivery</strong>
              </div>
            </div>

            <p className="cart-note">
              Your order has been saved. You can keep shopping now.
            </p>

            <button
              className="auth-submit-button"
              onClick={() => setOrderConfirmation(null)}
            >
              Continue shopping
            </button>
          </div>
        </div>
      )}

      {/* Login and registration modal */}
      {authMode && (
        <div
          className="overlay auth-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAuth()
          }}
        >
          <div className="auth-modal">
            <button
              className="close-button auth-close"
              onClick={closeAuth}
              aria-label="Close dialog"
            >
              ×
            </button>

            <div className="auth-brand">
              <span className="brand-icon">S</span>
              <span>shopora</span>
            </div>

            <div className="auth-heading">
              <h2>
                {authMode === 'login'
                  ? 'Welcome back!'
                  : 'Create your account'}
              </h2>

              <p>
                {authMode === 'login'
                  ? 'Log in to continue your shopping journey.'
                  : 'Join Shopora and keep your favourites close.'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authMode === 'register' && (
                <div className="form-group">
                  <label htmlFor="auth-name">Full name</label>
                  <input
                    id="auth-name"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="auth-email">Email address</label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete={
                    authMode === 'login'
                      ? 'current-password'
                      : 'new-password'
                  }
                  minLength={6}
                  required
                />
              </div>

              {authMessage && (
                <div
                  className={
                    authMessage.toLowerCase().includes('success')
                      ? 'auth-message success'
                      : 'auth-message'
                  }
                >
                  {authMessage}
                </div>
              )}

              <button
                type="submit"
                className="auth-submit-button"
                disabled={authLoading}
              >
                {authLoading
                  ? 'Please wait...'
                  : authMode === 'login'
                    ? 'Log in'
                    : 'Create account'}
              </button>
            </form>

            <div className="auth-switch">
              {authMode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}

              <button
                onClick={() => {
                  setAuthMode(
                    authMode === 'login' ? 'register' : 'login'
                  )
                  setAuthMessage('')
                  setPassword('')
                }}
              >
                {authMode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App