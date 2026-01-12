# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Solana DCA (Dollar Cost Averaging) bot that automatically purchases tokens using USDC on a schedule. The bot uses Jupiter for swaps, tracks portfolio performance, and sends Telegram notifications.

**Version**: 1.1.0 (defined in app.ts)
**Runtime**: Bun (not Node.js)
**Language**: TypeScript with strict mode
**Database**: PostgreSQL via Prisma ORM

## Common Commands

```bash
# Start the bot
bun run start

# Run tests
bun test                    # All tests
bun test --watch           # Watch mode
bun test <file-path>       # Single test file

# Database operations
bun run db:generate        # Generate Prisma client (run after schema changes)
bun run db:push           # Push schema to database (creates/updates tables)
bun run db:studio         # Open Prisma Studio (database GUI)

# Docker deployment
docker-compose up -d       # Start bot + PostgreSQL
docker-compose logs -f dca-bot  # View logs
docker-compose down        # Stop services
docker-compose down -v     # Stop and remove data
```

## Development Workflow

### Running Locally for Testing

Set `LOCAL_TEST=true` in `.env` to trigger an immediate run on startup instead of waiting for the cron schedule. Useful for debugging.

### After Schema Changes

Always run both commands in sequence:

```bash
bun run db:generate  # Generate TypeScript types
bun run db:push      # Update database schema
```

### Testing Philosophy

- Tests use Bun's built-in test runner (not Jest)
- Mock implementations follow interfaces defined in `src/interfaces/index.ts`
- Tests are located in `tests/unit/` with mocks in `tests/mocks/`
- Run tests after changes to calculator, database, or notification logic

## Architecture

### Core Design Patterns

The codebase follows SOLID principles with dependency inversion via interfaces:

**Key Interfaces** (`src/interfaces/index.ts`):

- `ITransactionRepository`: Database operations (implemented by `DatabaseProvider`)
- `IPriceProvider`: Price data fetching (implemented by `CoinGeckoProvider`)
- `INotificationProvider`: Notification sending (implemented by `TelegramProvider`)

This allows easy testing via mocks and clean separation of concerns.

### Data Flow

1. **Scheduler** (`app.ts`): Cron job triggers `run()` function
2. **Bot** (`solana-bot.ts`):
   - Gets quote from Jupiter API
   - Executes swap transaction on Solana
   - Transfers purchased tokens to cold wallet
3. **Database** (`database.ts`): Records transaction details
4. **Calculator** (`calculator.ts`): Computes portfolio stats (ROI, profit, avg price)
5. **Notifier** (`notify.ts`): Formats and sends Telegram message with results

### Module Responsibilities

| Module | Purpose | External Dependencies |
|--------|---------|----------------------|
| `providers/database.ts` | Prisma/PostgreSQL wrapper | `@prisma/client`, `pg` |
| `providers/coingecko.ts` | Fetch token prices | CoinGecko API |
| `providers/telegram.ts` | Send notifications | Telegram Bot API |
| `utils/solana-bot.ts` | Jupiter swap + Solana transactions | `@jup-ag/api`, `@solana/web3.js` |
| `utils/calculator.ts` | ROI/stats computations | None (pure logic) |
| `utils/notify.ts` | Message formatting | None (pure logic) |
| `utils/solana.ts` | Solana wallet utilities | `@solana/web3.js`, `bip39` |
| `utils/config.ts` | Static configuration | None |
| `utils/logger.ts` | Uptime logging | None |

### Critical Implementation Details

**Wallet Setup** (`utils/solana.ts`):

- Bot derives keypair from `MNEMONIC` environment variable using BIP39 + Ed25519
- Uses BIP44 derivation path: `m/44'/501'/0'/0'`
- Bot wallet needs SOL for fees and USDC for swaps
- Destination wallet (`DEST_WALLET`) receives purchased tokens

**Swap Flow** (`utils/solana-bot.ts`):

1. Check destination wallet has token account for target token (fails if missing)
2. Get quote from Jupiter with slippage tolerance
3. Execute swap with `destinationTokenAccount` parameter to send directly to cold wallet
4. Confirm transaction before proceeding

**Retry Logic** (`app.ts`):

- Max 5 retries on failure with 10-second delay between attempts
- Retries reset to 0 after successful run
- After max retries, logs error and waits for next scheduled run

**Token Configuration**:

- Any SPL token can be purchased by setting `TARGET_TOKEN_ADDRESS`
- Must also set `TARGET_TOKEN_SYMBOL`, `TARGET_TOKEN_DECIMALS`, and `TARGET_TOKEN_COINGECKO_ID`
- Default is cbBTC (Coinbase Wrapped Bitcoin)

## Environment Variables

Required variables (see `.env.example`):

- `DATABASE_URL`: PostgreSQL connection string
- `RPC_ENDPOINT`: Solana RPC endpoint (use Helius/QuickNode for reliability)
- `JUPITER_API_KEY`: Get from Jupiter Station (station.jup.ag/docs/api/get-api-key)
- `MNEMONIC`: 12-word seed phrase for bot wallet
- `DEST_WALLET`: Cold wallet address to receive purchased tokens
- `TARGET_TOKEN_ADDRESS`: Token mint address to purchase
- `USDC_ADDRESS`: USDC token mint address (default: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
- `TELEGRAM_BOT_ID`: Telegram bot token
- `TELEGRAM_CHAT_ID`: Telegram chat ID for notifications

Optional variables:

- `SCHEDULE`: Cron format (default: `0 0,12 * * *` = midnight & noon)
- `USD_AMOUNT_BUY`: USD amount per purchase (default: `5`)
- `SLIPPAGE`: Slippage in basis points (default: `4` = 0.04%)
- `TARGET_TOKEN_SYMBOL`: Display symbol (default: `TOKEN`)
- `TARGET_TOKEN_DECIMALS`: Token decimals (default: `8`)
- `TARGET_TOKEN_COINGECKO_ID`: CoinGecko ID for price data (default: `bitcoin`)
- `LOCAL_TEST`: Set to `true` to run immediately on startup

## Important Notes

### Security Considerations

- **Warning**: `app.ts` logs ALL environment variables at startup (lines 38-48), including sensitive values like `MNEMONIC`, `JUPITER_API_KEY`, and `TELEGRAM_BOT_ID`
- For production deployments, consider removing or securing these logs to prevent credential exposure
- The bot wallet private key is derived from `MNEMONIC` on startup and held in memory

### Type Safety

- TypeScript strict mode is enabled
- Never use `@ts-ignore` or `@ts-expect-error` without explanation
- Never use `any` type (except for the one-off Solana SDK issue in `solana-bot.ts:102`)

### Database Schema

- Single `Transaction` model with fields: `id`, `date`, `wallet`, `amount`, `tokenPrice`, `symbol`
- Indexed on `wallet` for efficient queries
- Prisma migrations are push-based (no migration files)

### External API Dependencies

- **Jupiter API**: Requires API key, rate-limited
- **CoinGecko API**: Free tier, rate-limited (30 calls/minute)
- **Solana RPC**: Use paid endpoint (Helius/QuickNode) for reliability
- **Telegram Bot API**: No rate limits for typical usage

### Cron Schedule Format

Standard cron format: `minute hour day-of-month month day-of-week`
Examples:

- `0 0,12 * * *`: Every day at midnight and noon
- `0 */6 * * *`: Every 6 hours
- `0 9 * * 1-5`: Every weekday at 9am

### Docker Deployment Notes

- `docker-compose.yml` includes PostgreSQL with health checks
- Database URL is hardcoded in docker-compose.yml to `postgresql://postgres:postgres@postgres:5432/dca_bot` (overrides .env)
- Data persists in `postgres_data` volume
- Bot container restarts automatically unless stopped manually
