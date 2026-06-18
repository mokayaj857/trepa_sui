import { useState, useCallback, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FlowVisualization } from '@/components/flow/FlowVisualization';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Bot,
  Shield,
  Layers,
  Lock,
  Zap,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  Sparkles,
  Landmark,
  TrendingUp,
  Wallet,
} from 'lucide-react';

type Step = 'input' | 'parsing' | 'parsed' | 'ptb-gen' | 'ptb' | 'guardian' | 'confirm' | 'executing' | 'done';

const STEPS = [
  { id: 'intent', label: 'Intent', icon: <Bot className="h-4 w-4" /> },
  { id: 'ptb', label: 'PTB', icon: <Layers className="h-4 w-4" /> },
  { id: 'guardian', label: 'Guardian', icon: <Shield className="h-4 w-4" /> },
  { id: 'confirm', label: 'Confirm', icon: <Lock className="h-4 w-4" /> },
  { id: 'execute', label: 'Execute', icon: <Zap className="h-4 w-4" /> },
  { id: 'treasury', label: 'Treasury', icon: <Landmark className="h-4 w-4" /> },
];

const stepIndexMap: Record<Step, number> = {
  input: -1, parsing: 0, parsed: 0, 'ptb-gen': 1, ptb: 1, guardian: 2, confirm: 3, executing: 4, done: 5,
};

const examples = [
  'Invest 100 USDC into the safest yield on Sui',
  'Stake 50 SUI for maximum rewards',
  'Convert 200 USDC to SUI and stake it all',
];

interface ParsedIntent {
  goal: string;
  risk: string;
  amount: string;
  strategy: string[];
}

const mockPTB = [
  { id: 1, label: 'Convert 100 USDC into SUI', desc: 'Swap via DEX aggregator', type: 'SWAP' },
  { id: 2, label: 'Stake SUI to earn rewards', desc: 'Delegate to validator', type: 'STAKE' },
  { id: 3, label: 'Store staking position', desc: 'Mint stakedSUI receipt', type: 'DEPOSIT' },
];

const mockRisks = [
  { id: '1', severity: 'high' as const, title: 'High Slippage', desc: 'Swap may lose ~7.4% due to limited liquidity.', detail: 'Expected slippage: 7.4%' },
  { id: '2', severity: 'medium' as const, title: 'Concentration Risk', desc: '100% allocation to a single asset.', detail: 'Allocation: 100% SUI' },
  { id: '3', severity: 'low' as const, title: 'Stale Pool', desc: 'Low recent activity, additional execution risk.', detail: 'Pool activity: very low' },
];

/* ─── animated panel wrapper ─── */
function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('animate-in fade-in-0 slide-in-from-bottom-3 duration-400', className)}>
      {children}
    </div>
  );
}

export default function IntentEngine() {
  useSeoMeta({
    title: 'Intent Engine — Trepa',
    description: 'Describe a financial goal and watch Trepa translate it into an executable Sui PTB with risk analysis.',
  });

  const [step, setStep] = useState<Step>('input');
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedIntent | null>(null);
  const [risks, setRisks] = useState<typeof mockRisks>([]);
  const [progress, setProgress] = useState(0);
  const [execStep, setExecStep] = useState(0);

  const activeStepIdx = stepIndexMap[step];

  const flowSteps = STEPS.map((s, i) => ({
    ...s,
    active: i === activeStepIdx,
    done: i < activeStepIdx,
  }));

  const reset = useCallback(() => {
    setStep('input');
    setInput('');
    setParsed(null);
    setRisks([]);
    setProgress(0);
    setExecStep(0);
  }, []);

  const parse = useCallback(() => {
    if (!input.trim()) return;
    setStep('parsing');
    setProgress(0);
    const iv = setInterval(() => setProgress(p => { if (p >= 100) { clearInterval(iv); return 100; } return p + 4; }), 40);
    setTimeout(() => {
      clearInterval(iv);
      setProgress(100);
      const amt = input.match(/\d+/)?.[0] ?? '100';
      const low = /safe|low|conservative/i.test(input);
      const high = /high|max|aggressive/i.test(input);
      setParsed({
        goal: /stake/i.test(input) ? 'Stake for Rewards' : 'Generate Yield',
        risk: high ? 'High' : low ? 'Low' : 'Medium',
        amount: `${amt} ${/sui/i.test(input) && !/usdc/i.test(input) ? 'SUI' : 'USDC'}`,
        strategy: /convert|swap/i.test(input)
          ? ['Swap USDC → SUI', 'Stake SUI', 'Deposit into Yield']
          : /stake/i.test(input) && !/usdc/i.test(input)
          ? ['Stake SUI', 'Earn Rewards', 'Reinvest']
          : ['Swap USDC → SUI', 'Stake SUI', 'Mint Position'],
      });
      setStep('parsed');
    }, 1500);
  }, [input]);

  const genPTB = useCallback(() => {
    setStep('ptb-gen');
    setTimeout(() => setStep('ptb'), 1200);
  }, []);

  const runGuardian = useCallback(() => {
    setStep('guardian');
    setTimeout(() => setRisks(mockRisks), 600);
  }, []);

  const approve = useCallback(() => {
    setStep('executing');
    setExecStep(0);
    const iv = setInterval(() => {
      setExecStep(p => {
        if (p >= 3) { clearInterval(iv); return 3; }
        return p + 1;
      });
    }, 700);
    setTimeout(() => setStep('done'), 3200);
  }, []);

  return (
    <div className="min-h-screen bg-background transition-theme">
      <Navbar />

      <main className="pt-16">
        {/* Flow bar */}
        <div className="border-b border-border/50 bg-card/50 py-5 transition-theme">
          <div className="container max-w-2xl">
            <FlowVisualization steps={flowSteps} />
          </div>
        </div>

        <div className="container max-w-2xl py-8 space-y-0">
          {/* ─── INPUT ─── */}
          {step === 'input' && (
            <Panel>
              <Card className="transition-theme">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Describe your financial goal
                  </h2>
                  <Textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder='e.g., "Invest 100 USDC into the safest yield on Sui"'
                    className="min-h-[80px] text-base resize-none transition-theme"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {examples.map(ex => (
                      <button
                        key={ex}
                        onClick={() => setInput(ex)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={parse}
                    disabled={!input.trim()}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
                  >
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    Parse Intent
                  </Button>
                </CardContent>
              </Card>
            </Panel>
          )}

          {/* ─── PARSING ─── */}
          {step === 'parsing' && (
            <Panel>
              <Card className="transition-theme">
                <CardContent className="p-8 flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Analyzing intent...</p>
                  <div className="w-full max-w-[200px] h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />
                  </div>
                </CardContent>
              </Card>
            </Panel>
          )}

          {/* ─── PARSED ─── */}
          {step === 'parsed' && parsed && (
            <Panel>
              <Card className="transition-theme">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-display font-semibold flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Intent Understanding
                  </h2>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['Goal', parsed.goal],
                      ['Risk', parsed.risk],
                      ['Amount', parsed.amount],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-md bg-muted/50 p-3 transition-theme">
                        <div className="text-[10px] text-muted-foreground uppercase">{l}</div>
                        <div className="text-sm font-semibold mt-0.5">{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {parsed.strategy.map((s, i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        {i > 0 && <ChevronRight className="h-3 w-3" />}
                        <span>{s}</span>
                      </span>
                    ))}
                  </div>
                  <Button onClick={genPTB} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-150">
                    <Layers className="mr-1.5 h-4 w-4" />
                    Generate PTB
                  </Button>
                </CardContent>
              </Card>
            </Panel>
          )}

          {/* ─── PTB GENERATING ─── */}
          {step === 'ptb-gen' && (
            <Panel>
              <Card className="transition-theme">
                <CardContent className="p-8 flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Compiling PTB...</p>
                </CardContent>
              </Card>
            </Panel>
          )}

          {/* ─── PTB PREVIEW ─── */}
          {step === 'ptb' && (
            <Panel>
              <Card className="transition-theme">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-display font-semibold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Execution Plan
                  </h2>
                  <div className="space-y-2">
                    {mockPTB.map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50 transition-theme">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{a.id}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{a.label}</p>
                          <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                        </div>
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{a.type}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium w-fit">
                    <TrendingUp className="h-3 w-3" />
                    Est. Yield: 6.2% APR
                  </div>
                  <Button onClick={runGuardian} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-150">
                    <Shield className="mr-1.5 h-4 w-4" />
                    Run Guardian Analysis
                  </Button>
                </CardContent>
              </Card>
            </Panel>
          )}

          {/* ─── GUARDIAN ─── */}
          {step === 'guardian' && (
            <Panel>
              <Card className="transition-theme">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-display font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Guardian Risk Analysis
                  </h2>
                  {risks.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">Inspecting PTB...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {risks.map((r, i) => (
                        <div
                          key={r.id}
                          className={cn(
                            'rounded-md p-3 animate-in fade-in-0 slide-in-from-left-2 duration-300',
                            r.severity === 'high' && 'bg-destructive/10',
                            r.severity === 'medium' && 'bg-primary/10',
                            r.severity === 'low' && 'bg-muted/60',
                          )}
                          style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <AlertTriangle className={cn(
                              'h-3.5 w-3.5',
                              r.severity === 'high' && 'text-destructive',
                              r.severity === 'medium' && 'text-primary',
                              r.severity === 'low' && 'text-muted-foreground',
                            )} />
                            <span className={cn(
                              'text-xs font-semibold',
                              r.severity === 'high' && 'text-destructive',
                              r.severity === 'medium' && 'text-primary',
                              r.severity === 'low' && 'text-muted-foreground',
                            )}>
                              {r.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{r.detail}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground ml-5.5">{r.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {risks.length > 0 && (
                    <Button onClick={() => setStep('confirm')} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-150">
                      <Lock className="mr-1.5 h-4 w-4" />
                      Review & Confirm
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Panel>
          )}

          {/* ─── CONFIRM ─── */}
          {step === 'confirm' && parsed && (
            <Panel>
              <Card className="transition-theme">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-display font-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Execution Summary
                  </h2>
                  <div className="rounded-md bg-muted/50 divide-y divide-border/40 transition-theme">
                    {[
                      ['Goal', parsed.goal],
                      ['Amount', parsed.amount],
                      ['Actions', mockPTB.map(a => a.label).join(' → ')],
                      ['Risks', risks.map(r => r.title).join(', ')],
                      ['Est. Yield', '6.2% APR'],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between items-center px-4 py-2.5">
                        <span className="text-xs text-muted-foreground">{l}</span>
                        <span className="text-xs font-medium text-right max-w-[60%]">{v}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                    By approving, you acknowledge the risks. This action cannot be undone once executed on-chain.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={reset} className="active:scale-[0.97] transition-all duration-150">
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button onClick={approve} className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all duration-150">
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Panel>
          )}

          {/* ─── EXECUTING ─── */}
          {step === 'executing' && (
            <Panel>
              <Card className="transition-theme">
                <CardContent className="p-6 space-y-3">
                  <h2 className="font-display font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary animate-pulse" />
                    Executing PTB...
                  </h2>
                  {['PTB Signed', 'Swap Executed', 'Stake Executed', 'Deposit Complete'].map((label, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-2 text-sm transition-all duration-300',
                        i <= execStep ? 'opacity-100' : 'opacity-0',
                      )}
                    >
                      {i <= execStep ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                      {label}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </Panel>
          )}

          {/* ─── DONE ─── */}
          {step === 'done' && (
            <Panel>
              <div className="space-y-4">
                <Card className="border-primary/20 transition-theme">
                  <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="font-display font-bold text-xl">Transaction Complete</h2>
                    <p className="text-xs text-muted-foreground">PTB executed on Sui</p>
                    <div className="w-full rounded-md bg-muted/50 divide-y divide-border/40 mt-2 transition-theme">
                      <div className="flex justify-between items-center px-4 py-2">
                        <span className="text-xs text-muted-foreground">Digest</span>
                        <span className="text-xs font-mono text-primary">0xA3f2...8b9c</span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-2">
                        <span className="text-xs text-muted-foreground">Gas</span>
                        <span className="text-xs">0.002 SUI</span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-2">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <span className="text-xs font-semibold text-primary">SUCCESS</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="transition-theme">
                  <CardContent className="p-6">
                    <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-3">
                      <Landmark className="h-4 w-4 text-primary" />
                      Treasury Integration
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { icon: <Wallet className="h-4 w-4" />, label: 'Fees', value: '0.05 SUI' },
                        { icon: <TrendingUp className="h-4 w-4" />, label: 'Yield', value: '6.2% APR' },
                        { icon: <Landmark className="h-4 w-4" />, label: 'Treasury', value: '+0.12 SUI' },
                      ].map(item => (
                        <div key={item.label} className="text-center p-2 rounded-md bg-muted/50 transition-theme">
                          <div className="text-primary flex justify-center mb-1">{item.icon}</div>
                          <div className="text-[10px] text-muted-foreground">{item.label}</div>
                          <div className="text-xs font-bold font-display">{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3">
                      <span className="font-semibold text-primary">Chrysalis Model:</span> Yield flows into the protected treasury. Principal is ringfenced — only yield funds future operations.
                    </p>
                  </CardContent>
                </Card>

                <Card className="transition-theme">
                  <CardContent className="p-5">
                    <h4 className="text-xs font-semibold mb-2">Self-Funding Loop Activated</h4>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['Research', 'AI Inference', 'Monitoring', 'Data', 'Reports', 'Operations'].map(item => (
                        <div key={item} className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-muted/50 transition-theme">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span className="text-[10px] text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Button variant="outline" onClick={reset} className="w-full active:scale-[0.98] transition-all duration-150">
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Start New Intent
                </Button>
              </div>
            </Panel>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
