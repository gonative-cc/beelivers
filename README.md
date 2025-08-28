# Beelivers NFT Collection

BTCFi Beelievers is more than an NFT - it's a movement to make Bitcoin work in DeFi without bridges, wrappers, or custodians. The Beeliever NFT is your badge of conviction, fueling Native's nBTC and BYield on Sui.

## Overview

- **Total Supply**: 6,021 NFTs
- **Mythic Supply**: 21 NFTs (special rarity)
- **Normal Supply**: 6,000 NFTs
- **Network**: Sui Blockchain
- **Contract Language**: Move

## Features

- **Mythic Eligibility System**: Special addresses can mint mythic NFTs
- **Auction Integration**: Auction winners can mint normal NFTs
- **Badge System**: Dynamic badge assignment for different user types
- **Metadata Management**: Comprehensive NFT metadata and URL management
- **Premint System**: Controlled premint for specific NFT ranges
- **Royalty & Lock Rules**: Built-in royalty and transfer restrictions

## Project Structure

```
beelivers/
├── mint/
│   ├── sources/
│   │   └── mint.move              # Main NFT contract
│   ├── tests/
│   │   └── mint_tests.move        # Contract tests
│   ├── setup_script.js            # Deployment & setup script
│   ├── mythic_eligible.txt        # Mythic eligible addresses
│   ├── badge_names.json           # Badge ID to name mapping
│   ├── badges.json                # Address to badge mapping
│   ├── imagelinks.json            # NFT ID to URL mapping
│   ├── JSON/                      # Individual NFT metadata
│   │   ├── 1.json
│   │   ├── 2.json
│   │   └── ... (6021 files)
│   └── package.json
├── beelivers_auction/
│   ├── sources/
│   │   └── auction.move           # Auction contract
│   └── tests/
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- Sui CLI
- Access to Sui testnet/mainnet
- Private key for deployment

## Setup Instructions

### 1. Install Dependencies

```bash
cd mint
npm install
```

### 2. Configure Environment

Update the configuration in `setup_script.js`:

```javascript
const CONFIGS = {
    test: {
        PACKAGE_ID: 'your_test_package_id',
        ADMIN_CAP: 'your_test_admin_cap',
        COLLECTION_ID: 'your_test_collection_id',
        // ... other test configs
    },
    production: {
        PACKAGE_ID: 'your_production_package_id',
        ADMIN_CAP: 'your_production_admin_cap',
        COLLECTION_ID: 'your_production_collection_id',
        // ... other production configs
    }
};
```

### 3. Set Private Key

Replace the placeholder in `setup_script.js`:

```javascript
const ADMIN_PRIVATE_KEY = 'your_actual_private_key';
```

### 4. Prepare Data Files

Ensure you have the following files in the `mint/` directory:

- **`mythic_eligible.txt`**: One address per line (3978 addresses for mainnet)
- **`badge_names.json`**: Badge ID to name mapping
- **`badges.json`**: Address to badge array mapping
- **`imagelinks.json`**: NFT ID to URL mapping
- **`JSON/` directory**: Individual NFT metadata files (1.json to 6021.json)

## Usage

### Test Setup

Run complete test setup (uses testnet):

```bash
node setup_script.js test
```

**What happens:**
- Adds 2 test mythic eligible addresses
- Processes first 21 NFTs for attributes/URLs
- Skips premint, sets as completed
- Starts minting

### Production Setup

Run complete production setup (uses mainnet):

```bash
node setup_script.js production
```

**What happens:**
- Adds 3978 mythic eligible addresses from `mythic_eligible.txt`
- Processes all 6021 NFTs for attributes/URLs
- Executes premint (NFTs #1-210)
- Starts minting

### Test Minting

Test minting functionality:

```bash
node setup_script.js test-minting
```

### Set Premint Status

Manually set premint completion status:

```bash
node setup_script.js set-premint
```

### Skip Options

Skip premint or minting:

```bash
node setup_script.js test --skip-premint
node setup_script.js production --skip-minting
```

## Contract Functions

### Admin Functions

- `add_mythic_eligible()`: Add addresses eligible for mythic NFTs
- `set_badge_names()`: Set badge name mappings
- `set_minter_badges()`: Assign badges to addresses
- `set_nft_attributes()`: Set NFT metadata attributes
- `set_nft_urls()`: Set NFT image URLs
- `start_minting()`: Enable public minting
- `pause_minting()`: Pause public minting

### Public Functions

- `mint()`: Mint an NFT (requires eligibility)
- `get_collection_stats()`: Get collection statistics
- `is_mythic_eligible_public()`: Check mythic eligibility
- `has_minted_public()`: Check if address has minted

## Minting Logic

### Eligibility Rules

1. **Mythic Eligible**: Addresses in `mythic_eligible_list` can mint mythic NFTs
2. **Auction Winners**: Auction winners can mint normal NFTs
3. **One Per Address**: Each address can only mint once

### Mythic Distribution

- Mythic eligible addresses have a chance to mint mythic NFTs
- Probability based on remaining mythics vs remaining eligible addresses
- If mythics run out, eligible addresses get normal NFTs

## Data File Formats

### mythic_eligible.txt
```
0xa4c784a6771d7f251e84ed4d032bc8dc4625467ca062a8aa14d5dab0b92dbc80
0x223c886907346c710b121efab26ee8169c62ccfe9afa44dc6c71474eaa8f0f64
...
```

### badge_names.json
```json
{
  "badge_names": {
    "1": "Early Adopter",
    "2": "Whale",
    "3": "OG"
  }
}
```

### badges.json
```json
{
  "0xaddress1": [1, 2],
  "0xaddress2": [3],
  "0xaddress3": [1, 2, 3]
}
```

### imagelinks.json
```json
{
  "1": "https://example.com/image1.png",
  "2": "https://example.com/image2.png"
}
```

### JSON/1.json (NFT Metadata)
```json
{
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    },
    {
      "trait_type": "Eyes",
      "value": "Green"
    }
  ]
}
```

## Configuration

### Test Environment
- **Network**: Sui Testnet
- **NFT Processing**: First 21 NFTs only
- **Mythic Eligible**: 2 test addresses
- **Premint**: Skipped, manually set as completed

### Production Environment
- **Network**: Sui Mainnet
- **NFT Processing**: All 6021 NFTs
- **Mythic Eligible**: 3978 addresses from file
- **Premint**: Executed (NFTs #1-210)

## Error Codes

- `ERROR_INSUFFICIENT_SUPPLY`: No NFTs available
- `ERROR_MINTING_NOT_ACTIVE`: Minting not started
- `ERROR_UNAUTHORIZED`: Address not eligible
- `ERROR_ALREADY_MINTED`: Address already minted
- `ERROR_INSUFFICIENT_PAYMENT`: Insufficient payment
- `ERROR_INVALID_QUANTITY`: Invalid quantity
- `ERROR_INVALID_TOKEN_ID`: Invalid token ID
- `ERROR_PREMINT_NOT_COMPLETED`: Premint not completed
- `ERROR_NO_MYTHICS_AVAILABLE`: No mythics available
- `ERROR_INVALID_RANGE`: Invalid range
- `ERROR_PREMINT_ALREADY_COMPLETED`: Premint already completed

## Testing

Run contract tests:

```bash
cd mint
sui move test
```

## Security

- Admin functions require `AdminCap`
- One mint per address enforced
- Mythic eligibility controlled by admin
- Transfer restrictions and royalties implemented
