import { useSeoMeta } from '@unhead/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTrepaWallet, fetchAllCoinBalances, COIN_TYPES } from '@/lib/sui';
import type { CoinBalance } from '@/lib/sui';
import { useState, useEffect } from 'react';
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
  Loader2,
  ExternalLink,
  Droplets,
} from 'lucide-react';

// ─── Treasury operations funded by yield ───
const ops = [
  { name: 'Research', cost: '0.8 SUI', icon: Microscope },
  { name: 'Data Collection', cost: '1.2 SUI', icon: Database },
  { name: 'AI Inference', cost: '2.5 SUI', icon: Bot },
  { name: 'Monitoring', cost: '0.5 SUI', icon: Eye },
  { name: 'Reports', cost: '0.3 SUI', icon: FileText },
];

// ─── Move objects (conceptual — on-chain when deployed) ───
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

  const wallet = useTrepaWallet();

  const [coinBalances, setCoinBalances] = useState<CoinBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalValue, setTotalValue] = useState('$0.00');

  // Fetch all real coin balances from testnet
  useEffect(() => {
    if (!wallet.address) {
      setCoinBalances([]);
      setTotalValue('$0.00');
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const balances = await fetchAllCoinBalances(wallet.address!);
        if (!cancelled) {
          setCoinBalances(balances);

          // Calculate approximate total value
          const suiBalance = balances.find(b => b.coinType === COIN_TYPES.SUI);
          const usdcBalance = balances.find(b => b.coinType === COIN_TYPES.USDC);

          // Approximate testnet prices for display
          const suiPrice = 3.0;
          const usdcPrice = 1.0;
          const totalSui = suiBalance ? parseFloat(suiBalance.balance) * suiPrice : 0;
          const totalUsdc = usdcBalance ? parseFloat(usdcBalance.balance) * usdcPrice : 0;
          setTotalValue(`$${(totalSui + totalUsdc).toFixed(2)}`);
        }
      } catch {
        // Keep existing values
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    // Poll every 15s
    const iv = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [wallet.address]);

  // Calculate 7d yield estimate (based on staking APR of ~6.2% on testnet)
  const suiBalanceNum = parseFloat(wallet.suiBalance) || 0;
  const weeklyYieldSui = (suiBalanceNum * 0.062) / 52;
  const weeklyYieldUsd = weeklyYieldSui * 3.0;

  const isNoWallet = !wallet.isConnected;

  return (
    <div className="min-h-screen bg-background transition-theme">
      <Navbar />

      <main className="pt-16">
          <div className="border-b border-border/50 bg-card/50 py-8 transition-theme">
          <div className="container max-w-2xl">
            <div className="flex items-center gap-2.5 mb-1">
              <img src="/images/sui-logo.png" alt="Sui" className="h-5 w-5" />
              <h1 className="font-display text-xl font-bold">Treasury</h1>
              <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">TESTNET</span>
            </div>
            <p className="text-sm text-muted-foreground">Self-funding treasury. Principal ringfenced. Only yield funds operations.</p>
          </div>
        </div>

        <div className="container max-w-2xl py-8 space-y-6">

          {/* No wallet banner */}
          {isNoWallet && (
            <Card className="border-primary/20 transition-theme">
              <CardContent className="p-5 flex items-center gap-3">
                <Wallet className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Connect your Sui wallet</p>
                  <p className="text-xs text-muted-foreground">Connect a wallet with testnet SUI to view your real on-chain balances.</p>
                </div>
                <a href="https://faucet.sui.io" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <Droplets className="h-3 w-3" />
                    Get Testnet SUI
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Overview — real data */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Balance', value: wallet.isConnected ? totalValue : '—', icon: Landmark },
              { label: 'SUI Balance', value: wallet.isConnected ? `${wallet.suiBalance} SUI` : '—', icon: Wallet },
              { label: 'USDC Balance', value: wallet.isConnected ? `${wallet.usdcBalance} USDC` : '—', icon: Shield },
              { label: 'Est. Weekly Yield', value: wallet.isConnected ? `~${weeklyYieldUsd.toFixed(2)}` : '—', icon: TrendingUp },
            ].map(s => (
              <Card key={s.label} className="transition-theme">
                <CardContent className="p-4 text-center">
                  <s.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                  <div className={cn('font-display text-lg font-bold', isLoading && 'opacity-50')}>
                    {isLoading && wallet.isConnected ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : s.value}
                  </div>
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
                  { label: 'Principal', sub: wallet.isConnected ? `${wallet.suiBalance} SUI` : '—', badge: 'Ringfenced', icon: Wallet },
                  { label: 'Yield', sub: wallet.isConnected ? '+6.2%' : '—', badge: 'Autonomous', icon: TrendingUp },
                  { label: 'Treasury', sub: wallet.isConnected ? `~${weeklyYieldUsd.toFixed(2)}/wk` : '—', badge: 'Move Objects', icon: Landmark },
                  { label: 'Operations', sub: wallet.isConnected ? `~${weeklyYieldSui.toFixed(4)} SUI` : '—', badge: 'Yield-Funded', icon: Zap },
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

          {/* Real coin balances from testnet */}
          <Card className="transition-theme">
            <CardContent className="p-5">
              <h2 className="font-display font-semibold text-sm flex items-center gap-1.5 mb-3">
                <Wallet className="h-4 w-4 text-primary" />
                Your Testnet Balances
                <span className="text-[10px] text-muted-foreground font-normal ml-1">(live from Sui testnet)</span>
              </h2>

              {!wallet.isConnected ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-xs">Connect a wallet to view your real testnet balances.</p>
                </div>
              ) : isLoading && coinBalances.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : coinBalances.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground mb-2">No token balances found on testnet.</p>
                  <a href="https://faucet.sui.io" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <Droplets className="h-3 w-3" />
                      Get Testnet SUI from Faucet
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {coinBalances.filter(b => parseFloat(b.balance) > 0).map(coin => (
                    <div key={coin.coinType} className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 transition-theme">
                      <div className="flex items-center gap-2">
                        <img
                          src={coin.coinType === COIN_TYPES.SUI ? '/images/sui-logo.png' : '/images/usdc-coin.png'}
                          alt=""
                          className="h-5 w-5"
                        />
                        <div>
                          <div className="text-sm font-medium">{coin.symbol}</div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">{coin.coinType}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{coin.balance}</div>
                        <div className="text-[10px] text-primary font-medium">
                          {coin.coinType === COIN_TYPES.SUI ? '6.2% APR' : '3.5% APR'}
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-primary flex-shrink-0" />
                    Ringfence Protection — principal cannot be withdrawn for operational costs.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Yield estimate */}
          <Card className="transition-theme">
            <CardContent className="p-5">
              <h2 className="font-display font-semibold text-sm flex items-center gap-1.5 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                Estimated Yield (7d)
              </h2>
              {!wallet.isConnected ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  Connect wallet to see yield estimates based on your real balance.
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    { name: 'Staking Rewards', amount: `${weeklyYieldSui.toFixed(6)} SUI`, from: 'SUI Staked' },
                    { name: 'Validator Fees', amount: `${(weeklyYieldSui * 0.08).toFixed(6)} SUI`, from: 'Validator Commission' },
                  ].map(e => (
                    <div key={e.name} className="flex items-center justify-between p-2.5 rounded-md bg-muted/50 transition-theme">
                      <div>
                        <div className="text-sm font-medium">{e.name}</div>
                        <div className="text-[11px] text-muted-foreground">from {e.from}</div>
                      </div>
                      <div className="text-sm font-semibold text-primary">{e.amount}</div>
                    </div>
                  ))}
                </div>
              )}
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

          {/* Faucet link for testnet */}
          <Card className="border-dashed transition-theme">
            <CardContent className="py-6 px-5 text-center">
              <Droplets className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">Need testnet tokens?</p>
              <p className="text-xs text-muted-foreground mb-3">Get free testnet SUI from the official faucet.</p>
              <a href="https://faucet.sui.io" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Sui Testnet Faucet
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
