/**
 * Trepa Sui Wallet — Testnet
 *
 * Connects to Sui wallets via the Wallet Standard (the official cross-chain
 * protocol that all Sui wallets implement). Uses:
 *
 *   - getWallets() for discovery
 *   - wallet.features['standard:connect'] for connecting
 *   - wallet.features['sui:signAndExecuteTransaction'] for v2 execution
 *   - wallet.features['sui:signAndExecuteTransactionBlock'] for legacy v1
 *   - wallet.accounts for auto-restored authorized accounts
 *
 * Also falls back to legacy injected wallets (window.suiWallet) for
 * older extensions that don't use the Wallet Standard.
 *
 * All on-chain reads use direct JSON-RPC to Sui testnet.
 */

import { useState, useCallback, useEffect } from 'react';

// ─── Sui Testnet RPC ───

export const SUI_TESTNET_URL = 'https://fullnode.testnet.sui.io:443';
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

// ─── Coin Types ───

export const COIN_TYPES = {
  SUI: '0x2::sui::SUI',
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

// ─── Wallet Standard Types ───
// Minimal types for the Wallet Standard we need.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

interface WalletAccount {
  address: string;
  publicKey?: Uint8Array;
  chains: string[];
  features: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface Wallet {
  name: string;
  icon: string;
  version: string;
  accounts: WalletAccount[];
  chains: string[];
  features: AnyRecord;
}

// ─── Wallet Standard Discovery ───

function getRegisteredWallets(): Wallet[] {
  if (typeof window === 'undefined') return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;

  // The Wallet Standard registers wallets via getWallets()
  // which is typically available from @wallet-standard/base
  // But in practice, wallets also register on window.__SUI__WALLET_STANDARD__ etc.
  // The most reliable way is to check window.walletStandard

  const wallets: Wallet[] = [];

  // Method 1: Wallet Standard getWallets()
  // Some dapp-kit bundles register this globally
  if (typeof w.getWallets === 'function') {
    try {
      const found = w.getWallets().get();
      if (Array.isArray(found)) {
        wallets.push(...found);
      }
    } catch {
      // getWallets() not available
    }
  }

  // Method 2: Check window.walletStandard
  if (w.walletStandard?.wallets && Array.isArray(w.walletStandard.wallets)) {
    for (const wallet of w.walletStandard.wallets) {
      if (!wallets.some(w => w.name === wallet.name)) {
        wallets.push(wallet);
      }
    }
  }

  // Method 3: Direct wallet injection (legacy fallback)
  // Sui Wallet injects as window.sui with Wallet Standard interface
  if (w.sui && typeof w.sui === 'object' && !wallets.some(wl => wl.name === (w.sui.name ?? 'Sui Wallet'))) {
    // Check if it implements Wallet Standard features
    const hasFeatures = w.sui.features && typeof w.sui.features === 'object';
    const hasAccounts = Array.isArray(w.sui.accounts);
    const hasConnect = hasFeatures && (
      typeof w.sui.features['standard:connect']?.connect === 'function'
    );

    if (hasFeatures || hasAccounts || hasConnect || typeof w.sui.connect === 'function') {
      wallets.push(w.sui);
    }
  }

  // Suiet
  if (w.__suiet__ && typeof w.__suiet__ === 'object' && !wallets.some(wl => wl.name === 'Suiet')) {
    if (w.__suiet__.features || Array.isArray(w.__suiet__.accounts) || typeof w.__suiet__.connect === 'function') {
      w.__suiet__.name = w.__suiet__.name ?? 'Suiet';
      wallets.push(w.__suiet__);
    }
  }

  return wallets;
}

// ─── Connect via Wallet Standard ───

async function connectStandardWallet(wallet: Wallet): Promise<WalletAccount[]> {
  // If the wallet already has authorized accounts, return them
  if (wallet.accounts && wallet.accounts.length > 0) {
    return wallet.accounts;
  }

  // Try standard:connect feature
  const connectFeature = wallet.features?.['standard:connect'];
  if (connectFeature && typeof connectFeature.connect === 'function') {
    const result = await connectFeature.connect();
    // connect() may return { accounts: WalletAccount[] }
    if (result?.accounts && result.accounts.length > 0) {
      return result.accounts;
    }
  }

  // Fallback: legacy connect() method on the wallet object
  if (typeof (wallet as AnyRecord).connect === 'function') {
    const result = await (wallet as AnyRecord).connect();
    if (result?.accounts && result.accounts.length > 0) {
      return result.accounts;
    }
    // Some wallets return the accounts array directly
    if (Array.isArray(result) && result.length > 0) {
      return result;
    }
  }

  // Fallback: requestPermissions + getAccounts (legacy Sui Wallet)
  if (typeof (wallet as AnyRecord).requestPermissions === 'function') {
    await (wallet as AnyRecord).requestPermissions();
  }
  if (typeof (wallet as AnyRecord).getAccounts === 'function') {
    const accounts = await (wallet as AnyRecord).getAccounts();
    if (Array.isArray(accounts) && accounts.length > 0) {
      // Convert string addresses to minimal WalletAccount-like objects
      return accounts.map((addr: string) => ({
        address: typeof addr === 'string' ? addr : addr.address,
        chains: ['sui:testnet'],
        features: [],
      }));
    }
  }

  // Last check: maybe accounts got populated after connect
  if (wallet.accounts && wallet.accounts.length > 0) {
    return wallet.accounts;
  }

  return [];
}

// ─── Check existing connection ───

function getExistingAccounts(wallet: Wallet): WalletAccount[] {
  // The Wallet Standard says wallets auto-restore authorized accounts
  if (wallet.accounts && wallet.accounts.length > 0) {
    return wallet.accounts;
  }
  return [];
}

// ─── Execute transaction via Wallet Standard ───

async function executeViaWallet(
  wallet: Wallet,
  account: WalletAccount,
  tx: unknown,
): Promise<{ digest: string }> {
  // Try v2: sui:signAndExecuteTransaction
  const v2Feature = wallet.features?.['sui:signAndExecuteTransaction'];
  if (v2Feature && typeof v2Feature.signAndExecuteTransaction === 'function') {
    return await v2Feature.signAndExecuteTransaction({
      transaction: tx,
      account,
      chain: 'sui:testnet',
      options: { showEffects: true },
    });
  }

  // Try v1 legacy: sui:signAndExecuteTransactionBlock
  const v1Feature = wallet.features?.['sui:signAndExecuteTransactionBlock'];
  if (v1Feature && typeof v1Feature.signAndExecuteTransactionBlock === 'function') {
    return await v1Feature.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      account,
      chain: 'sui:testnet',
      options: { showEffects: true, showRawEffects: true },
    });
  }

  // Fallback: direct method on wallet object (legacy injection)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = wallet as any;
  if (typeof w.signAndExecuteTransaction === 'function') {
    return await w.signAndExecuteTransaction({
      transaction: tx,
      options: { showEffects: true },
    });
  }
  if (typeof w.signAndExecuteTransactionBlock === 'function') {
    return await w.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: { showEffects: true, showRawEffects: true },
    });
  }

  throw new Error('Wallet does not support transaction execution.');
}

// ─── Disconnect via Wallet Standard ───

async function disconnectWallet(wallet: Wallet): Promise<void> {
  const disconnectFeature = wallet.features?.['standard:disconnect'];
  if (disconnectFeature && typeof disconnectFeature.disconnect === 'function') {
    try {
      await disconnectFeature.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    return;
  }
  // Fallback: direct method
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = wallet as any;
  if (typeof w.disconnect === 'function') {
    try { await w.disconnect(); } catch { /* ignore */ }
  }
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

  // Keep a reference to the connected wallet object and account
  // These are NOT React state because they're mutable objects from the wallet extension
  // that we don't control — putting them in state causes stale reference issues
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [connectedWallet, setConnectedWallet] = useState<Wallet | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<WalletAccount | null>(null);

  // Check for existing wallet connection on mount
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const wallets = getRegisteredWallets();
        for (const wallet of wallets) {
          const accounts = getExistingAccounts(wallet);
          if (accounts.length > 0) {
            // Find a Sui account
            const suiAccount = accounts.find((a: WalletAccount) =>
              a.chains?.some((c: string) => c.startsWith('sui:'))
            ) ?? accounts[0];

            const addr = suiAccount.address;
            if (!addr) continue;

            if (cancelled) return;
            setAddress(addr);
            setWalletName(wallet.name);
            setConnectedWallet(wallet);
            setConnectedAccount(suiAccount);

            const balances = await fetchAllTokenBalances(addr);
            if (!cancelled) {
              setSuiBalance(balances.sui);
              setUsdcBalance(balances.usdc);
            }
            break; // Connected to first available
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
        // Keep existing values
      }
    }, 15000);
    return () => clearInterval(iv);
  }, [address]);

  // Listen for wallet account changes
  useEffect(() => {
    if (!connectedWallet) return;

    const eventsFeature = connectedWallet.features?.['standard:events'];
    if (eventsFeature && typeof eventsFeature.on === 'function') {
      const unsubscribe = eventsFeature.on('change', (event: { accounts?: WalletAccount[] }) => {
        if (event.accounts && event.accounts.length > 0) {
          const acc = event.accounts[0];
          setAddress(acc.address);
          setConnectedAccount(acc);
          // Refresh balances
          fetchAllTokenBalances(acc.address).then(b => {
            setSuiBalance(b.sui);
            setUsdcBalance(b.usdc);
          }).catch(() => {});
        } else {
          // No more accounts — wallet disconnected externally
          setAddress(undefined);
          setSuiBalance('0.0000');
          setUsdcBalance('0.00');
          setWalletName('');
          setConnectedWallet(null);
          setConnectedAccount(null);
        }
      });

      return unsubscribe;
    }
  }, [connectedWallet]);

  const isConnected = !!address;
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : undefined;

  const connect = useCallback(async () => {
    setError('');
    try {
      const wallets = getRegisteredWallets();

      if (wallets.length === 0) {
        setError('No Sui wallet detected. Install the Sui Wallet extension and refresh this page.');
        return;
      }

      // Use the first registered wallet
      const wallet = wallets[0];
      const accounts = await connectStandardWallet(wallet);

      if (accounts.length === 0) {
        setError('No accounts found. Please unlock your wallet and try again.');
        return;
      }

      // Find a Sui-compatible account
      const suiAccount = accounts.find((a: WalletAccount) =>
        a.chains?.some((c: string) => c.startsWith('sui:'))
      ) ?? accounts[0];

      const addr = suiAccount.address;
      if (!addr) {
        setError('Could not get wallet address.');
        return;
      }

      setAddress(addr);
      setWalletName(wallet.name);
      setConnectedWallet(wallet);
      setConnectedAccount(suiAccount);
      setError('');

      const balances = await fetchAllTokenBalances(addr);
      setSuiBalance(balances.sui);
      setUsdcBalance(balances.usdc);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // User rejected — don't show an error, they chose to cancel
      if (
        msg.toLowerCase().includes('reject') ||
        msg.toLowerCase().includes('denied') ||
        msg.toLowerCase().includes('cancel') ||
        msg.toLowerCase().includes('user')
      ) {
        return;
      }
      setError(`Connection failed: ${msg}`);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (connectedWallet) {
      await disconnectWallet(connectedWallet);
    }
    setAddress(undefined);
    setSuiBalance('0.0000');
    setUsdcBalance('0.00');
    setWalletName('');
    setConnectedWallet(null);
    setConnectedAccount(null);
    setError('');
  }, [connectedWallet]);

  const executeTransaction = useCallback(async (tx: unknown): Promise<ExecutionResult> => {
    setIsExecuting(true);
    try {
      if (!connectedWallet || !connectedAccount || !address) {
        return {
          success: false,
          digest: '',
          gasUsed: '0 SUI',
          error: 'No wallet connected. Connect your Sui wallet first.',
        };
      }

      const result = await executeViaWallet(connectedWallet, connectedAccount, tx);

      if (result?.digest) {
        // Wait for finality
        await suiRpc('sui_waitForTransaction', [result.digest]);

        // Get gas info
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
          // Keep default
        }

        return { success: true, digest: result.digest, gasUsed };
      }

      return { success: false, digest: '', gasUsed: '0 SUI', error: 'No digest returned.' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      return { success: false, digest: '', gasUsed: '0 SUI', error: message };
    } finally {
      setIsExecuting(false);
    }
  }, [connectedWallet, connectedAccount, address]);

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
  return typeof window !== 'undefined' && getRegisteredWallets().length > 0;
}

export { fetchSuiBalance, fetchUsdcBalance, suiRpc };
