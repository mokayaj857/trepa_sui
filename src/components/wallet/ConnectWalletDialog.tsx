import { ExternalLink, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { DetectedWallet } from '@/lib/sui';

const SLUSH_EXTENSION_URL =
  'https://chromewebstore.google.com/detail/slush-%E2%80%94-a-sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil';

interface ConnectWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: DetectedWallet[];
  connecting: boolean;
  onConnect: (walletKey: string) => void;
}

export function ConnectWalletDialog({
  open,
  onOpenChange,
  wallets,
  connecting,
  onConnect,
}: ConnectWalletDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect wallet</DialogTitle>
          <DialogDescription>
            Choose Slush or another Sui wallet. Trepa runs on Sui testnet — switch your wallet to
            Testnet before signing.
          </DialogDescription>
        </DialogHeader>

        {wallets.length > 0 ? (
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <button
                key={wallet.key}
                type="button"
                disabled={connecting}
                onClick={() => onConnect(wallet.key)}
                className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-60"
              >
                {wallet.icon ? (
                  <img src={wallet.icon} alt="" className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{wallet.name}</p>
                  {wallet.name === 'Slush' && (
                    <p className="text-xs text-muted-foreground">Official Sui wallet</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No Sui wallet detected</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Install the Slush browser extension, then refresh this page.
            </p>
            <Button asChild className="mt-4" size="sm">
              <a href={SLUSH_EXTENSION_URL} target="_blank" rel="noopener noreferrer">
                Install Slush
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Need testnet SUI?{' '}
          <a
            href="https://faucet.sui.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Get it from the faucet
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}
