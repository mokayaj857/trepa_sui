/**
 * Register the Slush web wallet with the Wallet Standard.
 * The browser extension registers itself automatically; this enables
 * the Slush web app fallback when no extension is installed.
 */
import { registerSlushWallet } from '@mysten/slush-wallet';

export function initSlushWallet(): void {
  if (typeof window === 'undefined') return;
  registerSlushWallet('Trepa');
}
