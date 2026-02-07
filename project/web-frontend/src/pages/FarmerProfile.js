import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FarmerProfile = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFarmerProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      // TODO: Implement farmer profile API
      // For now, mock data
      setFarmer({
        id: id,
        first_name: 'John',
        last_name: 'Farmer',
        email: 'john@farm.com',
        phone: '555-0123',
        farm_name: 'Green Valley Farm',
        farm_description: 'Dedicated to growing fresh, quality produce for our community.',
        farm_location: 'Springfield, IL',
        farm_phone: '555-0124',
        profile_picture: null,
      });
      setProducts([
        {
          id: '1',
          name: 'Organic Tomatoes',
          description: 'Fresh, vine-ripened tomatoes',
          price: 3.99,
          image: '/images/tomatoes.jpg',
          category: 'Vegetables',
          quantity: 50,
          unit: 'lb',
          farmer_name: 'John Farmer',
        },
      ]);
    } catch (error) {
      console.error('Error loading farmer profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadFarmerProfile();
  }, [loadFarmerProfile]);

  if (isLoading) {
    return <div className="loading">Loading farmer profile...</div>;
  }

  if (!farmer) {
    return <div className="error">Farmer not found</div>;
  }

  return (
    <div className="farmer-profile-page">
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
            <li><a href="#contact">Contact</a></li>
            {user && user.is_farmer && (
              <li><Link to="/farmer-dashboard">My Shop</Link></li>
            )}
          </ul>
          <div className="nav-actions">
            {user ? (
              <div className="user-profile-dropdown">
                <button className="user-profile-btn">
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
                <div className="profile-dropdown">
                  <Link to="/profile" className="dropdown-item">
                    <i className="fas fa-user-edit"></i> Edit Profile
                  </Link>
                  <Link to="/cart" className="dropdown-item">
                    <i className="fas fa-shopping-cart"></i> My Cart
                  </Link>
                  <Link to="/orders" className="dropdown-item">
                    <i className="fas fa-shopping-bag"></i> My Orders
                  </Link>
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

      <section className="farmer-header">
        <div className="container">
          <div className="farmer-profile-header">
            <div className="farmer-avatar-large">
              {farmer.profile_picture ? (
                <img src={`/uploads/profiles/${farmer.profile_picture}`} alt={farmer.first_name} />
              ) : (
                <div className="avatar-placeholder">
                  <i className="fas fa-user-tie"></i>
                </div>
              )}
            </div>
            <div className="farmer-header-info">
              <h1>{farmer.first_name} {farmer.last_name}</h1>
              <h2 className="farm-name">{farmer.farm_name || 'Local Farm'}</h2>
              <p className="location">
                <i className="fas fa-map-marker-alt"></i> {farmer.farm_location || 'Location not specified'}
              </p>
              <p className="farmer-description">
                {farmer.farm_description || 'Dedicated to growing fresh, quality produce for our community.'}
              </p>
              <div className="farmer-contact">
                <a href={`mailto:${farmer.email}`} className="btn btn-primary">
                  <i className="fas fa-envelope"></i> Contact Farmer
                </a>
                <span className="phone">
                  <i className="fas fa-phone"></i> {farmer.farm_phone || farmer.phone || 'Contact via email'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="farmer-products">
        <div className="container">
          <h2>Available Products</h2>
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="product-placeholder">
                      <i className="fas fa-leaf"></i>
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <p className="product-price">${product.price}/{product.unit}</p>
                  <p className="product-farmer">by {product.farmer_name}</p>
                  <Link to={`/product/${product.id}`} className="btn btn-primary">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="no-products">
              <i className="fas fa-seedling"></i>
              <h3>No products available</h3>
              <p>This farmer hasn't listed any products yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FarmerProfile;