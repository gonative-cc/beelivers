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

1. Execute the pre-processor:

    It takes list of `csv` files and cleans it up, and resovles any sui ns.
    NOTE: Remember to run it on mainnet so the `suins` are resovled correctly.

```bash
pnpm ts-node scripts/wl-pre-processor.ts ./file1.csv ./file2.csv ./file3.csv --output final_WL.csv
```

1. Execute the script:

    Replace the file path and adjusting the batch size as needed.

```bash
pnpm ts-node scripts/wl-nft-minter.ts --file ./final_WL --batch-size 400
```

This will process all addresses from the file and generate a report on which addreses had their NFT minted.
