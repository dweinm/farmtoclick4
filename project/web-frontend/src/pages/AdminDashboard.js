import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalFarmers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.is_admin) {
      loadDashboardStats();
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('userToken');

      // Fetch all stats in parallel
      const [productsRes, farmersRes, ordersRes, verificationsRes] = await Promise.all([
        fetch('http://localhost:5001/api/products', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        }),
        fetch('http://localhost:5001/api/farmers', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        }),
        fetch('http://localhost:5001/api/orders', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        }),
        fetch('http://localhost:5001/api/admin/verifications', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        }),
      ]);

      let totalProducts = 0;
      let totalFarmers = 0;
      let totalOrders = 0;
      let totalRevenue = 0;
      let pendingVerifications = 0;

      if (productsRes.ok) {
        const data = await productsRes.json();
        totalProducts = Array.isArray(data.data) ? data.data.length : data.data?.count || 0;
      }

      if (farmersRes.ok) {
        const data = await farmersRes.json();
        totalFarmers = Array.isArray(data.data) ? data.data.length : data.data?.count || 0;
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const orders = Array.isArray(data.data) ? data.data : data.data?.items || [];
        totalOrders = orders.length;
        totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      }

      if (verificationsRes.ok) {
        const data = await verificationsRes.json();
        if (data.stats) {
          pendingVerifications = (data.stats.total || 0) - (data.stats.verified || 0) - (data.stats.rejected || 0);
        }
      }

      setStats({
        totalProducts,
        totalFarmers,
        totalOrders,
        totalRevenue,
        pendingVerifications,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileDropdown = () => {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
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
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!user || !user.is_admin) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
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
          </ul>
          <div className="nav-actions">
            <div className="user-profile-dropdown">
              <button className="user-profile-btn" onClick={handleProfileDropdown}>
                <div className="user-avatar">
                  {user.profile_picture ? (
                    <img src={`/uploads/profiles/${user.profile_picture}`} alt={user.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <i className="fas fa-user-shield"></i>
                  )}
                </div>
                <span>{user.first_name}</span>
                <i className="fas fa-chevron-down"></i>
              </button>
              <div className="profile-dropdown" id="profileDropdown">
                <Link to="/profile" className="dropdown-item"><i className="fas fa-user-edit"></i> Edit Profile</Link>
                <div className="dropdown-divider"></div>
                <button onClick={logout} className="dropdown-item logout"><i className="fas fa-sign-out-alt"></i> Logout</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h1><i className="fas fa-chart-line"></i> Admin Dashboard</h1>
          <p>Overview of shop statistics and management tools</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="admin-content">
        <div className="container">
          {isLoading ? (
            <div className="loading-spinner"><i className="fas fa-spinner fa-spin"></i> Loading statistics...</div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="admin-stats-grid">
                <div className="stat-card">
                  <div className="stat-icon"><i className="fas fa-box"></i></div>
                  <div className="stat-info">
                    <div className="stat-number">{stats.totalProducts}</div>
                    <div className="stat-label">Total Products</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon"><i className="fas fa-user-tie"></i></div>
                  <div className="stat-info">
                    <div className="stat-number">{stats.totalFarmers}</div>
                    <div className="stat-label">Registered Farmers</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon"><i className="fas fa-shopping-bag"></i></div>
                  <div className="stat-info">
                    <div className="stat-number">{stats.totalOrders}</div>
                    <div className="stat-label">Total Orders</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon"><i className="fas fa-peso-sign"></i></div>
                  <div className="stat-info">
                    <div className="stat-number">₱{stats.totalRevenue.toFixed(2)}</div>
                    <div className="stat-label">Total Revenue</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon"><i className="fas fa-hourglass-half"></i></div>
                  <div className="stat-info">
                    <div className="stat-number">{stats.pendingVerifications}</div>
                    <div className="stat-label">Pending Verifications</div>
                  </div>
                </div>
              </div>

              {/* Admin Action Cards */}
              <div className="admin-actions-section">
                <h2><i className="fas fa-cogs"></i> Management Tools</h2>
                <div className="admin-actions-grid">
                  <Link to="/permit-verification-dashboard" className="action-card">
                    <div className="action-icon"><i className="fas fa-check-circle"></i></div>
                    <div className="action-info">
                      <h3>Permit Verification</h3>
                      <p>Review and approve business permit verifications</p>
                      <span className="action-badge">{stats.pendingVerifications} pending</span>
                    </div>
                    <div className="action-arrow"><i className="fas fa-chevron-right"></i></div>
                  </Link>

                  <Link to="/orders" className="action-card">
                    <div className="action-icon"><i className="fas fa-receipt"></i></div>
                    <div className="action-info">
                      <h3>View Orders</h3>
                      <p>Monitor and manage customer orders</p>
                      <span className="action-badge">{stats.totalOrders} orders</span>
                    </div>
                    <div className="action-arrow"><i className="fas fa-chevron-right"></i></div>
                  </Link>

                  <Link to="/products" className="action-card">
                    <div className="action-icon"><i className="fas fa-list"></i></div>
                    <div className="action-info">
                      <h3>Browse Products</h3>
                      <p>Review all products in the system</p>
                      <span className="action-badge">{stats.totalProducts} products</span>
                    </div>
                    <div className="action-arrow"><i className="fas fa-chevron-right"></i></div>
                  </Link>

                  <Link to="/farmers" className="action-card">
                    <div className="action-icon"><i className="fas fa-users"></i></div>
                    <div className="action-info">
                      <h3>Manage Farmers</h3>
                      <p>View registered farmers and their details</p>
                      <span className="action-badge">{stats.totalFarmers} farmers</span>
                    </div>
                    <div className="action-arrow"><i className="fas fa-chevron-right"></i></div>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <style>{`
        .admin-dashboard-page {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .admin-content {
          padding: 40px 20px;
        }

        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 20px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          font-size: 2.5rem;
          color: #2c7a2c;
          width: 60px;
          height: 60px;
          background: #f0f7f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-info {
          flex: 1;
        }

        .stat-number {
          font-size: 1.8rem;
          font-weight: bold;
          color: #333;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #666;
          margin-top: 5px;
        }

        .admin-actions-section {
          margin-top: 50px;
        }

        .admin-actions-section h2 {
          font-size: 1.5rem;
          color: #333;
          margin-bottom: 25px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .action-card {
          background: white;
          border-radius: 8px;
          padding: 25px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 20px;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
          border-left: 4px solid #2c7a2c;
        }

        .action-card:hover {
          transform: translateX(5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          background: #f8fff8;
        }

        .action-icon {
          font-size: 2rem;
          color: #2c7a2c;
          width: 60px;
          height: 60px;
          background: #f0f7f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .action-info {
          flex: 1;
          min-width: 0;
        }

        .action-info h3 {
          font-size: 1.1rem;
          color: #333;
          margin-bottom: 5px;
        }

        .action-info p {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
        }

        .action-badge {
          display: inline-block;
          background: #e8f5e9;
          color: #2c7a2c;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 500;
          margin-top: 8px;
        }

        .action-arrow {
          color: #999;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .action-card:hover .action-arrow {
          color: #2c7a2c;
        }

        .loading-spinner {
          text-align: center;
          padding: 60px 20px;
          font-size: 1.1rem;
          color: #666;
        }

        .loading-spinner i {
          margin-right: 10px;
        }

        @media (max-width: 768px) {
          .admin-stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 15px;
          }

          .stat-card {
            flex-direction: column;
            text-align: center;
          }

          .stat-icon {
            width: 50px;
            height: 50px;
            font-size: 1.8rem;
          }

          .action-card {
            flex-direction: column;
            text-align: center;
          }

          .action-arrow {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
