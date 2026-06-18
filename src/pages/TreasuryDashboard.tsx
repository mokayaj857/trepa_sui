import { useSeoMeta } from '@unhead/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Database,
  Eye,
  FileText,
  Microscope,
} from 'lucide-react';

const treasuryAssets = [
  { name: 'SUI Staked', amount: '1,247.83 SUI', value: '$3,743.49', yield: '6.2% APR', type: 'principal' },
  { name: 'vSUI Position', amount: '432.15 vSUI', value: '$1,296.45', yield: '8.1% APR', type: 'principal' },
  { name: 'USDC Reserve', amount: '500.00 USDC', value: '$500.00', yield: '3.5% APR', type: 'principal' },
];

const yieldEntries = [
  { name: 'Staking Rewards', amount: '12.47 SUI', value: '$37.41', source: 'SUI Staked', period: '7d' },
  { name: 'Validator Fees', amount: '0.95 SUI', value: '$2.85', source: 'vSUI Position', period: '7d' },
  { name: 'LP Rewards', amount: '3.12 USDC', value: '$3.12', source: 'USDC Reserve', period: '7d' },
  { name: 'Protocol Revenue', amount: '5.00 USDC', value: '$5.00', source: 'Fees Collected', period: '7d' },
];

const operationalFunding = [
  { name: 'Research Queries', amount: '0.8 SUI', icon: Microscope, color: 'sui' },
  { name: 'Data Collection', amount: '1.2 SUI', icon: Database, color: 'trepa' },
  { name: 'AI Inference', amount: '2.5 SUI', icon: Bot, color: 'sui' },
  { name: 'Monitoring', amount: '0.5 SUI', icon: Eye, color: 'yield' },
  { name: 'Reports', amount: '0.3 SUI', icon: FileText, color: 'trepa' },
];

const yieldHistory = [
  { day: 'Day 1', yield: 0.5 },
  { day: 'Day 2', yield: 1.2 },
  { day: 'Day 3', yield: 1.8 },
  { day: 'Day 4', yield: 2.1 },
  { day: 'Day 5', yield: 2.8 },
  { day: 'Day 6', yield: 3.5 },
  { day: 'Day 7', yield: 4.2 },
];

export default function TreasuryDashboard() {
  useSeoMeta({
    title: 'Treasury Dashboard — Trepa',
    description: 'View the self-funding treasury powering Trepa\'s autonomous agent operations. Yield flows in, principal stays ringfenced.',
  });

  const totalTreasury = '$5,539.94';
  const totalYield7d = '$48.38';
  const totalPrincipal = '$5,539.94';
  const yieldAPR = '6.2%';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        {/* Header */}
        <div className="border-b border-border/30 bg-card/30 py-8">
          <div className="container max-w-5xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl gradient-yield flex items-center justify-center glow-yield">
                <Landmark className="h-5 w-5 text-white" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold">Treasury Dashboard</h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">
              The self-funding treasury powering autonomous agent operations. Principal is ringfenced — only yield becomes operational capital.
            </p>
          </div>
        </div>

        <div className="container max-w-5xl py-8 space-y-6">
          {/* Treasury Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="border-yield/20 bg-yield/5">
              <CardContent className="p-5 text-center">
                <Landmark className="h-6 w-6 text-yield mx-auto mb-2" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Treasury</span>
                <p className="text-2xl font-bold font-display text-yield mt-1">{totalTreasury}</p>
              </CardContent>
            </Card>
            <Card className="border-trepa/20 bg-trepa/5">
              <CardContent className="p-5 text-center">
                <Wallet className="h-6 w-6 text-trepa mx-auto mb-2" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Principal (Ringfenced)</span>
                <p className="text-2xl font-bold font-display text-trepa mt-1">{totalPrincipal}</p>
              </CardContent>
            </Card>
            <Card className="border-sui/20 bg-sui/5">
              <CardContent className="p-5 text-center">
                <TrendingUp className="h-6 w-6 text-sui mx-auto mb-2" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">7d Yield</span>
                <p className="text-2xl font-bold font-display text-sui mt-1">{totalYield7d}</p>
              </CardContent>
            </Card>
            <Card className="border-border/20 bg-card">
              <CardContent className="p-5 text-center">
                <Shield className="h-6 w-6 text-guardian mx-auto mb-2" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg APR</span>
                <p className="text-2xl font-bold font-display mt-1">{yieldAPR}</p>
              </CardContent>
            </Card>
          </div>

          {/* Self-Funding Loop Visualization */}
          <Card className="border-trepa/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <RotateCcw className="h-5 w-5 text-trepa" />
                Self-Funding Loop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch gap-3 justify-center">
                {/* Principal */}
                <div className="rounded-xl bg-trepa/10 border border-trepa/30 p-4 flex-1 text-center">
                  <Wallet className="h-6 w-6 text-trepa mx-auto mb-2" />
                  <span className="text-xs font-semibold text-trepa">Principal</span>
                  <p className="text-lg font-bold font-display mt-1">$5,539</p>
                  <Badge className="mt-2 bg-yield/20 text-yield border-yield/30 text-[10px]">RINGFENCED</Badge>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center py-2">
                  <ArrowRight className="h-5 w-5 text-yield hidden sm:block" />
                  <div className="h-[2px] w-8 bg-yield/50 hidden sm:block" />
                  <svg className="h-5 w-5 text-yield sm:hidden rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </div>

                {/* Yield Generation */}
                <div className="rounded-xl bg-yield/10 border border-yield/30 p-4 flex-1 text-center">
                  <TrendingUp className="h-6 w-6 text-yield mx-auto mb-2" />
                  <span className="text-xs font-semibold text-yield">Yield Generation</span>
                  <p className="text-lg font-bold font-display mt-1">+6.2%</p>
                  <Badge className="mt-2 bg-yield/20 text-yield border-yield/30 text-[10px]">AUTONOMOUS</Badge>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center py-2">
                  <ArrowRight className="h-5 w-5 text-sui hidden sm:block" />
                  <div className="h-[2px] w-8 bg-sui/50 hidden sm:block" />
                  <svg className="h-5 w-5 text-sui sm:hidden rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </div>

                {/* Treasury */}
                <div className="rounded-xl bg-sui/10 border border-sui/30 p-4 flex-1 text-center">
                  <Landmark className="h-6 w-6 text-sui mx-auto mb-2" />
                  <span className="text-xs font-semibold text-sui">Treasury</span>
                  <p className="text-lg font-bold font-display mt-1">$48/wk</p>
                  <Badge className="mt-2 bg-sui/20 text-sui border-sui/30 text-[10px]">MOVE OBJECTS</Badge>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center py-2">
                  <ArrowRight className="h-5 w-5 text-guardian hidden sm:block" />
                  <div className="h-[2px] w-8 bg-guardian/50 hidden sm:block" />
                  <svg className="h-5 w-5 text-guardian sm:hidden rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </div>

                {/* Agent Ops */}
                <div className="rounded-xl bg-guardian/10 border border-guardian/30 p-4 flex-1 text-center">
                  <Zap className="h-6 w-6 text-guardian mx-auto mb-2" />
                  <span className="text-xs font-semibold text-guardian">Agent Operations</span>
                  <p className="text-lg font-bold font-display mt-1">5.3 SUI</p>
                  <Badge className="mt-2 bg-guardian/20 text-guardian border-guardian/30 text-[10px]">FUNDED BY YIELD</Badge>
                </div>
              </div>

              {/* Loop back arrow */}
              <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/20 text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <RotateCcw className="h-3 w-3" />
                  <span>The loop repeats — yield continuously funds new agent operations without touching principal</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Treasury Assets */}
          <Card className="border-border/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Landmark className="h-5 w-5 text-trepa" />
                Principal Assets (Ringfenced)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {treasuryAssets.map((asset) => (
                  <div key={asset.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-trepa/10 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-trepa" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.amount}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{asset.value}</p>
                      <Badge variant="outline" className="border-yield/30 text-yield text-[10px] bg-yield/5">
                        {asset.yield}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-lg bg-yield/5 border border-yield/20">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yield flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-yield">Ringfence Protection:</span> Principal assets cannot be accessed for operational costs.
                    Only generated yield flows into the operational treasury.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Yield Generated */}
          <Card className="border-yield/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <TrendingUp className="h-5 w-5 text-yield" />
                Generated Yield (7-Day)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {yieldEntries.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between p-3 rounded-lg bg-yield/5 border border-yield/20">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-yield/10 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-yield" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">from {entry.source}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-yield">{entry.amount}</p>
                      <p className="text-xs text-muted-foreground">{entry.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Yield history mini chart */}
              <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/20">
                <span className="text-xs font-semibold text-muted-foreground mb-3 block">Yield Accumulation (7-Day)</span>
                <div className="flex items-end gap-2 h-16">
                  {yieldHistory.map((entry) => (
                    <div key={entry.day} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t gradient-yield opacity-80 transition-all"
                        style={{ height: `${(entry.yield / 5) * 100}%` }}
                      />
                      <span className="text-[9px] text-muted-foreground">{entry.day.replace('Day ', 'D')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operational Funding */}
          <Card className="border-sui/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Zap className="h-5 w-5 text-sui" />
                Yield-Funded Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {operationalFunding.map((op) => {
                  const colorClasses = {
                    sui: 'bg-sui/10 border-sui/30 text-sui',
                    trepa: 'bg-trepa/10 border-trepa/30 text-trepa',
                    yield: 'bg-yield/10 border-yield/30 text-yield',
                    guardian: 'bg-guardian/10 border-guardian/30 text-guardian',
                  };
                  return (
                    <div key={op.name} className={cn('rounded-lg border p-4', colorClasses[op.color as keyof typeof colorClasses])}>
                      <op.icon className={cn('h-5 w-5 mb-2', `text-${op.color}`)} />
                      <p className="text-xs font-medium">{op.name}</p>
                      <p className="text-sm font-bold font-display mt-1">{op.amount}</p>
                      <span className="text-[9px] text-muted-foreground">funded by yield</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 rounded-lg bg-trepa/5 border border-trepa/20">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-trepa flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-trepa">Chrysalis Model:</span> Yield metamorphoses into operational capacity.
                    As the treasury grows, so does the agent's ability to serve more intents autonomously.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Move Objects */}
          <Card className="border-border/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Layers className="h-5 w-5 text-primary" />
                On-Chain Treasury Objects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { id: 'TrepaTreasury', type: 'Shared Object', fields: 'principal, yield_pool, revenue', owner: 'Shared' },
                  { id: 'RingfenceCap', type: 'Capability Object', fields: 'withdraw_limit, allowed_ops', owner: 'Trepa Admin' },
                  { id: 'YieldCollector', type: 'Owned Object', fields: 'collected_yield, last_collection', owner: 'Trepa Agent' },
                  { id: 'PositionReceipt', type: 'Owned Object', fields: 'asset, amount, stake_epoch', owner: 'User' },
                ].map((obj) => (
                  <div key={obj.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium font-mono">{obj.id}</p>
                        <p className="text-xs text-muted-foreground">{obj.type}</p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-mono text-muted-foreground">{obj.fields}</p>
                      <Badge variant="outline" className="text-[10px] border-border/30">{obj.owner}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-lg bg-sui/5 border border-sui/20">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-sui flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    All treasury state is stored as native Move objects on Sui. The <span className="font-semibold text-sui">RingfenceCap</span> capability
                    enforces that principal can never be withdrawn for operational use.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
