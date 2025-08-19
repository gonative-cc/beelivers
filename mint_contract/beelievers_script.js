// author: @null
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';
import { KioskClient, Network } from '@mysten/kiosk';
import { fromB64 } from "@mysten/bcs";
import { fromHex } from '@mysten/sui/utils';
import { bech32 } from 'bech32';
import fs from 'fs/promises';
import { KioskTransaction } from '@mysten/kiosk';
import { TransferPolicyTransaction } from '@mysten/kiosk';
import { Secp256k1Keypair } from '@mysten/sui.js/keypairs/secp256k1';

// Beelievers Configuration
const PACKAGE_ID = '0xYOUR_PACKAGE_ID'; // Replace with actual package ID
const ADMIN_CAP = '0xYOUR_ADMIN_CAP'; // Replace with actual admin cap
const COLLECTION_ID = '0xYOUR_COLLECTION_ID'; // Replace with actual collection ID
const TRANSFER_POLICY_ID = '0xYOUR_TRANSFER_POLICY_ID'; // Replace with actual transfer policy ID
const MODULE_NAME = 'mint';
const ADMIN_PRIVATE_KEY = 'suiprivkeyxxxxx'; // Replace with your private key

const RPC_URL = 'https://fullnode.mainnet.sui.io:443';
const BATCH_SIZE = 50;

function suiprivkeyToHex(suiprivkey) {
    const decoded = bech32.decode(suiprivkey);
    const bytes = bech32.fromWords(decoded.words);
    const privateKeyBytes = bytes.slice(1);
    return fromHex(Buffer.from(privateKeyBytes).toString('hex'));
}

// Initialize collection and return important object IDs
async function initializeCollection() {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));
    
    const txb = new TransactionBlock();
    txb.setSender(signer.getPublicKey().toSuiAddress());
    txb.setGasBudget(1000000000);

    // Initialize Beelievers collection
    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::init`,
        arguments: [],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true, showObjectChanges: true }
        });
        console.log("Initialization successful:", result);
        return result;
    } catch (error) {
        console.error("Error initializing collection:", error);
        throw error;
    }
}

// Add partners to the collection
async function addPartners(partners) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::add_partners`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
            txb.pure(partners),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        console.log(`Successfully added ${partners.length} partners:`, result.digest);
        return result;
    } catch (error) {
        console.error("Error adding partners:", error);
        throw error;
    }
}

// Set auction contract address
async function setAuctionContract(auctionContractAddress) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::set_auction_contract`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
            txb.pure(auctionContractAddress),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        console.log("Successfully set auction contract:", result.digest);
        return result;
    } catch (error) {
        console.error("Error setting auction contract:", error);
        throw error;
    }
}

// Set NFT badges in bulk
async function setBulkNFTBadges(tokenIds, badges) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::set_bulk_nft_badges`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
            txb.pure(tokenIds),
            txb.pure(badges),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        console.log(`Successfully set badges for ${tokenIds.length} NFTs:`, result.digest);
        return result;
    } catch (error) {
        console.error("Error setting bulk badges:", error);
        throw error;
    }
}

// Set NFT attributes in bulk
async function setBulkNFTAttributes(nftIds, attributeKeys, attributeValues) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::set_bulk_nft_attributes`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
            txb.pure(nftIds),
            txb.pure(attributeKeys),
            txb.pure(attributeValues),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        console.log(`Successfully set attributes for ${nftIds.length} NFTs:`, result.digest);
        return result;
    } catch (error) {
        console.error("Error setting bulk attributes:", error);
        throw error;
    }
}

async function setBulkNFTUrls(nftIds, urls) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::set_bulk_nft_urls`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
            txb.pure(nftIds),
            txb.pure(urls.map(url => Array.from(Buffer.from(url)))),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        console.log(`Successfully set URLs for ${nftIds.length} NFTs:`, result.digest);
        return result;
    } catch (error) {
        console.error("Error setting bulk URLs:", error);
        throw error;
    }
}

// Set badge display settings
async function setBadgeDisplayable(badgeName, displayable) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::set_badge_displayable`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
            txb.pure(badgeName),
            txb.pure(displayable),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        console.log(`Successfully set badge ${badgeName} displayable to ${displayable}:`, result.digest);
        return result;
    } catch (error) {
        console.error("Error setting badge displayable:", error);
        throw error;
    }
}

async function executeNativePremint() {
    const client = new SuiClient({ url: RPC_URL });
    const kioskClient = new KioskClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    // Create kiosk first
    const tx1 = new TransactionBlock();
    tx1.setGasBudget(1000000000); 
    const kioskTx = new KioskTransaction({ transaction: tx1, kioskClient });

    kioskTx.create();
    kioskTx.shareAndTransferCap(signer.getPublicKey().toSuiAddress());
    kioskTx.finalize();

    try {
        const result1 = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: tx1,
            options: { showEffects: true }
        });

        console.log("Kiosk creation successful:", result1.digest);
        await new Promise(resolve => setTimeout(resolve, 5000));

        const txEffects = await client.getTransactionBlock({
            digest: result1.digest,
            options: { showEffects: true, showInput: true },
        });

        let kioskId, kioskCapId;
        txEffects.effects.created.forEach(obj => {
            if (obj.owner.Shared) {
                kioskId = obj.reference.objectId;
            } else if (obj.owner.AddressOwner === signer.getPublicKey().toSuiAddress()) {
                kioskCapId = obj.reference.objectId;
            }
        });

        if (!kioskId || !kioskCapId) {
            throw new Error('Failed to retrieve kiosk or kiosk cap ID');
        }

        // Execute premint in batches of 20
        const PREMINT_BATCH_SIZE = 20;
        const totalPremint = 210; // 1-210 range
        let completedPremint = 0;

        for (let startId = 1; startId <= totalPremint; startId += PREMINT_BATCH_SIZE) {
            const endId = Math.min(startId + PREMINT_BATCH_SIZE - 1, totalPremint);
            
            console.log(`Executing premint batch ${startId}-${endId}...`);
            
            const tx2 = new TransactionBlock();
            tx2.setGasBudget(2000000000); 

            tx2.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::premint_to_native_range`,
                arguments: [
                    tx2.object(ADMIN_CAP),
                    tx2.object(COLLECTION_ID),
                    tx2.object(TRANSFER_POLICY_ID),
                    tx2.object(kioskId),
                    tx2.object(kioskCapId),
                    tx2.pure(startId), 
                    tx2.pure(endId),
                ],
            });

            try {
                const result2 = await client.signAndExecuteTransactionBlock({
                    signer,
                    transactionBlock: tx2,
                    options: { showEffects: true }
                });
                
                completedPremint += (endId - startId + 1);
                console.log(`✅ Premint batch ${startId}-${endId} successful:`, result2.digest);
                console.log(`Progress: ${completedPremint}/${totalPremint} NFTs preminted`);
                
                // Add delay between batches
                if (endId < totalPremint) {
                    console.log("Waiting 5 seconds before next batch...");
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
                
            } catch (error) {
                console.error(`Error executing premint batch ${startId}-${endId}:`, error);
                throw error;
            }
        }

        console.log(`🎉 Successfully completed all premint batches! Total: ${completedPremint} NFTs`);
        return true;

    } catch (error) {
        console.error("Error in premint process:", error);
        throw error;
    }
}

async function startMinting(startTime) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::start_minting`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
            txb.pure(startTime),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        console.log("Successfully started minting:", result.digest);
        return result;
    } catch (error) {
        console.error("Error starting minting:", error);
        throw error;
    }
}

// Pause minting
async function pauseMinting() {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::pause_minting`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        console.log("Successfully paused minting:", result.digest);
        return result;
    } catch (error) {
        console.error("Error pausing minting:", error);
        throw error;
    }
}

async function addRoyaltyAndLockRules() {
    const client = new SuiClient({ url: RPC_URL });
    const kioskClient = new KioskClient({ client, network: Network.MAINNET });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    const policyType = `${PACKAGE_ID}::${MODULE_NAME}::BeelieverNFT`;
    const policyCaps = await kioskClient.getOwnedTransferPoliciesByType({
        type: policyType,
        address: signer.getPublicKey().toSuiAddress()
    });

    if (!policyCaps || policyCaps.length === 0) {
        throw new Error('No transfer policy caps found for this type');
    }

    const tx = new TransactionBlock();
    tx.setGasBudget(1000000000);

    const tpTx = new TransferPolicyTransaction({ 
        kioskClient, 
        transaction: tx, 
        cap: policyCaps[0] 
    });

    tpTx
        .addRoyaltyRule(500, 0) // 5% royalty
        .addLockRule();

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: tx,
            options: { showEffects: true }
        });
        console.log("Successfully added royalty and lock rules:", result.digest);
        return result;
    } catch (error) {
        console.error("Error adding rules:", error);
        throw error;
    }
}


async function setBulkNFTBadgesFromJson() {
    try {
        const badgesData = JSON.parse(await fs.readFile('badges.json', 'utf8'));
        const processedBadges = new Set();

        for (let i = 1; i <= 6021; i += BATCH_SIZE) {
            const batchEnd = Math.min(i + BATCH_SIZE - 1, 6021);
            const tokenIds = [];
            const badges = [];

            for (let j = i; j <= batchEnd; j++) {
                if (badgesData[j.toString()] && !processedBadges.has(j)) {
                    tokenIds.push(j);
                    badges.push(badgesData[j.toString()]);
                    processedBadges.add(j);
                }
            }

            if (tokenIds.length > 0) {
                console.log(`Processing badges batch from NFT #${i} to #${batchEnd}`);
                try {
                    await setBulkNFTBadges(tokenIds, badges);
                    console.log(`Successfully processed ${tokenIds.length} badges in current batch`);
                    
                    if (i + BATCH_SIZE <= 6021) {
                        await new Promise(resolve => setTimeout(resolve, 4000));
                    }
                } catch (error) {
                    console.error(`Error processing batch ${i}-${batchEnd}:`, error);
                }
            }
        }

        console.log(`Completed processing badges. Total NFTs processed: ${processedBadges.size}`);
    } catch (error) {
        console.error('Error reading or processing badges.json:', error);
        throw error;
    }
}


async function setBulkNFTAttributesFromJson() {
    try {
        const nftIds = [];
        const allKeys = [];
        const allValues = [];
        const processedNfts = new Set();

        for (let i = 1; i <= 6021; i += BATCH_SIZE) {
            const batchEnd = Math.min(i + BATCH_SIZE - 1, 6021);
            const batchNftIds = [];
            const batchKeys = [];
            const batchValues = [];

            for (let j = i; j <= batchEnd; j++) {
                if (processedNfts.has(j)) continue;

                try {
                    const jsonData = JSON.parse(
                        await fs.readFile(`JSON/${j}.json`, 'utf8')
                    );

                    if (jsonData.attributes && Array.isArray(jsonData.attributes)) {
                        const nftKeys = [];
                        const nftValues = [];

                        jsonData.attributes.forEach(attr => {
                            nftKeys.push(attr.trait_type);
                            nftValues.push(attr.value);
                        });

                        batchNftIds.push(j);
                        batchKeys.push(nftKeys);
                        batchValues.push(nftValues);
                        processedNfts.add(j);
                    }
                } catch (error) {
                    console.error(`Error reading attributes for NFT #${j}:`, error);
                    continue;
                }
            }

            if (batchNftIds.length > 0) {
                console.log(`Processing attributes batch from NFT #${i} to #${batchEnd}`);
                try {
                    await setBulkNFTAttributes(batchNftIds, batchKeys, batchValues);
                    console.log(`Successfully processed attributes for ${batchNftIds.length} NFTs in current batch`);
                    
                    if (i + BATCH_SIZE <= 6021) {
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                } catch (error) {
                    console.error(`Error processing attributes batch ${i}-${batchEnd}:`, error);
                }
            }
        }

        console.log(`Completed processing attributes. Total NFTs processed: ${processedNfts.size}`);
    } catch (error) {
        console.error('Error processing NFT attributes:', error);
        throw error;
    }
}


async function setBulkNFTUrlsFromJson() {
    try {
        const imageLinksData = JSON.parse(await fs.readFile('imagelinks.json', 'utf8'));
        const processedUrls = new Set();

        for (let i = 1; i <= 6021; i += BATCH_SIZE) {
            const batchEnd = Math.min(i + BATCH_SIZE - 1, 6021);
            const nftIds = [];
            const urls = [];

            for (let j = i; j <= batchEnd; j++) {
                if (imageLinksData[j.toString()] && !processedUrls.has(j)) {
                    nftIds.push(j);
                    urls.push(imageLinksData[j.toString()]);
                    processedUrls.add(j);
                }
            }

            if (nftIds.length > 0) {
                console.log(`Processing URLs batch from NFT #${i} to #${batchEnd}`);
                try {
                    await setBulkNFTUrls(nftIds, urls);
                    console.log(`Successfully processed ${nftIds.length} URLs in current batch`);
                    
                    if (i + BATCH_SIZE <= 6021) {
                        await new Promise(resolve => setTimeout(resolve, 4000));
                    }
                } catch (error) {
                    console.error(`Error processing batch ${i}-${batchEnd}:`, error);
                }
            }
        }

        console.log(`Completed processing URLs. Total NFTs processed: ${processedUrls.size}`);
    } catch (error) {
        console.error('Error reading or processing imagelinks.json:', error);
        throw error;
    }
}


async function readAddresses(filePath) {
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const lines = fileContent.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        const validAddresses = [];
        const invalidAddresses = [];
        
        for (const line of lines) {
            const validatedAddress = validateAddress(line);
            if (validatedAddress) {
                validAddresses.push(validatedAddress);
            } else {
                invalidAddresses.push(line);
            }
        }
        
        console.log(`\nAddress validation results for ${filePath}:`);
        console.log(`Total addresses found: ${lines.length}`);
        console.log(`Valid addresses: ${validAddresses.length}`);
        console.log(`Invalid addresses: ${invalidAddresses.length}`);
        
        if (invalidAddresses.length > 0) {
            console.log('\nInvalid addresses found:');
            invalidAddresses.forEach(addr => console.log(addr));
            
            const invalidFile = filePath.replace('.txt', '_invalid.txt');
            await fs.writeFile(invalidFile, invalidAddresses.join('\n'));
            console.log(`\nInvalid addresses have been written to ${invalidFile}`);
        }
        
        if (validAddresses.length === 0) {
            throw new Error('No valid addresses found in the file');
        }
        
        return validAddresses;
    } catch (error) {
        console.error(`Error reading addresses file: ${error.message}`);
        throw error;
    }
}

function validateAddress(address) {
    let cleanAddress = address.trim();
    
    if (!cleanAddress.startsWith('0x')) {
        cleanAddress = '0x' + cleanAddress;
    }
    
    const hexPart = cleanAddress.slice(2);
    if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
        return false;
    }

    return padAddress(cleanAddress);
}

function padAddress(address) {
    const cleanAddr = address.startsWith('0x') ? address.slice(2) : address;
    const paddedAddr = cleanAddr.padStart(64, '0');
    return '0x' + paddedAddr;
}

async function main() {
    const operation = process.argv[2];
    const filePath = process.argv[3]; 

    try {
        switch (operation) {
            case 'init':
                console.log("Initializing Beelievers collection...");
                await initializeCollection();
                break;

            case 'add-partners':
                if (!filePath) {
                    console.error("Please provide a file path: node beelievers_script.js add-partners <file_path>");
                    break;
                }
                console.log("Adding partners from file...");
                const partners = await readAddresses(filePath);
                await addPartners(partners);
                break;

            case 'set-auction-contract':
                if (!filePath) {
                    console.error("Please provide auction contract address: node beelievers_script.js set-auction-contract <address>");
                    break;
                }
                console.log("Setting auction contract...");
                await setAuctionContract(filePath);
                break;

            case 'set-badges':
                console.log("Setting NFT badges from badges.json...");
                await setBulkNFTBadgesFromJson();
                break;

            case 'set-attributes':
                console.log("Setting NFT attributes from JSON files...");
                await setBulkNFTAttributesFromJson();
                break;

            case 'set-urls':
                console.log("Setting NFT URLs from imagelinks.json...");
                await setBulkNFTUrlsFromJson();
                break;

            case 'set-badge-display':
                if (!filePath) {
                    console.error("Please provide badge name and displayable: node beelievers_script.js set-badge-display <badge_name> <true/false>");
                    break;
                }
                const [badgeName, displayable] = filePath.split(',');
                console.log(`Setting badge ${badgeName} displayable to ${displayable}...`);
                await setBadgeDisplayable(badgeName, displayable === 'true');
                break;

            case 'add-rules':
                console.log("Adding royalty and lock rules...");
                await addRoyaltyAndLockRules();
                break;

            case 'premint':
                console.log("Executing Native premint...");
                await executeNativePremint();
                break;

            case 'start-minting':
                if (!filePath) {
                    console.error("Please provide start time: node beelievers_script.js start-minting <timestamp>");
                    break;
                }
                const startTime = parseInt(filePath);
                console.log(`Starting minting at ${startTime}...`);
                await startMinting(startTime);
                break;

            case 'pause-minting':
                console.log("Pausing minting...");
                await pauseMinting();
                break;

            default:
                console.log(`
Beelievers Mint Setup Script

Usage:
  Initialize Collection:     node beelievers_script.js init
  Add Partners:             node beelievers_script.js add-partners <file_path>
  Set Auction Contract:     node beelievers_script.js set-auction-contract <address>
  Set Badges:               node beelievers_script.js set-badges
  Set Attributes:           node beelievers_script.js set-attributes
  Set URLs:                 node beelievers_script.js set-urls
  Set Badge Display:        node beelievers_script.js set-badge-display <badge_name,true/false>
  Add Rules:                node beelievers_script.js add-rules
  Execute Premint:          node beelievers_script.js premint
  Start Minting:            node beelievers_script.js start-minting <timestamp>
  Pause Minting:            node beelievers_script.js pause-minting

Required Files:
  - badges.json: Token ID to badge mapping
  - imagelinks.json: Token ID to Walrus URL mapping
  - JSON/: Directory with individual NFT JSON files (ERC721 format)

Example:
  node beelievers_script.js add-partners partners.txt
  node beelievers_script.js set-badges
  node beelievers_script.js set-attributes
  node beelievers_script.js set-urls
  node beelievers_script.js add-rules
  node beelievers_script.js premint
  node beelievers_script.js start-minting 1744088400000
  node beelievers_script.js pause-minting
                `);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

main(); 