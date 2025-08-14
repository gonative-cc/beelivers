# Sui NFT Batch Minter

This script reads a list of addresses from a CSV file, resolves any `.sui` names, and mints NFTs to the valid addresses in a single transaction.

## How to Run

1. Install dependencies:

```bash
pnpm install
```

1. Create `.env` file

```env
MNEMONIC="your mnemonic"
PACKAGE_ID="0x..."
PUBLISHER_ID="0x..."
# (e.g., mainnet, testnet, devnet, localnet)
NETWORK="devnet"
```

1. Execute the script:

    Replace the file path and adjusting the batch size as needed.

```bash
pnpm ts-node ./wl-nft-minter.ts --file ./path/to/your_addresses.csv --batch-size 100
```

This will process all addresses from the file and generate a report on which addreses had their NFT minted.
