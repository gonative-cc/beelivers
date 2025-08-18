# Sui NFT Batch Minter

This script reads a list of addresses from a CSV file, resolves any `.sui` names, and mints NFTs to the valid addresses in a single transaction.

## How to Run

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create `.env` file

```env
MNEMONIC="your mnemonic"
PACKAGE_ID="0x..."
PUBLISHER_ID="0x..."
# (e.g., mainnet, testnet, devnet, localnet)
NETWORK="devnet"
```

### 3. Execute scripts

Firstly we need to build the JS files:

```bash
pnpm build
```

Execute the pre-processor. It takes list of `csv` files and cleans it up, and resolves any Sui NS.
NOTE: Remember to run it on mainnet so the `suins` are resolved correctly.

```bash
node build/wl-pre-processor.js ./file1.csv ./file2.csv ./file3.csv --output final_WL.csv
```

Execute the script.
Replace the file path and adjusting the batch size as needed.

```bash
node build/wl-nft-minter.js --file ./final_WL.csv --batch-size 500
```

This will process all addresses from the file and generate a report on which addresses had their NFT minted.
