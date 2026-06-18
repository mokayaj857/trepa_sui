import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Shield,
  Bot,
  Zap,
  Landmark,
  Lock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { FlowVisualization } from '@/components/flow/FlowVisualization';
import { useEffect, useState } from 'react';

/* ─── animated counter hook ─── */
function useCounter(end: number, duration = 2000, startOnMount = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startOnMount) return;
    let raf: number;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setCount(Math.round(t * end));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, startOnMount]);
  return count;
}

/* ─── flow steps data ─── */
const flowStepsData = [
  { id: 'intent', label: 'Intent', icon: <Bot className="h-4 w-4" /> },
  { id: 'ptb', label: 'PTB', icon: <Layers className="h-4 w-4" /> },
  { id: 'guardian', label: 'Guardian', icon: <Shield className="h-4 w-4" /> },
  { id: 'confirm', label: 'Confirm', icon: <Lock className="h-4 w-4" /> },
  { id: 'execute', label: 'Execute', icon: <Zap className="h-4 w-4" /> },
  { id: 'treasury', label: 'Treasury', icon: <Landmark className="h-4 w-4" /> },
];

export default function Index() {
  useSeoMeta({
    title: 'Trepa — The First Self-Funding Intent Engine on Sui',
    description: 'Describe a financial goal. Trepa translates it into executable Sui transactions, analyzes risks, requires your approval, then executes and grows its treasury through autonomous yield.',
  });

  const [heroVisible, setHeroVisible] = useState(false);
  const [flowActive, setFlowActive] = useState(0);
  const stepsCounter = useCounter(6, 1500, heroVisible);
  const risksCounter = useCounter(3, 1200, heroVisible);

  useEffect(() => {
    setHeroVisible(true);
  }, []);

  /* auto-advance flow demo */
  useEffect(() => {
    const iv = setInterval(() => {
      setFlowActive(prev => (prev + 1) % (flowStepsData.length + 1));
    }, 1200);
    return () => clearInterval(iv);
  }, []);

  const flowSteps = flowStepsData.map((s, i) => ({
    ...s,
    active: i === flowActive,
    done: i < flowActive,
  }));

  return (
    <div className="min-h-screen bg-background transition-theme">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div
              className={cn(
                'transition-all duration-700 ease-out',
                heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
              )}
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                <img src="/images/sui-logo.png" alt="Sui" className="h-3.5 w-3.5" />
                Built on Sui
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
                Describe a goal.
                <br />
                <span className="text-primary">Trepa executes it.</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
                The first self-funding intent engine on Sui. Plain-English goals become
                executable PTBs with risk analysis, user approval, and autonomous treasury growth.
              </p>

              <div className="flex items-center gap-3">
                <Link to="/engine">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all duration-150">
                    Try the Engine
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/treasury">
                  <Button variant="outline" size="lg" className="transition-all duration-150">
                    Treasury
                    <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero image */}
            <div
              className={cn(
                'relative transition-all duration-700 delay-200 ease-out',
                heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
              )}
            >
              <div className="relative rounded-xl overflow-hidden border border-border/30 shadow-lg">
                <img
                  src="/images/sui-hero.jpeg"
                  alt="Sui ecosystem"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <img src="/images/usdc-coin.png" alt="USDC" className="h-8 w-8" />
                    <img src="/images/sui-logo.png" alt="SUI" className="h-7 w-7" />
                    <span className="text-xs font-medium text-primary-foreground bg-background/60 backdrop-blur-sm rounded-md px-2 py-1">
                      Swap · Stake · Lend
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            className={cn(
              'grid grid-cols-3 gap-4 mt-14 transition-all duration-700 delay-300',
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            )}
          >
            {[
              { label: 'Flow Steps', value: stepsCounter, icon: <Layers className="h-4 w-4 text-primary" /> },
              { label: 'Risk Checks', value: risksCounter, icon: <Shield className="h-4 w-4 text-primary" /> },
              { label: 'Human Approval', value: 'Required', icon: <Lock className="h-4 w-4 text-primary" /> },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-1">{stat.icon}</div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {typeof stat.value === 'number' ? stat.value : stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Flow Demo ─── */}
      <section className="py-16 border-y border-border/50 bg-card/50 transition-theme">
        <div className="container max-w-3xl">
          <p className="text-xs text-muted-foreground text-center uppercase tracking-wider font-medium mb-6">The Required Flow</p>
          <FlowVisualization steps={flowSteps} />
        </div>
      </section>

      {/* ─── Example Walkthrough ─── */}
      <section className="py-16 sm:py-24">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">See it in action</h2>
          <p className="text-muted-foreground mb-8">A user describes a goal. Trepa handles the rest.</p>

          <div className="space-y-4">
            {/* User Input */}
            <Card className="overflow-hidden transition-theme">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-xs font-bold">U</span>
                  </div>
                  <p className="text-sm font-medium pt-1">
                    "Invest 100 USDC into the safest yield opportunity on Sui."
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Steps */}
            {[
              {
                step: 1,
                title: 'Intent Understanding',
                icon: <Bot className="h-4 w-4" />,
                content: (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['Goal', 'Generate Yield'],
                        ['Risk', 'Low'],
                        ['Amount', '100 USDC'],
                      ].map(([label, val]) => (
                        <div key={label} className="rounded-md bg-muted/50 p-2.5">
                          <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
                          <div className="text-xs font-semibold mt-0.5 flex items-center gap-1">
                            {label === 'Amount' && <img src="/images/usdc-coin.png" alt="" className="h-3.5 w-3.5" />}
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>Swap USDC → SUI</span>
                      <ChevronRight className="h-3 w-3" />
                      <span>Stake SUI</span>
                      <ChevronRight className="h-3 w-3" />
                      <span>Deposit into Yield</span>
                    </div>
                  </div>
                ),
              },
              {
                step: 2,
                title: 'Human-Readable PTB Preview',
                icon: <Layers className="h-4 w-4" />,
                content: (
                  <div className="space-y-2">
                    {['Convert 100 USDC into SUI', 'Stake SUI to earn rewards', 'Store position in your wallet'].map((action, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        {action}
                      </div>
                    ))}
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium mt-1">
                      Est. Yield: 6.2% APR
                    </div>
                  </div>
                ),
              },
              {
                step: 3,
                title: 'Guardian Risk Analysis',
                icon: <Shield className="h-4 w-4" />,
                content: (
                  <div className="space-y-2">
                    {[
                      { severity: 'high', label: 'High Slippage', desc: 'Swap may lose ~7.4% due to limited liquidity' },
                      { severity: 'medium', label: 'Concentration Risk', desc: '100% allocation to single asset' },
                      { severity: 'low', label: 'Stale Pool', desc: 'Low recent activity, additional execution risk' },
                    ].map(r => (
                      <div key={r.label} className={cn(
                        'rounded-md p-2.5 text-xs',
                        r.severity === 'high' && 'bg-destructive/10 text-destructive',
                        r.severity === 'medium' && 'bg-primary/10 text-primary',
                        r.severity === 'low' && 'bg-muted text-muted-foreground',
                      )}>
                        <span className="font-semibold">{r.label}</span>
                        <span className="mx-1.5">·</span>
                        <span className="opacity-80">{r.desc}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                step: 4,
                title: 'Explicit Confirmation',
                icon: <Lock className="h-4 w-4" />,
                content: (
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">Approve</div>
                    <div className="rounded-md bg-muted text-muted-foreground px-3 py-1 text-xs font-medium">Cancel</div>
                    <span className="text-[10px] text-muted-foreground ml-2">User must sign before execution</span>
                  </div>
                ),
              },
            ].map(({ step, title, icon, content }) => (
              <Card key={step} className="overflow-hidden transition-theme">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
                    <span className="text-xs font-semibold text-primary">Step {step} — {title}</span>
                  </div>
                  {content}
                </CardContent>
              </Card>
            ))}

            {/* Treasury integration */}
            <Card className="overflow-hidden border-primary/20 transition-theme">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-primary">Treasury Integration — The Innovation</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generated yield flows into a protected on-chain treasury. Principal is ringfenced.
                  Only yield becomes operational capital — funding research, AI inference, monitoring,
                  and future agent operations. This is the self-funding loop.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Sui Ecosystem ─── */}
      <section className="py-16 border-t border-border/50 transition-theme">
        <div className="container max-w-5xl">
          <div className="text-center mb-8">
            <img src="/images/sui-logo.png" alt="Sui" className="h-8 w-8 mx-auto mb-3" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">Built for the Sui Ecosystem</h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Trepa leverages Sui's parallel execution, PTB composability, and Move object model to power the self-funding loop.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { src: '/images/navi-protocol.jpeg', title: 'NAVI Protocol', desc: 'Lending & borrowing on Sui' },
              { src: '/images/sui-network-1.jpeg', title: 'Sui Network', desc: 'Parallel execution engine' },
              { src: '/images/sui-network-2.jpeg', title: 'DeFi Ecosystem', desc: 'Swap, stake, lend on Sui' },
            ].map(item => (
              <Card key={item.title} className="overflow-hidden transition-theme hover:border-primary/30 transition-colors duration-200">
                <div className="h-32 overflow-hidden">
                  <img src={item.src} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-3">
                  <h3 className="font-display font-semibold text-xs">{item.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-16 sm:py-24 border-t border-border/50 transition-theme">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">What makes Trepa different</h2>
          <p className="text-muted-foreground mb-8">Other intent engines stop at execution. Trepa builds a self-sustaining loop.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: <Bot className="h-5 w-5" />, title: 'Intent-First', desc: 'Users describe goals, not transactions. The AI determines strategy and compiles a Sui PTB.' },
              { icon: <Shield className="h-5 w-5" />, title: 'Guardian Layer', desc: 'Every PTB is inspected for slippage, concentration, and stale pool risks before execution.' },
              { icon: <Lock className="h-5 w-5" />, title: 'Explicit Approval', desc: 'No auto-execution. Users review the full plan and risks, then approve or cancel.' },
              { icon: <Landmark className="h-5 w-5" />, title: 'Self-Funding Treasury', desc: 'Yield flows into an on-chain treasury. Principal stays ringfenced. Only yield funds operations.' },
              { icon: <Layers className="h-5 w-5" />, title: 'Native PTBs', desc: 'Strategies compile into Sui Programmable Transaction Blocks — atomic, composable, gas-efficient.' },
              { icon: <Zap className="h-5 w-5" />, title: 'Chrysalis Model', desc: 'Yield metamorphoses into operational capacity. As the treasury grows, so does the agent.' },
            ].map(feat => (
              <Card key={feat.title} className="transition-theme hover:border-primary/30 transition-colors duration-200">
                <CardContent className="p-5">
                  <div className="text-primary mb-3">{feat.icon}</div>
                  <h3 className="font-display font-semibold text-sm mb-1">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 sm:py-24">
        <div className="container max-w-3xl text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">Ready to try it?</h2>
          <p className="text-muted-foreground mb-6">Describe your financial goal and watch Trepa translate it into a complete execution plan.</p>
          <Link to="/engine">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all duration-150">
              Launch Intent Engine
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
