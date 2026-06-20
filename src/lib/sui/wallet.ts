/**
 * Trepa Sui Wallet — Testnet
 *
 * Direct JSON-RPC to Sui testnet. Real balances, real transactions.
 * Connects via the Sui Wallet Standard — supports both the legacy
 * signAndExecuteTransactionBlock API and the modern
 * signAndExecuteTransaction API used by current Sui Wallet extensions.
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
  error: string;
}

export interface ExecutionResult {
  success: boolean;
  digest: string;
  gasUsed: string;
  error?: string;
}

// ─── Sui Wallet Detection ───
//
// The Sui ecosystem has two generations of wallet APIs:
//
// 1. Legacy: window.suiWallet with signAndExecuteTransactionBlock()
// 2. Modern: window.sui with signAndExecuteTransaction()
//
// We detect BOTH and adapt. The modern Sui Wallet extension exposes
// itself on window.sui with:
//   - connect() → { accounts: string[] }
//   - disconnect()
//   - getAccounts() → string[]
//   - signAndExecuteTransaction(input) → { digest }
//   - hasPermissions() / requestPermissions()
//
// The legacy wallets use:
//   - hasPermission() / requestPermissions()
//   - getAccounts()
//   - signAndExecuteTransactionBlock(input)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WalletObj = Record<string, any>;

interface DetectedWallet {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: WalletObj;
  isModern: boolean;
}

function detectSuiWallets(): DetectedWallet[] {
  if (typeof window === 'undefined') return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const wallets: DetectedWallet[] = [];

  // ─── Modern Sui Wallet (window.sui) ───
  // The current Sui Wallet extension injects as window.sui
  // It uses signAndExecuteTransaction (no "Block")
  if (w.sui && typeof w.sui === 'object') {
    const hasExec = typeof w.sui.signAndExecuteTransaction === 'function';
    const hasExecBlock = typeof w.sui.signAndExecuteTransactionBlock === 'function';
    if (hasExec || hasExecBlock) {
      wallets.push({
        name: w.sui.name ?? 'Sui Wallet',
        obj: w.sui,
        isModern: hasExec && !hasExecBlock,
      });
    }
  }

  // ─── Legacy: window.suiWallet ───
  if (w.suiWallet && typeof w.suiWallet === 'object') {
    if (typeof w.suiWallet.signAndExecuteTransactionBlock === 'function') {
      wallets.push({
        name: w.suiWallet.name ?? 'Sui Wallet (Legacy)',
        obj: w.suiWallet,
        isModern: false,
      });
    }
  }

  // ─── Suiet ───
  if (w.__suiet__ && typeof w.__suiet__ === 'object') {
    const hasExec = typeof w.__suiet__.signAndExecuteTransaction === 'function';
    const hasExecBlock = typeof w.__suiet__.signAndExecuteTransactionBlock === 'function';
    if (hasExec || hasExecBlock) {
      wallets.push({
        name: 'Suiet',
        obj: w.__suiet__,
        isModern: hasExec && !hasExecBlock,
      });
    }
  }

  // ─── Ethos ───
  if (w.ethos && typeof w.ethos === 'object') {
    const hasExec = typeof w.ethos.signAndExecuteTransaction === 'function';
    const hasExecBlock = typeof w.ethos.signAndExecuteTransactionBlock === 'function';
    if (hasExec || hasExecBlock) {
      wallets.push({
        name: 'Ethos',
        obj: w.ethos,
        isModern: hasExec && !hasExecBlock,
      });
    }
  }

  // ─── Surf ───
  if (w.surf && typeof w.surf === 'object') {
    const hasExec = typeof w.surf.signAndExecuteTransaction === 'function';
    const hasExecBlock = typeof w.surf.signAndExecuteTransactionBlock === 'function';
    if (hasExec || hasExecBlock) {
      wallets.push({
        name: 'Surf',
        obj: w.surf,
        isModern: hasExec && !hasExecBlock,
      });
    }
  }

  return wallets;
}

function getPrimaryWallet(): DetectedWallet | undefined {
  return detectSuiWallets()[0];
}

// ─── Connect to wallet (handles both modern and legacy) ───

async function connectWallet(wallet: DetectedWallet): Promise<string[]> {
  const { obj, isModern } = wallet;

  if (isModern) {
    // Modern API: wallet.connect()
    if (typeof obj.connect === 'function') {
      const result = await obj.connect();
      // connect() returns { accounts: string[] } or string[]
      if (result?.accounts) return result.accounts;
      if (Array.isArray(result)) return result;
    }
    // Fallback: requestPermissions + getAccounts
    if (typeof obj.requestPermissions === 'function') {
      await obj.requestPermissions();
    }
    if (typeof obj.getAccounts === 'function') {
      return await obj.getAccounts();
    }
    return [];
  }

  // Legacy API: requestPermissions + getAccounts
  if (typeof obj.requestPermissions === 'function') {
    await obj.requestPermissions();
  }
  if (typeof obj.getAccounts === 'function') {
    return await obj.getAccounts();
  }
  return [];
}

// ─── Check existing connection ───

async function checkExistingConnection(wallet: DetectedWallet): Promise<string[]> {
  const { obj, isModern } = wallet;

  if (isModern) {
    // Modern wallets: hasPermissions() or getAccounts()
    if (typeof obj.hasPermissions === 'function') {
      try {
        const has = await obj.hasPermissions();
        if (!has) return [];
      } catch {
        return [];
      }
    }
    if (typeof obj.getAccounts === 'function') {
      return await obj.getAccounts();
    }
    return [];
  }

  // Legacy: hasPermission + getAccounts
  if (typeof obj.hasPermission === 'function') {
    try {
      const has = await obj.hasPermission();
      if (!has) return [];
    } catch {
      return [];
    }
  }
  if (typeof obj.getAccounts === 'function') {
    return await obj.getAccounts();
  }
  return [];
}

// ─── Execute transaction (handles both modern and legacy) ───

async function executeWalletTransaction(
  wallet: DetectedWallet,
  tx: unknown,
): Promise<{ digest: string }> {
  const { obj, isModern } = wallet;

  if (isModern && typeof obj.signAndExecuteTransaction === 'function') {
    return await obj.signAndExecuteTransaction({
      transaction: tx,
      options: { showEffects: true },
    });
  }

  if (typeof obj.signAndExecuteTransactionBlock === 'function') {
    return await obj.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: { showEffects: true, showRawEffects: true },
    });
  }

  throw new Error('Wallet does not support transaction execution.');
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
  const [error, setError] = useState('');

  // Check for existing wallet connection on mount
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const wallet = getPrimaryWallet();
        if (!wallet) return;
        const accounts = await checkExistingConnection(wallet);
        if (cancelled) return;
        if (accounts && accounts.length > 0) {
          const addr = accounts[0];
          setAddress(addr);
          setWalletName(wallet.name);
          const balances = await fetchAllTokenBalances(addr);
          if (!cancelled) {
            setSuiBalance(balances.sui);
            setUsdcBalance(balances.usdc);
          }
        }
      } catch {
        // No existing connection
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
    setError('');
    try {
      const wallet = getPrimaryWallet();
      if (!wallet) {
        setError('No Sui wallet detected. Please install the Sui Wallet browser extension and refresh this page.');
        return;
      }

      const accounts = await connectWallet(wallet);
      if (accounts && accounts.length > 0) {
        const addr = accounts[0];
        setAddress(addr);
        setWalletName(wallet.name);
        setError('');
        const balances = await fetchAllTokenBalances(addr);
        setSuiBalance(balances.sui);
        setUsdcBalance(balances.usdc);
      } else {
        setError('Wallet connection was cancelled or no accounts found.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet';
      // User rejected the connection — don't treat as error
      if (msg.includes('reject') || msg.includes('denied') || msg.includes('cancel')) {
        return;
      }
      setError(msg);
    }
  }, []);

  const disconnect = useCallback(() => {
    // Try calling wallet.disconnect() for modern wallets
    try {
      const wallet = getPrimaryWallet();
      if (wallet?.isModern && typeof wallet.obj.disconnect === 'function') {
        wallet.obj.disconnect();
      }
    } catch {
      // Ignore
    }
    setAddress(undefined);
    setSuiBalance('0.0000');
    setUsdcBalance('0.00');
    setWalletName('');
    setError('');
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
          error: 'No wallet connected. Connect your Sui wallet to execute transactions.',
        };
      }

      const result = await executeWalletTransaction(wallet, tx);

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
    error,
  };
}

export function isSuiWalletAvailable(): boolean {
  return typeof window !== 'undefined' && detectSuiWallets().length > 0;
}

export { fetchSuiBalance, fetchUsdcBalance, suiRpc };
