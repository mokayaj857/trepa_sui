import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border/50 transition-theme">
      <div className="container py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Trepa" className="h-6 w-6" />
            <span className="font-display text-sm font-bold">Trepa</span>
          </Link>
          <p className="text-xs text-muted-foreground">
            Self-funding intent engine on Sui · Vibed with{' '}
            <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Shakespeare</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
