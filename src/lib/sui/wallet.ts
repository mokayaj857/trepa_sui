/**
 * Trepa Sui Wallet — Testnet
 *
 * Connects to Slush (official Sui wallet) and other Sui-compatible wallets
 * via the Wallet Standard. Uses:
 *
 *   - @wallet-standard/core getWallets() for discovery
 *   - @mysten/slush-wallet registerSlushWallet() for web wallet fallback
 *   - wallet.features['standard:connect'] for connecting
 *   - wallet.features['sui:signAndExecuteTransaction'] for v2 execution
 *   - wallet.features['sui:signAndExecuteTransactionBlock'] for legacy v1
 *   - wallet.accounts for auto-restored authorized accounts
 *
 * Also falls back to legacy injected wallets (window.sui) for older
 * extensions.
 *
 * All on-chain reads use direct JSON-RPC to Sui testnet.
 */

import { getWallets } from '@wallet-standard/core';
import { SLUSH_WALLET_NAME } from '@mysten/slush-wallet';

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

export const SUI_TESTNET_CHAIN = 'sui:testnet';
const SLUSH_EXTENSION_ID = 'com.mystenlabs.suiwallet';

export interface DetectedWallet {
  key: string;
  name: string;
  icon: string;
  id?: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | undefined;
  shortAddress: string | undefined;
  suiBalance: string;
  usdcBalance: string;
  connect: (walletKey?: string) => Promise<boolean>;
  disconnect: () => void;
  executeTransaction: (tx: unknown) => Promise<ExecutionResult>;
  isExecuting: boolean;
  walletName: string;
  network: string;
  error: string;
  availableWallets: DetectedWallet[];
}

export interface ExecutionResult {
  success: boolean;
  digest: string;
  gasUsed: string;
  error?: string;
}

// ─── Wallet types (compatible with Wallet Standard but mutable for internal use) ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export interface WalletAccount {
  address: string;
  publicKey?: Uint8Array;
  chains: string[];
  features: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface Wallet {
  name: string;
  icon: string;
  version: string;
  accounts: WalletAccount[];
  chains: string[];
  features: Record<string, unknown>;
}

// ─── Wallet Standard Discovery ───

/**
 * Get all registered wallets via the Wallet Standard + legacy fallbacks.
 *
 * Primary: getWallets() from @wallet-standard/core dispatches
 * wallet-standard:app-ready and listens for wallet-standard:register-wallet
 * events. This handles both pre-loaded and late-loading wallets correctly.
 *
 * Fallback: check window.sui (Sui Wallet direct injection) for wallets
 * that haven't migrated to the Wallet Standard event model.
 */
function getRegisteredWallets(): Wallet[] {
  if (typeof window === 'undefined') return [];

  const wallets: Wallet[] = [];

  // Method 1: Wallet Standard via @wallet-standard/core
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const standardWallets = getWallets().get() as any[];
    for (const w of standardWallets) {
      wallets.push(w);
    }
  } catch {
    // getWallets() may fail in non-browser environments
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;

  // Method 2: window.sui (Slush/Sui Wallet legacy direct injection)
  if (w.sui && typeof w.sui === 'object' && !wallets.some(wl => wl.name === (w.sui.name ?? 'Sui Wallet'))) {
    const hasFeatures = w.sui.features && typeof w.sui.features === 'object';
    const hasAccounts = Array.isArray(w.sui.accounts);
    const hasConnect = hasFeatures && (
      typeof w.sui.features['standard:connect']?.connect === 'function'
    );

    if (hasFeatures || hasAccounts || hasConnect || typeof w.sui.connect === 'function') {
      wallets.push(w.sui);
    }
  }

  // Method 3: window.__suiet__ (Suiet legacy injection)
  if (w.__suiet__ && typeof w.__suiet__ === 'object' && !wallets.some(wl => wl.name === 'Suiet')) {
    if (w.__suiet__.features || Array.isArray(w.__suiet__.accounts) || typeof w.__suiet__.connect === 'function') {
      w.__suiet__.name = w.__suiet__.name ?? 'Suiet';
      wallets.push(w.__suiet__);
    }
  }

  return wallets;
}

function getWalletKey(wallet: Wallet): string {
  const wAny = wallet as AnyRecord;
  if (typeof wAny.id === 'string' && wAny.id.length > 0) return wAny.id;
  return wallet.name;
}

function isSuiCompatibleWallet(wallet: Wallet): boolean {
  const wAny = wallet as AnyRecord;
  if (wallet.name === SLUSH_WALLET_NAME || wAny.id === SLUSH_EXTENSION_ID) return true;
  if (wallet.chains?.some((c: string) => c.startsWith('sui:'))) return true;

  const features = wallet.features ?? {};
  return (
    'sui:signAndExecuteTransaction' in features ||
    'sui:signAndExecuteTransactionBlock' in features ||
    'sui:signTransaction' in features ||
    'sui:signTransactionBlock' in features
  );
}

function dedupeWallets(wallets: Wallet[]): Wallet[] {
  const seen = new Set<string>();
  const result: Wallet[] = [];
  for (const wallet of wallets) {
    const key = getWalletKey(wallet);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(wallet);
  }
  return result;
}

export function getSuiWallets(): Wallet[] {
  return sortWalletsPreferSlush(
    dedupeWallets(getRegisteredWallets().filter(isSuiCompatibleWallet)),
  );
}

function walletPriority(wallet: Wallet): number {
  const wAny = wallet as AnyRecord;
  if (wallet.name === SLUSH_WALLET_NAME || wAny.id === SLUSH_EXTENSION_ID) return 3;
  if (wallet.chains?.some((c: string) => c.startsWith('sui:'))) return 2;
  return 1;
}

function sortWalletsPreferSlush(wallets: Wallet[]): Wallet[] {
  return [...wallets].sort((a, b) => walletPriority(b) - walletPriority(a));
}

export function getAvailableWallets(): DetectedWallet[] {
  return getSuiWallets().map((wallet) => {
    const wAny = wallet as AnyRecord;
    const key = getWalletKey(wallet);
    return {
      key,
      name: wallet.name,
      icon: wallet.icon ?? '',
      id: typeof wAny.id === 'string' ? wAny.id : undefined,
    };
  });
}

export function findWalletByKey(wallets: Wallet[], walletKey: string): Wallet | undefined {
  return wallets.find((wallet) => getWalletKey(wallet) === walletKey);
}

// ─── Connect via Wallet Standard ───

export async function connectStandardWallet(wallet: Wallet): Promise<WalletAccount[]> {
  // If the wallet already has authorized accounts, return them
  if (wallet.accounts && wallet.accounts.length > 0) {
    return [...wallet.accounts];
  }

  // Try standard:connect feature (Wallet Standard API)
  const connectFeature = wallet.features?.['standard:connect'] as AnyRecord | undefined;
  if (connectFeature && typeof connectFeature.connect === 'function') {
    try {
      const result = await connectFeature.connect({ silent: false });
      if (result?.accounts && result.accounts.length > 0) {
        return [...result.accounts];
      }
      if (result?.address) {
        return [{ address: result.address, chains: [SUI_TESTNET_CHAIN], features: [] }];
      }
      if (Array.isArray(result) && result.length > 0) {
        return result.map((a: { address?: string } | string) => ({
          address: typeof a === 'string' ? a : a.address ?? '',
          chains: [SUI_TESTNET_CHAIN],
          features: [],
        }));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        !msg.toLowerCase().includes('reject') &&
        !msg.toLowerCase().includes('denied') &&
        !msg.toLowerCase().includes('cancel')
      ) {
        throw e;
      }
    }
  }

  // Fallback: try window.sui legacy methods directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suiLegacy = typeof window !== 'undefined' ? (window as any).sui : undefined;
  if (suiLegacy) {
    if (typeof suiLegacy.connect === 'function') {
      try {
        const result = await suiLegacy.connect();
        if (result?.accounts && result.accounts.length > 0) {
          return [...result.accounts];
        }
        if (Array.isArray(result) && result.length > 0) {
          return result.map((a: { address?: string } | string) => ({
            address: typeof a === 'string' ? a : a.address ?? '',
            chains: [SUI_TESTNET_CHAIN],
            features: [],
          }));
        }
        if (result?.address) {
          return [{ address: result.address, chains: [SUI_TESTNET_CHAIN], features: [] }];
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (
          !msg.toLowerCase().includes('reject') &&
          !msg.toLowerCase().includes('denied') &&
          !msg.toLowerCase().includes('cancel')
        ) {
          throw e;
        }
      }
    }

    if (typeof suiLegacy.requestPermissions === 'function' && typeof suiLegacy.getAccounts === 'function') {
      try {
        await suiLegacy.requestPermissions();
        const accounts = await suiLegacy.getAccounts();
        if (Array.isArray(accounts) && accounts.length > 0) {
          return accounts.map((a: { address?: string } | string) => ({
            address: typeof a === 'string' ? a : a.address ?? '',
            chains: [SUI_TESTNET_CHAIN],
            features: [],
          }));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (
          !msg.toLowerCase().includes('reject') &&
          !msg.toLowerCase().includes('denied') &&
          !msg.toLowerCase().includes('cancel')
        ) {
          throw e;
        }
      }
    }
  }

  if (wallet.accounts && wallet.accounts.length > 0) {
    return [...wallet.accounts];
  }

  return [];
}

// ─── Check existing connection ───

export function getExistingAccounts(wallet: Wallet): WalletAccount[] {
  // The Wallet Standard says wallets auto-restore authorized accounts
  if (wallet.accounts && wallet.accounts.length > 0) {
    return [...wallet.accounts];
  }
  return [];
}

// ─── Execute transaction via Wallet Standard ───

interface TransactionWithToJSON {
  toJSON: (options?: unknown) => Promise<string>;
}

function hasToJSON(tx: unknown): tx is TransactionWithToJSON {
  return (
    typeof tx === 'object' &&
    tx !== null &&
    typeof (tx as TransactionWithToJSON).toJSON === 'function'
  );
}

export async function executeViaWallet(
  wallet: Wallet,
  account: WalletAccount,
  tx: unknown,
): Promise<{ digest: string }> {
  const wAny = wallet as AnyRecord;

  // v2: sui:signAndExecuteTransaction — requires Transaction with toJSON()
  const v2 = wAny.features?.['sui:signAndExecuteTransaction'];
  if (v2 && typeof v2.signAndExecuteTransaction === 'function' && hasToJSON(tx)) {
    return await v2.signAndExecuteTransaction({
      transaction: tx,
      account,
      chain: SUI_TESTNET_CHAIN,
      options: { showEffects: true },
    });
  }

  // v1: sui:signAndExecuteTransactionBlock — legacy TransactionBlock
  const v1 = wAny.features?.['sui:signAndExecuteTransactionBlock'];
  if (v1 && typeof v1.signAndExecuteTransactionBlock === 'function') {
    return await v1.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      account,
      chain: SUI_TESTNET_CHAIN,
      options: { showEffects: true, showRawEffects: true },
    });
  }

  // Fallback: direct method on wallet object (legacy injection)
  if (typeof wAny.signAndExecuteTransaction === 'function' && hasToJSON(tx)) {
    return await wAny.signAndExecuteTransaction({
      transaction: tx,
      account,
      chain: SUI_TESTNET_CHAIN,
      options: { showEffects: true },
    });
  }
  if (typeof wAny.signAndExecuteTransactionBlock === 'function') {
    return await wAny.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      account,
      chain: SUI_TESTNET_CHAIN,
      options: { showEffects: true, showRawEffects: true },
    });
  }

  throw new Error('Wallet does not support transaction execution.');
}

// ─── Disconnect via Wallet Standard ───

export async function disconnectWallet(wallet: Wallet): Promise<void> {
  const wAny = wallet as AnyRecord;

  const disconnectFeature = wAny.features?.['standard:disconnect'];
  if (disconnectFeature && typeof disconnectFeature.disconnect === 'function') {
    try {
      await disconnectFeature.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    return;
  }
  // Fallback: direct method
  if (typeof wAny.disconnect === 'function') {
    try { await wAny.disconnect(); } catch { /* ignore */ }
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

export async function fetchAllTokenBalances(owner: string): Promise<{ sui: string; usdc: string }> {
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

// ─── Availability check ───

export function isSuiWalletAvailable(): boolean {
  return typeof window !== 'undefined' && getSuiWallets().length > 0;
}

export { fetchSuiBalance, fetchUsdcBalance, suiRpc };
