// Beelievers Complete Setup Script - Test & Production
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

// Configuration
const ENVIRONMENT = process.argv[2] || 'test'; // 'test' or 'production'
const SKIP_PREMINT = process.argv.includes('--skip-premint');
const SKIP_MINTING = process.argv.includes('--skip-minting');

// Environment-specific configurations
const CONFIGS = {
    test: {
        PACKAGE_ID: '0xada75092e6cecd4ddb31c328b31e6d5beea6860068e9ba32fe27560027faaa2f',
        ADMIN_CAP: '0xce8c355459dd0f44117608f4a282ab63c70dcba10ca596265e473353bdee435a',
        COLLECTION_ID: '0xa1d6b6eb06c27186ebb193704896d5f706e0437f11779483feb81658759df0d6',
        TRANSFER_POLICY_ID: '0x9f963968ec33326fd4de2f86e64538e63013f7f4120c1553cb2dc9f0ed9917c6',
        AUCTION_CONTRACT: '0x345c10a69dab4ba85be56067c94c4a626c51e297b884e43b113d3eb99ed7a0f3',
        RPC_URL: 'https://fullnode.testnet.sui.io:443',
        BATCH_SIZE: 5,
        DELAY_BETWEEN_BATCHES: 2000,
        TOTAL_NFTS: 5, // Test with first 5 NFTs only
        PREMINT_RANGE: 5, // Test premint range
        MINT_START_TIME: 1744088400000 //timestamp ms
    },
    production: {
        PACKAGE_ID: '', // Replace with production package ID
        ADMIN_CAP: '', // Replace with production admin cap
        COLLECTION_ID: '', // Replace with production collection ID
        TRANSFER_POLICY_ID: '', // Replace with production transfer policy ID
        AUCTION_CONTRACT: '0xff4982cd449809676699d1a52c5562fc15b9b92cb41bde5f8845a14647186704', // Replace with production auction contract
        RPC_URL: 'https://fullnode.mainnet.sui.io:443',
        BATCH_SIZE: 50,
        DELAY_BETWEEN_BATCHES: 5000,
        TOTAL_NFTS: 6021, // Full collection
        PREMINT_RANGE: 210, // Full premint range
        MINT_START_TIME: 1744088400000   //timestamp ms
    }
};

const CONFIG = CONFIGS[ENVIRONMENT];
const MODULE_NAME = 'mint';
const ADMIN_PRIVATE_KEY = 'suiprivkeyxxxx'; // Replace with your private key

// Enhanced logging with environment and timestamps
function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const emoji = type === 'SUCCESS' ? '✅' : type === 'ERROR' ? '❌' : type === 'WARNING' ? '⚠️' : 'ℹ️';
    const env = ENVIRONMENT.toUpperCase();
    console.log(`[${timestamp}] [${env}] ${emoji} ${message}`);
}

function suiprivkeyToHex(suiprivkey) {
    const decoded = bech32.decode(suiprivkey);
    const bytes = bech32.fromWords(decoded.words);
    const privateKeyBytes = bytes.slice(1);
    return fromHex(Buffer.from(privateKeyBytes).toString('hex'));
}

// Initialize client and signer
function getClientAndSigner() {
    const client = new SuiClient({ url: CONFIG.RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));
    return { client, signer };
}

// Add test partners (for test environment)
async function addTestPartners() {
    const { client, signer } = getClientAndSigner();

    const testPartners = [
        '0xa3585953487cf72b94233df0895ae7f6bb05c873772f6ad956dac9cafb946d5d',
    ];

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${CONFIG.PACKAGE_ID}::${MODULE_NAME}::add_partners`,
        arguments: [
            txb.object(CONFIG.ADMIN_CAP),
            txb.object(CONFIG.COLLECTION_ID),
            txb.pure(testPartners),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        log(`Successfully added ${testPartners.length} test partners`, 'SUCCESS');
        log(`Transaction digest: ${result.digest}`, 'INFO');
        return result;
    } catch (error) {
        log(`Error adding test partners: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Add production partners from file
async function addProductionPartners() {
    const { client, signer } = getClientAndSigner();

    try {
        log("Reading partners from partners.txt...", 'INFO');
        const fileContent = await fs.readFile('partners.txt', 'utf8');
        const partners = fileContent.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(addr => addr.startsWith('0x') ? addr : '0x' + addr);

        if (partners.length === 0) {
            throw new Error('No partners found in partners.txt');
        }

        log(`Found ${partners.length} partners to add`, 'INFO');

        const PARTNER_BATCH_SIZE = 50;
        let totalProcessed = 0;

        for (let i = 0; i < partners.length; i += PARTNER_BATCH_SIZE) {
            const batchEnd = Math.min(i + PARTNER_BATCH_SIZE, partners.length);
            const batchPartners = partners.slice(i, batchEnd);
            
            log(`Processing partners batch ${i + 1}-${batchEnd} (${batchPartners.length} partners)`, 'INFO');

            const txb = new TransactionBlock();
            txb.setGasBudget(1000000000);

            txb.moveCall({
                target: `${CONFIG.PACKAGE_ID}::${MODULE_NAME}::add_partners`,
                arguments: [
                    txb.object(CONFIG.ADMIN_CAP),
                    txb.object(CONFIG.COLLECTION_ID),
                    txb.pure(batchPartners),
                ],
            });

            try {
                const result = await client.signAndExecuteTransactionBlock({
                    signer,
                    transactionBlock: txb,
                    options: { showEffects: true }
                });
                
                totalProcessed += batchPartners.length;
                log(`Successfully added ${batchPartners.length} partners in current batch`, 'SUCCESS');
                log(`Progress: ${totalProcessed}/${partners.length} partners processed`, 'INFO');
                log(`Transaction digest: ${result.digest}`, 'INFO');
                
                // Add delay between batches to avoid rate limiting
                if (batchEnd < partners.length) {
                    log("Waiting 5 seconds before next batch...", 'INFO');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
                
            } catch (error) {
                log(`Error processing partners batch ${i + 1}-${batchEnd}: ${error.message}`, 'ERROR');
                throw error;
            }
        }

        log(`Successfully added all ${totalProcessed} partners in batches`, 'SUCCESS');
        return { totalProcessed };
    } catch (error) {
        log(`Error adding partners: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Set badges from JSON file
async function setBadgesFromJson() {
    const { client, signer } = getClientAndSigner();

    try {
        log("Reading badges from badges.json...", 'INFO');
        const badgesData = JSON.parse(await fs.readFile('badges.json', 'utf8'));
        const processedBadges = new Set();

        log(`Found ${Object.keys(badgesData).length} badge entries in badges.json`, 'INFO');

        for (let i = 1; i <= CONFIG.TOTAL_NFTS; i += CONFIG.BATCH_SIZE) {
            const batchEnd = Math.min(i + CONFIG.BATCH_SIZE - 1, CONFIG.TOTAL_NFTS);
            const tokenIds = [];
            const badges = [];

            for (let j = i; j <= batchEnd; j++) {
                if (badgesData[j.toString()] && !processedBadges.has(j)) {
                    tokenIds.push(j);
                    
                    const badgeData = badgesData[j.toString()];
                    if (Array.isArray(badgeData)) {
                        badges.push(badgeData);
                    } else {
                        badges.push([badgeData]);
                    }
                    
                    processedBadges.add(j);
                }
            }

            if (tokenIds.length > 0) {
                log(`Processing badges batch from NFT #${i} to #${batchEnd} (${tokenIds.length} NFTs)`, 'INFO');
                
                const txb = new TransactionBlock();
                txb.setGasBudget(1000000000);

                txb.moveCall({
                    target: `${CONFIG.PACKAGE_ID}::${MODULE_NAME}::set_bulk_nft_badges`,
                    arguments: [
                        txb.object(CONFIG.ADMIN_CAP),
                        txb.object(CONFIG.COLLECTION_ID),
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
                    log(`Successfully processed ${tokenIds.length} badges in current batch`, 'SUCCESS');
                    
                    if (i + CONFIG.BATCH_SIZE <= CONFIG.TOTAL_NFTS) {
                        log(`Waiting ${CONFIG.DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`, 'INFO');
                        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
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

// Set attributes from JSON files
async function setAttributesFromJson() {
    const { client, signer } = getClientAndSigner();

    try {
        log("Processing NFT attributes from JSON files...", 'INFO');
        const processedNfts = new Set();

        for (let i = 1; i <= CONFIG.TOTAL_NFTS; i += CONFIG.BATCH_SIZE) {
            const batchEnd = Math.min(i + CONFIG.BATCH_SIZE - 1, CONFIG.TOTAL_NFTS);
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
                
                const txb = new TransactionBlock();
                txb.setGasBudget(1000000000);

                txb.moveCall({
                    target: `${CONFIG.PACKAGE_ID}::${MODULE_NAME}::set_bulk_nft_attributes`,
                    arguments: [
                        txb.object(CONFIG.ADMIN_CAP),
                        txb.object(CONFIG.COLLECTION_ID),
                        txb.pure(batchNftIds),
                        txb.pure(batchKeys),
                        txb.pure(batchValues),
                    ],
                });

                try {
                    const result = await client.signAndExecuteTransactionBlock({
                        signer,
                        transactionBlock: txb,
                        options: { showEffects: true }
                    });
                    log(`Successfully processed attributes for ${batchNftIds.length} NFTs in current batch`, 'SUCCESS');
                    
                    if (i + CONFIG.BATCH_SIZE <= CONFIG.TOTAL_NFTS) {
                        log(`Waiting ${CONFIG.DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`, 'INFO');
                        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
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

// Set URLs from JSON file
async function setUrlsFromJson() {
    const { client, signer } = getClientAndSigner();

    try {
        log("Reading URLs from imagelinks.json...", 'INFO');
        const imageLinksData = JSON.parse(await fs.readFile('imagelinks.json', 'utf8'));
        const processedUrls = new Set();

        log(`Found ${Object.keys(imageLinksData).length} URL entries in imagelinks.json`, 'INFO');

        for (let i = 1; i <= CONFIG.TOTAL_NFTS; i += CONFIG.BATCH_SIZE) {
            const batchEnd = Math.min(i + CONFIG.BATCH_SIZE - 1, CONFIG.TOTAL_NFTS);
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
                
                const txb = new TransactionBlock();
                txb.setGasBudget(1000000000);

                txb.moveCall({
                    target: `${CONFIG.PACKAGE_ID}::${MODULE_NAME}::set_bulk_nft_urls`,
                    arguments: [
                        txb.object(CONFIG.ADMIN_CAP),
                        txb.object(CONFIG.COLLECTION_ID),
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
                    log(`Successfully processed ${nftIds.length} URLs in current batch`, 'SUCCESS');
                    
                    if (i + CONFIG.BATCH_SIZE <= CONFIG.TOTAL_NFTS) {
                        log(`Waiting ${CONFIG.DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`, 'INFO');
                        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
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

// Set badge display settings
async function setBadgeDisplaySettings() {
    const { client, signer } = getClientAndSigner();

    // Common badges that should be displayable
    const displayableBadges = [
        "Early Adopter", "Whale", "OG", "Special", "Limited", "Founder", "VIP", "Legendary"
    ];

    log(`Setting display settings for ${displayableBadges.length} badges...`, 'INFO');

    for (const badgeName of displayableBadges) {
        const txb = new TransactionBlock();
        txb.setGasBudget(1000000000);

        txb.moveCall({
            target: `${CONFIG.PACKAGE_ID}::${MODULE_NAME}::set_badge_displayable`,
            arguments: [
                txb.object(CONFIG.ADMIN_CAP),
                txb.object(CONFIG.COLLECTION_ID),
                txb.pure(badgeName),
                txb.pure(true), // Set as displayable
            ],
        });

        try {
            const result = await client.signAndExecuteTransactionBlock({
                signer,
                transactionBlock: txb,
                options: { showEffects: true }
            });
            log(`Set badge "${badgeName}" as displayable`, 'SUCCESS');
            
            // Small delay between transactions
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            log(`Error setting badge "${badgeName}" displayable: ${error.message}`, 'WARNING');
            // Continue with other badges even if one fails
        }
    }
}

// Add royalty and lock rules
async function addRoyaltyAndLockRules() {
    const { client, signer } = getClientAndSigner();
    const kioskClient = new KioskClient({ 
        client, 
        network: ENVIRONMENT === 'production' ? Network.MAINNET : Network.TESTNET 
    });

    log("Adding royalty and lock rules...", 'INFO');

    const policyType = `${CONFIG.PACKAGE_ID}::${MODULE_NAME}::BeelieverNFT`;
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

// Execute premint
async function executePremint() {
    if (SKIP_PREMINT) {
        log("Skipping premint as requested", 'INFO');
        return;
    }

    const { client, signer } = getClientAndSigner();
    const kioskClient = new KioskClient({ url: CONFIG.RPC_URL });

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

        // Execute premint in specific ranges
        const PREMINT_BATCH_SIZE = 20;
        let completedPremint = 0;
        let totalPremint = 0;

        // Define premint ranges: 1-10 (mythics), skip 11-21, then 22-221 (normals)
        const premintRanges = [
            { start: 1, end: 10, description: "First 10 mythics" },
            { start: 22, end: 221, description: "200 normal NFTs after mythics" }
        ];

        // Calculate total NFTs to premint
        premintRanges.forEach(range => {
            totalPremint += (range.end - range.start + 1);
        });

        log(`Starting premint process for ${totalPremint} NFTs in specific ranges...`, 'INFO');
        log(`Ranges: 1-10 (mythics), skip 11-21, then 22-221 (normals)`, 'INFO');

        for (const range of premintRanges) {
            log(`Processing range ${range.start}-${range.end}: ${range.description}`, 'INFO');
            
            // Process each range in batches
            for (let startId = range.start; startId <= range.end; startId += PREMINT_BATCH_SIZE) {
                const endId = Math.min(startId + PREMINT_BATCH_SIZE - 1, range.end);
                
                log(`Executing premint batch ${startId}-${endId}...`, 'INFO');
                
                const tx2 = new TransactionBlock();
                tx2.setGasBudget(10000000000); //10 sui budget

                tx2.moveCall({
                    target: `${CONFIG.PACKAGE_ID}::${MODULE_NAME}::premint_to_native_range`,
                    arguments: [
                        tx2.object(CONFIG.ADMIN_CAP),
                        tx2.object(CONFIG.COLLECTION_ID),
                        tx2.object(CONFIG.TRANSFER_POLICY_ID),
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
                    if (endId < range.end || range !== premintRanges[premintRanges.length - 1]) {
                        log(`Waiting ${CONFIG.DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`, 'INFO');
                        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
                    }
                    
                } catch (error) {
                    log(`Error executing premint batch ${startId}-${endId}: ${error.message}`, 'ERROR');
                    throw error;
                }
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
async function startMinting() {
    if (SKIP_MINTING) {
        log("Skipping minting as requested", 'INFO');
        return;
    }

    const { client, signer } = getClientAndSigner();

    // Use start time from config (convert from milliseconds to seconds)
    const startTime = Math.floor(CONFIG.MINT_START_TIME / 1000);

    log(`Starting minting at timestamp: ${startTime}`, 'INFO');
    log(`Minting will start at: ${new Date(startTime * 1000).toISOString()}`, 'INFO');

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${CONFIG.PACKAGE_ID}::${MODULE_NAME}::start_minting`,
        arguments: [
            txb.object(CONFIG.ADMIN_CAP),
            txb.object(CONFIG.COLLECTION_ID),
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

// Run complete setup
async function runCompleteSetup() {
    log(`🚀 Starting Beelievers ${ENVIRONMENT.toUpperCase()} Setup...`, 'INFO');
    log(`Configuration: ${CONFIG.TOTAL_NFTS} NFTs, Batch Size: ${CONFIG.BATCH_SIZE}, Premint Range: ${CONFIG.PREMINT_RANGE}`, 'INFO');
log(`Mint Start Time: ${new Date(CONFIG.MINT_START_TIME).toISOString()} (${CONFIG.MINT_START_TIME} ms)`, 'INFO');
    
    if (SKIP_PREMINT) log("⚠️ Premint will be skipped", 'WARNING');
    if (SKIP_MINTING) log("⚠️ Minting will be skipped", 'WARNING');
    
    try {
        // Step 1: Add partners
        log("\n1️⃣ Adding partners...", 'INFO');
        if (ENVIRONMENT === 'test') {
            await addTestPartners();
        } else {
            await addProductionPartners();
        }
        await new Promise(resolve => setTimeout(resolve, 2000));


        // Step 3: Set badges
        log("\n3️⃣ Setting NFT badges...", 'INFO');
        await setBadgesFromJson();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 4: Set attributes
        log("\n4️⃣ Setting NFT attributes...", 'INFO');
        await setAttributesFromJson();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 5: Set URLs
        log("\n5️⃣ Setting NFT URLs...", 'INFO');
        await setUrlsFromJson();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 6: Set badge display settings
        log("\n6️⃣ Setting badge display settings...", 'INFO');
        await setBadgeDisplaySettings();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 7: Add royalty and lock rules
        log("\n7️⃣ Adding royalty and lock rules...", 'INFO');
        await addRoyaltyAndLockRules();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 8: Execute premint
        log("\n8️⃣ Executing premint...", 'INFO');
        await executePremint();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 9: Start minting
        log("\n9️⃣ Starting minting...", 'INFO');
        await startMinting();

        log("\n🎉 Setup completed successfully!", 'SUCCESS');
        log("\n📊 Setup Summary:", 'INFO');
        log(`   ✅ Partners added (${ENVIRONMENT === 'test' ? '3 test partners' : 'from partners.txt'})`, 'SUCCESS');
        log(`   ✅ Badges set for ${CONFIG.TOTAL_NFTS} NFTs`, 'SUCCESS');
        log(`   ✅ Attributes set for ${CONFIG.TOTAL_NFTS} NFTs`, 'SUCCESS');
        log(`   ✅ URLs set for ${CONFIG.TOTAL_NFTS} NFTs`, 'SUCCESS');
        log(`   ✅ Badge display settings configured`, 'SUCCESS');
        log(`   ✅ Royalty and lock rules added`, 'SUCCESS');
        if (!SKIP_PREMINT) {
            log(`   ✅ Premint executed (NFTs #1-${CONFIG.PREMINT_RANGE})`, 'SUCCESS');
        }
        if (!SKIP_MINTING) {
            log(`   ✅ Minting started`, 'SUCCESS');
        }
        
        log("\n🔍 All features configured successfully!", 'SUCCESS');
        log("💡 Your Beelievers collection is ready!", 'SUCCESS');

    } catch (error) {
        log(`\n❌ Setup failed: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Main function
async function main() {
    const operation = process.argv[2];

    if (!operation || (operation !== 'test' && operation !== 'production')) {
        log(`
🏭 Beelievers Complete Setup Script

Usage:
  Test Setup:        node setup_script.js test
  Production Setup:  node setup_script.js production

Options:
  --skip-premint     Skip the premint process
  --skip-minting     Skip starting the minting process

Examples:
  node setup_script.js test
  node setup_script.js production
  node setup_script.js test --skip-premint
  node setup_script.js production --skip-minting

Required Files:
  - badges.json: Token ID to badge mapping
  - imagelinks.json: Token ID to Walrus URL mapping
  - JSON/: Directory with individual NFT JSON files
  - partners.txt: Partner addresses (for production only)

Test Environment:
  - Uses testnet RPC
  - Tests first 5 NFTs only
  - Uses 3 test partner addresses
  - Smaller batch sizes and delays

Production Environment:
  - Uses mainnet RPC
  - Processes all 6021 NFTs
  - Uses partners from partners.txt
  - Larger batch sizes and delays

Configuration:
  - Test: 5 NFTs, Batch Size: 5, Premint: 5, Mint Start: 1 hour from now
  - Production: 6021 NFTs, Batch Size: 50, Premint: 210, Mint Start: 1 hour from now

Mint Start Time Configuration:
  - Set MINT_START_TIME in the config to your desired timestamp (in milliseconds)
  - Examples:
    - 1 hour from now: Date.now() + 3600000
    - Specific date: new Date('2024-01-15T10:00:00Z').getTime()
    - Immediate: Date.now()
        `, 'INFO');
        return;
    }

    try {
        await runCompleteSetup();
    } catch (error) {
        log(`Script execution failed: ${error.message}`, 'ERROR');
        process.exit(1);
    }
}

main();
