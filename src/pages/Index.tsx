import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FlowVisualization } from '@/components/flow/FlowVisualization';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Shield,
  Bot,
  Zap,
  Landmark,
  ChevronRight,
  Sparkles,
  Layers,
  Lock,
} from 'lucide-react';

export default function Index() {
  useSeoMeta({
    title: 'Trepa — The First Self-Funding Intent Engine on Sui',
    description: 'Describe a financial goal. Trepa translates it into executable Sui transactions, analyzes risks in plain English, waits for your approval, then executes and grows its treasury through autonomous yield generation.',
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sui/5 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-trepa/5 rounded-full blur-[128px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yield/3 rounded-full blur-[200px]" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sui/10 border border-sui/20 text-sui text-xs font-medium mb-8 animate-fade-in">
              <Sparkles className="h-3.5 w-3.5" />
              Built on Sui with Programmable Transaction Blocks
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-slide-up">
              Describe a goal.
              <br />
              <span className="gradient-text">Trepa executes it.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance animate-slide-up" style={{ animationDelay: '0.1s' }}>
              The first self-funding intent engine on Sui. Convert plain-English financial
              goals into executable PTBs, understand every risk before you approve, and
              watch your treasury grow autonomously.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/engine">
                <Button size="lg" className="gradient-sui text-white font-semibold px-8 h-12 glow-sui hover:opacity-90 transition-opacity">
                  Try the Intent Engine
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/treasury">
                <Button variant="outline" size="lg" className="px-8 h-12 border-border/50">
                  View Treasury
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Flow Visualization */}
          <div className="mt-20 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-center mb-8">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">The Required Flow</span>
            </div>
            <FlowVisualization />
          </div>
        </div>
      </section>

      {/* Example Journey Section */}
      <section className="py-20 relative">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              See it in action
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A user simply describes a financial goal. Trepa handles everything else.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="border-sui/20 bg-sui/5 overflow-hidden">
              <CardContent className="p-0">
                {/* User Input */}
                <div className="p-6 border-b border-border/30">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-sui/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sui text-xs font-bold">U</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-muted-foreground mb-1 block">User Intent</span>
                      <p className="text-foreground font-medium">
                        "Invest 100 USDC into the safest yield opportunity on Sui."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trepa Response Steps */}
                <div className="divide-y divide-border/30">
                  {/* Step 1: Intent Understanding */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-md bg-sui/20 flex items-center justify-center">
                        <Bot className="h-3.5 w-3.5 text-sui" />
                      </div>
                      <span className="font-display font-semibold text-sm text-sui">Step 1 — Intent Understanding</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 ml-8">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Goal</span>
                        <p className="text-sm font-medium">Generate Yield</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk</span>
                        <p className="text-sm font-medium">Low</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Amount</span>
                        <p className="text-sm font-medium">100 USDC</p>
                      </div>
                    </div>
                    <div className="ml-8 mt-3 rounded-lg bg-trepa/10 border border-trepa/20 p-3">
                      <span className="text-[10px] text-trepa uppercase tracking-wider font-medium">Strategy</span>
                      <div className="flex items-center gap-2 mt-1.5 text-sm">
                        <span className="text-foreground">Swap USDC → SUI</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground">Stake SUI</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground">Deposit into Yield Strategy</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: PTB Preview */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-md bg-trepa/20 flex items-center justify-center">
                        <Layers className="h-3.5 w-3.5 text-trepa" />
                      </div>
                      <span className="font-display font-semibold text-sm text-trepa">Step 2 — Human-Readable PTB Preview</span>
                    </div>
                    <div className="ml-8 space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="h-5 w-5 rounded-full bg-trepa/20 text-trepa text-xs flex items-center justify-center font-bold">1</span>
                        <span>Convert 100 USDC into SUI</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="h-5 w-5 rounded-full bg-trepa/20 text-trepa text-xs flex items-center justify-center font-bold">2</span>
                        <span>Stake SUI to earn rewards</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="h-5 w-5 rounded-full bg-trepa/20 text-trepa text-xs flex items-center justify-center font-bold">3</span>
                        <span>Store staking position in your wallet</span>
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yield/10 text-yield text-xs font-medium">
                        Estimated Yield: 6.2% APR
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Guardian */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-md bg-guardian/20 flex items-center justify-center">
                        <Shield className="h-3.5 w-3.5 text-guardian" />
                      </div>
                      <span className="font-display font-semibold text-sm text-guardian">Step 3 — Guardian Risk Analysis</span>
                    </div>
                    <div className="ml-8 space-y-2">
                      <div className="rounded-lg bg-warning/5 border border-warning/20 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                          <span className="text-xs font-semibold text-warning">High Slippage Warning</span>
                        </div>
                        <p className="text-xs text-muted-foreground">This swap may lose approximately 7.4% because liquidity is limited.</p>
                      </div>
                      <div className="rounded-lg bg-guardian/5 border border-guardian/20 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-guardian" />
                          <span className="text-xs font-semibold text-guardian">Concentration Warning</span>
                        </div>
                        <p className="text-xs text-muted-foreground">All funds will be invested in a single asset. A decline in SUI price could significantly impact your position.</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                          <span className="text-xs font-semibold text-muted-foreground">Stale Pool Warning</span>
                        </div>
                        <p className="text-xs text-muted-foreground">This pool has low recent activity and may carry additional execution risk.</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Confirmation */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-md bg-yield/20 flex items-center justify-center">
                        <Lock className="h-3.5 w-3.5 text-yield" />
                      </div>
                      <span className="font-display font-semibold text-sm text-yield">Step 4 — Explicit Confirmation</span>
                    </div>
                    <div className="ml-8">
                      <div className="rounded-lg bg-muted/30 border border-border/30 p-4 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Goal</span>
                          <span className="font-medium">Earn Yield</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Actions</span>
                          <span className="font-medium">Swap USDC → SUI, Stake SUI</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Risks</span>
                          <span className="font-medium text-warning">High Slippage, Single Asset</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <div className="px-3 py-1.5 rounded-md bg-yield/20 text-yield text-xs font-semibold">Approve</div>
                          <div className="px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-xs font-semibold">Cancel</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-trepa/5 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-yield/5 rounded-full blur-[128px]" />
        </div>

        <div className="container relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Why Trepa wins
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Other intent engines stop at execution. Trepa builds a self-sustaining loop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-sui/20 bg-card/50 hover:border-sui/40 transition-colors">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-lg bg-sui/10 flex items-center justify-center mb-4">
                  <Bot className="h-5 w-5 text-sui" />
                </div>
                <h3 className="font-display font-semibold mb-2">Intent-First Design</h3>
                <p className="text-sm text-muted-foreground">
                  Users describe goals, not transactions. The AI determines the best strategy
                  and compiles it into a Sui PTB automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="border-guardian/20 bg-card/50 hover:border-guardian/40 transition-colors">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-lg bg-guardian/10 flex items-center justify-center mb-4">
                  <Shield className="h-5 w-5 text-guardian" />
                </div>
                <h3 className="font-display font-semibold mb-2">Guardian Risk Layer</h3>
                <p className="text-sm text-muted-foreground">
                  Every PTB is inspected before execution. Slippage, concentration, and stale
                  pool risks are caught and explained in plain English.
                </p>
              </CardContent>
            </Card>

            <Card className="border-yield/20 bg-card/50 hover:border-yield/40 transition-colors">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-lg bg-yield/10 flex items-center justify-center mb-4">
                  <Zap className="h-5 w-5 text-yield" />
                </div>
                <h3 className="font-display font-semibold mb-2">Explicit Confirmation</h3>
                <p className="text-sm text-muted-foreground">
                  No auto-execution. Users see a full execution summary with risks before
                  approving. Cancel anytime before signing.
                </p>
              </CardContent>
            </Card>

            <Card className="border-trepa/20 bg-card/50 hover:border-trepa/40 transition-colors">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-lg bg-trepa/10 flex items-center justify-center mb-4">
                  <Landmark className="h-5 w-5 text-trepa" />
                </div>
                <h3 className="font-display font-semibold mb-2">Self-Funding Treasury</h3>
                <p className="text-sm text-muted-foreground">
                  Generated yield flows into an on-chain treasury stored as Move objects.
                  Yield never touches principal — it funds future agent operations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-sui/20 bg-card/50 hover:border-sui/40 transition-colors">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-lg bg-sui/10 flex items-center justify-center mb-4">
                  <Layers className="h-5 w-5 text-sui" />
                </div>
                <h3 className="font-display font-semibold mb-2">PTB Compilation</h3>
                <p className="text-sm text-muted-foreground">
                  Strategies compile into native Sui Programmable Transaction Blocks — atomic,
                  composable, and gas-efficient multi-step operations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-yield/20 bg-card/50 hover:border-yield/40 transition-colors">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-lg bg-yield/10 flex items-center justify-center mb-4">
                  <Lock className="h-5 w-5 text-yield" />
                </div>
                <h3 className="font-display font-semibold mb-2">Chrysalis + Ringfence</h3>
                <p className="text-sm text-muted-foreground">
                  Principal is ringfenced and never at risk. Only generated yield becomes
                  operational capital — the chrysalis model of sustainable funding.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-card/30 border-y border-border/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Beyond a simple swap
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Most intent engines stop at execution. Trepa builds a self-sustaining loop.
            </p>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Others */}
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-6">
                <h3 className="font-display font-semibold mb-4 text-destructive">Other Intent Engines</h3>
                <div className="space-y-3">
                  {['User Goal', 'Swap', 'Done'].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive">
                        {i + 1}
                      </div>
                      <span className="text-sm text-muted-foreground">{step}</span>
                      {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 ml-auto" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trepa */}
            <Card className="border-sui/30 bg-sui/5 glow-sui">
              <CardContent className="p-6">
                <h3 className="font-display font-semibold mb-4 text-sui">Trepa</h3>
                <div className="space-y-2">
                  {[
                    'User Goal',
                    'Intent Parsing',
                    'PTB Compilation',
                    'Guardian Analysis',
                    'Human Approval',
                    'Execution',
                    'Treasury Growth',
                    'Yield Generation',
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-sui/20 flex items-center justify-center text-[10px] font-bold text-sui">
                        {i + 1}
                      </div>
                      <span className="text-xs">{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sui/5 rounded-full blur-[160px]" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Ready to try the Intent Engine?
            </h2>
            <p className="text-muted-foreground mb-8 text-balance">
              Describe your financial goal and watch Trepa translate it into a complete,
              risk-analyzed execution plan on Sui.
            </p>
            <Link to="/engine">
              <Button size="lg" className="gradient-sui text-white font-semibold px-8 h-12 glow-sui hover:opacity-90 transition-opacity">
                Launch Intent Engine
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
