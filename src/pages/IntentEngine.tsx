import { useState, useCallback, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FlowVisualization } from '@/components/flow/FlowVisualization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';
import {
  Bot,
  Shield,
  Layers,
  Lock,
  Zap,
  ChevronRight,
  ArrowRight,
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

type EngineStep = 'input' | 'parsing' | 'parsed' | 'ptb-generating' | 'ptb-preview' | 'guardian' | 'confirm' | 'executing' | 'complete';

interface ParsedIntent {
  goal: string;
  riskLevel: string;
  amount: string;
  strategy: string[];
}

interface RiskCheck {
  id: string;
  type: 'slippage' | 'concentration' | 'stale-pool';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  details: string;
}

interface PTBAction {
  id: number;
  label: string;
  description: string;
  type: 'swap' | 'stake' | 'deposit';
}

const exampleIntents = [
  'Invest 100 USDC into the safest yield opportunity on Sui',
  'Stake 50 SUI for maximum rewards',
  'Convert 200 USDC to SUI and stake it all',
  'Find the best yield for 500 USDC with low risk',
];

const mockParsedIntents: Record<string, ParsedIntent> = {
  default: {
    goal: 'Generate Yield',
    riskLevel: 'Low',
    amount: '100 USDC',
    strategy: ['Swap USDC → SUI', 'Stake SUI', 'Deposit into Yield Strategy'],
  },
};

const mockPTBActions: PTBAction[] = [
  { id: 1, label: 'Convert 100 USDC into SUI', description: 'Swap USDC for SUI via DEX aggregator', type: 'swap' },
  { id: 2, label: 'Stake SUI to earn rewards', description: 'Delegate SUI to validator for staking rewards', type: 'stake' },
  { id: 3, label: 'Store staking position in your wallet', description: 'Mint stakedSUI position object', type: 'deposit' },
];

const mockRiskChecks: RiskCheck[] = [
  {
    id: '1',
    type: 'slippage',
    severity: 'high',
    title: 'High Slippage Warning',
    description: 'This swap may lose approximately 7.4% because liquidity is limited.',
    details: 'Expected Slippage: 7.4%',
  },
  {
    id: '2',
    type: 'concentration',
    severity: 'medium',
    title: 'Concentration Warning',
    description: 'All funds will be invested in a single asset. A decline in SUI price could significantly impact your position.',
    details: '100% allocation to SUI',
  },
  {
    id: '3',
    type: 'stale-pool',
    severity: 'low',
    title: 'Stale Pool Warning',
    description: 'This pool has low recent activity and may carry additional execution risk.',
    details: 'Pool activity: Very low',
  },
];

const stepFlowMap: Record<EngineStep, string | null> = {
  input: null,
  parsing: 'intent',
  parsed: 'intent',
  'ptb-generating': 'ptb',
  'ptb-preview': 'ptb',
  guardian: 'guardian',
  confirm: 'confirm',
  executing: 'execute',
  complete: 'treasury',
};

export default function IntentEngine() {
  const [step, setStep] = useState<EngineStep>('input');
  const [userInput, setUserInput] = useState('');
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);
  const [ptbActions, setPtbActions] = useState<PTBAction[]>([]);
  const [riskChecks, setRiskChecks] = useState<RiskCheck[]>([]);
  const [estimatedYield, setEstimatedYield] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  const activeFlowStep = stepFlowMap[step];

  const reset = useCallback(() => {
    setStep('input');
    setUserInput('');
    setParsedIntent(null);
    setPtbActions([]);
    setRiskChecks([]);
    setEstimatedYield('');
    setLoadingProgress(0);
  }, []);

  const handleParse = useCallback(() => {
    if (!userInput.trim()) return;
    setStep('parsing');
    setLoadingProgress(0);

    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      setLoadingProgress(100);

      // Parse the user input to determine intent
      const input = userInput.toLowerCase();
      let parsed: ParsedIntent;

      if (input.includes('stake') && input.includes('sui') && !input.includes('usdc') && !input.includes('convert')) {
        parsed = {
          goal: 'Stake for Rewards',
          riskLevel: 'Low',
          amount: input.match(/\d+/)?.[0] ? `${input.match(/\d+/)![0]} SUI` : '50 SUI',
          strategy: ['Stake SUI', 'Earn Staking Rewards', 'Reinvest Rewards'],
        };
      } else if (input.includes('convert') || input.includes('swap')) {
        parsed = {
          goal: 'Convert & Stake',
          riskLevel: 'Medium',
          amount: input.match(/\d+/)?.[0] ? `${input.match(/\d+/)![0]} USDC` : '200 USDC',
          strategy: ['Swap USDC → SUI', 'Stake SUI', 'Deposit into Yield Strategy'],
        };
      } else if (input.includes('high') && input.includes('yield') || input.includes('max')) {
        parsed = {
          goal: 'Maximize Yield',
          riskLevel: 'High',
          amount: input.match(/\d+/)?.[0] ? `${input.match(/\d+/)![0]} USDC` : '300 USDC',
          strategy: ['Swap USDC → vSUI', 'Provide Liquidity', 'Farm Yield Rewards'],
        };
      } else {
        parsed = {
          ...mockParsedIntents.default,
          amount: input.match(/\d+/)?.[0] ? `${input.match(/\d+/)![0]} USDC` : '100 USDC',
        };
      }

      setParsedIntent(parsed);
      setStep('parsed');
    }, 2000);
  }, [userInput]);

  const handleGeneratePTB = useCallback(() => {
    setStep('ptb-generating');
    setTimeout(() => {
      setPtbActions(mockPTBActions);
      setEstimatedYield('6.2% APR');
      setStep('ptb-preview');
    }, 1500);
  }, []);

  const handleGuardianCheck = useCallback(() => {
    setStep('guardian');
    setTimeout(() => {
      setRiskChecks(mockRiskChecks);
    }, 500);
  }, []);

  const handleConfirm = useCallback(() => {
    setStep('confirm');
  }, []);

  const handleApprove = useCallback(() => {
    setStep('executing');
    setTimeout(() => {
      setStep('complete');
    }, 3000);
  }, []);

  // Auto-advance guardian check
  useEffect(() => {
    if (step === 'guardian' && riskChecks.length === 0) {
      const timer = setTimeout(() => {
        setRiskChecks(mockRiskChecks);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, riskChecks.length]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        {/* Flow Visualization Bar */}
        <div className="border-b border-border/30 bg-card/30 py-6">
          <div className="container max-w-5xl">
            <FlowVisualization activeStep={activeFlowStep} compact />
          </div>
        </div>

        <div className="container max-w-4xl py-8">
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6 text-sm">
            <span className={cn('font-medium', step === 'input' ? 'text-primary' : 'text-muted-foreground')}>
              {step === 'input' ? 'Describe your intent' : 'Intent captured'}
            </span>
            {step !== 'input' && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                <span className={cn('font-medium', ['parsing', 'parsed'].includes(step) ? 'text-primary' : 'text-muted-foreground')}>
                  Parse
                </span>
              </>
            )}
            {['ptb-generating', 'ptb-preview', 'guardian', 'confirm', 'executing', 'complete'].includes(step) && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                <span className={cn('font-medium', ['ptb-generating', 'ptb-preview'].includes(step) ? 'text-primary' : 'text-muted-foreground')}>
                  PTB
                </span>
              </>
            )}
            {['guardian', 'confirm', 'executing', 'complete'].includes(step) && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                <span className={cn('font-medium', step === 'guardian' ? 'text-primary' : 'text-muted-foreground')}>
                  Guardian
                </span>
              </>
            )}
            {['confirm', 'executing', 'complete'].includes(step) && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                <span className={cn('font-medium', step === 'confirm' ? 'text-primary' : 'text-muted-foreground')}>
                  Confirm
                </span>
              </>
            )}
            {['executing', 'complete'].includes(step) && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                <span className={cn('font-medium', step === 'executing' ? 'text-primary' : 'text-muted-foreground')}>
                  Execute
                </span>
              </>
            )}
            {step === 'complete' && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                <span className="font-medium text-yield">Treasury</span>
              </>
            )}
          </div>

          {/* STEP 1: Intent Input */}
          {step === 'input' && (
            <Card className="border-sui/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <div className="h-8 w-8 rounded-lg bg-sui/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-sui" />
                  </div>
                  Describe Your Financial Goal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="e.g., Invest 100 USDC into the safest yield opportunity on Sui"
                    className="min-h-[100px] text-base resize-none bg-muted/30 border-border/50 focus:border-sui/50"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Try an example:</span>
                  <div className="flex flex-wrap gap-2">
                    {exampleIntents.map((example) => (
                      <button
                        key={example}
                        onClick={() => setUserInput(example)}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted/50 border border-border/30 text-muted-foreground hover:text-foreground hover:border-sui/30 transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleParse}
                  disabled={!userInput.trim()}
                  size="lg"
                  className="w-full gradient-sui text-white font-semibold glow-sui hover:opacity-90"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Parse Intent
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Parsing */}
          {step === 'parsing' && (
            <Card className="border-sui/20">
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-14 w-14 rounded-xl gradient-sui flex items-center justify-center animate-pulse-glow">
                    <Bot className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-display font-semibold text-lg mb-1">Analyzing your intent...</h3>
                    <p className="text-sm text-muted-foreground">Extracting goal, risk preference, and amount</p>
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-sui transition-all duration-100"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">Parsing</span>
                      <span className="text-[10px] text-muted-foreground">{loadingProgress}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: Parsed Intent */}
          {step === 'parsed' && parsedIntent && (
            <div className="space-y-6">
              <Card className="border-sui/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <div className="h-8 w-8 rounded-lg bg-sui/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-sui" />
                    </div>
                    Step 1 — Intent Understanding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-sui/5 border border-sui/20 p-4">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Goal</span>
                      <p className="text-sm font-semibold mt-1">{parsedIntent.goal}</p>
                    </div>
                    <div className="rounded-lg bg-sui/5 border border-sui/20 p-4">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Preference</span>
                      <p className="text-sm font-semibold mt-1">{parsedIntent.riskLevel}</p>
                    </div>
                    <div className="rounded-lg bg-sui/5 border border-sui/20 p-4">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Amount</span>
                      <p className="text-sm font-semibold mt-1">{parsedIntent.amount}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-trepa/5 border border-trepa/20 p-4">
                    <span className="text-[10px] text-trepa uppercase tracking-wider font-medium">Determined Strategy</span>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {parsedIntent.strategy.map((s, i) => (
                        <span key={i} className="flex items-center gap-2">
                          <Badge variant="outline" className="border-trepa/30 text-trepa bg-trepa/5">
                            {s}
                          </Badge>
                          {i < parsedIntent.strategy.length - 1 && (
                            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleGeneratePTB}
                size="lg"
                className="w-full gradient-sui text-white font-semibold glow-sui hover:opacity-90"
              >
                <Layers className="mr-2 h-4 w-4" />
                Generate PTB
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* STEP 4: PTB Generating */}
          {step === 'ptb-generating' && (
            <Card className="border-trepa/20">
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-14 w-14 rounded-xl gradient-sui flex items-center justify-center animate-pulse-glow">
                    <Layers className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-display font-semibold text-lg mb-1">Compiling PTB...</h3>
                    <p className="text-sm text-muted-foreground">Building Programmable Transaction Block from strategy</p>
                  </div>
                  <div className="space-y-2 w-full max-w-sm">
                    {['Swap transaction', 'Stake transaction', 'Deposit transaction'].map((label, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 5: PTB Preview */}
          {step === 'ptb-preview' && (
            <div className="space-y-6">
              <Card className="border-trepa/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <div className="h-8 w-8 rounded-lg bg-trepa/10 flex items-center justify-center">
                      <Layers className="h-4 w-4 text-trepa" />
                    </div>
                    Step 2 — Execution Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ptbActions.map((action) => (
                    <div key={action.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/20">
                      <div className={cn(
                        'h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0',
                        action.type === 'swap' && 'bg-sui/20 text-sui',
                        action.type === 'stake' && 'bg-yield/20 text-yield',
                        action.type === 'deposit' && 'bg-trepa/20 text-trepa',
                      )}>
                        {action.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{action.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        'text-[10px]',
                        action.type === 'swap' && 'border-sui/30 text-sui',
                        action.type === 'stake' && 'border-yield/30 text-yield',
                        action.type === 'deposit' && 'border-trepa/30 text-trepa',
                      )}>
                        {action.type.toUpperCase()}
                      </Badge>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-8 px-3 rounded-lg bg-yield/10 border border-yield/20 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-yield" />
                      <span className="text-xs font-semibold text-yield">Estimated Yield: {estimatedYield}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleGuardianCheck}
                size="lg"
                className="w-full font-semibold border-2 border-guardian/50 bg-guardian/10 text-guardian hover:bg-guardian/20"
              >
                <Shield className="mr-2 h-4 w-4" />
                Run Guardian Risk Analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* STEP 6: Guardian Risk Analysis */}
          {step === 'guardian' && (
            <div className="space-y-6">
              <Card className="border-guardian/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <div className="h-8 w-8 rounded-lg bg-guardian/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-guardian" />
                    </div>
                    Step 3 — Guardian Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {riskChecks.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-guardian" />
                      <p className="text-sm text-muted-foreground">Inspecting PTB for risks...</p>
                    </div>
                  ) : (
                    riskChecks.map((check) => (
                      <div
                        key={check.id}
                        className={cn(
                          'rounded-lg border p-4 animate-slide-in-right',
                          check.severity === 'high' && 'bg-warning/5 border-warning/20',
                          check.severity === 'medium' && 'bg-guardian/5 border-guardian/20',
                          check.severity === 'low' && 'bg-muted/30 border-border/30',
                        )}
                        style={{ animationDelay: `${parseInt(check.id) * 150}ms` }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0',
                            check.severity === 'high' && 'bg-warning/20',
                            check.severity === 'medium' && 'bg-guardian/20',
                            check.severity === 'low' && 'bg-muted/50',
                          )}>
                            {check.severity === 'high' && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                            {check.severity === 'medium' && <AlertTriangle className="h-3.5 w-3.5 text-guardian" />}
                            {check.severity === 'low' && <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                'text-xs font-semibold',
                                check.severity === 'high' && 'text-warning',
                                check.severity === 'medium' && 'text-guardian',
                                check.severity === 'low' && 'text-muted-foreground',
                              )}>
                                {check.title}
                              </span>
                              <Badge variant="outline" className={cn(
                                'text-[9px] px-1.5',
                                check.severity === 'high' && 'border-warning/30 text-warning',
                                check.severity === 'medium' && 'border-guardian/30 text-guardian',
                                check.severity === 'low' && 'border-border/30 text-muted-foreground',
                              )}>
                                {check.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{check.description}</p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">{check.details}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {riskChecks.length > 0 && (
                    <div className="flex items-center gap-2 pt-2">
                      <Badge className="bg-guardian/10 text-guardian border-guardian/20">
                        <Shield className="h-3 w-3 mr-1" />
                        3 Risk Checks Complete
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {riskChecks.length > 0 && (
                <Button
                  onClick={handleConfirm}
                  size="lg"
                  className="w-full gradient-sui text-white font-semibold glow-sui hover:opacity-90"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Review & Confirm
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* STEP 7: Confirmation */}
          {step === 'confirm' && parsedIntent && (
            <div className="space-y-6">
              <Card className="border-yield/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <div className="h-8 w-8 rounded-lg bg-yield/10 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-yield" />
                    </div>
                    Step 4 — Execution Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-muted/30 border border-border/30 divide-y divide-border/20">
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs text-muted-foreground">Goal</span>
                      <span className="text-sm font-semibold">{parsedIntent.goal}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs text-muted-foreground">Amount</span>
                      <span className="text-sm font-semibold">{parsedIntent.amount}</span>
                    </div>
                    <div className="flex justify-between items-start px-4 py-3">
                      <span className="text-xs text-muted-foreground">Actions</span>
                      <div className="flex flex-col items-end gap-1">
                        {ptbActions.map((a) => (
                          <span key={a.id} className="text-xs font-medium">{a.label}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-start px-4 py-3">
                      <span className="text-xs text-muted-foreground">Risks</span>
                      <div className="flex flex-col items-end gap-1">
                        {riskChecks.map((r) => (
                          <span key={r.id} className={cn(
                            'text-xs font-medium',
                            r.severity === 'high' && 'text-warning',
                            r.severity === 'medium' && 'text-guardian',
                            r.severity === 'low' && 'text-muted-foreground',
                          )}>
                            {r.title.replace(' Warning', '')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-xs text-muted-foreground">Estimated Yield</span>
                      <span className="text-sm font-semibold text-yield">{estimatedYield}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        By approving, you acknowledge the risks listed above. This action cannot be undone once the PTB is signed and executed on-chain.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={reset}
                  variant="outline"
                  size="lg"
                  className="h-12 font-semibold border-border/50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleApprove}
                  size="lg"
                  className="h-12 gradient-sui text-white font-semibold glow-sui hover:opacity-90"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve & Execute
                </Button>
              </div>
            </div>
          )}

          {/* STEP 8: Executing */}
          {step === 'executing' && (
            <Card className="border-sui/20">
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-14 w-14 rounded-xl gradient-sui flex items-center justify-center animate-pulse-glow">
                    <Zap className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-display font-semibold text-lg mb-1">Executing PTB...</h3>
                    <p className="text-sm text-muted-foreground">Signing and broadcasting transaction on Sui</p>
                  </div>

                  <div className="w-full max-w-sm space-y-3 mt-2">
                    {['PTB Signed', 'Swap Executed', 'Stake Executed', 'Deposit Complete'].map((label, i) => (
                      <div key={i} className="flex items-center gap-3 animate-slide-in-right" style={{ animationDelay: `${i * 400}ms` }}>
                        <div className="h-6 w-6 rounded-full bg-yield/20 flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5 text-yield" />
                        </div>
                        <span className="text-xs font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 9: Complete */}
          {step === 'complete' && parsedIntent && (
            <div className="space-y-6">
              {/* Success Card */}
              <Card className="border-yield/20 bg-yield/5">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="h-16 w-16 rounded-2xl gradient-yield flex items-center justify-center glow-yield">
                      <CheckCircle2 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl mb-1">Transaction Complete</h3>
                      <p className="text-sm text-muted-foreground">Your PTB has been executed on Sui successfully</p>
                    </div>

                    <div className="w-full rounded-lg bg-background/50 border border-border/20 divide-y divide-border/20 mt-2">
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-xs text-muted-foreground">Transaction Digest</span>
                        <span className="text-xs font-mono text-primary">0xA3f2...8b9c</span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-xs text-muted-foreground">Gas Used</span>
                        <span className="text-xs font-medium">0.002 SUI</span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <Badge className="bg-yield/20 text-yield border-yield/30 text-[10px]">SUCCESS</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Treasury Integration Card */}
              <Card className="border-trepa/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <div className="h-8 w-8 rounded-lg bg-trepa/10 flex items-center justify-center">
                      <Landmark className="h-4 w-4 text-trepa" />
                    </div>
                    Treasury Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-yield/5 border border-yield/20 p-4 text-center">
                      <Wallet className="h-5 w-5 text-yield mx-auto mb-2" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Fees Collected</span>
                      <p className="text-lg font-bold font-display text-yield mt-1">0.05 SUI</p>
                    </div>
                    <div className="rounded-lg bg-yield/5 border border-yield/20 p-4 text-center">
                      <TrendingUp className="h-5 w-5 text-yield mx-auto mb-2" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Yield Directed</span>
                      <p className="text-lg font-bold font-display text-yield mt-1">6.2% APR</p>
                    </div>
                    <div className="rounded-lg bg-trepa/5 border border-trepa/20 p-4 text-center">
                      <Landmark className="h-5 w-5 text-trepa mx-auto mb-2" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Treasury Growth</span>
                      <p className="text-lg font-bold font-display text-trepa mt-1">+0.12 SUI</p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/20">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-trepa">Chrysalis Model:</span> Generated yield flows into the protected treasury.
                      Principal remains ringfenced — only yield becomes operational capital for future agent operations.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* What funds next */}
              <Card className="border-border/20">
                <CardContent className="p-6">
                  <h4 className="font-display font-semibold text-sm mb-3">Self-Funding Loop Activated</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    The yield generated from this transaction now funds:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Research Queries', 'Data Collection', 'AI Inference', 'Monitoring', 'Reports', 'Future Operations'].map((item) => (
                      <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-yield" />
                        <span className="text-xs text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={reset}
                size="lg"
                className="w-full font-semibold border-border/50"
                variant="outline"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Start New Intent
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
