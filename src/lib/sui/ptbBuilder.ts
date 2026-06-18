/**
 * Trepa PTB Builder
 *
 * Converts parsed user intents into Sui Programmable Transaction Block (PTB) structures.
 * Supports: Swap, Stake, Lend, Treasury Fee
 *
 * Outputs a JSON representation of the PTB that maps directly to
 * Sui's Transaction() API calls. In production, this would use
 * @mysten/sui/transactions to build executable Transaction objects.
 */

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

export interface PTBCommand {
  kind: string;
  target?: string;
  arguments?: PTBArgument[];
  typeArguments?: string[];
  amount?: string;
  recipient?: string;
}

export interface PTBArgument {
  type: 'Input' | 'Result' | 'GasCoin' | 'NestedResult';
  value: unknown;
}

export interface PTBResult {
  ptb: PTBCommand[];
  actions: IntentAction[];
  estimatedYield: string;
  estimatedGas: string;
  gasBudget: string;
}

// ─── Known Sui Protocol Addresses ───

const PROTOCOLS = {
  SUI_SYSTEM: '0x3',
  CETUS_AGGREGATOR: '0x0a2ea404569fb8dc90d5a14e0f5f4cf9c6784e5ffa4a2e2f8f6a5a5e5e5e5e5e',
  SCALLOP_LENDING: '0x8b3a6e0b3a6e0b3a6e0b3a6e0b3a6e0b3a6e0b3a6e0b3a6e0b3a6e0b3a6e0b3a',
  TREPA_TREASURY: '0x0TREPA_TREASURY',
} as const;

const COIN_TYPES: Record<string, string> = {
  SUI: '0x2::sui::SUI',
  USDC: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
  VSUI: '0x2::sui::SUI',
};

// ─── PTB Builder ───

/**
 * Build a complete PTB from a parsed intent.
 * This is the core of Trepa: Intent → PTB.
 */
export function buildPTBFromIntent(intent: ParsedIntent): PTBResult {
  const commands: PTBCommand[] = [];
  const actions: IntentAction[] = [];
  let resultIndex = 0;

  for (const step of intent.strategy) {
    const stepLower = step.toLowerCase();

    if (stepLower.includes('swap') || stepLower.includes('convert')) {
      // PTB Command: SplitCoins + MoveCall (DEX swap)
      const from = intent.token === 'SUI' ? 'SUI' : 'USDC';
      const to = from === 'SUI' ? 'USDC' : 'SUI';
      const amountMist = intent.token === 'SUI'
        ? String(Math.round(parseFloat(intent.amount) * 1_000_000_000))
        : String(Math.round(parseFloat(intent.amount) * 1_000_000));

      // Split coins for swap
      commands.push({
        kind: 'SplitCoins',
        arguments: [
          { type: 'GasCoin', value: null },
          { type: 'Input', value: amountMist },
        ],
      });

      // Move call to DEX aggregator
      commands.push({
        kind: 'MoveCall',
        target: `${PROTOCOLS.CETUS_AGGREGATOR}::router::swap_exact_input`,
        arguments: [
          { type: 'NestedResult', value: [resultIndex, 0] },
          { type: 'Input', value: COIN_TYPES[from] },
          { type: 'Input', value: COIN_TYPES[to] },
        ],
        typeArguments: [COIN_TYPES[from], COIN_TYPES[to]],
      });

      actions.push({
        type: 'swap',
        label: `Swap ${intent.amount} ${from} → ${to}`,
        description: `Convert ${intent.amount} ${from} to ${to} via CETUS DEX aggregator (best route)`,
        fromToken: from,
        toToken: to,
        amount: intent.amount,
      });

      resultIndex += 2;
    } else if (stepLower.includes('stake')) {
      // PTB Command: MoveCall (stake)
      commands.push({
        kind: 'MoveCall',
        target: `${PROTOCOLS.SUI_SYSTEM}::sui_system::request_add_stake`,
        arguments: [
          { type: 'Input', value: '0x5' }, // Sui System State
          { type: 'Input', value: String(Math.round(parseFloat(intent.amount) * 1_000_000_000)) },
          { type: 'Input', value: '0x7a7110e8e8c1c5b5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e' }, // Validator
        ],
      });

      actions.push({
        type: 'stake',
        label: `Stake ${intent.amount} SUI`,
        description: `Delegate SUI to validator for staking rewards (~6.2% APR)`,
        fromToken: 'SUI',
        toToken: 'vSUI',
        amount: intent.amount,
      });

      resultIndex += 1;
    } else if (stepLower.includes('lend')) {
      // PTB Command: MoveCall (lend)
      commands.push({
        kind: 'MoveCall',
        target: `${PROTOCOLS.SCALLOP_LENDING}::lending::deposit`,
        arguments: [
          { type: 'Input', value: String(Math.round(parseFloat(intent.amount) * 1_000_000)) },
          { type: 'Input', value: '0x0LENDING_MARKET' },
        ],
        typeArguments: [COIN_TYPES[intent.token] ?? COIN_TYPES.USDC],
      });

      actions.push({
        type: 'lend',
        label: `Lend ${intent.amount} ${intent.token}`,
        description: `Deposit ${intent.amount} ${intent.token} into Scallop lending protocol (~3.5% APR)`,
        fromToken: intent.token,
        toToken: `s${intent.token}`,
        amount: intent.amount,
      });

      resultIndex += 1;
    }
  }

  // Add treasury fee collection (0.5%)
  const feeAmount = (parseFloat(intent.amount) * 0.005).toFixed(4);
  const feeMist = String(Math.round(parseFloat(feeAmount) * 1_000_000_000));

  commands.push({
    kind: 'SplitCoins',
    arguments: [
      { type: 'GasCoin', value: null },
      { type: 'Input', value: feeMist },
    ],
  });

  commands.push({
    kind: 'TransferObjects',
    arguments: [
      { type: 'NestedResult', value: [resultIndex, 0] },
      { type: 'Input', value: PROTOCOLS.TREPA_TREASURY },
    ],
  });

  actions.push({
    type: 'deposit',
    label: `Treasury fee: ${feeAmount} SUI`,
    description: 'Protocol fee directed to self-funding treasury (Chrysalis model)',
    fromToken: 'SUI',
    toToken: 'TREASURY',
    amount: feeAmount,
  });

  return {
    ptb: commands,
    actions,
    estimatedYield: intent.riskLevel === 'low' ? '6.2%' : intent.riskLevel === 'high' ? '12.8%' : '8.5%',
    estimatedGas: '~0.002 SUI',
    gasBudget: '100000000', // 0.1 SUI
  };
}

/**
 * Parse a user's natural language intent into a structured intent
 * that can be compiled into a PTB.
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
    return { type: 'deposit' as IntentActionType, label: 'Treasury fee', description: 'Protocol fee directed to self-funding treasury', fromToken: 'SUI', toToken: 'TREASURY', amount: (parseFloat(amount) * 0.005).toFixed(4) };
  });

  return { goal, riskLevel, amount, token, strategy, actions };
}

export { COIN_TYPES, PROTOCOLS };
