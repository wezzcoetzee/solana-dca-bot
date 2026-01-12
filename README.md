# Dollar Cost Average Bot

A cryptocurrency DCA (Dollar Cost Averaging) bot for Solana. Automatically purchases any token using USDC on a schedule and sends notifications via Telegram.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

## Features

- Automated DCA purchases on customizable schedules
- Portfolio tracking with ROI calculations
- Telegram notifications with trade summaries
- Secure cold wallet transfers

### Roadmap

- Specify time of day, interval, hourly buys, etc.
- DCA using any token (not just USDC)
- Show bot performance over time

## Architecture

```text
src/
├── interfaces/         # TypeScript interfaces (SOLID - DIP)
│   └── index.ts        # ITransactionRepository, IPriceProvider, INotificationProvider, ISwapProvider
├── providers/          # External service integrations
│   ├── database.ts     # Prisma/PostgreSQL repository
│   ├── coingecko.ts    # Price data provider
│   ├── telegram.ts     # Notification provider
│   └── jupiter.ts      # Jupiter swap provider
├── utils/              # Business logic & utilities
│   ├── calculator.ts   # ROI/stats calculations
│   ├── notify.ts       # Notification dispatcher
│   ├── message-formatter.ts  # Message formatting logic
│   ├── solana-bot.ts   # Solana trading orchestrator
│   ├── solana.ts       # Solana wallet utilities
│   ├── token-utils.ts  # Token conversion utilities
│   ├── http-utils.ts   # HTTP response validation
│   ├── retry.ts        # Retry logic
│   ├── logger.ts       # Uptime logging
│   └── config.ts       # Static configuration
├── app.ts              # Application entry point
prisma/
└── schema.prisma       # Database schema
tests/
├── unit/               # Unit tests
└── mocks/              # Test mocks
```

### Design Principles

- **SOLID**: Interfaces for dependency inversion (ITransactionRepository, IPriceProvider, INotificationProvider, ISwapProvider)
  - Single Responsibility: Each class has one reason to change
  - Interface Segregation: Split interfaces (TransactionDetails, WalletBalances, CalculatorResponse)
  - Dependency Inversion: High-level modules depend on abstractions (e.g., SolanaBot uses ISwapProvider)
- **DRY**: Shared utilities for token conversion, HTTP validation, retry logic
- **KISS**: Simple, focused classes with single responsibilities
- **YAGNI**: Removed unused code, added only necessary abstractions

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- PostgreSQL 14+
- Solana wallet with SOL for gas

## Installation

```bash
# Clone repository
git clone <repo-url>
cd dca-bot

# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push
```

## Configuration

Create a `.env` file in the project root:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/dca_bot

# Schedule (cron format)
SCHEDULE=0 0,12 * * *

# Solana Configuration
RPC_ENDPOINT=https://your-rpc-endpoint
JUPITER_API_KEY=your-jupiter-api-key
MNEMONIC=your twelve word seed phrase here
DEST_WALLET=your-cold-wallet-address
USDC_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
USD_AMOUNT_BUY=5
SLIPPAGE=4

# Target Token Configuration
TARGET_TOKEN_ADDRESS=cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij
TARGET_TOKEN_SYMBOL=cbBTC
TARGET_TOKEN_DECIMALS=8
TARGET_TOKEN_COINGECKO_ID=bitcoin

# Telegram
TELEGRAM_BOT_ID=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Development
LOCAL_TEST=false
```

### Configuration Options

| Variable                  | Required | Default         | Description                                      |
|---------------------------|----------|-----------------|--------------------------------------------------|
| `DATABASE_URL`            | Yes      | -               | PostgreSQL connection string                     |
| `SCHEDULE`                | No       | `0 0,12 * * *`  | Cron schedule for DCA (default: 12:00 and 00:00) |
| `RPC_ENDPOINT`            | Yes      | -               | Solana RPC endpoint (e.g., Helius)               |
| `JUPITER_API_KEY`         | Yes      | -               | Jupiter API key for swap quotes                  |
| `MNEMONIC`                | Yes      | -               | 12-word seed phrase for bot wallet               |
| `DEST_WALLET`             | Yes      | -               | Cold wallet address for purchased tokens         |
| `USD_AMOUNT_BUY`          | No       | `5`             | USD amount per purchase                          |
| `SLIPPAGE`                | No       | `4`             | Slippage in basis points (4 = 0.04%)             |
| `TARGET_TOKEN_ADDRESS`    | Yes      | -               | Token mint address to purchase                   |
| `TARGET_TOKEN_SYMBOL`     | No       | `TOKEN`         | Token symbol for notifications                   |
| `TARGET_TOKEN_DECIMALS`   | No       | `8`             | Token decimal places                             |
| `TARGET_TOKEN_COINGECKO_ID`| No      | `bitcoin`       | CoinGecko ID for price data                      |
| `TELEGRAM_BOT_ID`         | Yes      | -               | Telegram bot token                               |
| `TELEGRAM_CHAT_ID`        | Yes      | -               | Telegram chat ID for notifications               |
| `LOCAL_TEST`              | No       | `false`         | Set to `true` to run immediately on startup      |

### Getting a Jupiter API Key

Get your API key from [Jupiter Station](https://station.jup.ag/docs/api/get-api-key).

### Getting Telegram Credentials

See [this guide](https://gist.github.com/nafiesl/4ad622f344cd1dc3bb1ecbe468ff9f8a) for getting Telegram Bot ID and Chat ID.

### Generating a Wallet

Create a new wallet in Phantom and use the mnemonic seed phrase.

## Development

### Running Locally

```bash
# Start the bot
bun run start

# For debugging (triggers immediate run)
# Set LOCAL_TEST=true in .env to run immediately on startup
LOCAL_TEST=true bun run start
```

### Database Commands

```bash
# Generate Prisma client after schema changes
bun run db:generate

# Push schema changes to database
bun run db:push

# Open Prisma Studio (database GUI)
bun run db:studio
```

### Project Scripts

| Script              | Description               |
|---------------------|---------------------------|
| `bun run start`     | Start the bot             |
| `bun run test`      | Run all tests             |
| `bun run test:watch`| Run tests in watch mode   |
| `bun run db:generate`| Generate Prisma client   |
| `bun run db:push`   | Push schema to database   |
| `bun run db:studio` | Open Prisma Studio        |

## Testing

The project uses Bun's built-in test runner.

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test tests/unit/calculator.test.ts
```

### Test Structure

```text
tests/
├── unit/
│   ├── calculator.test.ts  # Calculator service tests
│   ├── database.test.ts    # Database provider tests
│   └── notify.test.ts      # Notification service tests
└── mocks/
    └── index.ts            # Mock implementations
```

### Writing Tests

Tests use mock implementations of interfaces for isolation:

```typescript
import { MockTransactionRepository } from "../mocks";
import Calculator from "../../src/utils/calculator";

const mockRepo = new MockTransactionRepository();
const calculator = new Calculator(mockRepo);
```

## Deployment

### Quick Start with Docker

The easiest way to get started is with Docker Compose, which includes PostgreSQL:

```bash
# Clone the repository
git clone <repo-url>
cd dca-bot

# Create your .env file (see Configuration section)
cp .env.example .env

# Start everything (bot + PostgreSQL)
docker-compose up -d
```

This will:

- Start a PostgreSQL database with persistent storage
- Build and run the DCA bot
- Automatically connect the bot to the database

### Manual Deployment

If you prefer to use your own PostgreSQL instance:

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Start bot
bun run start
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f dca-bot

# Stop services
docker-compose down

# Stop and remove data
docker-compose down -v
```

## License

MIT
