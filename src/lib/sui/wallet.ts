/**
 * Trepa Sui Wallet — Testnet
 *
 * Direct JSON-RPC to Sui testnet. Real balances, real transactions.
 * Connects via the Sui Wallet Standard (window.suiWallet, window.__suiet__, etc.)
 * Falls back to read-only mode (view balances, no signing).
 *
 * No @mysten/sui dependency — uses native fetch for JSON-RPC.
 */

import { useState, useCallback, useEffect } from 'react';

// ─── Sui Testnet RPC ───

export const SUI_TESTNET_URL = 'https://fullnode.testnet.sui.io:443';

async function suiRpc(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(SUI_TESTNET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? 'RPC error');
  return json.result;
}

// ─── Coin Types (Testnet) ───

export const COIN_TYPES = {
  SUI: '0x2::sui::SUI',
  // Testnet USDC
  USDC: '0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcf28e1d5e2dc07fcd2e811f025832::usdc::USDC',
} as const;

// ─── Types ───

export interface WalletState {
  isConnected: boolean;
  address: string | undefined;
  shortAddress: string | undefined;
  suiBalance: string;
  usdcBalance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  executePTB: (ptbBytes: string) => Promise<ExecutionResult>;
  isExecuting: boolean;
  walletName: string;
  network: string;
}

export interface ExecutionResult {
  success: boolean;
  digest: string;
  gasUsed: string;
  error?: string;
}

// ─── Sui Wallet Standard ───

interface SuiWallet {
  hasPermission: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  getAccounts: () => Promise<string[]>;
  signAndExecuteTransactionBlock: (input: {
    transactionBlock: string;
    options?: Record<string, boolean>;
  }) => Promise<{ digest: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WindowWithSui = Window & Record<string, any>;

function getSuiWallets(): SuiWallet[] {
  if (typeof window === 'undefined') return [];
  const w = window as WindowWithSui;
  const wallets: SuiWallet[] = [];

  // Standard Sui Wallet
  if (w.suiWallet && typeof w.suiWallet.signAndExecuteTransactionBlock === 'function') {
    wallets.push(w.suiWallet);
  }
  // Suiet wallet
  if (w.__suiet__ && typeof w.__suiet__.signAndExecuteTransactionBlock === 'function') {
    wallets.push(w.__suiet__);
  }
  // Ethos wallet
  if (w.ethos && typeof w.ethos.signAndExecuteTransactionBlock === 'function') {
    wallets.push(w.ethos);
  }
  // Surf wallet
  if (w.surf && typeof w.surf.signAndExecuteTransactionBlock === 'function') {
    wallets.push(w.surf);
  }
  // Generic sui namespace (Sui Wallet extension)
  if (w.sui && typeof w.sui.signAndExecuteTransactionBlock === 'function') {
    wallets.push(w.sui);
  }

  return wallets;
}

function getPrimaryWallet(): SuiWallet | undefined {
  return getSuiWallets()[0];
}

// ─── Fetch real balances from testnet ───

async function fetchSuiBalance(owner: string): Promise<string> {
  try {
    const result = await suiRpc('suix_getBalance', [owner, COIN_TYPES.SUI]) as { totalBalance: string };
    const mist = BigInt(result.totalBalance ?? '0');
    const sui = Number(mist) / 1_000_000_000;
    return sui.toFixed(4);
  } catch {
    return '0.0000';
  }
}

async function fetchUsdcBalance(owner: string): Promise<string> {
  try {
    const result = await suiRpc('suix_getBalance', [owner, COIN_TYPES.USDC]) as { totalBalance: string };
    const micro = BigInt(result.totalBalance ?? '0');
    const usdc = Number(micro) / 1_000_000;
    return usdc > 0 ? usdc.toFixed(2) : '0.00';
  } catch {
    // USDC may not exist on this address
    return '0.00';
  }
}

async function fetchAllTokenBalances(owner: string): Promise<{ sui: string; usdc: string }> {
  const [sui, usdc] = await Promise.all([
    fetchSuiBalance(owner),
    fetchUsdcBalance(owner),
  ]);
  return { sui, usdc };
}

// ─── Fetch all coin balances ───

export interface CoinBalance {
  coinType: string;
  symbol: string;
  balance: string;
  decimals: number;
}

const KNOWN_SYMBOLS: Record<string, { symbol: string; decimals: number }> = {
  [COIN_TYPES.SUI]: { symbol: 'SUI', decimals: 9 },
  [COIN_TYPES.USDC]: { symbol: 'USDC', decimals: 6 },
};

export async function fetchAllCoinBalances(owner: string): Promise<CoinBalance[]> {
  try {
    const allBalances = await suiRpc('suix_getAllBalances', [owner]) as Array<{
      coinType: string;
      totalBalance: string;
    }>;
    const coins: CoinBalance[] = [];

    for (const b of allBalances) {
      const known = KNOWN_SYMBOLS[b.coinType];
      const decimals = known?.decimals ?? 9;
      const symbol = known?.symbol ?? b.coinType.split('::').pop() ?? 'UNKNOWN';
      const rawBalance = BigInt(b.totalBalance ?? '0');
      const human = Number(rawBalance) / Math.pow(10, decimals);

      coins.push({
        coinType: b.coinType,
        symbol,
        balance: human > 0 ? human.toFixed(decimals > 6 ? 4 : 2) : '0.00',
        decimals,
      });
    }

    return coins;
  } catch {
    return [];
  }
}

// ─── Build a real PTB using JSON-RPC ───

/**
 * Build and execute a real transaction on Sui testnet using
 * the dryRun + signAndExecuteTransactionBlock flow.
 *
 * This constructs a serialized transaction using the
 * `sui_serializeTransactionBlock` or equivalent, then
 * submits it via the wallet.
 */

export interface PTBAction {
  type: 'split_then_stake' | 'split_then_transfer' | 'move_call';
  description: string;
  details: Record<string, string>;
}

/**
 * Build a real staking transaction using the Sui JSON-RPC.
 * Returns a Base64-encoded TransactionBlock that can be signed.
 */
export async function buildStakeTransaction(
  address: string,
  amountSui: number,
  validatorAddress: string,
): Promise<string> {
  // Use sui_moveCall to construct the transaction
  // First, we need to create a transaction that:
  // 1. Splits coins from gas
  // 2. Stakes them with a validator

  // Use the experimental transaction builder API
  const txKind = await suiRpc('sui_moveCall', [
    address,
    '0x3::sui_system::request_add_stake',
    [],
    [], // no type args
    [
      '0x5', // Sui System State object
      String(Math.round(amountSui * 1_000_000_000)), // amount in MIST
      validatorAddress,
    ],
    '100000000', // gas budget (0.1 SUI)
    null, // gas payment (auto-select)
  ]) as string;

  return txKind;
}

// ─── Hook ───

export function useTrepaWallet(): WalletState {
  const [address, setAddress] = useState<string | undefined>();
  const [suiBalance, setSuiBalance] = useState('0.0000');
  const [usdcBalance, setUsdcBalance] = useState('0.00');
  const [isExecuting, setIsExecuting] = useState(false);
  const [walletName, setWalletName] = useState('');

  // Check for existing wallet connection and fetch balances
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const wallet = getPrimaryWallet();
        if (!wallet) return;
        const hasPermission = await wallet.hasPermission?.();
        if (cancelled) return;
        if (hasPermission) {
          const accounts = await wallet.getAccounts?.();
          if (cancelled) return;
          if (accounts && accounts.length > 0) {
            const addr = accounts[0];
            setAddress(addr);
            setWalletName('Sui Wallet');
            const balances = await fetchAllTokenBalances(addr);
            if (!cancelled) {
              setSuiBalance(balances.sui);
              setUsdcBalance(balances.usdc);
            }
          }
        }
      } catch {
        // Wallet not available
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  // Poll balances every 15s when connected
  useEffect(() => {
    if (!address) return;
    const iv = setInterval(async () => {
      try {
        const balances = await fetchAllTokenBalances(address);
        setSuiBalance(balances.sui);
        setUsdcBalance(balances.usdc);
      } catch {
        // Balance fetch failed, keep existing values
      }
    }, 15000);
    return () => clearInterval(iv);
  }, [address]);

  const isConnected = !!address;
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : undefined;

  const connect = useCallback(async () => {
    try {
      const wallet = getPrimaryWallet();
      if (wallet) {
        await wallet.requestPermissions?.();
        const accounts = await wallet.getAccounts?.();
        if (accounts && accounts.length > 0) {
          const addr = accounts[0];
          setAddress(addr);
          setWalletName('Sui Wallet');
          const balances = await fetchAllTokenBalances(addr);
          setSuiBalance(balances.sui);
          setUsdcBalance(balances.usdc);
        }
      } else {
        window.open('https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil', '_blank');
      }
    } catch {
      // User rejected
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(undefined);
    setSuiBalance('0.0000');
    setUsdcBalance('0.00');
    setWalletName('');
  }, []);

  const executePTB = useCallback(async (ptbBytes: string): Promise<ExecutionResult> => {
    setIsExecuting(true);
    try {
      const wallet = getPrimaryWallet();
      if (wallet && address) {
        const result = await wallet.signAndExecuteTransactionBlock?.({
          transactionBlock: ptbBytes,
          options: { showEffects: true, showRawEffects: true },
        });

        if (result?.digest) {
          // Wait for finality
          await suiRpc('sui_waitForTransaction', [result.digest]);

          // Get transaction details for gas info
          let gasUsed = '~0.002 SUI';
          try {
            const txDetails = await suiRpc('sui_getTransactionBlock', [result.digest, {
              showEffects: true,
            }]) as { effects?: { gasUsed?: { computationCost: string; storageCost: string; storageRebate: string } } };
            if (txDetails.effects?.gasUsed) {
              const g = txDetails.effects.gasUsed;
              const totalGas = (BigInt(g.computationCost) + BigInt(g.storageCost) - BigInt(g.storageRebate));
              gasUsed = `${Number(totalGas) / 1_000_000_000} SUI`;
            }
          } catch {
            // Keep default gas estimate
          }

          return {
            success: true,
            digest: result.digest,
            gasUsed,
          };
        }
        return {
          success: false,
          digest: '',
          gasUsed: '0 SUI',
          error: 'No digest returned',
        };
      }

      return {
        success: false,
        digest: '',
        gasUsed: '0 SUI',
        error: 'No wallet connected. Install Sui Wallet and switch to Testnet.',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      return {
        success: false,
        digest: '',
        gasUsed: '0 SUI',
        error: message,
      };
    } finally {
      setIsExecuting(false);
    }
  }, [address]);

  return {
    isConnected,
    address,
    shortAddress,
    suiBalance,
    usdcBalance,
    connect,
    disconnect,
    executePTB,
    isExecuting,
    walletName,
    network: 'testnet',
  };
}

export function isSuiWalletAvailable(): boolean {
  return typeof window !== 'undefined' && getSuiWallets().length > 0;
}

export { fetchSuiBalance, fetchUsdcBalance, suiRpc };
