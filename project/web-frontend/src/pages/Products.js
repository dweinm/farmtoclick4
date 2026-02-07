import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { productsAPI, cartAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [searchParams, setSearchParams] = useSearchParams();
  const [flashMessages, setFlashMessages] = useState([]);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const categories = [
    'Vegetables', 'Fruits', 'Grains & Cereals', 'Dairy & Eggs', 'Meat & Poultry',
    'Herbs & Spices', 'Nuts & Seeds', 'Honey & Jams', 'Oils & Condiments',
    'Baked Goods', 'Beverages', 'Organic Products', 'Flowers'
  ];

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterProducts = useCallback(() => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.category && product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(product =>
        (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (minPrice) {
      filtered = filtered.filter(product => parseFloat(product.price) >= parseFloat(minPrice));
    }

    if (maxPrice) {
      filtered = filtered.filter(product => parseFloat(product.price) <= parseFloat(maxPrice));
    }

    // Sort
    if (sortBy === 'price_low') {
      filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortBy === 'name_asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name_desc') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else { // newest
      filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    // Load from URL params
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const min = searchParams.get('min_price');
    const max = searchParams.get('max_price');
    const sort = searchParams.get('sort');

    if (category) setSelectedCategory(category);
    if (search) setSearchQuery(search);
    if (min) setMinPrice(min);
    if (max) setMaxPrice(max);
    if (sort) setSortBy(sort);

    loadProducts();
  }, [searchParams, loadProducts]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(selectedCategory === category ? null : category);
    const params = new URLSearchParams(searchParams);
    if (selectedCategory === category) {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    setSearchParams(params);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (searchQuery) params.set('search', searchQuery);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (sortBy) params.set('sort', sortBy);
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setSearchParams({});
  };

  const handleAddToCart = async (productId, productName) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await cartAPI.addToCart(productId, 1);
      setFlashMessages([{ category: 'success', text: `${productName} added to cart!` }]);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setFlashMessages([{ category: 'error', text: 'Network error. Please check your connection.' }]);
    }
  };

  return (
    <div className="products-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h2><i className="fas fa-seedling"></i> FarmtoClick</h2>
            </Link>
          </div>
          <ul className="nav-menu">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products" className="active">Products</Link></li>
            <li><Link to="/farmers">Farmers</Link></li>
            <li><a href="#contact">Contact</a></li>
            {user && user.is_farmer && (
              <li><Link to="/farmer-dashboard">My Shop</Link></li>
            )}
          </ul>
          <div className="nav-actions">
            {user ? (
              <div className="user-profile-dropdown">
                <button className="user-profile-btn" onClick={() => document.getElementById('profileDropdown')?.classList.toggle('show')}>
                  <div className="user-avatar">
                    {user.profile_picture ? (
                      <img src={`/uploads/profiles/${user.profile_picture}`} alt={user.first_name} />
                    ) : (
                      <i className="fas fa-user"></i>
                    )}
                  </div>
                  <span>{user.first_name}</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                <div className="profile-dropdown" id="profileDropdown">
                  <Link to="/profile" className="dropdown-item">
                    <i className="fas fa-user-edit"></i> Edit Profile
                  </Link>
                  <Link to="/cart" className="dropdown-item">
                    <i className="fas fa-shopping-cart"></i> My Cart
                  </Link>
                  <Link to="/orders" className="dropdown-item">
                    <i className="fas fa-shopping-bag"></i> My Orders
                  </Link>
                  {user.is_admin && (
                    <>
                      <div className="dropdown-divider"></div>
                      <Link to="/admin-dashboard" className="dropdown-item">
                        <i className="fas fa-chart-bar"></i> Admin Dashboard
                      </Link>
                    </>
                  )}
                  <div className="dropdown-divider"></div>
                  <button onClick={logout} className="dropdown-item logout">
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">Login</Link>
                <Link to="/register" className="btn btn-primary">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Flash Messages */}
      {flashMessages.length > 0 && (
        <div className="flash-messages">
          {flashMessages.map((message, index) => (
            <div key={index} className={`flash-message flash-${message.category}`}>
              <i className={`fas fa-${message.category === 'success' ? 'check-circle' : message.category === 'error' ? 'exclamation-circle' : 'info-circle'}`}></i>
              {message.text}
              <button className="flash-close" onClick={() => {
                const newMessages = [...flashMessages];
                newMessages.splice(index, 1);
                setFlashMessages(newMessages);
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h1>Fresh Products</h1>
          <p>Browse our selection of fresh, locally grown produce</p>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-page-main">
        <div className="container">
          <div className="products-layout">
            {/* Sidebar Filters */}
            <aside className="filters-sidebar">
              <h3>Categories</h3>
              <div className="category-filters">
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`category-btn ${!selectedCategory ? 'active' : ''}`}
                >
                  <i className="fas fa-th-large"></i> All Products
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  >
                    {category === 'Vegetables' && <i className="fas fa-carrot"></i>}
                    {category === 'Fruits' && <i className="fas fa-apple-alt"></i>}
                    {category === 'Herbs & Spices' && <i className="fas fa-leaf"></i>}
                    {!['Vegetables', 'Fruits', 'Herbs & Spices'].includes(category) && <i className="fas fa-tag"></i>}
                    {' '}{category}
                  </button>
                ))}
              </div>

              <div className="filter-panel">
                <h3>Filter Products</h3>
                <form className="filter-form" onSubmit={handleFilterSubmit}>
                  <div className="filter-group">
                    <label htmlFor="search">Search</label>
                    <input
                      className="filter-input"
                      type="text"
                      id="search"
                      placeholder="Search products"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label htmlFor="min_price">Min Price</label>
                    <input
                      className="filter-input"
                      type="number"
                      step="0.01"
                      min="0"
                      id="min_price"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label htmlFor="max_price">Max Price</label>
                    <input
                      className="filter-input"
                      type="number"
                      step="0.01"
                      min="0"
                      id="max_price"
                      placeholder="1000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label htmlFor="sort">Sort By</label>
                    <select
                      className="filter-select"
                      id="sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                      <option value="name_asc">Name: A to Z</option>
                      <option value="name_desc">Name: Z to A</option>
                    </select>
                  </div>
                  <div className="filter-actions">
                    <button type="submit" className="btn btn-primary btn-small">Apply</button>
                    <button type="button" onClick={handleReset} className="btn btn-outline btn-small">Reset</button>
                  </div>
                </form>
              </div>

              <div className="sidebar-info">
                <h4><i className="fas fa-info-circle"></i> Why Buy Local?</h4>
                <ul>
                  <li>✅ Fresh from the farm</li>
                  <li>✅ Support local farmers</li>
                  <li>✅ Better for environment</li>
                  <li>✅ Healthier produce</li>
                </ul>
              </div>
            </aside>

            {/* Products Grid */}
            <main className="products-main">
              {isLoading ? (
                <div className="loading-spinner" style={{ textAlign: 'center', padding: '4rem' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#4CAF50' }}></i>
                  <p style={{ marginTop: '1rem', color: '#666' }}>Loading products...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <>
                  <div className="products-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#666' }}>
                      {selectedCategory ? (
                        <>Showing {filteredProducts.length} {selectedCategory} product(s)</>
                      ) : (
                        <>Showing {filteredProducts.length} product(s)</>
                      )}
                    </p>
                  </div>

                  <div className="products-grid">
                    {filteredProducts.map(product => (
                      <div key={product.id || product._id} className="product-card">
                        <div className="product-image">
                          {product.image_url || product.image ? (
                            <img
                              src={product.image_url || product.image}
                              alt={product.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextElementSibling) {
                                  e.target.nextElementSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className="product-placeholder" style={{ display: !product.image_url && !product.image ? 'flex' : 'none' }}>
                            <i className="fas fa-leaf"></i>
                          </div>

                          {product.category && (
                            <span className="category-badge">
                              {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                            </span>
                          )}
                        </div>

                        <div className="product-info">
                          <h3>{product.name}</h3>

                          <p className="product-farmer">
                            <i className="fas fa-user-tie"></i> by{' '}
                            {product.farmer_name ? (
                              <span style={{ color: '#4CAF50' }}>
                                {product.farmer_name}
                              </span>
                            ) : (
                              <span style={{ color: '#999' }}>Unknown Farmer</span>
                            )}
                          </p>

                          <p className="product-description">
                            {product.description
                              ? product.description.substring(0, 100) + (product.description.length > 100 ? '...' : '')
                              : 'Fresh produce, directly from the farm.'}
                          </p>

                          <div className="product-meta">
                            <span className="product-price">
                              <i className="fas fa-tag"></i> ₱{parseFloat(product.price).toFixed(2)}/{product.unit || 'unit'}
                            </span>
                            <span
                              className="product-quantity"
                              style={{ color: product.quantity < 20 ? '#ff6b6b' : '#4CAF50' }}
                            >
                              <i className="fas fa-box"></i> {product.quantity || 0} {product.unit || 'unit'} available
                            </span>
                          </div>

                          <div className="product-actions">
                            <Link
                              to={`/product/${product.id || product._id}`}
                              className="btn btn-outline btn-small"
                            >
                              <i className="fas fa-eye"></i> View Details
                            </Link>
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => handleAddToCart(product.id || product._id, product.name)}
                            >
                              <i className="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="no-products" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <i className="fas fa-box-open" style={{ fontSize: '5rem', color: '#ddd', marginBottom: '1.5rem' }}></i>
                  <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>No Products Found</h3>
                  <p style={{ color: '#999', marginBottom: '2rem' }}>
                    {selectedCategory ? (
                      <>No products available in the "{selectedCategory}" category at the moment.</>
                    ) : (
                      <>There are no products available at the moment.</>
                    )}
                  </p>
                  {selectedCategory ? (
                    <button onClick={() => handleReset()} className="btn btn-primary">
                      <i className="fas fa-th-large"></i> View All Products
                    </button>
                  ) : (
                    <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem', maxWidth: '500px', margin: '2rem auto 0' }}>
                      <p style={{ margin: 0, color: '#666' }}>
                        <i className="fas fa-info-circle"></i> Products will appear here once farmers add them to the marketplace.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3><i className="fas fa-seedling"></i> FarmtoClick</h3>
              <p>Connecting communities with fresh, local produce since 2024.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/products">Products</Link></li>
                <li><Link to="/farmers">Farmers</Link></li>
                <li><a href="/about">About Us</a></li>
                <li><a href="/faq">FAQ</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>For Farmers</h4>
              <ul>
                <li><a href="/start-selling">Join as Farmer</a></li>
                <li><a href="/farmer-resources">Farmer Resources</a></li>
                <li><a href="/success-stories">Success Stories</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Follow Us</h4>
              <div className="social-links">
                <a href="https://facebook.com/farmtoclick" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook"></i> Facebook</a>
                <a href="https://instagram.com/farmtoclick" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i> Instagram</a>
                <a href="https://twitter.com/farmtoclick" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i> Twitter</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 FarmtoClick. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Products;