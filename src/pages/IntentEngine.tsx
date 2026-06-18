import { useState, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FlowVisualization } from '@/components/flow/FlowVisualization';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { parseUserIntent, buildPTBFromIntent, runGuardianChecks, getSeverityBg, useTrepaWallet } from '@/lib/sui';
import type { ParsedIntent, PTBResult, GuardianReport } from '@/lib/sui';
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
  'Lend 500 USDC for stable yield',
];

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
    description: 'Describe a financial goal and Trepa translates it into an executable Sui PTB with risk analysis.',
  });

  const wallet = useTrepaWallet();
  const isDemoMode = !wallet.isConnected;

  const [step, setStep] = useState<Step>('input');
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedIntent | null>(null);
  const [ptbResult, setPtbResult] = useState<PTBResult | null>(null);
  const [guardianReport, setGuardianReport] = useState<GuardianReport | null>(null);
  const [progress, setProgress] = useState(0);
  const [execStep, setExecStep] = useState(0);
  const [execDigest, setExecDigest] = useState('');
  const [execError, setExecError] = useState('');

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
    setPtbResult(null);
    setGuardianReport(null);
    setProgress(0);
    setExecStep(0);
    setExecDigest('');
    setExecError('');
  }, []);

  // Step 1: Parse the user's intent
  const parse = useCallback(() => {
    if (!input.trim()) return;
    setStep('parsing');
    setProgress(0);
    const iv = setInterval(() => setProgress(p => {
      if (p >= 100) { clearInterval(iv); return 100; }
      return p + 5;
    }), 40);
    setTimeout(() => {
      clearInterval(iv);
      setProgress(100);
      const result = parseUserIntent(input);
      setParsed(result);
      setStep('parsed');
    }, 1200);
  }, [input]);

  // Step 2: Build PTB from intent
  const genPTB = useCallback(() => {
    if (!parsed) return;
    setStep('ptb-gen');
    setTimeout(() => {
      const result = buildPTBFromIntent(parsed);
      setPtbResult(result);
      setStep('ptb');
    }, 1000);
  }, [parsed]);

  // Step 3: Run Guardian checks
  const runGuardian = useCallback(() => {
    if (!ptbResult || !parsed) return;
    setStep('guardian');
    setTimeout(() => {
      const report = runGuardianChecks(ptbResult.actions, parsed);
      setGuardianReport(report);
    }, 600);
  }, [ptbResult, parsed]);

  // Step 4: Confirm & Execute
  const approve = useCallback(async () => {
    if (!ptbResult) return;

    if (wallet.isConnected) {
      // Real execution via wallet
      setStep('executing');
      setExecStep(0);
      const iv = setInterval(() => setExecStep(p => p < 3 ? p + 1 : 3), 500);

      try {
        const result = await wallet.executePTB(ptbResult.ptb);
        clearInterval(iv);
        setExecStep(3);
        if (result.success) {
          setExecDigest(result.digest);
          setTimeout(() => setStep('done'), 800);
        } else {
          setExecError(result.error || 'Transaction failed');
          setTimeout(() => setStep('done'), 800);
        }
      } catch (err) {
        clearInterval(iv);
        setExecError(err instanceof Error ? err.message : 'Execution failed');
        setExecStep(3);
        setTimeout(() => setStep('done'), 800);
      }
    } else {
      // Demo mode — simulate execution
      setStep('executing');
      setExecStep(0);
      const iv = setInterval(() => setExecStep(p => {
        if (p >= 3) { clearInterval(iv); return 3; }
        return p + 1;
      }), 700);
      setTimeout(() => {
        setExecDigest('0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '...');
        setStep('done');
      }, 3200);
    }
  }, [ptbResult, wallet]);

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

        {/* Demo mode banner */}
        {isDemoMode && step === 'input' && (
          <div className="border-b border-primary/20 bg-primary/5">
            <div className="container max-w-2xl py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              <span>Connect a Sui wallet for on-chain execution, or try the demo mode below.</span>
            </div>
          </div>
        )}

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
                      ['Risk', parsed.riskLevel],
                      ['Amount', `${parsed.amount} ${parsed.token}`],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-md bg-muted/50 p-3 transition-theme">
                        <div className="text-[10px] text-muted-foreground uppercase">{l}</div>
                        <div className="text-sm font-semibold mt-0.5">{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
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
                  <p className="text-sm text-muted-foreground">Compiling PTB from strategy...</p>
                </CardContent>
              </Card>
            </Panel>
          )}

          {/* ─── PTB PREVIEW ─── */}
          {step === 'ptb' && ptbResult && (
            <Panel>
              <Card className="transition-theme">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-display font-semibold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Execution Plan
                  </h2>
                  <div className="space-y-2">
                    {ptbResult.actions.map(a => (
                      <div key={`${a.type}-${a.label}`} className="flex items-center gap-3 p-3 rounded-md bg-muted/50 transition-theme">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {a.type === 'swap' ? '⇄' : a.type === 'stake' ? '◎' : a.type === 'lend' ? '↗' : '◆'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{a.label}</p>
                          <p className="text-[11px] text-muted-foreground">{a.description}</p>
                        </div>
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{a.type.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                      <TrendingUp className="h-3 w-3" />
                      Est. Yield: {ptbResult.estimatedYield} APR
                    </span>
                    <span className="text-muted-foreground">Gas: {ptbResult.estimatedGas}</span>
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
                  {!guardianReport ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">Inspecting PTB for risks...</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {guardianReport.checks.map((check, i) => (
                          <div
                            key={check.id}
                            className={cn(
                              'rounded-md p-3 animate-in fade-in-0 slide-in-from-left-2 duration-300',
                              getSeverityBg(check.severity),
                            )}
                            style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <AlertTriangle className={cn(
                                'h-3.5 w-3.5',
                                check.severity === 'high' && 'text-destructive',
                                check.severity === 'medium' && 'text-primary',
                                check.severity === 'low' && 'text-muted-foreground',
                              )} />
                              <span className={cn(
                                'text-xs font-semibold',
                                check.severity === 'high' && 'text-destructive',
                                check.severity === 'medium' && 'text-primary',
                                check.severity === 'low' && 'text-muted-foreground',
                              )}>
                                {check.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-auto">{check.detail}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground ml-5.5">{check.description}</p>
                            {check.recommendation && (
                              <p className="text-[10px] text-primary mt-1 ml-5.5">→ {check.recommendation}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className={cn(
                        'rounded-md p-2.5 text-xs font-medium text-center',
                        guardianReport.overallRisk === 'low' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive',
                      )}>
                        {guardianReport.summary}
                      </div>
                      <Button
                        onClick={() => setStep('confirm')}
                        disabled={!guardianReport.canProceed}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
                      >
                        <Lock className="mr-1.5 h-4 w-4" />
                        Review & Confirm
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </Panel>
          )}

          {/* ─── CONFIRM ─── */}
          {step === 'confirm' && parsed && ptbResult && guardianReport && (
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
                      ['Amount', `${parsed.amount} ${parsed.token}`],
                      ['Actions', ptbResult.actions.map(a => a.label).join(' → ')],
                      ['Risks', guardianReport.checks.filter(c => c.severity !== 'low').map(c => c.title).join(', ') || 'None'],
                      ['Est. Yield', `${ptbResult.estimatedYield} APR`],
                      ['Mode', wallet.isConnected ? 'On-Chain (Wallet)' : 'Demo'],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between items-center px-4 py-2.5">
                        <span className="text-xs text-muted-foreground">{l}</span>
                        <span className="text-xs font-medium text-right max-w-[60%]">{v}</span>
                      </div>
                    ))}
                  </div>
                  {!wallet.isConnected && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Wallet className="h-3 w-3 text-primary flex-shrink-0" />
                      No wallet connected — this will simulate execution. Connect a wallet for on-chain execution.
                    </p>
                  )}
                  {guardianReport.checks.filter(c => c.severity === 'high' || c.severity === 'medium').length > 0 && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                      By approving, you acknowledge the risks listed above. This action cannot be undone.
                    </p>
                  )}
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
                    {wallet.isConnected ? 'Executing PTB on-chain...' : 'Simulating execution...'}
                  </h2>
                  {['PTB Signed', 'Transaction Submitted', 'Waiting for Finality', 'Confirmed'].map((label, i) => (
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
                  {wallet.isExecuting && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary mt-2" />
                  )}
                </CardContent>
              </Card>
            </Panel>
          )}

          {/* ─── DONE ─── */}
          {step === 'done' && (
            <Panel>
              <div className="space-y-4">
                <Card className={cn('transition-theme', !execError && 'border-primary/20')}>
                  <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                      {execError ? (
                        <XCircle className="h-7 w-7 text-destructive" />
                      ) : (
                        <CheckCircle2 className="h-7 w-7 text-primary" />
                      )}
                    </div>
                    <h2 className="font-display font-bold text-xl">
                      {execError ? 'Transaction Failed' : 'Transaction Complete'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {execError ? execError : wallet.isConnected ? 'PTB executed on Sui' : 'Demo execution complete'}
                    </p>
                    {!execError && (
                      <div className="w-full rounded-md bg-muted/50 divide-y divide-border/40 mt-2 transition-theme">
                        <div className="flex justify-between items-center px-4 py-2">
                          <span className="text-xs text-muted-foreground">Digest</span>
                          <span className="text-xs font-mono text-primary">{execDigest || '0xA3f2...8b9c'}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2">
                          <span className="text-xs text-muted-foreground">Gas</span>
                          <span className="text-xs">{ptbResult?.estimatedGas ?? '~0.002 SUI'}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2">
                          <span className="text-xs text-muted-foreground">Status</span>
                          <span className={cn('text-xs font-semibold', execError ? 'text-destructive' : 'text-primary')}>
                            {execError ? 'FAILED' : 'SUCCESS'}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!execError && (
                  <>
                    <Card className="transition-theme">
                      <CardContent className="p-6">
                        <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-3">
                          <Landmark className="h-4 w-4 text-primary" />
                          Treasury Integration
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { icon: <Wallet className="h-4 w-4" />, label: 'Fees', value: `${(parseFloat(parsed?.amount ?? '0') * 0.005).toFixed(4)} SUI` },
                            { icon: <TrendingUp className="h-4 w-4" />, label: 'Yield', value: `${ptbResult?.estimatedYield ?? '6.2%'} APR` },
                            { icon: <Landmark className="h-4 w-4" />, label: 'Treasury', value: `+${(parseFloat(parsed?.amount ?? '0') * 0.005).toFixed(4)} SUI` },
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
                  </>
                )}

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
