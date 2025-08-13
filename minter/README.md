# Sui NFT Batch Minter

This script reads a list of addresses from a CSV file, resolves any `.sui` names, and mints NFTs to the valid addresses in a single transaction.

## How to Run

1. Install dependencies:

```bash
    npm install
```

2. Create `.env` file

```env
MNEMONIC="your mnemonic"
PACKAGE_ID="0x..."
PUBLISHER_ID="0x..."
# (e.g., mainnet, testnet, devnet, localnet)
NETWORK="devnet"
```

3. Execute the script:

    Replace the file path and adjusting the batch size as needed.

```bash
    npx ts-node src/mint.ts --file ./path/to/your_addresses.csv --batch-size 100
```

This will process all addresses from the file and generate a report on which addreses had their NFT minted.
