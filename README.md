# Beelievers NFT Collection

BTCFi Beelievers is more than an NFT - it's a movement to make Bitcoin work in DeFi without bridges, wrappers, or custodians. The Beeliever NFT is your badge of conviction, fueling Native's nBTC and BYield on Sui.

## Overview

This repository contains the complete Beelievers NFT collection implementation on Sui, including:

- **Smart Contract**: Move contract for NFT minting with mythic eligibility system
- **Setup Scripts**: Automated deployment and configuration scripts
- **Metadata**: Complete NFT metadata and image URLs
- **Badge System**: Special badges for different user categories

## Collection Details

- **Total Supply**: 6,021 NFTs
- **Mythic Supply**: 21 NFTs (special rarity)
- **Normal Supply**: 6,000 NFTs
- **Native Mythics**: 10 NFTs (reserved for Native team)
- **Premint Range**: 210 NFTs (1-10 mythics + 22-221 normals)

## Project Structure

```
beelivers/
├── mint/                          # Main minting contract
│   ├── sources/
│   │   └── mint.move             # Main Move contract
│   ├── tests/
│   │   └── mint_tests.move       # Contract tests
│   ├── setup_script.js           # Setup and deployment script
│   ├── mythic_eligible.txt       # Mythic eligible addresses (3978)
│   ├── badge_names.json          # Badge ID to name mapping
│   ├── badges.json               # Address to badge mapping
│   ├── imagelinks.json           # NFT ID to image URL mapping
│   ├── JSON/                     # Individual NFT metadata
│   │   ├── 1.json
│   │   ├── 2.json
│   │   └── ... (6021 files)
│   └── package.json
├── beelivers_auction/            # Auction contract
│   ├── sources/
│   │   └── auction.move
│   └── tests/
└── scripts/                      # Additional scripts
```

## Prerequisites

- Node.js (v16 or higher)
- Sui CLI
- Access to Sui testnet/mainnet
- Admin private key for deployment

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd beelivers
   ```

2. **Install dependencies**:
   ```bash
   cd mint
   npm install
   ```

3. **Configure environment**:
   - Update `ADMIN_PRIVATE_KEY` in `setup_script.js`
   - Update package IDs in `CONFIGS` for your deployment

## Required Files

### For Setup Script

1. **`mythic_eligible.txt`** (Production only)
   - One address per line
   - 3978 addresses eligible for mythic NFT minting
   - Format: `0x...` or without prefix

2. **`badge_names.json`**
   ```json
   {
     "badge_names": {
       "1": "Early Adopter",
       "2": "Whale",
       "3": "OG"
     }
   }
   ```

3. **`badges.json`**
   ```json
   {
     "0xaddress1": [1, 2],
     "0xaddress2": [3]
   }
   ```

4. **`imagelinks.json`**
   ```json
   {
     "1": "https://example.com/image1.png",
     "2": "https://example.com/image2.png"
   }
   ```

5. **`JSON/` directory**
   - Individual NFT metadata files (1.json to 6021.json)
   - Each file contains attributes for one NFT

## Usage

### Test Setup

For testing on testnet with limited data:

```bash
cd mint
node setup_script.js test
```

**What happens:**
- Uses testnet configuration
- Adds 2 test mythic eligible addresses
- Processes first 21 NFTs for attributes/URLs
- Skips premint, sets completed=true
- Starts minting immediately

### Production Setup

For full mainnet deployment:

```bash
cd mint
node setup_script.js production
```

**What happens:**
- Uses mainnet configuration
- Reads 3978 addresses from `mythic_eligible.txt`
- Processes all 6021 NFTs
- Executes premint (NFTs #1-210)
- Starts minting at configured time

### Options

```bash
# Skip premint process
node setup_script.js production --skip-premint

# Skip starting minting
node setup_script.js production --skip-minting

# Test minting functionality
node setup_script.js test-minting

# Set premint completed manually
node setup_script.js set-premint
```

## Smart Contract Features

### Mythic Eligibility System

- **Mythic Eligible**: Addresses that can potentially mint mythic NFTs
- **Rolling System**: Random chance based on remaining mythics vs eligible addresses
- **Automatic Adjustment**: If more mythics than eligible, everyone gets mythic

### Badge System

- **Minter Badges**: Special badges assigned to addresses
- **Displayable Badges**: Configurable which badges to show
- **Badge Names**: Customizable badge names and descriptions

### Minting Logic

1. **Eligibility Check**: Must be mythic eligible OR auction winner
2. **Mythic Roll**: Random chance for mythic if eligible
3. **Token Selection**: Random selection from available pool
4. **Badge Assignment**: Automatic badge assignment based on eligibility

### Admin Functions

- `add_mythic_eligible()`: Add addresses to mythic eligible list
- `set_badge_names()`: Configure badge names
- `set_minter_badges()`: Assign badges to addresses
- `set_nft_attributes()`: Set NFT metadata
- `set_nft_urls()`: Set NFT image URLs
- `start_minting()`: Activate public minting
- `pause_minting()`: Pause public minting

## Configuration

### Testnet Configuration

```javascript
test: {
    PACKAGE_ID: '0x...',
    ADMIN_CAP: '0x...',
    COLLECTION_ID: '0x...',
    TRANSFER_POLICY_ID: '0x...',
    AUCTION_CONTRACT: '0x...',
    RPC_URL: 'https://fullnode.testnet.sui.io:443',
    MINT_START_TIME: 1744088400000
}
```

### Mainnet Configuration

```javascript
production: {
    PACKAGE_ID: '', // Add your package ID
    ADMIN_CAP: '', // Add your admin cap
    COLLECTION_ID: '', // Add your collection ID
    TRANSFER_POLICY_ID: '', // Add your transfer policy ID
    AUCTION_CONTRACT: '0x345c10a69dab4ba85be56067c94c4a626c51e297b884e43b113d3eb99ed7a0f3',
    RPC_URL: 'https://fullnode.mainnet.sui.io:443',
    MINT_START_TIME: 1744088400000
}
```

## Deployment Process

### 1. Deploy Contract

```bash
cd mint
sui move build
sui client publish --gas-budget 1000000000
```

### 2. Update Configuration

Update package IDs in `setup_script.js` with your deployed contract addresses.

### 3. Run Setup

```bash
# Test setup
node setup_script.js test

# Production setup
node setup_script.js production
```

## Testing

### Run Contract Tests

```bash
cd mint
sui move test
```

### Test Minting

```bash
node setup_script.js test-minting
```

## Security

- **Admin Cap**: Keep admin capabilities secure
- **Private Keys**: Never commit private keys to repository
- **Access Control**: Verify all admin functions have proper access control
- **Testing**: Always test on testnet before mainnet

## Troubleshooting

### Common Issues

1. **Gas Budget**: Increase gas budget for large operations
2. **Rate Limiting**: Add delays between batch operations
3. **File Format**: Ensure JSON files are properly formatted
4. **Address Format**: Verify addresses have correct format (0x prefix)

### Error Codes

- `ERROR_INSUFFICIENT_SUPPLY`: No more NFTs available
- `ERROR_MINTING_NOT_ACTIVE`: Minting not started
- `ERROR_UNAUTHORIZED`: Address not eligible
- `ERROR_ALREADY_MINTED`: Address already minted
- `ERROR_INSUFFICIENT_PAYMENT`: Insufficient payment
- `ERROR_NO_MYTHICS_AVAILABLE`: No mythics available

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Add your license information here]

## Support

For support and questions:
- [Discord](https://discord.gg/...)
- [Twitter](https://twitter.com/...)
- [Documentation](https://docs...)

---

**Note**: This is a production-ready NFT collection. Always test thoroughly on testnet before deploying to mainnet.
