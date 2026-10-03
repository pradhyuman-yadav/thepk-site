import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { List, X } from '@phosphor-icons/react';
import Navigation from './Navigation';
import DarkModeToggle from './DarkModeToggle';
import NewspaperBackdrop from './NewspaperBackdrop';

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { pathname, search } = useLocation();

  // Close the mobile menu whenever the page changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, search]);

  return (
    <div className="layout">
      {/* Washed-out broadsheet that fills the screen behind the page */}
      <NewspaperBackdrop />

      {/* Hamburger Menu Button - Mobile Only */}
      <button
        className={`hamburger-menu ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen((open) => !open)}
        aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <X size={22} aria-hidden="true" /> : <List size={22} aria-hidden="true" />}
      </button>

      {/* Left sidebar - Navigation */}
      <div className={`nav-sidebar ${isMobileMenuOpen ? 'active' : ''}`}>
        <Navigation />
        <DarkModeToggle />
      </div>

      {/* Center - Main page content, the focused "clipping" over the broadsheet */}
      <div className="page-container">
        <main className="main-content" onClick={() => setIsMobileMenuOpen(false)}>
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
