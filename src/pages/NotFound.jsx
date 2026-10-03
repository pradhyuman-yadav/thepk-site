import { Link, useLocation } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';

const NotFound = () => {
  const { pathname } = useLocation();
  useSeo({ title: 'Page not found', description: 'This page does not exist.', path: pathname });

  return (
    <div className="not-found-page">
      <header className="page-header">
        <h1 className="page-title">Page not found</h1>
        <p className="page-subtitle">Nothing lives at this address.</p>
      </header>
      <p className="state-msg">
        <Link to="/articles" className="text-link">Browse all articles</Link>
      </p>
    </div>
  );
};

export default NotFound;
