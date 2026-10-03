import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS } from '../seo/siteMeta';

const Navigation = () => {
  const location = useLocation();
  const p = location.pathname;

  const isActive = (path) => {
    if (path === '/') return p === '/';
    if (path === '/articles') return p === path || p.startsWith('/article/');
    return p === path || p.startsWith(path + '/');
  };

  return (
    <nav className="navigation" aria-label="Primary">
      {NAV_LINKS.map(({ path, label }) => (
        <Link
          key={path}
          to={path}
          className={isActive(path) ? 'active' : ''}
          aria-current={isActive(path) ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default Navigation;
