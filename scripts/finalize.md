# Finalize Auction

## How to run

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create `.env` file

```env
MNEMONIC="your mnemonic"
```

### 3. Execute scripts

Firstly we need to build the JS files:

```bash
pnpm build
```

Update ./scripts/auction.config.ts to match with package id, auction id and admin cap of your auction.

```ts
export const auction_conf: Auction = {
    package_id: "0xff4982cd449809676699d1a52c5562fc15b9b92cb41bde5f8845a14647186704",
    auction_id: "0x161524be15687cca96dec58146568622458905c30479452351f231cac5d64c41",
    admin_cap_id: "0xe0b2e857aaa3120b7c4e3f2e5f5073e2b603719bbfcdcd0ce8e138b49922f27c",
    auction_item: 5810,
    clearing_price: 0, // should >=1e9
    network: "testnet",
};
```

We should prepare the auction winner list, data file should have format one line one address.

Set the winner list to auction

```
node ./build/beelievers_auction_finalize.js set-winner data.txt
```

Finalize the auction with clearing price set in config

```
node ./build/beelievers_auction_finalize.js finalize
```
