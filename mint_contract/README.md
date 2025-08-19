# Beelievers NFT Mint Contract

## Overview

The Beelievers NFT mint contract is a comprehensive Sui Move smart contract that handles the minting of 6021 NFTs (21 Mythics + 6000 Normals) with advanced features including partner lists, auction integration, badge systems, and premint functionality.

## Contract Features

### Core Specifications
- **Total Supply**: 6021 NFTs
- **Mythic Supply**: 21 NFTs (1/1)
- **Normal Supply**: 6000 NFTs
- **Native Premint**: 10 Mythics + 200 Normals
- **Partner Mythic Chance**: 11/400 probability

### Key Features
- ✅ Random premint to Native treasury
- ✅ Partner list with mythic minting privileges
- ✅ Auction winner verification
- ✅ Badge system per token ID
- ✅ One-time minting per address
- ✅ Dynamic NFT metadata and attributes
- ✅ Custom image URLs per token
- ✅ Transfer policy integration
- ✅ Admin controls and events

## Contract Structure

### Main Components
- `BeelieversCollection`: Main collection state object
- `BeelieverNFT`: Individual NFT structure
- `AdminCap`: Administrative capabilities
- `MINT`: Module witness

### Key Functions
- `init()`: Contract initialization
- `mint()`: Main minting function
- `premint_to_native_range()`: Native treasury premint
- `add_partners()`: Add partner addresses
- `set_nft_badge()`: Set badges per token ID
- `set_nft_attributes()`: Set metadata attributes
- `set_nft_url()`: Set custom image URLs

## Deployment Setup Guide

### 1. Deploy the Contract
```bash
# Deploy the mint contract
sui client publish --gas-budget 100000000
```

### 2. Configure Transfer Policy
After deployment, you'll receive a `TransferPolicyCap`. Use this to:
- Set royalty rules
- Configure lock rules
- Set transfer restrictions

```move
// Example: Set royalty (you'll need to implement this)
transfer_policy::set_royalty(transfer_policy_cap, royalty_rule);
```

### 3. Add Partner List
```move
// Add partner addresses who can mint with mythic chance
add_partners(
    admin_cap,
    collection,
    vector[
        @0x1234...,
        @0x5678...,
        // ... more partner addresses
    ]
);
```

### 4. Set Token ID to Badge Mapping
```move
// Set badges for specific token IDs
set_bulk_nft_badges(
    admin_cap,
    collection,
    vector[1, 2, 3, 4, 5], // token IDs
    vector[
        string::utf8(b"TopBidder"),
        string::utf8(b"Partner"),
        string::utf8(b"EarlySupporter"),
        string::utf8(b"Whitelist"),
        string::utf8(b"None")
    ]
);
```

### 5. Set NFT Attributes (Metadata)
```javascript
// Set attributes from ERC721/OpenSea JSON files
// The script automatically reads JSON files and extracts attributes
await setBulkNFTAttributesFromJson();

// Or manually set attributes for specific NFTs
const nftIds = [1, 2, 3];
const attributeKeys = [
    ["Background", "Character"],
    ["Background", "Character"], 
    ["Background", "Character"]
];
const attributeValues = [
    ["Blue", "Beeliever"],
    ["Red", "Whale"],
    ["Green", "Early"]
];

set_bulk_nft_attributes(admin_cap, collection, nftIds, attributeKeys, attributeValues);
```

### 6. Set Custom Image URLs (Walrus Hashes)
```javascript
// Set custom image URLs from Walrus hashes
// The script automatically reads imagelinks.json and sets URLs
await setBulkNFTUrlsFromJson();

// Or manually set URLs for specific NFTs
const nftIds = [1, 2, 3];
const urls = [
    "https://walrus.tusky.io/1.png",
    "https://walrus.tusky.io/2.png", 
    "https://walrus.tusky.io/3.png"
];

set_bulk_nft_urls(admin_cap, collection, nftIds, urls);
```

### 7. Set Auction Contract Address
```javascript
// Link to the auction contract for winner verification
const auctionContractAddress = "0xAUCTION_CONTRACT_ADDRESS";
set_auction_contract(admin_cap, collection, auctionContractAddress);
```

### 8. Configure Badge Display Settings
```javascript
// Set which badges should be displayed on NFTs
set_badge_displayable(admin_cap, collection, "TopBidder", true);
set_badge_displayable(admin_cap, collection, "Partner", true);
```

### 9. Execute Native Premint
```javascript
// Premint 10 mythics and 200 normals to Native treasury
// This will randomly select from available mythics and normals
premint_to_native_range(
    admin_cap,
    collection,
    transfer_policy,
    kiosk,
    kiosk_owner_cap,
    1,    // start_id
    210,  // end_id (adjust based on your needs)
    ctx
);
```

### 10. Start Minting
```javascript
// Start public minting with timestamp
const mintStartTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
start_minting(admin_cap, collection, mintStartTime);
```

## Data Preparation

### JSON Files for Attributes (ERC721/OpenSea Format)
Prepare JSON files with the following structure:
```json
{
  "name": "Beelievers #1",
  "description": "BTCFi Beelievers is more than an NFT- it's a movement to make Bitcoin work in DeFi without bridges, wrappers, or custodians.",
  "image": "https://walrus.tusky.io/1.png",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    },
    {
      "trait_type": "Character", 
      "value": "Beeliever"
    },
    {
      "trait_type": "Rarity",
      "value": "Common"
    }
  ]
}
```

### Partner List
Prepare a list of partner addresses:
```json
[
  "0x1234567890abcdef...",
  "0xabcdef1234567890...",
  "0x9876543210fedcba..."
]
```

### Badge Mapping
Prepare token ID to badge mapping:
```json
{
  "1": "TopBidder",
  "2": "Partner", 
  "3": "EarlySupporter",
  "4": "Whitelist"
}
```

### Walrus Image Hashes
Prepare image walrus hash mappings in `imagelinks.json`:
```json
{
  "1": "ug1FrkJpAeAkjSxwKo0aZBMgJrfwRFx2_uvt_lqomnY",
  "2": "ug1FrkJpAeAkjSxwKo0aZBMgJrfwRFx2_uvt_lqomnY",
  "3": "ug1FrkJpAeAkjSxwKo0aZBMgJrfwRFx2_uvt_lqomnY"
}
```

## Deployment Script

The project includes a comprehensive deployment script (`scripts/wl-nft-minter.ts`) that automates the entire setup process:

### Key Script Functions
- `initializeCollection()` - Initialize the collection
- `add_partners()` - Add partner addresses in batches
- `set_bulk_nft_attributes()` - Set attributes from JSON files
- `set_bulk_nft_urls()` - Set Walrus image hashes
- `set_nft_badge()` - Set badges per token ID
- `premint_to_native_range()` - Execute Native premint
- `start_minting()` - Start public minting

### Script Usage Examples
```bash
# Initialize collection
node script.js init

# Set attributes from JSON files
node script.js set-attributes

# Set image URLs from Walrus hashes
node script.js set-urls

# Add partner list
node script.js add-partners <partner_file.txt>

# Set badges
node script.js set-badges <badge_mapping.json>

# Execute Native premint
node script.js premint-native

# Start minting
node script.js start-minting
```

## Testing

### Run Unit Tests
```bash
# Run all tests
sui move test

# Run specific test file
sui move test --filter mint_tests
```

### Test Coverage
- ✅ Partner minting with mythic chance
- ✅ Auction winner verification
- ✅ Premint functionality
- ✅ Badge assignment
- ✅ One-time minting restriction
- ✅ Admin functions

## Production Checklist

Before going live, ensure:

- [ ] Contract deployed and verified
- [ ] Transfer policy configured with royalties
- [ ] Partner list added
- [ ] Badge mappings set
- [ ] NFT attributes loaded from JSON
- [ ] Custom image URLs (Walrus hashes) set
- [ ] Auction contract address configured
- [ ] Native premint completed
- [ ] Mint start time set
- [ ] All tests passing
- [ ] Admin capabilities secured

## Contract Addresses

After deployment, you'll need these addresses:
- **Mint Contract**: `@0xMINT_CONTRACT_ADDRESS`
- **Transfer Policy**: `@0xTRANSFER_POLICY_ADDRESS`
- **Auction Contract**: `@0xAUCTION_CONTRACT_ADDRESS`
- **Treasury Address**: `@0xTREASURY_ADDRESS`

## Events

The contract emits these events:
- `NFTMinted`: When an NFT is minted
- `PremintCompleted`: When Native premint is finished
- `PartnerAdded`: When partners are added
- `AuctionContractUpdated`: When auction contract is set
- `MintingStarted`: When public minting begins

## Security Notes

- Keep `AdminCap` secure and only use for authorized operations
- Verify all addresses before adding to partner list
- Test all functions thoroughly before production
- Monitor events for minting activity
- Ensure auction contract integration is working correctly

## Support

For technical support or questions about the contract implementation, contact the development team. 