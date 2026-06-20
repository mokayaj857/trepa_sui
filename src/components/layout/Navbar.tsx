import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, LogOut, Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useTrepaWallet } from '@/lib/sui';
import { useState } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/engine', label: 'Intent Engine' },
  { href: '/treasury', label: 'Treasury' },
];

export function Navbar() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const wallet = useTrepaWallet();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await wallet.connect();
    } finally {
      setConnecting(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-theme">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <img src="/logo.svg" alt="Trepa" className="h-7 w-7 transition-transform duration-200 group-hover:scale-110" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Trepa
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Wallet */}
          {wallet.isConnected ? (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
              <Wallet className="h-3 w-3" />
              <span>{wallet.shortAddress}</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono">{wallet.suiBalance} SUI</span>
              <button
                onClick={() => wallet.disconnect()}
                className="ml-1 h-4 w-4 rounded flex items-center justify-center hover:text-destructive transition-colors"
                aria-label="Disconnect wallet"
              >
                <LogOut className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 active:scale-[0.97] transition-all duration-150 disabled:opacity-60 disabled:pointer-events-none"
            >
              {connecting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Wallet className="h-3 w-3" />
              )}
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Wallet connection error */}
      {wallet.error && !wallet.isConnected && (
        <div className="border-t border-destructive/20 bg-destructive/5">
          <div className="container py-2 flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{wallet.error}</span>
            <button onClick={handleConnect} className="ml-auto text-primary hover:underline font-medium">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          <div className="container py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-2">
              {wallet.isConnected ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-md bg-primary/10 text-xs font-medium text-primary">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-3 w-3" />
                    <span>{wallet.shortAddress}</span>
                    <span className="font-mono">{wallet.suiBalance} SUI</span>
                  </div>
                  <button onClick={() => wallet.disconnect()} className="text-destructive hover:underline">Disconnect</button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
                >
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
