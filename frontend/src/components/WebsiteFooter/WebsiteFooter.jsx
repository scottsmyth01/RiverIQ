import { Link } from 'react-router';
import './WebsiteFooter.css';

const footerLinks = [
  { label: 'Blog', to: '/blog' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms & Conditions', to: '/terms' },
];

const WebsiteFooter = () => {
  return (
    <footer className='website-footer'>
      <div className='website-footer__inner'>
        <span>© {new Date().getFullYear()} RiverIQ</span>
        <nav aria-label='Website footer'>
          {footerLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
};

export default WebsiteFooter;
