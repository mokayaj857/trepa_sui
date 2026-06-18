/**
 * Trepa Guardian — Risk Analysis Layer
 *
 * Inspects PTBs before execution and surfaces risks in plain English.
 * Checks: Slippage, Concentration, Liquidity/Stale Pool, Treasury Budget
 */

import type { IntentAction, ParsedIntent } from './ptbBuilder';

// ─── Types ───

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface RiskCheck {
  id: string;
  type: 'slippage' | 'concentration' | 'liquidity' | 'treasury_budget';
  severity: RiskSeverity;
  title: string;
  description: string;
  detail: string;
  recommendation?: string;
}

export interface GuardianReport {
  checks: RiskCheck[];
  overallRisk: RiskSeverity;
  canProceed: boolean;
  summary: string;
}

// ─── Risk Check Implementations ───

/**
 * Check 1: Slippage Risk
 * Estimates slippage based on pool depth and trade size.
 */
function checkSlippage(actions: IntentAction[], intent: ParsedIntent): RiskCheck {
  const swapAction = actions.find(a => a.type === 'swap');
  if (!swapAction) {
    return {
      id: 'slippage',
      type: 'slippage',
      severity: 'low',
      title: 'Slippage',
      description: 'No swap involved — no slippage risk.',
      detail: 'N/A',
    };
  }

  const amount = parseFloat(swapAction.amount) || 0;

  // Simulated slippage estimation
  // In production, this would query on-chain pool reserves
  let slippagePct: number;
  let severity: RiskSeverity;

  if (amount > 500) {
    slippagePct = 3.2 + (amount - 500) * 0.008;
    severity = 'high';
  } else if (amount > 200) {
    slippagePct = 1.5 + (amount - 200) * 0.006;
    severity = 'medium';
  } else {
    slippagePct = 0.3 + amount * 0.005;
    severity = 'low';
  }

  slippagePct = Math.round(slippagePct * 100) / 100;

  return {
    id: 'slippage',
    type: 'slippage',
    severity,
    title: severity === 'high' ? 'High Slippage' : severity === 'medium' ? 'Moderate Slippage' : 'Low Slippage',
    description: `Expected slippage: ~${slippagePct}%. ${severity === 'high' ? 'This swap may lose significant value due to limited liquidity.' : severity === 'medium' ? 'Some price impact expected from this trade size.' : 'Minimal price impact expected.'}`,
    detail: `Expected slippage: ${slippagePct}%`,
    recommendation: severity === 'high' ? 'Consider splitting into smaller trades or waiting for deeper liquidity.' : undefined,
  };
}

/**
 * Check 2: Concentration Risk
 * Warns if all funds go into a single asset.
 */
function checkConcentration(actions: IntentAction[], intent: ParsedIntent): RiskCheck {
  const targetAssets = new Set(actions.map(a => a.toToken));
  const isSingleAsset = targetAssets.size === 1;
  const isSuiOnly = targetAssets.has('SUI') || targetAssets.has('vSUI');

  if (isSingleAsset && isSuiOnly) {
    return {
      id: 'concentration',
      type: 'concentration',
      severity: 'medium',
      title: 'Concentration Risk',
      description: `100% of funds will be in a single asset (${[...targetAssets][0]}). A decline in ${[...targetAssets][0]} price could significantly impact your position.`,
      detail: 'Allocation: 100% single asset',
      recommendation: 'Consider diversifying across multiple assets to reduce exposure.',
    };
  }

  if (isSingleAsset) {
    return {
      id: 'concentration',
      type: 'concentration',
      severity: 'low',
      title: 'Concentration Risk',
      description: 'All funds directed to a single asset. Moderate diversification risk.',
      detail: `Allocation: 100% ${[...targetAssets][0]}`,
    };
  }

  return {
    id: 'concentration',
    type: 'concentration',
    severity: 'low',
    title: 'Diversified',
    description: 'Funds spread across multiple assets — good diversification.',
    detail: `Allocation: ${[...targetAssets].join(', ')}`,
  };
}

/**
 * Check 3: Liquidity / Stale Pool Risk
 * Checks if the target pool has sufficient recent activity.
 */
function checkLiquidity(actions: IntentAction[], intent: ParsedIntent): RiskCheck {
  const hasSwap = actions.some(a => a.type === 'swap');

  if (!hasSwap) {
    return {
      id: 'liquidity',
      type: 'liquidity',
      severity: 'low',
      title: 'Liquidity',
      description: 'No swap involved — no liquidity risk.',
      detail: 'N/A',
    };
  }

  // Simulated liquidity check
  // In production, this would query on-chain TVL and 24h volume
  const riskLevel = intent.riskLevel;
  const poolActivity = riskLevel === 'high' ? 'moderate' : riskLevel === 'medium' ? 'normal' : 'high';
  const tvl = riskLevel === 'high' ? '$2.1M' : riskLevel === 'medium' ? '$8.5M' : '$45M';

  if (riskLevel === 'high') {
    return {
      id: 'liquidity',
      type: 'liquidity',
      severity: 'medium',
      title: 'Stale Pool Warning',
      description: `Pool activity: ${poolActivity}. TVL: ${tvl}. May carry additional execution risk due to lower liquidity depth.`,
      detail: `Pool TVL: ${tvl}, Activity: ${poolActivity}`,
      recommendation: 'Monitor execution closely. Consider smaller position sizes.',
    };
  }

  return {
    id: 'liquidity',
    type: 'liquidity',
    severity: 'low',
    title: 'Pool Liquidity',
    description: `Pool activity: ${poolActivity}. TVL: ${tvl}. Sufficient liquidity for this trade size.`,
    detail: `Pool TVL: ${tvl}, Activity: ${poolActivity}`,
  };
}

/**
 * Check 4: Treasury Budget Check
 * Verifies the treasury has sufficient budget for the operation.
 */
function checkTreasuryBudget(actions: IntentAction[]): RiskCheck {
  const feeAction = actions.find(a => a.type === 'deposit');
  const feeAmount = feeAction ? parseFloat(feeAction.amount) : 0;

  // Simulated treasury balance
  const treasuryBalance = 5.3; // SUI
  const canAfford = treasuryBalance > feeAmount;

  return {
    id: 'treasury_budget',
    type: 'treasury_budget',
    severity: canAfford ? 'low' : 'medium',
    title: canAfford ? 'Treasury Budget OK' : 'Treasury Budget Low',
    description: canAfford
      ? `Treasury balance (${treasuryBalance.toFixed(1)} SUI) sufficient for operation fee (${feeAmount.toFixed(4)} SUI).`
      : `Treasury balance low. Fee of ${feeAmount.toFixed(4)} SUI may exceed available budget.`,
    detail: `Treasury: ${treasuryBalance.toFixed(1)} SUI, Fee: ${feeAmount.toFixed(4)} SUI`,
  };
}

// ─── Main Guardian Function ───

/**
 * Run all Guardian checks on the proposed PTB actions.
 * Returns a comprehensive risk report.
 */
export function runGuardianChecks(actions: IntentAction[], intent: ParsedIntent): GuardianReport {
  const checks: RiskCheck[] = [
    checkSlippage(actions, intent),
    checkConcentration(actions, intent),
    checkLiquidity(actions, intent),
    checkTreasuryBudget(actions),
  ];

  // Determine overall risk
  const severities = checks.map(c => c.severity);
  const overallRisk: RiskSeverity = severities.includes('critical')
    ? 'critical'
    : severities.includes('high')
      ? 'high'
      : severities.includes('medium')
        ? 'medium'
        : 'low';

  const canProceed = overallRisk !== 'critical';

  const highRisks = checks.filter(c => c.severity === 'high' || c.severity === 'medium');
  const summary = highRisks.length === 0
    ? 'All checks passed. Low risk execution.'
    : `${highRisks.length} risk${highRisks.length > 1 ? 's' : ''} detected: ${highRisks.map(r => r.title).join(', ')}`;

  return {
    checks,
    overallRisk,
    canProceed,
    summary,
  };
}

/**
 * Get severity color for UI display
 */
export function getSeverityColor(severity: RiskSeverity): string {
  switch (severity) {
    case 'critical': return 'text-destructive';
    case 'high': return 'text-destructive';
    case 'medium': return 'text-primary';
    case 'low': return 'text-muted-foreground';
  }
}

export function getSeverityBg(severity: RiskSeverity): string {
  switch (severity) {
    case 'critical': return 'bg-destructive/10';
    case 'high': return 'bg-destructive/10';
    case 'medium': return 'bg-primary/10';
    case 'low': return 'bg-muted/60';
  }
}
