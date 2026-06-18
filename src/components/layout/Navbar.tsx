import { Link, useLocation } from 'react-router-dom';
import { Bot, LayoutDashboard, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/engine', label: 'Intent Engine', icon: Bot },
  { href: '/treasury', label: 'Treasury', icon: LayoutDashboard },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg gradient-sui flex items-center justify-center glow-sui">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            <span className="gradient-text">Trepa</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/engine"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-sui text-white text-sm font-semibold transition-all hover:opacity-90 glow-sui"
          >
            Try Engine
            <ChevronRight className="h-4 w-4" />
          </Link>

          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'flex items-center justify-center h-9 w-9 rounded-lg transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.icon ? <link.icon className="h-4 w-4" /> : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
