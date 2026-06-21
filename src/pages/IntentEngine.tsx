import { useState, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FlowVisualization } from '@/components/flow/FlowVisualization';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { parseUserIntent, buildPTBFromIntent, buildStakeTransactionBlock, runGuardianChecks, getSeverityBg, useTrepaWallet } from '@/lib/sui';
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
  Droplets,
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
    <div className={cn('animate-in fade-in-0 slide-in-from-bottom-2 duration-500', className)}>
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
  const [execGasUsed, setExecGasUsed] = useState('');

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
    setExecGasUsed('');
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
    // Build the PTB description with real data (address is used for gas estimation context)
    const result = buildPTBFromIntent(parsed, wallet.address ?? '');
    setPtbResult(result);
    // Small delay for UX polish
    setTimeout(() => setStep('ptb'), 600);
  }, [parsed, wallet.address]);

  // Step 3: Run Guardian checks with real on-chain data
  const runGuardian = useCallback(async () => {
    if (!ptbResult || !parsed) return;
    setStep('guardian');
    setGuardianReport(null); // Show loading state while fetching

    try {
      const report = await runGuardianChecks(
        ptbResult.actions,
        parsed,
        wallet.address,
      );
      setGuardianReport(report);
    } catch {
      // Even if RPC fails, provide a basic report
      const report = await runGuardianChecks(ptbResult.actions, parsed);
      setGuardianReport(report);
    }
  }, [ptbResult, parsed, wallet.address]);

  // Step 4: Confirm & Execute
  const approve = useCallback(async () => {
    if (!ptbResult || !parsed) return;

    if (!wallet.isConnected) {
      // No wallet — show clear message
      setStep('executing');
      setExecStep(0);
      // Simulate a brief "connecting" animation, then show error
      const iv = setInterval(() => setExecStep(p => {
        if (p >= 1) { clearInterval(iv); return 1; }
        return p + 1;
      }), 400);
      setTimeout(() => {
        clearInterval(iv);
        setExecError('No Slush wallet connected. Install the Slush extension and switch to Testnet to execute real transactions.');
        setStep('done');
      }, 1000);
      return;
    }

    // Real execution via wallet
    setStep('executing');
    setExecStep(0);
    setExecError('');
    setExecDigest('');
    setExecGasUsed('');

    const progressIv = setInterval(() => setExecStep(p => {
      if (p >= 2) return 2; // Stop at "Waiting for wallet signature..."
      return p + 1;
    }), 600);

    try {
      // Find the primary action and build the appropriate transaction
      const stakeAction = ptbResult.actions.find(a => a.type === 'stake');
      const swapAction = ptbResult.actions.find(a => a.type === 'swap');

      let tx: unknown = null;

      if (stakeAction && wallet.address) {
        // Build a real staking transaction
        tx = await buildStakeTransactionBlock(
          wallet.address,
          stakeAction.amount,
        );
      } else if (swapAction && wallet.address) {
        // Swap requires DEX integration — explain limitation
        clearInterval(progressIv);
        setExecStep(3);
        setExecError('Swap execution requires DEX protocol integration (Turbos, Aftermath, or DeepBook) which is not yet deployed. Staking intents can be executed on-chain now.');
        setTimeout(() => setStep('done'), 800);
        return;
      }

      if (!tx) {
        clearInterval(progressIv);
        setExecStep(3);
        setExecError('Could not build on-chain transaction. Currently, only staking intents are supported for on-chain execution. Try "Stake X SUI" as your intent.');
        setTimeout(() => setStep('done'), 800);
        return;
      }

      // Execute via the wallet
      setExecStep(2); // "Waiting for wallet signature..."
      const result = await wallet.executeTransaction(tx);
      clearInterval(progressIv);

      if (result.success) {
        setExecStep(3);
        setExecDigest(result.digest);
        setExecGasUsed(result.gasUsed);
        setTimeout(() => setStep('done'), 800);
      } else {
        setExecStep(3);
        setExecError(result.error || 'Transaction failed');
        setTimeout(() => setStep('done'), 800);
      }
    } catch (err) {
      clearInterval(progressIv);
      setExecStep(3);
      setExecError(err instanceof Error ? err.message : 'Execution failed unexpectedly');
      setTimeout(() => setStep('done'), 800);
    }
  }, [ptbResult, parsed, wallet]);

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

        {/* Wallet mode banner */}
        {step === 'input' && (
          <div className="border-b border-primary/20 bg-primary/5">
            <div className="container max-w-2xl py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              {wallet.isConnected ? (
                <span>Wallet connected — <span className="text-primary font-medium">{wallet.shortAddress}</span> · On-chain execution enabled on testnet.</span>
              ) : (
                <span>Connect Slush for real on-chain execution on testnet, or explore the flow in demo mode.</span>
              )}
              {!wallet.isConnected && (
                <a href="https://faucet.sui.io" target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-primary hover:underline">
                  <Droplets className="h-3 w-3" />
                  Faucet
                </a>
              )}
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
                  {wallet.isConnected && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Wallet className="h-3 w-3 text-primary" />
                      <span>Wallet: <span className="text-primary font-medium">{wallet.shortAddress}</span> · Balance: <span className="font-mono">{wallet.suiBalance} SUI</span></span>
                    </div>
                  )}
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
                          {a.type === 'swap' ? <img src="/images/sui-logo.png" alt="" className="h-3.5 w-3.5" /> : a.type === 'stake' ? '◎' : a.type === 'lend' ? '↗' : '◆'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{a.label}</p>
                          <p className="text-[11px] text-muted-foreground">{a.description}</p>
                        </div>
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{a.type.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs flex-wrap">
                    <span className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                      <TrendingUp className="h-3 w-3" />
                      Est. Yield: {ptbResult.estimatedYield} APR
                    </span>
                    <span className="text-muted-foreground">Gas: {ptbResult.estimatedGas}</span>
                    {wallet.isConnected && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                        <Wallet className="h-3 w-3" />
                        SUI: {wallet.suiBalance}
                      </span>
                    )}
                  </div>
                  {/* Capability note */}
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-primary flex-shrink-0" />
                    {ptbResult.actions.some(a => a.type === 'stake')
                      ? 'Staking can be executed on-chain via your wallet.'
                      : 'Swap and lend require protocol integrations — currently only staking is executable on testnet.'}
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
                      <p className="text-xs text-muted-foreground">
                        {wallet.isConnected
                          ? 'Querying on-chain data for risk analysis...'
                          : 'Running risk analysis...'}
                      </p>
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
                            style={{ animationDelay: `${i * 100}ms` }}
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
                            <p className="text-[11px] text-muted-foreground ml-[22px]">{check.description}</p>
                            {check.recommendation && (
                              <p className="text-[10px] text-primary mt-1 ml-[22px]">→ {check.recommendation}</p>
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
                      ['Mode', wallet.isConnected ? 'On-Chain (Testnet)' : 'Demo Mode'],
                      ['Wallet Balance', wallet.isConnected ? `${wallet.suiBalance} SUI, ${wallet.usdcBalance} USDC` : 'Not connected'],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between items-center px-4 py-2.5">
                        <span className="text-xs text-muted-foreground">{l}</span>
                        <span className="text-xs font-medium text-right max-w-[60%]">{v}</span>
                      </div>
                    ))}
                  </div>
                  {!wallet.isConnected && (
                    <div className="rounded-md bg-primary/10 text-primary p-3 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold mb-1">
                        <Wallet className="h-3.5 w-3.5" />
                        No wallet connected
                      </div>
                      <p className="text-primary/80">
                        To execute real transactions on Sui testnet, connect a wallet. The approval step will prompt you to install one.
                        Alternatively, you can explore the full flow in demo mode.
                      </p>
                    </div>
                  )}
                  {wallet.isConnected && !ptbResult.actions.some(a => a.type === 'stake') && (
                    <div className="rounded-md bg-primary/10 text-primary p-3 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold mb-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Execution limitation
                      </div>
                      <p className="text-primary/80">
                        Only staking intents can be executed on-chain currently. Swap and lend require protocol integrations
                        that are not yet deployed. The flow will complete in demo mode for non-staking intents.
                      </p>
                    </div>
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
                    {wallet.isConnected ? 'Executing PTB on Sui testnet...' : 'Preparing execution...'}
                  </h2>
                  {[
                    'Building transaction...',
                    'Waiting for wallet signature...',
                    'Submitting to network...',
                    'Confirmed on-chain',
                  ].map((label, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-2 text-sm transition-all duration-300',
                        i <= execStep ? 'opacity-100' : 'opacity-0',
                      )}
                    >
                      {i <= execStep ? (
                        i < execStep ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )
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
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {execError
                        ? execError
                        : 'PTB executed successfully on Sui testnet. The transaction is now confirmed on-chain.'}
                    </p>
                    {!execError && (
                      <div className="w-full rounded-md bg-muted/50 divide-y divide-border/40 mt-2 transition-theme">
                        <div className="flex justify-between items-center px-4 py-2">
                          <span className="text-xs text-muted-foreground">Digest</span>
                          <span className="text-xs font-mono text-primary break-all">{execDigest || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2">
                          <span className="text-xs text-muted-foreground">Gas Used</span>
                          <span className="text-xs">{execGasUsed || ptbResult?.estimatedGas || '~0.002 SUI'}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2">
                          <span className="text-xs text-muted-foreground">Status</span>
                          <span className="text-xs font-semibold text-primary">SUCCESS</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2">
                          <span className="text-xs text-muted-foreground">Network</span>
                          <span className="text-xs">Sui Testnet</span>
                        </div>
                      </div>
                    )}
                    {!execError && execDigest && (
                      <a
                        href={`https://suiscan.xyz/testnet/tx/${execDigest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        View on SuiScan
                        <ChevronRight className="h-3 w-3" />
                      </a>
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
                            { icon: <TrendingUp className="h-4 w-4" />, label: 'Yield', value: `${ptbResult?.estimatedYield || '6.2%'} APR` },
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
