import Navigation from './Navigation';
import DarkModeToggle from './DarkModeToggle';
import NewspaperBackdrop from './NewspaperBackdrop';

// One open composition: expressive type fills the margins, the content column sits directly on the
// background with the section links set as a line of type, and the nameplate runs down the right.
// Elements marked data-backdrop-avoid are kept clear of the background type.
const Layout = ({ children }) => (
  <div className="layout">
    <NewspaperBackdrop />

    <div className="page-container" data-backdrop-avoid="">
      <header className="site-ribbon">
        <Navigation />
        <DarkModeToggle />
      </header>
      <main className="main-content">{children}</main>
    </div>

    {/* Brand wordmark, not a heading: each page owns its single <h1> */}
    <div className="name-branding" data-backdrop-avoid="">
      <p className="site-title-vertical">Pradhyuman Yadav</p>
    </div>
  </div>
);

export default Layout;
