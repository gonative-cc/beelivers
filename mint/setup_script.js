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

// Environment-specific configurations


const CONFIGS = {
    test: {
        PACKAGE_ID: '0x3064d43ee6cc4d703d4c10089786f0ae805b24d2d031326520131d78667ffc2c',
        ADMIN_CAP: '0x0f85445dc767cb9fe6ae3cbc03c097ae656a2a660f5f208e8ceba5fec1ff2dc3',
        COLLECTION_ID: '0x6a41d0a1b90172e558ec08169dff16dbe2b7d0d99d9c5f6164f00b6ae1c245a1',
        TRANSFER_POLICY_ID: '0xef61e56ab17cac808a79bd5741054a3167f80608f4eb3908ff129ce0769fec40',
        AUCTION_CONTRACT: '0x5ae4810b0a0a30b5767c3da561f2fb64315167a9cfa809ad877e1f5902cb2e41',
        RPC_URL: 'https://fullnode.testnet.sui.io:443',
        BATCH_SIZE: 50,
        DELAY_BETWEEN_BATCHES: 5000,
        TOTAL_NFTS: 6021, // Full collection (same as production)
        PREMINT_RANGE: 210, // Full premint range (same as production)
        MINT_START_TIME: 1744088400000, //timestamp ms
        TESTNET_ATTRIBUTES_LIMIT: 21, // Only process first 21 NFTs for attributes on testnet
        TESTNET_URLS_LIMIT: 21 // Only process first 21 NFTs for URLs on testnet
    },
    production: {
        PACKAGE_ID: '', // Replace with production package ID
        ADMIN_CAP: '', // Replace with production admin cap
        COLLECTION_ID: '', // Replace with production collection ID
        TRANSFER_POLICY_ID: '', // Replace with production transfer policy ID
        AUCTION_CONTRACT: '0x345c10a69dab4ba85be56067c94c4a626c51e297b884e43b113d3eb99ed7a0f3', // Replace with production auction contract
        RPC_URL: 'https://fullnode.mainnet.sui.io:443',
        BATCH_SIZE: 50,
        DELAY_BETWEEN_BATCHES: 5000,
        TOTAL_NFTS: 6021, // Full collection
        PREMINT_RANGE: 210, // Full premint range
        MINT_START_TIME: 1744088400000   //timestamp ms
    }
};

// Configuration
const SKIP_PREMINT = process.argv.includes('--skip-premint');
const SKIP_MINTING = process.argv.includes('--skip-minting');

function getConfig() {
    let environment = process.argv[2] || 'test';
    
    // Handle test-minting and set-premint commands
    if (environment === 'test-minting' || environment === 'set-premint') {
        environment = 'test';
    }
    
    return CONFIGS[environment];
}
const MODULE_NAME = 'mint';
const ADMIN_PRIVATE_KEY = 'suiprivkeyxxx'; 

// Enhanced logging with environment and timestamps
function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const emoji = type === 'SUCCESS' ? '✅' : type === 'ERROR' ? '❌' : type === 'WARNING' ? '⚠️' : 'ℹ️';
    const environment = process.argv[2] || 'test';
    const env = environment.toUpperCase();
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
    const config = getConfig();
    const client = new SuiClient({ url: config.RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));
    return { client, signer };
}

// Add test mythic eligible (for test environment)
async function addTestMythicEligible() {
    const { client, signer } = getClientAndSigner();

    const testMythicEligible = [
        '0x8a80d50ac4e36b3b6257f8e9a3afb429e717c08db9e2cc7643c0fd414767f7de',
        '0x8e2ccd32e13ba1b9273bffb21ed1a850b18d319df026c39ecc279bc25d3ab8e2',
        '0x7d42d4a91119cd4b5ca4ec637be61add4fdce404b70ebe84bfd7a8ac6dfa3d54',
        '0x4a707ac63cca5b55559fbafffd35b166a8222f538f3a397ff7952ae9e4c0efda',
        '0xe670405731f97182a4e5056b63385ddd6f7929dfa1a64f82c5f0bdd780dc79f4',
        '0x1d62d59890e0e8adeace350653d05027846004887ed17b92abb3fdc803ffefa6',
        '0x38b0b0a95e18fea78a63c69a43fb2e7412733dc4e5d2b5faeaf4ba867f85432a',
        '0xa3585953487cf72b94233df0895ae7f6bb05c873772f6ad956dac9cafb946d5d',
        '0x9728ec13d7321c7ee46669454e6d49857cc29fed09ba13696af7692c55e61a24',
    ];

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    const config = getConfig();
    txb.moveCall({
        target: `${config.PACKAGE_ID}::${MODULE_NAME}::add_mythic_eligible`,
        arguments: [
            txb.object(config.ADMIN_CAP),
            txb.object(config.COLLECTION_ID),
            txb.pure(testMythicEligible),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        log(`Successfully added ${testMythicEligible.length} test mythic eligible addresses`, 'SUCCESS');
        log(`Transaction digest: ${result.digest}`, 'INFO');
        return result;
    } catch (error) {
        log(`Error adding test mythic eligible: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Add production mythic eligible from file
async function addProductionMythicEligible() {
    const { client, signer } = getClientAndSigner();

    try {
        log("Reading mythic eligible from mythic_eligible.txt...", 'INFO');
        const fileContent = await fs.readFile('mythic_eligible.txt', 'utf8');
        const mythicEligible = fileContent.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(addr => addr.startsWith('0x') ? addr : '0x' + addr);

        if (mythicEligible.length === 0) {
            throw new Error('No mythic eligible addresses found in mythic_eligible.txt');
        }

        log(`Found ${mythicEligible.length} mythic eligible addresses to add`, 'INFO');

        const MYTHIC_ELIGIBLE_BATCH_SIZE = 50;
        let totalProcessed = 0;

        for (let i = 0; i < mythicEligible.length; i += MYTHIC_ELIGIBLE_BATCH_SIZE) {
            const batchEnd = Math.min(i + MYTHIC_ELIGIBLE_BATCH_SIZE, mythicEligible.length);
            const batchMythicEligible = mythicEligible.slice(i, batchEnd);
            
            log(`Processing mythic eligible batch ${i + 1}-${batchEnd} (${batchMythicEligible.length} addresses)`, 'INFO');

            const txb = new TransactionBlock();
            txb.setGasBudget(1000000000);

            const config = getConfig();
            txb.moveCall({
                target: `${config.PACKAGE_ID}::${MODULE_NAME}::add_mythic_eligible`,
                arguments: [
                    txb.object(config.ADMIN_CAP),
                    txb.object(config.COLLECTION_ID),
                    txb.pure(batchMythicEligible),
                ],
            });

            try {
                const result = await client.signAndExecuteTransactionBlock({
                    signer,
                    transactionBlock: txb,
                    options: { showEffects: true }
                });
                
                totalProcessed += batchMythicEligible.length;
                log(`Successfully added ${batchMythicEligible.length} mythic eligible addresses in current batch`, 'SUCCESS');
                log(`Progress: ${totalProcessed}/${mythicEligible.length} addresses processed`, 'INFO');
                log(`Transaction digest: ${result.digest}`, 'INFO');
                
                // Add delay between batches to avoid rate limiting
                if (batchEnd < mythicEligible.length) {
                    log("Waiting 5 seconds before next batch...", 'INFO');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
                
            } catch (error) {
                log(`Error processing mythic eligible batch ${i + 1}-${batchEnd}: ${error.message}`, 'ERROR');
                throw error;
            }
        }

        log(`Successfully added all ${totalProcessed} mythic eligible addresses in batches`, 'SUCCESS');
        return { totalProcessed };
    } catch (error) {
        log(`Error adding mythic eligible: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Set badge names from JSON file
async function setBadgeNamesFromJson() {
    const { client, signer } = getClientAndSigner();

    try {
        log("Reading badge names from badge_names.json...", 'INFO');
        const badgeNamesData = JSON.parse(await fs.readFile('badge_names.json', 'utf8'));
        const badgeNames = badgeNamesData.badge_names;

        if (!badgeNames) {
            throw new Error('No badge_names found in badge_names.json');
        }

        log(`Found ${Object.keys(badgeNames).length} badge name entries`, 'INFO');

        const config = getConfig();
        const badgeIds = Object.keys(badgeNames).map(id => parseInt(id));
        const badgeNameStrings = Object.values(badgeNames);

        log(`Setting ${badgeIds.length} badge names...`, 'INFO');
        
        const txb = new TransactionBlock();
        txb.setGasBudget(1000000000);

        txb.moveCall({
            target: `${config.PACKAGE_ID}::${MODULE_NAME}::set_bulk_badge_names`,
            arguments: [
                txb.object(config.ADMIN_CAP),
                txb.object(config.COLLECTION_ID),
                txb.pure(badgeIds),
                txb.pure(badgeNameStrings),
            ],
        });

        try {
            const result = await client.signAndExecuteTransactionBlock({
                signer,
                transactionBlock: txb,
                options: { showEffects: true }
            });
            log(`Successfully set ${badgeIds.length} badge names`, 'SUCCESS');
            log(`Transaction digest: ${result.digest}`, 'INFO');
        } catch (error) {
            log(`Error setting badge names: ${error.message}`, 'ERROR');
            throw error;
        }

        log(`Completed setting badge names`, 'SUCCESS');
    } catch (error) {
        log(`Error reading or processing badge_names.json: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Set minter badges from JSON file
async function setMinterBadgesFromJson() {
    const { client, signer } = getClientAndSigner();

    try {
        log("Reading minter badges from badges.json...", 'INFO');
        const badgeData = JSON.parse(await fs.readFile('badges.json', 'utf8'));

        if (!badgeData || Object.keys(badgeData).length === 0) {
            log("No badge data found in badges.json, skipping minter badge assignment", 'WARNING');
            return;
        }

        log(`Found ${Object.keys(badgeData).length} address entries with badge data`, 'INFO');

        const config = getConfig();
        const addresses = Object.keys(badgeData);
        const badgeNumbers = Object.values(badgeData);

        // Filter out empty badge arrays
        const validEntries = addresses.filter((_, index) => badgeNumbers[index].length > 0);
        const validBadgeNumbers = badgeNumbers.filter(badges => badges.length > 0);

        if (validEntries.length === 0) {
            log("No valid badge assignments found, skipping", 'WARNING');
            return;
        }

        log(`Setting badges for ${validEntries.length} addresses...`, 'INFO');
        
        const txb = new TransactionBlock();
        txb.setGasBudget(1000000000);

        txb.moveCall({
            target: `${config.PACKAGE_ID}::${MODULE_NAME}::set_bulk_minter_badges`,
            arguments: [
                txb.object(config.ADMIN_CAP),
                txb.object(config.COLLECTION_ID),
                txb.pure(validEntries),
                txb.pure(validBadgeNumbers),
            ],
        });

        try {
            const result = await client.signAndExecuteTransactionBlock({
                signer,
                transactionBlock: txb,
                options: { showEffects: true }
            });
            log(`Successfully set badges for ${validEntries.length} addresses`, 'SUCCESS');
            log(`Transaction digest: ${result.digest}`, 'INFO');
        } catch (error) {
            log(`Error setting minter badges: ${error.message}`, 'ERROR');
            throw error;
        }

        log(`Completed setting minter badges`, 'SUCCESS');
    } catch (error) {
        log(`Error reading or processing badges.json: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Set attributes from JSON files
async function setAttributesFromJson() {
    const config = getConfig();
    const { client, signer } = getClientAndSigner();

    try {
        log("Processing NFT attributes from JSON files...", 'INFO');
        const processedNfts = new Set();

        // Determine the limit based on environment
        const environment = process.argv[2] || 'test';
        const maxNfts = environment === 'test' && config.TESTNET_ATTRIBUTES_LIMIT 
            ? config.TESTNET_ATTRIBUTES_LIMIT 
            : config.TOTAL_NFTS;

        log(`Processing attributes for first ${maxNfts} NFTs (${environment === 'test' ? 'testnet limit' : 'full collection'})`, 'INFO');

        for (let i = 1; i <= maxNfts; i += config.BATCH_SIZE) {
            const batchEnd = Math.min(i + config.BATCH_SIZE - 1, maxNfts);
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
                    target: `${config.PACKAGE_ID}::${MODULE_NAME}::set_bulk_nft_attributes`,
                    arguments: [
                        txb.object(config.ADMIN_CAP),
                        txb.object(config.COLLECTION_ID),
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
                    
                    if (i + config.BATCH_SIZE <= config.TOTAL_NFTS) {
                        log(`Waiting ${config.DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`, 'INFO');
                        await new Promise(resolve => setTimeout(resolve, config.DELAY_BETWEEN_BATCHES));
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
    const config = getConfig();
    const { client, signer } = getClientAndSigner();

    try {
        log("Reading URLs from imagelinks.json...", 'INFO');
        const imageLinksData = JSON.parse(await fs.readFile('imagelinks.json', 'utf8'));
        const processedUrls = new Set();

        log(`Found ${Object.keys(imageLinksData).length} URL entries in imagelinks.json`, 'INFO');

        // Determine the limit based on environment
        const environment = process.argv[2] || 'test';
        const maxNfts = environment === 'test' && config.TESTNET_URLS_LIMIT 
            ? config.TESTNET_URLS_LIMIT 
            : config.TOTAL_NFTS;

        log(`Processing URLs for first ${maxNfts} NFTs (${environment === 'test' ? 'testnet limit' : 'full collection'})`, 'INFO');

        for (let i = 1; i <= maxNfts; i += config.BATCH_SIZE) {
            const batchEnd = Math.min(i + config.BATCH_SIZE - 1, maxNfts);
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
                    target: `${config.PACKAGE_ID}::${MODULE_NAME}::set_bulk_nft_urls`,
                    arguments: [
                        txb.object(config.ADMIN_CAP),
                        txb.object(config.COLLECTION_ID),
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
                    
                    if (i + config.BATCH_SIZE <= config.TOTAL_NFTS) {
                        log(`Waiting ${config.DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`, 'INFO');
                        await new Promise(resolve => setTimeout(resolve, config.DELAY_BETWEEN_BATCHES));
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
    const config = getConfig();
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
            target: `${config.PACKAGE_ID}::${MODULE_NAME}::set_badge_displayable`,
            arguments: [
                txb.object(config.ADMIN_CAP),
                txb.object(config.COLLECTION_ID),
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
    const config = getConfig();
    const { client, signer } = getClientAndSigner();
    const environment = process.argv[2] || 'test';
    const kioskClient = new KioskClient({ 
        client, 
        network: environment === 'production' ? Network.MAINNET : Network.TESTNET 
    });

    log("Adding royalty and lock rules...", 'INFO');

    const policyType = `${config.PACKAGE_ID}::${MODULE_NAME}::BeelieverNFT`;
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

    const config = getConfig();
    const { client, signer } = getClientAndSigner();
    const kioskClient = new KioskClient({ url: config.RPC_URL });

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
                    target: `${config.PACKAGE_ID}::${MODULE_NAME}::premint_to_native_range`,
                    arguments: [
                        tx2.object(config.ADMIN_CAP),
                        tx2.object(config.COLLECTION_ID),
                        tx2.object(config.TRANSFER_POLICY_ID),
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
                        log(`Waiting ${config.DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`, 'INFO');
                        await new Promise(resolve => setTimeout(resolve, config.DELAY_BETWEEN_BATCHES));
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

    const config = getConfig();
    const { client, signer } = getClientAndSigner();

    // Use start time from config (convert from milliseconds to seconds)
    const startTime = Math.floor(config.MINT_START_TIME);

    log(`Starting minting at timestamp: ${startTime}`, 'INFO');
    log(`Minting will start at: ${new Date(startTime).toISOString()}`, 'INFO');

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${config.PACKAGE_ID}::${MODULE_NAME}::start_minting`,
        arguments: [
            txb.object(config.ADMIN_CAP),
            txb.object(config.COLLECTION_ID),
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

// Test minting (for testing after deployment)
async function testMinting() {
    const config = getConfig();
    const { client, signer } = getClientAndSigner();

    log("Testing minting functionality...", 'INFO');
    
    // Set mint start time to now (immediate)
    const startTime = Math.floor(Date.now() / 1000);
    
    log(`Setting mint start time to now: ${startTime}`, 'INFO');
    log(`Minting will start at: ${new Date(startTime * 1000).toISOString()}`, 'INFO');

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${config.PACKAGE_ID}::${MODULE_NAME}::start_minting`,
        arguments: [
            txb.object(config.ADMIN_CAP),
            txb.object(config.COLLECTION_ID),
            txb.pure(startTime),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        log("Successfully started minting for testing", 'SUCCESS');
        log(`Transaction digest: ${result.digest}`, 'INFO');
        
        // Wait a moment then check collection stats
        await new Promise(resolve => setTimeout(resolve, 3000));
        await checkCollectionStats();
        
        // Now try to actually mint an NFT
        await performTestMint();
        
        return result;
    } catch (error) {
        log(`Error starting minting: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Perform actual test mint
async function performTestMint() {
    const config = getConfig();
    const { client, signer } = getClientAndSigner();
    const kioskClient = new KioskClient({ url: config.RPC_URL });

    log("Performing actual test mint...", 'INFO');

    try {
        // Step 1: Create kiosk
        log("Creating kiosk for test mint...", 'INFO');
        const tx1 = new TransactionBlock();
        tx1.setGasBudget(1000000000);
        const kioskTx = new KioskTransaction({ transaction: tx1, kioskClient });

        kioskTx.create();
        kioskTx.shareAndTransferCap(signer.getPublicKey().toSuiAddress());
        kioskTx.finalize();

        const result1 = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: tx1,
            options: { showEffects: true }
        });

        log("Kiosk creation successful", 'SUCCESS');
        log(`Kiosk transaction digest: ${result1.digest}`, 'INFO');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get kiosk and cap IDs
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

        log(`Kiosk ID: ${kioskId}`, 'INFO');
        log(`Kiosk Cap ID: ${kioskCapId}`, 'INFO');

        // Step 2: Perform the actual mint
        log("Attempting to mint NFT...", 'INFO');
        const tx2 = new TransactionBlock();
        tx2.setGasBudget(1000000000); // 1 SUI budget

        // Create a zero SUI coin for payment (since mint_price is 0)
        const [coin] = tx2.splitCoins(tx2.gas, [tx2.pure(0)]);

        tx2.moveCall({
            target: `${config.PACKAGE_ID}::${MODULE_NAME}::mint`,
            arguments: [
                tx2.object(config.COLLECTION_ID),
                coin, // payment
                tx2.object(config.TRANSFER_POLICY_ID),
                tx2.object("0x8"), // random
                tx2.object("0x6"), // clock
                tx2.object(config.AUCTION_CONTRACT), // auction contract
                tx2.object(kioskId),
                tx2.object(kioskCapId),
            ],
        });

        const result2 = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: tx2,
            options: { showEffects: true }
        });

        log("🎉 Test mint successful!", 'SUCCESS');
        log(`Mint transaction digest: ${result2.digest}`, 'INFO');
        
        // Check what was minted
        if (result2.effects && result2.effects.created) {
            result2.effects.created.forEach(obj => {
                if (obj.owner.AddressOwner === signer.getPublicKey().toSuiAddress()) {
                    log(`Minted object: ${obj.reference.objectId}`, 'INFO');
                }
            });
        }

        // Wait and check updated stats
        await new Promise(resolve => setTimeout(resolve, 3000));
        await checkCollectionStats();

        return result2;
    } catch (error) {
        log(`Error performing test mint: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Set premint completed (for testing)
async function setPremintCompleted(completed = true) {
    const config = getConfig();
    const { client, signer } = getClientAndSigner();

    try {
        log(`Setting premint_completed to ${completed}...`, 'INFO');
        
        const txb = new TransactionBlock();
        txb.setGasBudget(1000000000);

        txb.moveCall({
            target: `${config.PACKAGE_ID}::${MODULE_NAME}::set_premint_completed`,
            arguments: [
                txb.object(config.ADMIN_CAP),
                txb.object(config.COLLECTION_ID),
                txb.pure(completed),
            ],
        });

        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        
        log(`Successfully set premint_completed to ${completed}`, 'SUCCESS');
        log(`Transaction digest: ${result.digest}`, 'INFO');
        return result;
    } catch (error) {
        log(`Error setting premint_completed: ${error.message}`, 'ERROR');
        throw error;
    }
}

// Check collection stats
async function checkCollectionStats() {
    const config = getConfig();
    const { client } = getClientAndSigner();

    try {
        log("Checking collection stats...", 'INFO');
        
        const txb = new TransactionBlock();
        txb.setGasBudget(1000000000);

        txb.moveCall({
            target: `${config.PACKAGE_ID}::${MODULE_NAME}::get_collection_stats`,
            arguments: [
                txb.object(config.COLLECTION_ID),
            ],
        });

        const result = await client.dryRunTransactionBlock({
            transactionBlock: txb,
        });

        console.log(result)

        if (result.results && result.results.length > 0) {
            const returnValues = result.results[0].returnValues;
            if (returnValues && returnValues.length >= 5) {
                const totalMinted = parseInt(returnValues[0]);
                const mythicMinted = parseInt(returnValues[1]);
                const normalMinted = parseInt(returnValues[2]);
                const availableMythics = parseInt(returnValues[3]);
                const availableNormals = parseInt(returnValues[4]);
                
                log(`📊 Collection Stats:`, 'INFO');
                log(`   Total Minted: ${totalMinted}`, 'INFO');
                log(`   Mythics Minted: ${mythicMinted}`, 'INFO');
                log(`   Normals Minted: ${normalMinted}`, 'INFO');
                log(`   Available Mythics: ${availableMythics}`, 'INFO');
                log(`   Available Normals: ${availableNormals}`, 'INFO');
            }
        }
    } catch (error) {
        log(`Error checking collection stats: ${error.message}`, 'WARNING');
    }
}

// Run complete setup
async function runCompleteSetup() {
    const config = getConfig();
    const environment = process.argv[2] || 'test';
    log(`🚀 Starting Beelievers ${environment.toUpperCase()} Setup...`, 'INFO');
    log(`Configuration: ${config.TOTAL_NFTS} NFTs, Batch Size: ${config.BATCH_SIZE}, Premint Range: ${config.PREMINT_RANGE}`, 'INFO');
log(`Mint Start Time: ${new Date(config.MINT_START_TIME).toISOString()} (${config.MINT_START_TIME} ms)`, 'INFO');
    
    if (SKIP_PREMINT) log("⚠️ Premint will be skipped", 'WARNING');
    if (SKIP_MINTING) log("⚠️ Minting will be skipped", 'WARNING');
    
    try {
        // Step 1: Add mythic eligible
        log("\n1️⃣ Adding mythic eligible...", 'INFO');
        if (environment === 'test') {
            await addTestMythicEligible();
        } else {
            await addProductionMythicEligible();
        }
        await new Promise(resolve => setTimeout(resolve, 2000));


        // Step 3: Set badge names
        log("\n3️⃣ Setting badge names...", 'INFO');
        await setBadgeNamesFromJson();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 3.5: Set minter badges
        log("\n3️⃣5️⃣ Setting minter badges...", 'INFO');
        await setMinterBadgesFromJson();
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

        // Step 8: Execute premint (skip on testnet, manually set as completed)
        if (environment === 'test') {
            log("\n8️⃣ Skipping premint on testnet, setting premint_completed to true...", 'INFO');
            await setPremintCompleted(true);
        } else {
            log("\n8️⃣ Executing premint...", 'INFO');
            await executePremint();
        }
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 9: Start minting
        log("\n9️⃣ Starting minting...", 'INFO');
        await startMinting();

        log("\n🎉 Setup completed successfully!", 'SUCCESS');
        log("\n📊 Setup Summary:", 'INFO');
        log(`   ✅ Mythic eligible added (${environment === 'test' ? '2 test mythic eligible' : 'from mythic_eligible.txt'})`, 'SUCCESS');
        log(`   ✅ Badge names set from badge_names.json`, 'SUCCESS');
        log(`   ✅ Minter badges assigned from badges.json`, 'SUCCESS');
        log(`   ✅ Attributes set for ${environment === 'test' ? config.TESTNET_ATTRIBUTES_LIMIT : config.TOTAL_NFTS} NFTs`, 'SUCCESS');
        log(`   ✅ URLs set for ${environment === 'test' ? config.TESTNET_URLS_LIMIT : config.TOTAL_NFTS} NFTs`, 'SUCCESS');
        log(`   ✅ Badge display settings configured`, 'SUCCESS');
        log(`   ✅ Royalty and lock rules added`, 'SUCCESS');
        if (environment === 'test') {
            log(`   ✅ Premint skipped on testnet, manually set as completed`, 'SUCCESS');
        } else if (!SKIP_PREMINT) {
            log(`   ✅ Premint executed (NFTs #1-${config.PREMINT_RANGE})`, 'SUCCESS');
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

    if (!operation || (operation !== 'test' && operation !== 'production' && operation !== 'test-minting' && operation !== 'set-premint')) {
        log(`
🏭 Beelievers Complete Setup Script

Usage:
  Test Setup:        node setup_script.js test
  Production Setup:  node setup_script.js production
  Test Minting:      node setup_script.js test-minting
  Set Premint:       node setup_script.js set-premint

Options:
  --skip-premint     Skip the premint process
  --skip-minting     Skip starting the minting process

Examples:
  node setup_script.js test
  node setup_script.js production
  node setup_script.js test --skip-premint
  node setup_script.js production --skip-minting
  node setup_script.js test-minting

Commands:
  test              - Run complete test setup (mythic eligible, badges, attributes, URLs, premint, minting)
  production        - Run complete production setup (mythic eligible, badges, attributes, URLs, premint, minting)
  test-minting      - Test minting functionality only (starts minting immediately)
  set-premint       - Set premint_completed to true (for testing)

Required Files:
  - badges.json: Token ID to badge mapping
  - imagelinks.json: Token ID to Walrus URL mapping
  - JSON/: Directory with individual NFT JSON files
  - mythic_eligible.txt: Mythic eligible addresses (for production only)

Test Environment:
  - Uses testnet RPC
  - Processes first 21 NFTs for attributes and URLs only
  - Uses 2 test mythic eligible addresses
  - Same batch sizes and delays as production
  - Skips premint execution, manually sets premint_completed to true

Production Environment:
  - Uses mainnet RPC
  - Processes all 6021 NFTs for all features
  - Uses mythic eligible from mythic_eligible.txt
  - Full batch sizes and delays

Configuration:
  - Test: 21 NFTs (attributes/URLs), Batch Size: 50, Premint: skipped, Mint Start: 1 hour from now
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
        if (operation === 'test-minting') {
            log("🧪 Testing minting functionality...", 'INFO');
            await testMinting();
        } else if (operation === 'set-premint') {
            log("🔧 Setting premint_completed to true...", 'INFO');
            await setPremintCompleted(true);
        } else {
            await runCompleteSetup();
        }
    } catch (error) {
        log(`Script execution failed: ${error.message}`, 'ERROR');
        process.exit(1);
    }
}

main();
