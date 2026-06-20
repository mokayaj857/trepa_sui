/**
 * Trepa Sui Wallet — Testnet
 *
 * Direct JSON-RPC to Sui testnet. Real balances, real transactions.
 * Connects via the Sui Wallet Standard (window.suiWallet, window.__suiet__, etc.)
 * Falls back to read-only mode (view balances, no signing).
 *
 * No @mysten/sui.js dependency — uses native fetch for JSON-RPC.
 * Transaction building uses the ESM CDN at runtime (loaded dynamically
 * only when the user clicks "Approve" to execute a real transaction).
 */

import { useState, useCallback, useEffect } from 'react';

// ─── Sui Testnet RPC ───

export const SUI_TESTNET_URL = 'https://fullnode.testnet.sui.io:443';

// Sui System State object ID (constant on all networks)
export const SUI_SYSTEM_STATE_OBJECT_ID = '0x5';

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
  executeTransaction: (tx: unknown) => Promise<ExecutionResult>;
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

interface SuiWalletV1 {
  hasPermission: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  getAccounts: () => Promise<string[]>;
  signAndExecuteTransactionBlock: (input: {
    transactionBlock: string | unknown;
    options?: Record<string, boolean>;
  }) => Promise<{ digest: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WindowWithSui = Window & Record<string, any>;

function getSuiWallets(): SuiWalletV1[] {
  if (typeof window === 'undefined') return [];
  const w = window as WindowWithSui;
  const wallets: SuiWalletV1[] = [];

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

function getPrimaryWallet(): SuiWalletV1 | undefined {
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

// ─── Fetch validator list from testnet ───

export async function getTestnetValidators(): Promise<string[]> {
  try {
    const result = await suiRpc('suix_getLatestSuiSystemState', []) as {
      activeValidators: Array<{ suiAddress: string }>;
    };
    return result.activeValidators?.map(v => v.suiAddress) ?? [];
  } catch {
    return [];
  }
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

  const executeTransaction = useCallback(async (tx: unknown): Promise<ExecutionResult> => {
    setIsExecuting(true);
    try {
      const wallet = getPrimaryWallet();
      if (!wallet || !address) {
        return {
          success: false,
          digest: '',
          gasUsed: '0 SUI',
          error: 'No wallet connected. Install a Sui wallet extension and switch to Testnet.',
        };
      }

      // The wallet's signAndExecuteTransactionBlock accepts:
      // - A TransactionBlock object (the wallet has the SDK bundled internally)
      // - A base64-encoded BCS string
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
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
        error: 'No digest returned from wallet.',
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
    executeTransaction,
    isExecuting,
    walletName,
    network: 'testnet',
  };
}

export function isSuiWalletAvailable(): boolean {
  return typeof window !== 'undefined' && getSuiWallets().length > 0;
}

export { fetchSuiBalance, fetchUsdcBalance, suiRpc };
