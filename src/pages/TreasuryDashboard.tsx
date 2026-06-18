import { useSeoMeta } from '@unhead/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Landmark,
  TrendingUp,
  Wallet,
  Shield,
  Zap,
  ArrowRight,
  RotateCcw,
  Bot,
  Layers,
  Eye,
  FileText,
  Database,
  Microscope,
} from 'lucide-react';

const assets = [
  { name: 'SUI Staked', amount: '1,247.83 SUI', value: '$3,743', apr: '6.2%' },
  { name: 'vSUI Position', amount: '432.15 vSUI', value: '$1,296', apr: '8.1%' },
  { name: 'USDC Reserve', amount: '500.00 USDC', value: '$500', apr: '3.5%' },
];

const yieldEntries = [
  { name: 'Staking Rewards', amount: '12.47 SUI', from: 'SUI Staked' },
  { name: 'Validator Fees', amount: '0.95 SUI', from: 'vSUI Position' },
  { name: 'LP Rewards', amount: '3.12 USDC', from: 'USDC Reserve' },
  { name: 'Protocol Revenue', amount: '5.00 USDC', from: 'Fees' },
];

const ops = [
  { name: 'Research', cost: '0.8 SUI', icon: Microscope },
  { name: 'Data Collection', cost: '1.2 SUI', icon: Database },
  { name: 'AI Inference', cost: '2.5 SUI', icon: Bot },
  { name: 'Monitoring', cost: '0.5 SUI', icon: Eye },
  { name: 'Reports', cost: '0.3 SUI', icon: FileText },
];

const objects = [
  { id: 'TrepaTreasury', type: 'Shared', fields: 'principal, yield_pool, revenue' },
  { id: 'RingfenceCap', type: 'Capability', fields: 'withdraw_limit, allowed_ops' },
  { id: 'YieldCollector', type: 'Owned', fields: 'collected_yield, last_ts' },
];

export default function TreasuryDashboard() {
  useSeoMeta({
    title: 'Treasury — Trepa',
    description: 'Self-funding treasury powering autonomous agent operations on Sui.',
  });

  return (
    <div className="min-h-screen bg-background transition-theme">
      <Navbar />

      <main className="pt-16">
        <div className="border-b border-border/50 bg-card/50 py-8 transition-theme">
          <div className="container max-w-2xl">
            <div className="flex items-center gap-2.5 mb-1">
              <Landmark className="h-5 w-5 text-primary" />
              <h1 className="font-display text-xl font-bold">Treasury</h1>
            </div>
            <p className="text-sm text-muted-foreground">Self-funding treasury. Principal ringfenced. Only yield funds operations.</p>
          </div>
        </div>

        <div className="container max-w-2xl py-8 space-y-6">
          {/* Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Treasury', value: '$5,540', icon: Landmark },
              { label: 'Principal', value: '$5,540', icon: Wallet },
              { label: '7d Yield', value: '$48', icon: TrendingUp },
              { label: 'Avg APR', value: '6.2%', icon: Shield },
            ].map(s => (
              <Card key={s.label} className="transition-theme">
                <CardContent className="p-4 text-center">
                  <s.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                  <div className="font-display text-lg font-bold">{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Self-funding loop */}
          <Card className="transition-theme">
            <CardContent className="p-5">
              <h2 className="font-display font-semibold text-sm flex items-center gap-1.5 mb-4">
                <RotateCcw className="h-4 w-4 text-primary" />
                Self-Funding Loop
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch gap-2 justify-center">
                {[
                  { label: 'Principal', sub: '$5,540', badge: 'Ringfenced', icon: Wallet },
                  { label: 'Yield', sub: '+6.2%', badge: 'Autonomous', icon: TrendingUp },
                  { label: 'Treasury', sub: '$48/wk', badge: 'Move Objects', icon: Landmark },
                  { label: 'Operations', sub: '5.3 SUI', badge: 'Yield-Funded', icon: Zap },
                ].map((node, i) => (
                  <div key={node.label} className="flex items-center gap-2 flex-1">
                    <div className="flex-1 rounded-md bg-muted/50 p-3 text-center transition-theme">
                      <node.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                      <div className="text-xs font-semibold">{node.label}</div>
                      <div className="text-sm font-bold font-display">{node.sub}</div>
                      <div className="text-[9px] text-primary font-medium mt-0.5">{node.badge}</div>
                    </div>
                    {i < 3 && (
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hidden sm:block flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground text-center mt-3">
                The loop repeats — yield continuously funds new operations without touching principal.
              </p>
            </CardContent>
          </Card>

          {/* Principal assets */}
          <Card className="transition-theme">
            <CardContent className="p-5">
              <h2 className="font-display font-semibold text-sm flex items-center gap-1.5 mb-3">
                <Wallet className="h-4 w-4 text-primary" />
                Principal (Ringfenced)
              </h2>
              <div className="space-y-2">
                {assets.map(a => (
                  <div key={a.name} className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 transition-theme">
                    <div>
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-[11px] text-muted-foreground">{a.amount}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{a.value}</div>
                      <div className="text-[10px] text-primary font-medium">{a.apr} APR</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-primary flex-shrink-0" />
                Ringfence Protection — principal cannot be withdrawn for operational costs.
              </p>
            </CardContent>
          </Card>

          {/* Yield */}
          <Card className="transition-theme">
            <CardContent className="p-5">
              <h2 className="font-display font-semibold text-sm flex items-center gap-1.5 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                Generated Yield (7d)
              </h2>
              <div className="space-y-2">
                {yieldEntries.map(e => (
                  <div key={e.name} className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 transition-theme">
                    <div>
                      <div className="text-sm font-medium">{e.name}</div>
                      <div className="text-[11px] text-muted-foreground">from {e.from}</div>
                    </div>
                    <div className="text-sm font-semibold text-primary">{e.amount}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Operations */}
          <Card className="transition-theme">
            <CardContent className="p-5">
              <h2 className="font-display font-semibold text-sm flex items-center gap-1.5 mb-3">
                <Zap className="h-4 w-4 text-primary" />
                Yield-Funded Operations
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ops.map(op => (
                  <div key={op.name} className="rounded-md bg-muted/50 p-3 transition-theme">
                    <op.icon className="h-4 w-4 text-primary mb-1.5" />
                    <div className="text-xs font-medium">{op.name}</div>
                    <div className="text-[10px] text-muted-foreground">{op.cost}/wk</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Move objects */}
          <Card className="transition-theme">
            <CardContent className="p-5">
              <h2 className="font-display font-semibold text-sm flex items-center gap-1.5 mb-3">
                <Layers className="h-4 w-4 text-primary" />
                On-Chain Objects
              </h2>
              <div className="space-y-2">
                {objects.map(obj => (
                  <div key={obj.id} className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 transition-theme">
                    <div>
                      <div className="text-xs font-mono font-medium">{obj.id}</div>
                      <div className="text-[10px] text-muted-foreground">{obj.fields}</div>
                    </div>
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{obj.type}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-primary flex-shrink-0" />
                <span><span className="font-semibold text-primary">RingfenceCap</span> enforces that principal can never be withdrawn for operations.</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
