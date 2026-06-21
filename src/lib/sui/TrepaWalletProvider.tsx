import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { getWallets } from '@wallet-standard/core';
import type { WalletState } from './wallet';
import {
  connectStandardWallet,
  disconnectWallet,
  executeViaWallet,
  fetchAllTokenBalances,
  findWalletByKey,
  getAvailableWallets,
  getExistingAccounts,
  getSuiWallets,
  suiRpc,
  type Wallet,
  type WalletAccount,
} from './wallet';

const TrepaWalletContext = createContext<WalletState | null>(null);

function subscribeToWallets(callback: () => void): () => void {
  const wallets = getWallets();
  const off1 = wallets.on('register', callback);
  const off2 = wallets.on('unregister', callback);
  return () => {
    off1();
    off2();
  };
}

function getStandardWalletsSnapshot(): number {
  return getWallets().get().length;
}

export function TrepaWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | undefined>();
  const [suiBalance, setSuiBalance] = useState('0.0000');
  const [usdcBalance, setUsdcBalance] = useState('0.00');
  const [isExecuting, setIsExecuting] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [error, setError] = useState('');
  const [connectedWallet, setConnectedWallet] = useState<Wallet | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<WalletAccount | null>(null);

  const walletCount = useSyncExternalStore(
    subscribeToWallets,
    getStandardWalletsSnapshot,
    getStandardWalletsSnapshot,
  );
  const availableWallets = getAvailableWallets();

  // Restore existing wallet authorization once for the whole app
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const wallets = getSuiWallets();
        for (const wallet of wallets) {
          const accounts = getExistingAccounts(wallet);
          if (accounts.length === 0) continue;

          const suiAccount =
            accounts.find((a: WalletAccount) =>
              a.chains?.some((c: string) => c.startsWith('sui:')),
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
          break;
        }
      } catch {
        // No existing connection
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [walletCount]);

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

  useEffect(() => {
    if (!connectedWallet) return;

    const eventsFeature = connectedWallet.features?.['standard:events'] as
      | { on: (event: string, listener: (event: { accounts?: WalletAccount[] }) => void) => (() => void) | undefined }
      | undefined;

    if (!eventsFeature || typeof eventsFeature.on !== 'function') return;

    const unsubscribe = eventsFeature.on('change', (event) => {
      if (event.accounts && event.accounts.length > 0) {
        const acc = event.accounts[0];
        setAddress(acc.address);
        setConnectedAccount(acc);
        void fetchAllTokenBalances(acc.address).then((b: { sui: string; usdc: string }) => {
          setSuiBalance(b.sui);
          setUsdcBalance(b.usdc);
        });
      } else {
        setAddress(undefined);
        setSuiBalance('0.0000');
        setUsdcBalance('0.00');
        setWalletName('');
        setConnectedWallet(null);
        setConnectedAccount(null);
      }
    });

    return typeof unsubscribe === 'function' ? unsubscribe : undefined;
  }, [connectedWallet]);

  const connect = useCallback(async (walletKey?: string): Promise<boolean> => {
    setError('');
    try {
      const wallets = getSuiWallets();

      if (wallets.length === 0) {
        setError('No Sui wallet detected. Install the Slush extension and refresh this page.');
        return false;
      }

      const wallet = walletKey ? findWalletByKey(wallets, walletKey) ?? wallets[0] : wallets[0];
      const accounts = await connectStandardWallet(wallet);

      if (accounts.length === 0) {
        setError('No accounts found. Unlock Slush, switch to Testnet, and try again.');
        return false;
      }

      const suiAccount =
        accounts.find((a: WalletAccount) =>
          a.chains?.some((c: string) => c.startsWith('sui:')),
        ) ?? accounts[0];

      const addr = suiAccount.address;
      if (!addr) {
        setError('Could not get wallet address.');
        return false;
      }

      setAddress(addr);
      setWalletName(wallet.name);
      setConnectedWallet(wallet);
      setConnectedAccount(suiAccount);
      setError('');

      const balances = await fetchAllTokenBalances(addr);
      setSuiBalance(balances.sui);
      setUsdcBalance(balances.usdc);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes('reject') ||
        msg.toLowerCase().includes('denied') ||
        msg.toLowerCase().includes('cancel') ||
        msg.toLowerCase().includes('user')
      ) {
        return false;
      }
      setError(`Connection failed: ${msg}`);
      return false;
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

  const executeTransaction = useCallback(
    async (tx: unknown) => {
      setIsExecuting(true);
      try {
        if (!connectedWallet || !connectedAccount || !address) {
          return {
            success: false,
            digest: '',
            gasUsed: '0 SUI',
            error: 'No wallet connected. Connect Slush on Testnet first.',
          };
        }

        const result = await executeViaWallet(connectedWallet, connectedAccount, tx);

        if (result?.digest) {
          await suiRpc('sui_waitForTransaction', [result.digest]);

          let gasUsed = '~0.002 SUI';
          try {
            const txDetails = (await suiRpc('sui_getTransactionBlock', [
              result.digest,
              { showEffects: true },
            ])) as {
              effects?: {
                gasUsed?: { computationCost: string; storageCost: string; storageRebate: string };
              };
            };
            if (txDetails.effects?.gasUsed) {
              const g = txDetails.effects.gasUsed;
              const totalGas =
                BigInt(g.computationCost) + BigInt(g.storageCost) - BigInt(g.storageRebate);
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
    },
    [connectedWallet, connectedAccount, address],
  );

  const value = useMemo<WalletState>(
    () => ({
      isConnected: !!address,
      address,
      shortAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : undefined,
      suiBalance,
      usdcBalance,
      connect,
      disconnect,
      executeTransaction,
      isExecuting,
      walletName,
      network: 'testnet',
      error,
      availableWallets,
    }),
    [
      address,
      suiBalance,
      usdcBalance,
      connect,
      disconnect,
      executeTransaction,
      isExecuting,
      walletName,
      error,
      availableWallets,
    ],
  );

  return (
    <TrepaWalletContext.Provider value={value}>{children}</TrepaWalletContext.Provider>
  );
}

export function useTrepaWallet(): WalletState {
  const context = useContext(TrepaWalletContext);
  if (!context) {
    throw new Error('useTrepaWallet must be used within TrepaWalletProvider');
  }
  return context;
}
