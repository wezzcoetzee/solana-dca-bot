interface ExplorerConfig {
  txUrl: string;
  accountUrl: string;
}

interface TelegramConfig {
  botUrl: string;
}

interface AppConfig {
  blockchainExplorer: ExplorerConfig;
  telegram: TelegramConfig;
}

export const Config: AppConfig = {
  blockchainExplorer: {
    txUrl: "https://www.orbmarkets.io/tx",
    accountUrl: "https://www.orbmarkets.io/address",
  },
  telegram: {
    botUrl: "https://api.telegram.org/bot",
  },
};
