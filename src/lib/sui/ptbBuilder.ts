/**
 * Trepa PTB Builder
 *
 * Converts parsed user intents into structured PTB descriptions and
 * Sui Transaction objects for on-chain execution via Slush / Wallet Standard.
 *
 * Supports: Swap (via DEX aggregator), Stake (native Sui staking), Lend (Scallop),
 * Treasury Fee collection.
 */

import { Transaction } from '@mysten/sui/transactions';
import { SUI_SYSTEM_STATE_OBJECT_ID, getTestnetValidators } from './wallet';

// ─── Types ───

export type IntentActionType = 'swap' | 'stake' | 'lend' | 'deposit';

export interface IntentAction {
  type: IntentActionType;
  label: string;
  description: string;
  fromToken: string;
  toToken: string;
  amount: string;
}

export interface ParsedIntent {
  goal: string;
  riskLevel: 'low' | 'medium' | 'high';
  amount: string;
  token: string;
  strategy: string[];
  actions: IntentAction[];
}

export interface PTBResult {
  actions: IntentAction[];
  estimatedYield: string;
  estimatedGas: string;
  gasBudget: string;
}

// ─── Staking limits (Sui testnet) ───

/** Minimum delegator stake: 1 SUI (MIN_STAKING_THRESHOLD on-chain). */
export const MIN_STAKE_SUI = 1;
export const MIN_STAKE_MIST = 1_000_000_000n;
/** Reserve for gas on top of the stake amount. */
export const STAKE_GAS_RESERVE_SUI = 0.05;

const DEFAULT_TESTNET_VALIDATOR = '0x44b1b319e23495995fc837dafd28fc6af8b645edddff0fc1467f1ad631362c23';

export function validateStakeAmount(
  amountSui: string,
  walletBalanceSui?: string,
): string | null {
  const amount = parseFloat(amountSui);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Enter a valid stake amount in SUI.';
  }

  const amountMist = BigInt(Math.round(amount * 1_000_000_000));
  if (amountMist < MIN_STAKE_MIST) {
    return `Minimum stake on Sui testnet is ${MIN_STAKE_SUI} SUI (you entered ${amountSui} SUI). Try "Stake 1 SUI" or more.`;
  }

  if (walletBalanceSui) {
    const balance = parseFloat(walletBalanceSui);
    const required = amount + STAKE_GAS_RESERVE_SUI;
    if (Number.isFinite(balance) && balance < required) {
      return `Insufficient testnet SUI. Need ~${required.toFixed(2)} SUI (${amountSui} stake + gas). Your balance: ${walletBalanceSui} SUI.`;
    }
  }

  return null;
}

export function formatSuiTransactionError(message: string): string {
  if (
    message.includes('EStakingBelowThreshold') ||
    /request_add_stake.*\}, 10\)/.test(message) ||
    /MoveAbort\([^)]*request_add_stake[^)]*, 10\)/.test(message)
  ) {
    return `Stake amount is below the Sui testnet minimum of ${MIN_STAKE_SUI} SUI. Use at least 1 full SUI (e.g. "Stake 1 SUI").`;
  }
  if (message.includes('Method not found')) {
    return 'RPC method unavailable on testnet. If Slush showed success, check your wallet history or suiscan.xyz testnet for the transaction.';
  }
  return message;
}

/**
 * Fetch the first available validator address from the Sui testnet.
 * Falls back to a known default if the RPC call fails.
 */
async function getValidatorAddress(): Promise<string> {
  const validators = await getTestnetValidators();
  return validators.length > 0 ? validators[0] : DEFAULT_TESTNET_VALIDATOR;
}

// ─── Build PTB result from intent ───

export function buildPTBFromIntent(intent: ParsedIntent, _address?: string): PTBResult {
  const actions: IntentAction[] = [];

  for (const step of intent.strategy) {
    const stepLower = step.toLowerCase();

    if (stepLower.includes('stake')) {
      actions.push({
        type: 'stake',
        label: `Stake ${intent.amount} SUI`,
        description: `Delegate ${intent.amount} SUI to validator for staking rewards (~6.2% APR on testnet)`,
        fromToken: 'SUI',
        toToken: 'vSUI',
        amount: intent.amount,
      });
    } else if (stepLower.includes('swap') || stepLower.includes('convert')) {
      const from = intent.token === 'SUI' ? 'SUI' : 'USDC';
      const to = from === 'SUI' ? 'USDC' : 'SUI';
      actions.push({
        type: 'swap',
        label: `Swap ${intent.amount} ${from} → ${to}`,
        description: `Convert ${intent.amount} ${from} to ${to} via DEX aggregator (best route)`,
        fromToken: from,
        toToken: to,
        amount: intent.amount,
      });
    } else if (stepLower.includes('lend')) {
      actions.push({
        type: 'lend',
        label: `Lend ${intent.amount} ${intent.token}`,
        description: `Deposit ${intent.amount} ${intent.token} into lending protocol (~3.5% APR)`,
        fromToken: intent.token,
        toToken: `s${intent.token}`,
        amount: intent.amount,
      });
    }
  }

  // Treasury fee collection (0.5% of amount)
  const feeAmount = (parseFloat(intent.amount) * 0.005).toFixed(4);
  actions.push({
    type: 'deposit',
    label: `Treasury fee: ${feeAmount} SUI`,
    description: 'Protocol fee directed to self-funding treasury (Chrysalis model)',
    fromToken: 'SUI',
    toToken: 'TREASURY',
    amount: feeAmount,
  });

  return {
    actions,
    estimatedYield: intent.riskLevel === 'low' ? '6.2%' : intent.riskLevel === 'high' ? '12.8%' : '8.5%',
    estimatedGas: '~0.002 SUI',
    gasBudget: '100000000',
  };
}

// ─── Build stake transaction ───

/**
 * Build a Sui Transaction for native staking on testnet.
 *
 * Returns a Transaction with toJSON() for Slush / Wallet Standard v2 signing.
 */
export async function buildStakeTransactionBlock(
  senderAddress: string,
  amountSui: string,
  validatorAddress?: string,
): Promise<Transaction | null> {
  try {
    const stakeError = validateStakeAmount(amountSui);
    if (stakeError) {
      console.error(stakeError);
      return null;
    }

    const validator = validatorAddress ?? await getValidatorAddress();
    const amountMist = BigInt(Math.round(parseFloat(amountSui) * 1_000_000_000));

    if (amountMist < MIN_STAKE_MIST) {
      return null;
    }

    const tx = new Transaction();

    const stakeCoin = tx.splitCoins(tx.gas, [amountMist]);

    tx.moveCall({
      target: '0x3::sui_system::request_add_stake',
      arguments: [
        tx.object(SUI_SYSTEM_STATE_OBJECT_ID),
        stakeCoin,
        tx.pure.address(validator),
      ],
    });

    tx.setGasBudget(100_000_000);
    tx.setSender(senderAddress);

    return tx;
  } catch (err) {
    console.error('Failed to build stake transaction:', err);
    return null;
  }
}

/**
 * Parse a user's natural language intent into a structured intent.
 */
export function parseUserIntent(input: string): ParsedIntent {
  const lower = input.toLowerCase();
  const amount = input.match(/\d+(\.\d+)?/)?.[0] ?? '100';

  const hasSui = /sui/i.test(input) && !/usdc|usdt/i.test(input);
  const hasUsdc = /usdc/i.test(input);
  const token = hasSui ? 'SUI' : hasUsdc ? 'USDC' : 'USDC';

  const isLowRisk = /safe|low|conservative|safest/i.test(input);
  const isHighRisk = /high|aggressive|max|maximum/i.test(input);
  const riskLevel: ParsedIntent['riskLevel'] = isHighRisk ? 'high' : isLowRisk ? 'low' : 'medium';

  const wantsStake = /stake/i.test(input);
  const wantsLend = /lend|supply/i.test(input) && !/yield/i.test(input);
  const wantsSwap = /swap|convert|change/i.test(input);
  const wantsYield = /yield|earn|invest|grow/i.test(input);

  let strategy: string[];
  let goal: string;

  if (wantsSwap && wantsStake) {
    goal = 'Convert & Stake';
    strategy = ['Swap USDC → SUI', 'Stake SUI', 'Treasury Fee'];
  } else if (wantsStake && hasSui) {
    goal = 'Stake for Rewards';
    strategy = ['Stake SUI', 'Treasury Fee'];
  } else if (wantsLend) {
    goal = 'Lend for Yield';
    strategy = ['Lend USDC', 'Treasury Fee'];
  } else if (wantsYield || wantsStake) {
    goal = 'Generate Yield';
    strategy = ['Swap USDC → SUI', 'Stake SUI', 'Treasury Fee'];
  } else if (lower.includes('deposit') || lower.includes('add')) {
    goal = 'Deposit';
    strategy = ['Deposit to Protocol', 'Treasury Fee'];
  } else {
    goal = 'Generate Yield';
    strategy = ['Swap USDC → SUI', 'Stake SUI', 'Treasury Fee'];
  }

  const actions: IntentAction[] = strategy.map((step) => {
    const stepLower = step.toLowerCase();
    if (stepLower.includes('swap') || stepLower.includes('convert')) {
      return { type: 'swap' as IntentActionType, label: `Swap ${amount} ${token} → SUI`, description: `Convert ${amount} ${token} to SUI via DEX aggregator (best route)`, fromToken: token, toToken: 'SUI', amount };
    }
    if (stepLower.includes('stake')) {
      return { type: 'stake' as IntentActionType, label: `Stake ${amount} SUI`, description: `Delegate SUI to validator for staking rewards`, fromToken: 'SUI', toToken: 'vSUI', amount };
    }
    if (stepLower.includes('lend')) {
      return { type: 'lend' as IntentActionType, label: `Lend ${amount} ${token}`, description: `Deposit ${amount} ${token} into lending protocol`, fromToken: token, toToken: `s${token}`, amount };
    }
    if (stepLower.includes('deposit')) {
      return { type: 'deposit' as IntentActionType, label: `Deposit ${amount} ${token}`, description: `Deposit ${amount} ${token} into protocol`, fromToken: token, toToken: 'RECEIPT', amount };
    }
    return { type: 'deposit' as IntentActionType, label: 'Treasury fee', description: 'Protocol fee directed to self-funding treasury', fromToken: 'SUI', toToken: 'TREASURY', amount: (parseFloat(amount) * 0.005).toFixed(4) };
  });

  return { goal, riskLevel, amount, token, strategy, actions };
}
