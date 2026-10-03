import { useState } from 'react';
import Navigation from './Navigation';
import DarkModeToggle from './DarkModeToggle';

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="layout">
      {/* Hamburger Menu Button - Mobile Only */}
      <button
        className={`hamburger-menu ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Left sidebar - Navigation */}
      <div className={`nav-sidebar ${isMobileMenuOpen ? 'active' : ''}`}>
        <Navigation />
        <DarkModeToggle />
      </div>

      {/* Center - Main page content */}
      <div className="page-container">
        <main className="main-content" onClick={closeMobileMenu}>
          {children}
        </main>
      </div>

      {/* Right sidebar - Name branding */}
      {/* Brand wordmark, not a heading: each page owns its single <h1> */}
      <div className="name-branding">
        <p className="site-title-vertical">Pradhyuman Yadav</p>
      </div>
    </div>
  );
};

export default Layout;
