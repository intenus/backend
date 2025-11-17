import { registerAs } from '@nestjs/config';

export interface SuiConfig {
  network: 'devnet' | 'testnet' | 'mainnet';
  rpcUrl: string;
  faucetUrl?: string;
  intentPackageId: string;
  eventPollingIntervalMs?: number;
  autoStartEventListener?: boolean;
}

export const suiConfig = registerAs(
  'sui',
  (): SuiConfig => ({
    network:
      (process.env.SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet') ||
      'testnet',
    rpcUrl:
      process.env.SUI_RPC_URL ||
      (process.env.SUI_NETWORK === 'mainnet'
        ? 'https://fullnode.mainnet.sui.io'
        : 'https://fullnode.testnet.sui.io'),
    faucetUrl: process.env.SUI_FAUCET_URL,
    intentPackageId: process.env.SUI_INTENT_PACKAGE_ID || '',
    eventPollingIntervalMs: parseInt(
      process.env.SUI_EVENT_POLLING_INTERVAL_MS || '2000',
      10,
    ),
    autoStartEventListener:
      process.env.SUI_AUTO_START_EVENT_LISTENER !== 'false',
  }),
);
