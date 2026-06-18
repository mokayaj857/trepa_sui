import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-md gradient-sui flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold gradient-text">Trepa</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              The first self-funding intent engine on Sui. Convert plain-English financial goals
              into executable PTBs with risk analysis and autonomous treasury growth.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/engine" className="text-sm text-muted-foreground hover:text-primary transition-colors">Intent Engine</Link></li>
              <li><Link to="/treasury" className="text-sm text-muted-foreground hover:text-primary transition-colors">Treasury</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Protocol</h4>
            <ul className="space-y-2">
              <li><span className="text-sm text-muted-foreground">Built on Sui</span></li>
              <li><span className="text-sm text-muted-foreground">Programmable Transaction Blocks</span></li>
              <li><span className="text-sm text-muted-foreground">Move Treasury Objects</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Vibed with <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Shakespeare</a>
          </p>
          <p className="text-xs text-muted-foreground">
            Trepa — Self-Funding Intent Engine on Sui
          </p>
        </div>
      </div>
    </footer>
  );
}
