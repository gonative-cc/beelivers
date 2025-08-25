// Beelievers Production Deployment Script
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

// Production Configuration
const PACKAGE_ID = '0xYOUR_PRODUCTION_PACKAGE_ID'; // Replace with production package ID
const ADMIN_CAP = '0xYOUR_PRODUCTION_ADMIN_CAP'; // Replace with production admin cap
const COLLECTION_ID = '0xYOUR_PRODUCTION_COLLECTION_ID'; // Replace with production collection ID
const TRANSFER_POLICY_ID = '0xYOUR_PRODUCTION_TRANSFER_POLICY_ID'; // Replace with production transfer policy ID
const MODULE_NAME = 'mint';
const ADMIN_PRIVATE_KEY = 'suiprivkeyxxxxx'; // Replace with your production private key

const RPC_URL = 'https://fullnode.mainnet.sui.io:443'; // Production mainnet
const BATCH_SIZE = 50; // Production batch size
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds between batches

// Production logging with timestamps
function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const emoji = type === 'SUCCESS' ? '✅' : type === 'ERROR' ? '❌' : type === 'WARNING' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${emoji} ${message}`);
}

function suiprivkeyToHex(suiprivkey) {
    const decoded = bech32.decode(suiprivkey);
    const bytes = bech32.fromWords(decoded.words);
    const privateKeyBytes = bytes.slice(1);
    return fromHex(Buffer.from(privateKeyBytes).toString('hex'));
}



// Add partners to the collection with validation
async function addPartners(partners) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    // Validate partners array
    if (!Array.isArray(partners) || partners.length === 0) {
        throw new Error('Partners array must be non-empty');
    }

    log(`Adding ${partners.length} partners to collection...`, 'INFO');

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
        log(`Successfully added ${partners.length} partners`, 'SUCCESS');
        log(`Transaction digest: ${result.digest}`, 'INFO');
        return result;
    } catch (error) {
        log(`Error adding partners: ${error.message}`, 'ERROR');
        throw error;
    }
}


// Set NFT badges in bulk with progress tracking
async function setBulkNFTBadges(tokenIds, badges) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    // Validate inputs
    if (!Array.isArray(tokenIds) || !Array.isArray(badges) || tokenIds.length !== badges.length) {
        throw new Error('Token IDs and badges arrays must have the same length');
    }

    log(`Setting badges for ${tokenIds.length} NFTs...`, 'INFO');

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
        log(`Successfully set badges for ${tokenIds.length} NFTs`, 'SUCCESS');
        log(`Transaction digest: ${result.digest}`, 'INFO');
        return result;
    } catch (error) {
        log(`Error setting bulk badges: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Set NFT attributes in bulk with progress tracking
async function setBulkNFTAttributes(nftIds, attributeKeys, attributeValues) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    // Validate inputs
    if (!Array.isArray(nftIds) || !Array.isArray(attributeKeys) || !Array.isArray(attributeValues)) {
        throw new Error('All input arrays must be valid');
    }

    log(`Setting attributes for ${nftIds.length} NFTs...`, 'INFO');

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
        log(`Successfully set attributes for ${nftIds.length} NFTs`, 'SUCCESS');
        log(`Transaction digest: ${result.digest}`, 'INFO');
        return result;
    } catch (error) {
        log(`Error setting bulk attributes: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Set NFT URLs in bulk
async function setBulkNFTUrls(nftIds, urls) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    // Validate inputs
    if (!Array.isArray(nftIds) || !Array.isArray(urls) || nftIds.length !== urls.length) {
        throw new Error('NFT IDs and URLs arrays must have the same length');
    }

    log(`Setting URLs for ${nftIds.length} NFTs...`, 'INFO');

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
        log(`Successfully set URLs for ${nftIds.length} NFTs`, 'SUCCESS');
        log(`Transaction digest: ${result.digest}`, 'INFO');
        return result;
    } catch (error) {
        log(`Error setting bulk URLs: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Add individual badge to an NFT
async function addNFTBadge(tokenId, badge) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    log(`Adding badge "${badge}" to NFT #${tokenId}...`, 'INFO');

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::add_post_mint_badge`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
            txb.pure(tokenId),
            txb.pure(badge),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        log(`Successfully added badge "${badge}" to NFT #${tokenId}`, 'SUCCESS');
        log(`Transaction digest: ${result.digest}`, 'INFO');
        return result;
    } catch (error) {
        log(`Error adding badge: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Add multiple badges to an NFT
async function addNFTBadges(tokenId, badges) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    log(`Adding ${badges.length} badges to NFT #${tokenId}...`, 'INFO');

    // Add badges one by one to avoid transaction size limits
    for (let i = 0; i < badges.length; i++) {
        const badge = badges[i];
        const txb = new TransactionBlock();
        txb.setGasBudget(1000000000);

        txb.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::add_post_mint_badge`,
            arguments: [
                txb.object(ADMIN_CAP),
                txb.object(COLLECTION_ID),
                txb.pure(tokenId),
                txb.pure(badge),
            ],
        });

        try {
            const result = await client.signAndExecuteTransactionBlock({
                signer,
                transactionBlock: txb,
                options: { showEffects: true }
            });
            log(`Added badge "${badge}" to NFT #${tokenId} (${i + 1}/${badges.length})`, 'SUCCESS');
            
            // Add delay between transactions
            if (i < badges.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            log(`Error adding badge "${badge}" to NFT #${tokenId}: ${error.message}`, 'ERROR');
            throw error;
        }
    }
}

// Set badge display settings
async function setBadgeDisplayable(badgeName, displayable) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    log(`Setting badge "${badgeName}" displayable to ${displayable}...`, 'INFO');

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
        log(`Successfully set badge "${badgeName}" displayable to ${displayable}`, 'SUCCESS');
        log(`Transaction digest: ${result.digest}`, 'INFO');
        return result;
    } catch (error) {
        log(`Error setting badge displayable: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Execute production premint
async function executeNativePremint() {
    const client = new SuiClient({ url: RPC_URL });
    const kioskClient = new KioskClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    log("Creating kiosk for premint...", 'INFO');

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

        log("Kiosk creation successful", 'SUCCESS');
        log(`Kiosk transaction digest: ${result1.digest}`, 'INFO');
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

        // Execute premint in batches
        const PREMINT_BATCH_SIZE = 20;
        const totalPremint = 210; // 1-210 range
        let completedPremint = 0;

        log(`Starting premint process for NFTs #1-${totalPremint} in batches of ${PREMINT_BATCH_SIZE}...`, 'INFO');

        for (let startId = 1; startId <= totalPremint; startId += PREMINT_BATCH_SIZE) {
            const endId = Math.min(startId + PREMINT_BATCH_SIZE - 1, totalPremint);
            
            log(`Executing premint batch ${startId}-${endId}...`, 'INFO');
            
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
                log(`Premint batch ${startId}-${endId} successful`, 'SUCCESS');
                log(`Progress: ${completedPremint}/${totalPremint} NFTs preminted`, 'INFO');
                log(`Batch transaction digest: ${result2.digest}`, 'INFO');
                
                // Add delay between batches
                if (endId < totalPremint) {
                    log(`Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`, 'INFO');
                    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
                }
                
            } catch (error) {
                log(`Error executing premint batch ${startId}-${endId}: ${error.message}`, 'ERROR');
                throw error;
            }
        }

        log(`Premint process completed successfully! Total: ${completedPremint} NFTs`, 'SUCCESS');
        return true;

    } catch (error) {
        log(`Error in premint process: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Start minting
async function startMinting(startTime) {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    log(`Starting minting at timestamp: ${startTime}`, 'INFO');
    log(`Minting will start at: ${new Date(startTime * 1000).toISOString()}`, 'INFO');

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
        log("Successfully started minting", 'SUCCESS');
        log(`Transaction digest: ${result.digest}`, 'INFO');
        return result;
    } catch (error) {
        log(`Error starting minting: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Pause minting
async function pauseMinting() {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    log("Pausing minting...", 'INFO');

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
        log("Successfully paused minting", 'SUCCESS');
        log(`Transaction digest: ${result.digest}`, 'INFO');
        return result;
    } catch (error) {
        log(`Error pausing minting: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Add royalty and lock rules
async function addRoyaltyAndLockRules() {
    const client = new SuiClient({ url: RPC_URL });
    const kioskClient = new KioskClient({ client, network: Network.MAINNET });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    log("Adding royalty and lock rules...", 'INFO');

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
        log("Successfully added royalty and lock rules", 'SUCCESS');
        log(`Transaction digest: ${result.digest}`, 'INFO');
        return result;
    } catch (error) {
        log(`Error adding rules: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Process badges from JSON file
async function setBulkNFTBadgesFromJson() {
    try {
        log("Reading badges from badges.json...", 'INFO');
        const badgesData = JSON.parse(await fs.readFile('badges.json', 'utf8'));
        const processedBadges = new Set();

        log(`Found ${Object.keys(badgesData).length} badge entries in badges.json`, 'INFO');

        for (let i = 1; i <= 6021; i += BATCH_SIZE) {
            const batchEnd = Math.min(i + BATCH_SIZE - 1, 6021);
            const tokenIds = [];
            const badges = [];

            for (let j = i; j <= batchEnd; j++) {
                if (badgesData[j.toString()] && !processedBadges.has(j)) {
                    tokenIds.push(j);
                    
                    // Handle both single badge (string) and multiple badges (array)
                    const badgeData = badgesData[j.toString()];
                    if (Array.isArray(badgeData)) {
                        badges.push(badgeData);
                    } else {
                        badges.push([badgeData]); // Convert single badge to array
                    }
                    
                    processedBadges.add(j);
                }
            }

            if (tokenIds.length > 0) {
                log(`Processing badges batch from NFT #${i} to #${batchEnd} (${tokenIds.length} NFTs)`, 'INFO');
                try {
                    await setBulkNFTBadges(tokenIds, badges);
                    log(`Successfully processed ${tokenIds.length} badges in current batch`, 'SUCCESS');
                    
                    if (i + BATCH_SIZE <= 6021) {
                        log(`Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`, 'INFO');
                        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
                    }
                } catch (error) {
                    log(`Error processing batch ${i}-${batchEnd}: ${error.message}`, 'ERROR');
                    throw error;
                }
            }
        }

        log(`Completed processing badges. Total NFTs processed: ${processedBadges.size}`, 'SUCCESS');
    } catch (error) {
        log(`Error reading or processing badges.json: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Process attributes from JSON files
async function setBulkNFTAttributesFromJson() {
    try {
        log("Processing NFT attributes from JSON files...", 'INFO');
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
                    log(`Error reading attributes for NFT #${j}: ${error.message}`, 'WARNING');
                    continue;
                }
            }

            if (batchNftIds.length > 0) {
                log(`Processing attributes batch from NFT #${i} to #${batchEnd} (${batchNftIds.length} NFTs)`, 'INFO');
                try {
                    await setBulkNFTAttributes(batchNftIds, batchKeys, batchValues);
                    log(`Successfully processed attributes for ${batchNftIds.length} NFTs in current batch`, 'SUCCESS');
                    
                    if (i + BATCH_SIZE <= 6021) {
                        log(`Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`, 'INFO');
                        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
                    }
                } catch (error) {
                    log(`Error processing attributes batch ${i}-${batchEnd}: ${error.message}`, 'ERROR');
                    throw error;
                }
            }
        }

        log(`Completed processing attributes. Total NFTs processed: ${processedNfts.size}`, 'SUCCESS');
    } catch (error) {
        log(`Error processing NFT attributes: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Process URLs from JSON file
async function setBulkNFTUrlsFromJson() {
    try {
        log("Reading URLs from imagelinks.json...", 'INFO');
        const imageLinksData = JSON.parse(await fs.readFile('imagelinks.json', 'utf8'));
        const processedUrls = new Set();

        log(`Found ${Object.keys(imageLinksData).length} URL entries in imagelinks.json`, 'INFO');

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
                log(`Processing URLs batch from NFT #${i} to #${batchEnd} (${nftIds.length} NFTs)`, 'INFO');
                try {
                    await setBulkNFTUrls(nftIds, urls);
                    log(`Successfully processed ${nftIds.length} URLs in current batch`, 'SUCCESS');
                    
                    if (i + BATCH_SIZE <= 6021) {
                        log(`Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`, 'INFO');
                        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
                    }
                } catch (error) {
                    log(`Error processing batch ${i}-${batchEnd}: ${error.message}`, 'ERROR');
                    throw error;
                }
            }
        }

        log(`Completed processing URLs. Total NFTs processed: ${processedUrls.size}`, 'SUCCESS');
    } catch (error) {
        log(`Error reading or processing imagelinks.json: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Read and validate addresses from file
async function readAddresses(filePath) {
    try {
        log(`Reading addresses from ${filePath}...`, 'INFO');
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
        
        log(`Address validation results for ${filePath}:`, 'INFO');
        log(`Total addresses found: ${lines.length}`, 'INFO');
        log(`Valid addresses: ${validAddresses.length}`, 'SUCCESS');
        log(`Invalid addresses: ${invalidAddresses.length}`, invalidAddresses.length > 0 ? 'WARNING' : 'INFO');
        
        if (invalidAddresses.length > 0) {
            log('Invalid addresses found:', 'WARNING');
            invalidAddresses.forEach(addr => log(`  ${addr}`, 'WARNING'));
            
            const invalidFile = filePath.replace('.txt', '_invalid.txt');
            await fs.writeFile(invalidFile, invalidAddresses.join('\n'));
            log(`Invalid addresses have been written to ${invalidFile}`, 'INFO');
        }
        
        if (validAddresses.length === 0) {
            throw new Error('No valid addresses found in the file');
        }
        
        return validAddresses;
    } catch (error) {
        log(`Error reading addresses file: ${error.message}`, 'ERROR');
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

// Main function with production-ready error handling
async function main() {
    const operation = process.argv[2];
    const filePath = process.argv[3]; 

    log("🚀 Beelievers Production Script Started", 'INFO');

    try {
        switch (operation) {

            case 'add-partners':
                if (!filePath) {
                    log("Please provide a file path: node production_script.js add-partners <file_path>", 'ERROR');
                    break;
                }
                log("Adding partners from file...", 'INFO');
                const partners = await readAddresses(filePath);
                await addPartners(partners);
                break;


            case 'set-badges':
                log("Setting NFT badges from badges.json...", 'INFO');
                await setBulkNFTBadgesFromJson();
                break;

            case 'add-badge':
                if (!filePath) {
                    log("Please provide token ID and badge: node production_script.js add-badge <token_id,badge>", 'ERROR');
                    break;
                }
                const [tokenId, badge] = filePath.split(',');
                log(`Adding badge "${badge}" to NFT #${tokenId}...`, 'INFO');
                await addNFTBadge(parseInt(tokenId), badge);
                break;

            case 'add-badges':
                if (!filePath) {
                    log("Please provide token ID and badges: node production_script.js add-badges <token_id,badge1,badge2,badge3>", 'ERROR');
                    break;
                }
                const parts = filePath.split(',');
                const nftId = parseInt(parts[0]);
                const badges = parts.slice(1);
                log(`Adding badges [${badges.join(', ')}] to NFT #${nftId}...`, 'INFO');
                await addNFTBadges(nftId, badges);
                break;

            case 'set-attributes':
                log("Setting NFT attributes from JSON files...", 'INFO');
                await setBulkNFTAttributesFromJson();
                break;

            case 'set-urls':
                log("Setting NFT URLs from imagelinks.json...", 'INFO');
                await setBulkNFTUrlsFromJson();
                break;

            case 'set-badge-display':
                if (!filePath) {
                    log("Please provide badge name and displayable: node production_script.js set-badge-display <badge_name,true/false>", 'ERROR');
                    break;
                }
                const [badgeName, displayable] = filePath.split(',');
                log(`Setting badge ${badgeName} displayable to ${displayable}...`, 'INFO');
                await setBadgeDisplayable(badgeName, displayable === 'true');
                break;

            case 'add-rules':
                log("Adding royalty and lock rules...", 'INFO');
                await addRoyaltyAndLockRules();
                break;

            case 'premint':
                log("Executing Native premint...", 'INFO');
                await executeNativePremint();
                break;

            case 'start-minting':
                if (!filePath) {
                    log("Please provide start time: node production_script.js start-minting <timestamp>", 'ERROR');
                    break;
                }
                const startTime = parseInt(filePath);
                log(`Starting minting at ${startTime}...`, 'INFO');
                await startMinting(startTime);
                break;

            case 'pause-minting':
                log("Pausing minting...", 'INFO');
                await pauseMinting();
                break;

            default:
                log(`
🏭 Beelievers Production Deployment Script

Usage:
  Add Partners:             node production_script.js add-partners <file_path>
  Set Auction Contract:     node production_script.js set-auction-contract <address>
  Set Badges:               node production_script.js set-badges
  Add Badge:                node production_script.js add-badge <token_id,badge>
  Add Multiple Badges:      node production_script.js add-badges <token_id,badge1,badge2,badge3>
  Set Attributes:           node production_script.js set-attributes
  Set URLs:                 node production_script.js set-urls
  Set Badge Display:        node production_script.js set-badge-display <badge_name,true/false>
  Add Rules:                node production_script.js add-rules
  Execute Premint:          node production_script.js premint
  Start Minting:            node production_script.js start-minting <timestamp>
  Pause Minting:            node production_script.js pause-minting

Required Files:
  - badges.json: Token ID to badge mapping (supports single badge or array of badges)
  - imagelinks.json: Token ID to Walrus URL mapping
  - JSON/: Directory with individual NFT JSON files (ERC721 format)

Badge Format Examples:
  Single badge: {"1": "Early Adopter"}
  Multiple badges: {"1": ["Early Adopter", "Whale", "OG"]}

Production Features:
  - Mainnet deployment
  - Comprehensive error handling
  - Progress tracking
  - Batch processing with delays
  - Detailed logging with timestamps
  - Address validation
  - Transaction digest logging

Example:
  node production_script.js add-partners partners.txt
  node production_script.js set-badges
  node production_script.js add-badge 1,Whale
  node production_script.js add-badges 1,Early Adopter,OG,Whale
  node production_script.js set-attributes
  node production_script.js set-urls
  node production_script.js add-rules
  node production_script.js premint
  node production_script.js start-minting 1744088400000
  node production_script.js pause-minting
                `, 'INFO');
        }
    } catch (error) {
        log(`Script execution failed: ${error.message}`, 'ERROR');
        process.exit(1);
    }
}

main();
