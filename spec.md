# Aether Wallet - ICP Privacy Wallet

## Current State
New project. No existing application files.

## Requested Changes (Diff)

### Add
- ICP wallet dashboard with balance display (ICP balance)
- Send ICP transaction flow (recipient address + amount)
- Stealth Send: send ICP where transaction is hidden from public view on the transaction list
- Receive: show principal/account address with copy to clipboard
- Transaction history list with per-row privacy toggle to hide/show individual transactions
- Hidden transactions are stored with `isHidden` flag; when hidden, the type/amount/ID are masked in the UI
- Assets overview panel (ICP balance breakdown)
- Authorization so each user has their own wallet data

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend (Motoko):
   - User authentication via Internet Identity (authorization component)
   - Store transactions per user: id, type (send/receive/stealthSend), toFrom address, amount (ICP), timestamp, status, isHidden flag
   - `sendICP(to: Text, amount: Float, stealth: Bool) -> Result<TxId, Text>` -- creates outgoing transaction, if stealth=true marks isHidden=true
   - `getTransactions() -> [Transaction]` -- returns caller's transactions
   - `toggleTransactionVisibility(txId: Text) -> Result<(), Text>` -- flip isHidden flag
   - `getBalance() -> Float` -- returns mock balance for the caller
   - `getPrincipal() -> Text` -- returns caller's principal as wallet address
   - Seed demo transactions for new users

2. Frontend:
   - Dark fintech dashboard UI matching design preview
   - Header with nav tabs: Dashboard, Privacy, Assets
   - Balance card with total balance + 24h change sparkline
   - Action buttons: Send ICP, Receive, Stealth Send
   - Assets panel
   - Recent Transactions table with Hide/Show toggle per row
   - Stealth transactions show masked data when hidden
   - Send modal (normal + stealth mode)
   - Receive modal showing principal address
