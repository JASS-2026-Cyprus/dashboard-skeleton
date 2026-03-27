import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

const navItems = [
  { label: 'Overview', path: '/' },
  { divider: true },
  { label: 'Maintenance', path: '/maintenance' },
  { label: 'Air Quality', path: '/air-quality' },
  { label: 'Water', path: '/water' },
  { label: 'Earthquake', path: '/earthquake' },
] as const;

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      <h1 className={styles.title}>Cockpit</h1>
      <p className={styles.subtitle}>Dashboard</p>
      <nav className={styles.nav}>
        {navItems.map((item, i) => {
          if ('divider' in item) {
            return <div key={i} className={styles.divider} />;
          }
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
