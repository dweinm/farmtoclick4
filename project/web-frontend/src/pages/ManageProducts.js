import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../services/api';

const ManageProducts = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [flashMessages, setFlashMessages] = useState([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form data for adding new product
  const [addFormData, setAddFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    unit: '',
    description: '',
    available: true,
    image: null,
  });

  // Form data for editing product
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    unit: '',
    description: '',
    available: true,
    image: null,
  });

  const categories = [
    'Vegetables', 'Fruits', 'Grains & Cereals', 'Dairy & Eggs',
    'Meat & Poultry', 'Herbs & Spices', 'Nuts & Seeds', 'Honey & Jams',
    'Oils & Condiments', 'Baked Goods', 'Beverages', 'Organic Products', 'Flowers'
  ];

  const units = ['kg', 'g', 'lb', 'lbs', 'piece', 'pack', 'bunch', 'bundle', 'box', 'tray', 'liter', 'ml'];

  const loadProducts = useCallback(async () => {
    try {
      const res = await productsAPI.getProducts();
      setProducts(res.data?.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.is_farmer) {
      loadProducts();
    }
  }, [user, loadProducts]);

  const openAddModal = () => {
    setAddFormData({
      name: '', category: '', price: '', quantity: '', unit: '', description: '', available: true, image: null
    });
    setShowAddModal(true);
    document.body.classList.add('modal-open');
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    document.body.classList.remove('modal-open');
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name || '',
      category: product.category || '',
      price: product.price || '',
      quantity: product.quantity || '',
      unit: product.unit || '',
      description: product.description || '',
      available: product.available !== false,
      image: null,
    });
    setShowEditModal(true);
    document.body.classList.add('modal-open');
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    document.body.classList.remove('modal-open');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(addFormData).forEach(key => {
        if (key === 'image' && addFormData.image) {
          formData.append('image', addFormData.image);
        } else if (key === 'available') {
          formData.append('available', addFormData.available ? 'true' : 'false');
        } else {
          formData.append(key, addFormData[key]);
        }
      });

      await productsAPI.addProduct(formData);
      setFlashMessages([{ category: 'success', text: 'Product added successfully!' }]);
      closeAddModal();
      loadProducts();
    } catch (error) {
      setFlashMessages([{ category: 'error', text: 'Failed to add product. Please try again.' }]);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const formData = new FormData();
      Object.keys(editFormData).forEach(key => {
        if (key === 'image' && editFormData.image) {
          formData.append('image', editFormData.image);
        } else if (key === 'available') {
          formData.append('available', editFormData.available ? 'true' : 'false');
        } else {
          formData.append(key, editFormData[key]);
        }
      });

      await productsAPI.updateProduct(editingProduct.id || editingProduct._id, formData);
      setFlashMessages([{ category: 'success', text: 'Product updated successfully!' }]);
      closeEditModal();
      loadProducts();
    } catch (error) {
      setFlashMessages([{ category: 'error', text: 'Failed to update product. Please try again.' }]);
    }
  };

  const deleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) return;

    try {
      await productsAPI.deleteProduct(productId);
      setFlashMessages([{ category: 'success', text: 'Product deleted successfully!' }]);
      loadProducts();
    } catch (error) {
      setFlashMessages([{ category: 'error', text: 'Failed to delete product.' }]);
    }
  };

  const handleProfileDropdown = () => {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.toggle('show');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById('profileDropdown');
      const button = document.querySelector('.user-profile-btn');
      if (dropdown && button && !button.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove('show');
      }
    };
    document.addEventListener('click', handleClickOutside);
    
    // Close modal on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showAddModal) closeAddModal();
        if (showEditModal) closeEditModal();
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showAddModal, showEditModal]);

  if (!user || !user.is_farmer) {
    return (
      <div className="manage-products-page">
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-logo">
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h2><i className="fas fa-seedling"></i> FarmtoClick</h2>
              </Link>
            </div>
            <ul className="nav-menu">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/farmers">Farmers</Link></li>
              <li><Link to="/start-selling">Start Selling</Link></li>
            </ul>
            <div className="nav-actions">
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </div>
          </div>
        </nav>

        <section className="page-header">
          <div className="container">
            <h1><i className="fas fa-cogs"></i> Access Denied</h1>
            <p>This page is only available for sellers.</p>
          </div>
        </section>

        <section className="products-page">
          <div className="container">
            <div className="no-products">
              <h3>Become a Seller</h3>
              <p>Start selling on FarmtoClick to manage your products.</p>
              <Link to="/start-selling" className="btn btn-primary btn-large">
                <i className="fas fa-seedling"></i> Start Selling
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="manage-products-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h2><i className="fas fa-seedling"></i> FarmtoClick</h2>
            </Link>
          </div>
          <ul className="nav-menu">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/farmers">Farmers</Link></li>
            <li><Link to="/orders">My Orders</Link></li>
            <li><Link to="/farmer-dashboard">My Shop</Link></li>
          </ul>
          <div className="nav-actions">
            <div className="user-profile-dropdown">
              <button className="user-profile-btn" onClick={handleProfileDropdown}>
                <div className="user-avatar">
                  {user.profile_picture ? (
                    <img src={`/uploads/profiles/${user.profile_picture}`} alt={user.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <i className="fas fa-user"></i>
                  )}
                </div>
                <span>{user.first_name}</span>
                <i className="fas fa-chevron-down"></i>
              </button>
              <div className="profile-dropdown" id="profileDropdown">
                <Link to="/profile" className="dropdown-item"><i className="fas fa-user-edit"></i> Edit Profile</Link>
                <Link to="/cart" className="dropdown-item"><i className="fas fa-shopping-cart"></i> My Cart</Link>
                <Link to="/orders" className="dropdown-item"><i className="fas fa-shopping-bag"></i> My Orders</Link>
                {user.is_admin && (
                  <>
                    <div className="dropdown-divider"></div>
                    <Link to="/admin-dashboard" className="dropdown-item"><i className="fas fa-chart-bar"></i> Admin Dashboard</Link>
                  </>
                )}
                <div className="dropdown-divider"></div>
                <button onClick={logout} className="dropdown-item logout"><i className="fas fa-sign-out-alt"></i> Logout</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <section className="page-header">
        <div className="container">
          <h1><i className="fas fa-cogs"></i> Manage Products</h1>
          <p>Add, edit, or delete your products.</p>
        </div>
      </section>

      <section className="products-page">
        <div className="container">
          {/* Flash Messages */}
          {flashMessages.length > 0 && (
            <div className="flash-messages">
              {flashMessages.map((message, index) => (
                <div key={index} className={`alert alert-${message.category}`}>
                  {message.text}
                </div>
              ))}
            </div>
          )}

          {/* Products Table */}
          <div className="profile-card" style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2><i className="fas fa-list"></i> Your Products</h2>
              <button className="btn btn-primary" onClick={openAddModal}>
                <i className="fas fa-plus"></i> Add Product
              </button>
            </div>

            {products.length > 0 ? (
              <div className="manage-products-grid">
                {products.map(product => (
                  <article key={product.id || product._id} className="manage-product-card">
                    <div className="manage-product-image">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} />
                      ) : (
                        <div className="manage-product-placeholder"><i className="fas fa-seedling"></i></div>
                      )}
                    </div>
                    <div className="manage-product-body">
                      <div className="manage-product-header">
                        <h3>{product.name}</h3>
                        <span className={`manage-product-status ${product.available !== false ? 'status-available' : 'status-out'}`}>
                          {product.available !== false ? 'Available' : 'Out of Stock'}
                        </span>
                      </div>
                      <p className="manage-product-category">{product.category}</p>
                      <div className="manage-product-meta">
                        <span><i className="fas fa-tag"></i> ₱{product.price?.toFixed(2)}</span>
                        <span><i className="fas fa-box"></i> {product.quantity} {product.unit}</span>
                      </div>
                      <div className="manage-product-actions">
                        <button className="btn btn-outline btn-small" onClick={() => openEditModal(product)}>Edit</button>
                        <button className="btn btn-danger btn-small" onClick={() => deleteProduct(product.id || product._id, product.name)}>Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                <i className="fas fa-inbox" style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.5 }}></i>
                <p>You haven't added any products yet.</p>
                <p style={{ fontSize: '0.9rem' }}>Click "Add Product" to get started!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="modal show" onClick={(e) => { if (e.target === e.currentTarget) closeAddModal(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-plus-circle"></i> Add New Product</h2>
              <button type="button" className="modal-close" onClick={closeAddModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ width: '100%' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="modal_name">Product Name</label>
                  <input type="text" id="modal_name" placeholder="e.g., Fresh Tomatoes" value={addFormData.name} onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="modal_category">Category</label>
                  <input type="text" id="modal_category" list="modal_category_options" placeholder="e.g., Vegetables" value={addFormData.category} onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })} required />
                  <datalist id="modal_category_options">
                    {categories.map(cat => <option key={cat} value={cat}></option>)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label htmlFor="modal_price">Price (₱)</label>
                  <input type="number" id="modal_price" step="0.01" min="0.01" placeholder="e.g., 4.99" value={addFormData.price} onChange={(e) => setAddFormData({ ...addFormData, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="modal_quantity">Quantity</label>
                  <input type="number" id="modal_quantity" min="0" placeholder="e.g., 50" value={addFormData.quantity} onChange={(e) => setAddFormData({ ...addFormData, quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="modal_unit">Unit of Measure</label>
                  <input type="text" id="modal_unit" list="modal_unit_options" placeholder="e.g., kg, lbs, piece" value={addFormData.unit} onChange={(e) => setAddFormData({ ...addFormData, unit: e.target.value })} required />
                  <datalist id="modal_unit_options">
                    {units.map(unit => <option key={unit} value={unit}></option>)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label htmlFor="modal_image">Product Image (optional)</label>
                  <input type="file" id="modal_image" accept="image/*" onChange={(e) => setAddFormData({ ...addFormData, image: e.target.files[0] })} />
                  <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>Max 5MB. JPG, PNG, GIF, or WebP</small>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="modal_description">Product Description</label>
                  <textarea id="modal_description" rows="4" placeholder="Describe your product, its quality, origin, etc." value={addFormData.description} onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={addFormData.available} onChange={(e) => setAddFormData({ ...addFormData, available: e.target.checked })} />
                    <span>This product is available for sale</span>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary"><i className="fas fa-plus"></i> Add Product</button>
                <button type="button" className="btn btn-outline" onClick={closeAddModal}><i className="fas fa-times"></i> Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditModal && (
        <div className="modal show" onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-pen"></i> Edit Product</h2>
              <button type="button" className="modal-close" onClick={closeEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ width: '100%' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="edit_name">Product Name</label>
                  <input type="text" id="edit_name" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="edit_category">Category</label>
                  <input type="text" id="edit_category" list="modal_category_options" value={editFormData.category} onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="edit_price">Price (₱)</label>
                  <input type="number" id="edit_price" step="0.01" min="0.01" value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="edit_quantity">Quantity</label>
                  <input type="number" id="edit_quantity" min="0" value={editFormData.quantity} onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="edit_unit">Unit of Measure</label>
                  <input type="text" id="edit_unit" list="modal_unit_options" value={editFormData.unit} onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="edit_image">Product Image (optional)</label>
                  <input type="file" id="edit_image" accept="image/*" onChange={(e) => setEditFormData({ ...editFormData, image: e.target.files[0] })} />
                  <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>Leave empty to keep current image.</small>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="edit_description">Product Description</label>
                  <textarea id="edit_description" rows="4" value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={editFormData.available} onChange={(e) => setEditFormData({ ...editFormData, available: e.target.checked })} />
                    <span>This product is available for sale</span>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary"><i className="fas fa-save"></i> Save Changes</button>
                <button type="button" className="btn btn-outline" onClick={closeEditModal}><i className="fas fa-times"></i> Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <li><Link to="/start-selling">Join as Farmer</Link></li>
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

      {/* Modal CSS */}
      <style>{`
        .modal {
          display: none;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.4);
          animation: fadeIn 0.3s ease-in;
          overflow: hidden;
        }
        .modal.show {
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-content {
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease-out;
          position: relative;
          z-index: 1001;
        }
        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 15px;
        }
        .modal-header h2 { margin: 0; font-size: 1.5rem; }
        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.3s;
        }
        .modal-close:hover { background: #f0f0f0; color: #000; }
        body.modal-open { overflow: hidden; }
      `}</style>
    </div>
  );
};

export default ManageProducts;