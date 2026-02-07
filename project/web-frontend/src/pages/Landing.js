import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../services/api';

const Landing = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredFarmers, setFeaturedFarmers] = useState([]);
  const [flashMessages, setFlashMessages] = useState([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadFeaturedProducts();
    loadFeaturedFarmers();
  }, []);

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

  const loadFeaturedProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setFeaturedProducts(response.data.slice(0, 6));
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadFeaturedFarmers = async () => {
    try {
      // TODO: Implement farmers API
      setFeaturedFarmers([
        {
          id: 1,
          name: 'Maria Santos',
          farm_name: 'Green Valley Farm',
          location: 'Quezon City',
          profile_picture: null
        },
        {
          id: 2,
          name: 'Juan dela Cruz',
          farm_name: 'Mountain Fresh Produce',
          location: 'Baguio City',
          profile_picture: null
        },
        {
          id: 3,
          name: 'Ana Reyes',
          farm_name: 'Sunrise Organic Farm',
          location: 'Laguna',
          profile_picture: null
        }
      ]);
    } catch (error) {
      console.error('Error loading farmers:', error);
    }
  };

  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How does FarmtoClick work?",
      answer: "FarmtoClick connects you directly with local farmers. Browse products, place orders, and either pick up at the farm or arrange delivery. Farmers update their availability in real-time, so you always get the freshest produce."
    },
    {
      question: "Is the produce really fresh?",
      answer: "Absolutely! Most produce is harvested within 24-48 hours of delivery. Unlike grocery store produce that travels thousands of miles and sits in storage for weeks, our farm-fresh items come straight from the field to you."
    },
    {
      question: "How do I know the quality is good?",
      answer: "Every farmer on our platform is vetted for quality and sustainable practices. Plus, you can read reviews from other customers and communicate directly with farmers about their growing methods. Many offer organic and pesticide-free options."
    },
    {
      question: "What if I'm not satisfied with my order?",
      answer: "We stand behind the quality of our produce. If you're not satisfied for any reason, contact the farmer directly within 24 hours. Most farmers offer refunds or replacements for quality issues."
    },
    {
      question: "Can I visit the farms?",
      answer: "Many of our partner farms welcome visitors! Check individual farmer profiles for farm tour availability, farmers' market schedules, or open house events. It's a great way to see where your food comes from."
    },
    {
      question: "How does delivery work?",
      answer: "Delivery options vary by farmer. Some offer home delivery within certain areas, others have designated pickup points, and many participate in local farmers' markets. Check each farmer's profile for specific delivery options and schedules."
    },
    {
      question: "Is it more expensive than grocery stores?",
      answer: "While some items may cost slightly more, you're getting superior freshness, better nutrition, and supporting local families. Many customers find that reduced waste and better flavor make it well worth the investment."
    },
    {
      question: "Can I request specific products?",
      answer: "Yes! Many farmers are happy to grow specific crops based on customer demand. Use the contact feature on farmer profiles to make special requests or inquire about upcoming seasonal items."
    }
  ];

  return (
    <div className="landing">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <Link to="/" style={{ textDecoration: 'none', color: '#2c7a2c' }}>
              <h2><i className="fas fa-seedling"></i> FarmtoClick</h2>
            </Link>
          </div>
          <ul className="nav-menu">
            <li><a href="#home">Home</a></li>
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
                <button className="user-profile-btn" onClick={handleProfileDropdown}>
                  <div className="user-avatar">
                    {user.profile_picture ? (
                      <img src={`/uploads/profiles/${user.profile_picture}`} alt={user.first_name} />
                    ) : (
                      <i className="fas fa-user"></i>
                    )}
                  </div>
                  <span>{user?.first_name || 'User'}</span>
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

      <section id="home" className="hero">
        <div className="hero-background">
          <img src="/images/farm.jpg" alt="FarmtoClick - Fresh Produce from Local Farms" className="hero-bg-img" />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Fresh Produce Direct from Local Farmers</h1>
              <p>Connect directly with farmers in your community. Buy fresh, seasonal produce while supporting local agriculture.</p>
              <div className="hero-buttons">
                <Link to="/products" className="btn btn-primary btn-large">Shop Now</Link>
                <Link to="/farmers" className="btn btn-outline btn-large">Meet Farmers</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Why Choose FarmtoClick?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-seedling"></i></div>
              <h3>Fresh & Local</h3>
              <p>Get produce picked at peak freshness from farms near you</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-user-tie"></i></div>
              <h3>Support Farmers</h3>
              <p>Directly support local farming families and sustainable agriculture</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-truck"></i></div>
              <h3>Convenient Delivery</h3>
              <p>Easy ordering and delivery right to your doorstep</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-heart"></i></div>
              <h3>Sustainable</h3>
              <p>Reduce food miles and support environmentally friendly farming</p>
            </div>
          </div>
        </div>
      </section>

      <section className="featured-products">
        <div className="container">
          <h2>Featured Products</h2>
          <div className="products-grid">
            {featuredProducts.length > 0 ? featuredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="product-placeholder"><i className="fas fa-leaf"></i></div>
                  )}
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-price">${product.price}/{product.unit}</p>
                  <p className="product-farmer">by {product.farmer_name}</p>
                  <Link to={`/product/${product.id}`} className="btn btn-primary">View Details</Link>
                </div>
              </div>
            )) : (
              <p>No products available yet. Check back soon!</p>
            )}
          </div>
          <div className="text-center">
            <Link to="/products" className="btn btn-outline">View All Products</Link>
          </div>
        </div>
      </section>

      <section className="featured-farmers">
        <div className="container">
          <h2>Meet Our Farmers</h2>
          <div className="farmers-grid">
            {featuredFarmers.length > 0 ? featuredFarmers.map(farmer => (
              <div key={farmer.id} className="farmer-card">
                <div className="farmer-avatar">
                  {farmer.profile_picture ? (
                    <img src={`/uploads/profiles/${farmer.profile_picture}`} alt={farmer.name} />
                  ) : (
                    <div className="avatar-placeholder"><i className="fas fa-user-tie"></i></div>
                  )}
                </div>
                <div className="farmer-info">
                  <h3>{farmer.name}</h3>
                  <p className="farm-name">{farmer.farm_name}</p>
                  <p className="location"><i className="fas fa-map-marker-alt"></i> {farmer.location}</p>
                  <Link to={`/farmer-profile/${farmer.id}`} className="btn btn-outline btn-small">View Profile</Link>
                </div>
              </div>
            )) : (
              <p>No farmers registered yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="educational-resources">
        <div className="container">
          <h2>Educational Resources</h2>
          <p>Learn more about sustainable farming, seasonal eating, and supporting local agriculture</p>

          <div className="resources-grid">
            <div className="resource-card">
              <div className="resource-video">
                <div className="video-container">
                  <iframe
                    src="https://www.youtube.com/embed/dBnniua6-oM"
                    title="How to grow food in the desert"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen>
                  </iframe>
                </div>
              </div>
              <div className="resource-content">
                <h3>Sustainable Farming Practices</h3>
                <p>Discover how to grow food sustainably and efficiently, even in challenging environments.</p>
                <button className="btn btn-outline btn-small">Watch Video</button>
              </div>
            </div>

            <div className="resource-card">
              <div className="resource-video">
                <div className="video-container">
                  <iframe
                    src="https://www.youtube.com/embed/B2lspKVrHmY"
                    title="The future of food"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen>
                  </iframe>
                </div>
              </div>
              <div className="resource-content">
                <h3>Benefits of Seasonal Eating</h3>
                <p>Explore why eating locally and seasonally is better for your health and the planet.</p>
                <button className="btn btn-outline btn-small">Watch Video</button>
              </div>
            </div>

            <div className="resource-card">
              <div className="resource-video">
                <div className="video-container">
                  <iframe
                    src="https://www.youtube.com/embed/DkZ7BJlFWY8"
                    title="Local food systems"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen>
                  </iframe>
                </div>
              </div>
              <div className="resource-content">
                <h3>Farm to Table Journey</h3>
                <p>Understand how local food systems connect farmers directly with consumers.</p>
                <button className="btn btn-outline btn-small">Watch Video</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about buying fresh produce directly from local farmers</p>

          <div className="faq-container">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <div className="faq-question" onClick={() => toggleFaq(index)}>
                  <h3>{faq.question}</h3>
                  <i className={`fas fa-chevron-down ${activeFaq === index ? 'active' : ''}`}></i>
                </div>
                <div className={`faq-answer ${activeFaq === index ? 'active' : ''}`}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="learning-hub">
        <div className="container">
          <h2>FarmtoClick Learning Hub</h2>
          <p>Expand your knowledge about sustainable agriculture and healthy eating</p>

          <div className="learning-grid">
            <div className="learning-card">
              <div className="learning-icon">
                <i className="fas fa-book-open"></i>
              </div>
              <h3>Farming Guides</h3>
              <ul>
                <li>Understanding Organic Certification</li>
                <li>Seasonal Produce Calendar</li>
                <li>Composting at Home</li>
                <li>Starting Your Own Garden</li>
              </ul>
              <a href="/guides" className="btn btn-outline btn-small">Read Guides</a>
            </div>

            <div className="learning-card">
              <div className="learning-icon">
                <i className="fas fa-utensils"></i>
              </div>
              <h3>Recipe Collection</h3>
              <ul>
                <li>Farm-Fresh Breakfast Ideas</li>
                <li>Seasonal Vegetable Recipes</li>
                <li>Preserving the Harvest</li>
                <li>Kid-Friendly Vegetable Dishes</li>
              </ul>
              <a href="/recipes" className="btn btn-outline btn-small">View Recipes</a>
            </div>

            <div className="learning-card">
              <div className="learning-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Nutrition Information</h3>
              <ul>
                <li>Benefits of Local Produce</li>
                <li>Seasonal Nutrition Guide</li>
                <li>Understanding Food Labels</li>
                <li>Vitamins by Season</li>
              </ul>
              <a href="/nutrition" className="btn btn-outline btn-small">Learn More</a>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact">
        <div className="container">
          <h2>Get in Touch</h2>
          <div className="contact-content">
            <div className="contact-info">
              <h3>Connect With Us</h3>
              <p>Have questions? Want to become a partner farmer? We'd love to hear from you!</p>
              <div className="contact-details">
                <p><i className="fas fa-envelope"></i> info@farmtoclick.com</p>
                <p><i className="fas fa-phone"></i> (555) 123-4567</p>
                <p><i className="fas fa-map-marker-alt"></i> 123 Farm Road, Agricultural Valley</p>
              </div>
            </div>
            <div className="contact-form">
              <form>
                <input type="text" placeholder="Your Name" required />
                <input type="email" placeholder="Your Email" required />
                <textarea placeholder="Your Message" rows="5" required></textarea>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

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
                <a href="https://www.facebook.com"><i className="fab fa-facebook"></i> Facebook</a>
                <a href="https://www.instagram.com"><i className="fab fa-instagram"></i> Instagram</a>
                <a href="https://www.twitter.com"><i className="fab fa-twitter"></i> Twitter</a>
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

export default Landing;