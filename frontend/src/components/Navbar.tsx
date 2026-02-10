import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, ChevronDown, MessageSquare } from 'lucide-react';
import logo from '../assets/logo.png';
import './Navbar.css';

interface DropdownItem {
    label: string;
    href: string;
}

interface NavDropdown {
    label: string;
    icon: string;
    items: DropdownItem[];
}

const dropdownMenus: NavDropdown[] = [
    {
        label: 'Performance',
        icon: '⚡',
        items: [
            { label: 'Page Speed', href: '/performance/speed' },
            { label: 'Core Web Vitals', href: '/performance/vitals' },
            { label: 'Load Testing', href: '/performance/load' },
        ],
    },
    {
        label: 'SEO',
        icon: '🔍',
        items: [
            { label: 'Meta Tags', href: '/seo/meta' },
            { label: 'Heading Structure', href: '/seo/headings' },
            { label: 'Structured Data', href: '/seo/schema' },
        ],
    },
    {
        label: 'UX & Mobile',
        icon: '📱',
        items: [
            { label: 'Mobile Friendly', href: '/ux/mobile' },
            { label: 'Accessibility', href: '/ux/accessibility' },
            { label: 'Usability', href: '/ux/usability' },
        ],
    },
    {
        label: 'Content',
        icon: '📄',
        items: [
            { label: 'Readability', href: '/content/readability' },
            { label: 'Content Quality', href: '/content/quality' },
            { label: 'Content Structure', href: '/content/structure' },
        ],
    },
];

export function Navbar() {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const isHome = location.pathname === '/';

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = (label: string) => {
        setOpenDropdown(prev => (prev === label ? null : label));
    };

    return (
        <header className="header" ref={navRef}>
            {/* Top bar — always visible */}
            <div className="header-top">
                <div className="container header-top-inner">
                    <Link to="/" className="logo">
                        <img src={logo} alt="Web Analyzer" className="logo-image" />
                    </Link>
                    <div className="header-right">
                        <Link to="/signin" className="signin-link">
                            <User size={20} />
                            <span>Sign In</span>
                        </Link>
                        {/* Mobile hamburger */}
                        {!isHome && (
                            <button
                                className="mobile-toggle"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                aria-label="Toggle menu"
                            >
                                <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation bar — hidden on home page */}
            {!isHome && (
                <>
                    <div className="header-divider" />
                    <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                        <div className="container header-nav-inner">
                            <div className="nav-items">
                                {/* Dropdown nav items */}
                                {dropdownMenus.map(menu => (
                                    <div className="nav-dropdown-wrapper" key={menu.label}>
                                        <button
                                            className={`nav-item nav-item-dropdown ${openDropdown === menu.label ? 'active' : ''}`}
                                            onClick={() => toggleDropdown(menu.label)}
                                        >
                                            <span className="nav-item-icon">{menu.icon}</span>
                                            <span>{menu.label}</span>
                                            <ChevronDown
                                                size={14}
                                                className={`chevron ${openDropdown === menu.label ? 'rotated' : ''}`}
                                            />
                                        </button>
                                        {openDropdown === menu.label && (
                                            <div className="dropdown-menu">
                                                {menu.items.map(item => (
                                                    <Link
                                                        key={item.href}
                                                        to={item.href}
                                                        className="dropdown-item"
                                                        onClick={() => {
                                                            setOpenDropdown(null);
                                                            setMobileMenuOpen(false);
                                                        }}
                                                    >
                                                        {item.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Contact Us button */}
                            <Link
                                to="/contact"
                                className="contact-btn"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <MessageSquare size={16} />
                                <span>Contact Us</span>
                            </Link>
                        </div>
                    </nav>
                </>
            )}
        </header>
    );
}
