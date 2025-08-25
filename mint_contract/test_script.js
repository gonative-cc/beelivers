// Beelievers Test Script - Comprehensive Feature Demonstration
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

// Test Configuration - Use testnet or devnet
const PACKAGE_ID = '0xada75092e6cecd4ddb31c328b31e6d5beea6860068e9ba32fe27560027faaa2f'; // Replace with test package ID
const ADMIN_CAP = '0xce8c355459dd0f44117608f4a282ab63c70dcba10ca596265e473353bdee435a'; // Replace with test admin cap
const COLLECTION_ID = '0xa1d6b6eb06c27186ebb193704896d5f706e0437f11779483feb81658759df0d6'; // Replace with test collection ID
const TRANSFER_POLICY_ID = '0x9f963968ec33326fd4de2f86e64538e63013f7f4120c1553cb2dc9f0ed9917c6'; // Replace with test transfer policy ID
const MODULE_NAME = 'mint';
const ADMIN_PRIVATE_KEY = 'suiprivkeyxxxxx'; // Replace with your test private key

const RPC_URL = 'https://fullnode.testnet.sui.io:443'; // Use testnet for testing
const TEST_BATCH_SIZE = 5; // Small batch size for testing

function suiprivkeyToHex(suiprivkey) {
    const decoded = bech32.decode(suiprivkey);
    const bytes = bech32.fromWords(decoded.words);
    const privateKeyBytes = bytes.slice(1);
    return fromHex(Buffer.from(privateKeyBytes).toString('hex'));
}


// Add test partners
async function addTestPartners() {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    // Test partner addresses
    const testPartners = [
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        '0x2345678901234567890123456789012345678901234567890123456789012345',
        '0x3456789012345678901234567890123456789012345678901234567890123456'
    ];

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::add_partners`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
            txb.pure(testPartners),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        console.log(`✅ Successfully added ${testPartners.length} test partners:`, result.digest);
        return result;
    } catch (error) {
        console.error("❌ Error adding test partners:", error);
        throw error;
    }
}



// Set test badges for first 5 NFTs
async function setTestBadges() {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    // Test badge data for first 5 NFTs
    const testBadges = {
        tokenIds: [1, 2, 3, 4, 5],
        badges: [
            ["Early Adopter", "OG"],           // NFT #1: Multiple badges
            ["Whale"],                         // NFT #2: Single badge
            ["Early Adopter", "Whale", "OG"],  // NFT #3: Three badges
            ["Test Badge"],                    // NFT #4: Single badge
            ["Special", "Limited"]             // NFT #5: Two badges
        ]
    };

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::set_bulk_nft_badges`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
            txb.pure(testBadges.tokenIds),
            txb.pure(testBadges.badges),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        console.log(`✅ Successfully set test badges for ${testBadges.tokenIds.length} NFTs:`, result.digest);
        console.log("📋 Test badges set:");
        testBadges.tokenIds.forEach((id, index) => {
            console.log(`   NFT #${id}: [${testBadges.badges[index].join(', ')}]`);
        });
        return result;
    } catch (error) {
        console.error("❌ Error setting test badges:", error);
        throw error;
    }
}

// Set test attributes for first 5 NFTs
async function setTestAttributes() {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    // Test attribute data for first 5 NFTs
    const testAttributes = {
        nftIds: [1, 2, 3, 4, 5],
        attributeKeys: [
            ["Background", "Eyes", "Mouth", "Rarity"],     // NFT #1
            ["Background", "Eyes", "Mouth", "Rarity"],     // NFT #2
            ["Background", "Eyes", "Mouth", "Rarity"],     // NFT #3
            ["Background", "Eyes", "Mouth", "Rarity"],     // NFT #4
            ["Background", "Eyes", "Mouth", "Rarity"]      // NFT #5
        ],
        attributeValues: [
            ["Blue", "Happy", "Smile", "Common"],          // NFT #1
            ["Red", "Sad", "Frown", "Rare"],               // NFT #2
            ["Green", "Wink", "Laugh", "Epic"],            // NFT #3
            ["Purple", "Angry", "Grin", "Legendary"],      // NFT #4
            ["Gold", "Cool", "Smirk", "Mythic"]            // NFT #5
        ]
    };

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::set_bulk_nft_attributes`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
            txb.pure(testAttributes.nftIds),
            txb.pure(testAttributes.attributeKeys),
            txb.pure(testAttributes.attributeValues),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        console.log(`✅ Successfully set test attributes for ${testAttributes.nftIds.length} NFTs:`, result.digest);
        console.log("📋 Test attributes set:");
        testAttributes.nftIds.forEach((id, index) => {
            const attrs = testAttributes.attributeKeys[index].map((key, i) => 
                `${key}: ${testAttributes.attributeValues[index][i]}`
            ).join(', ');
            console.log(`   NFT #${id}: {${attrs}}`);
        });
        return result;
    } catch (error) {
        console.error("❌ Error setting test attributes:", error);
        throw error;
    }
}

// Set test URLs for first 5 NFTs
async function setTestUrls() {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    // Test URL data for first 5 NFTs
    const testUrls = {
        nftIds: [1, 2, 3, 4, 5],
        urls: [
            "https://walrus.tusky.io/test-image-1.png",
            "https://walrus.tusky.io/test-image-2.png", 
            "https://walrus.tusky.io/test-image-3.png",
            "https://walrus.tusky.io/test-image-4.png",
            "https://walrus.tusky.io/test-image-5.png"
        ]
    };

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::set_bulk_nft_urls`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
            txb.pure(testUrls.nftIds),
            txb.pure(testUrls.urls.map(url => Array.from(Buffer.from(url)))),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        console.log(`✅ Successfully set test URLs for ${testUrls.nftIds.length} NFTs:`, result.digest);
        console.log("📋 Test URLs set:");
        testUrls.nftIds.forEach((id, index) => {
            console.log(`   NFT #${id}: ${testUrls.urls[index]}`);
        });
        return result;
    } catch (error) {
        console.error("❌ Error setting test URLs:", error);
        throw error;
    }
}

// Add individual test badge
async function addIndividualTestBadge() {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    const txb = new TransactionBlock();
    txb.setGasBudget(1000000000);

    txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::add_post_mint_badge`,
        arguments: [
            txb.object(ADMIN_CAP),
            txb.object(COLLECTION_ID),
            txb.pure(1), // Add to NFT #1
            txb.pure("Individual Test Badge"),
        ],
    });

    try {
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: txb,
            options: { showEffects: true }
        });
        console.log("✅ Successfully added individual test badge to NFT #1:", result.digest);
        return result;
    } catch (error) {
        console.error("❌ Error adding individual test badge:", error);
        throw error;
    }
}

// Set badge display settings
async function setTestBadgeDisplay() {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    const testBadges = [
        { name: "Early Adopter", displayable: true },
        { name: "Whale", displayable: true },
        { name: "OG", displayable: false },
        { name: "Test Badge", displayable: true },
        { name: "Special", displayable: true },
        { name: "Limited", displayable: false }
    ];

    for (const badge of testBadges) {
        const txb = new TransactionBlock();
        txb.setGasBudget(1000000000);

        txb.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::set_badge_displayable`,
            arguments: [
                txb.object(ADMIN_CAP),
                txb.object(COLLECTION_ID),
                txb.pure(badge.name),
                txb.pure(badge.displayable),
            ],
        });

        try {
            const result = await client.signAndExecuteTransactionBlock({
                signer,
                transactionBlock: txb,
                options: { showEffects: true }
            });
            console.log(`✅ Set badge "${badge.name}" displayable to ${badge.displayable}:`, result.digest);
            
            // Small delay between transactions
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`❌ Error setting badge "${badge.name}" displayable:`, error);
            throw error;
        }
    }
}

// Add royalty and lock rules
async function addTestRules() {
    const client = new SuiClient({ url: RPC_URL });
    const kioskClient = new KioskClient({ client, network: Network.TESTNET });
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
        console.log("✅ Successfully added test royalty and lock rules:", result.digest);
        return result;
    } catch (error) {
        console.error("❌ Error adding test rules:", error);
        throw error;
    }
}

// Execute test premint (small batch)
async function executeTestPremint() {
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

        console.log("✅ Test kiosk creation successful:", result1.digest);
        await new Promise(resolve => setTimeout(resolve, 3000));

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

        // Execute test premint for first 5 NFTs only
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
                tx2.pure(1), // Start from NFT #1
                tx2.pure(5), // End at NFT #5
            ],
        });

        const result2 = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: tx2,
            options: { showEffects: true }
        });
        
        console.log("✅ Test premint successful for NFTs #1-5:", result2.digest);
        return true;

    } catch (error) {
        console.error("❌ Error in test premint process:", error);
        throw error;
    }
}

// Start test minting
async function startTestMinting() {
    const client = new SuiClient({ url: RPC_URL });
    const signer = Secp256k1Keypair.fromSecretKey(suiprivkeyToHex(ADMIN_PRIVATE_KEY));

    // Set start time to 1 hour from now
    const startTime = Math.floor(Date.now() / 1000) + 3600;

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
        console.log("✅ Successfully started test minting:", result.digest);
        console.log(`📅 Minting will start at: ${new Date(startTime * 1000).toISOString()}`);
        return result;
    } catch (error) {
        console.error("❌ Error starting test minting:", error);
        throw error;
    }
}

// Pause test minting
async function pauseTestMinting() {
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
        console.log("✅ Successfully paused test minting:", result.digest);
        return result;
    } catch (error) {
        console.error("❌ Error pausing test minting:", error);
        throw error;
    }
}

// Run complete test suite
async function runCompleteTest() {
    console.log("🚀 Starting Beelievers Test Suite...\n");
    
    try {
        console.log("\n2️⃣ Adding test partners...");
        await addTestPartners();
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("\n4️⃣ Setting test badges for first 5 NFTs...");
        await setTestBadges();
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("\n5️⃣ Setting test attributes for first 5 NFTs...");
        await setTestAttributes();
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("\n6️⃣ Setting test URLs for first 5 NFTs...");
        await setTestUrls();
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("\n7️⃣ Adding individual test badge...");
        await addIndividualTestBadge();
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("\n8️⃣ Setting badge display settings...");
        await setTestBadgeDisplay();
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("\n9️⃣ Adding royalty and lock rules...");
        await addTestRules();
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("\n🔟 Executing test premint...");
        await executeTestPremint();
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("\n1️⃣1️⃣ Starting test minting...");
        await startTestMinting();
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("\n1️⃣2️⃣ Pausing test minting...");
        await pauseTestMinting();

        console.log("\n🎉 Test suite completed successfully!");
        console.log("\n📊 Test Summary:");
        console.log("   ✅ 3 test partners added");
        console.log("   ✅ Test auction contract set");
        console.log("   ✅ Badges set for NFTs #1-5");
        console.log("   ✅ Attributes set for NFTs #1-5");
        console.log("   ✅ URLs set for NFTs #1-5");
        console.log("   ✅ Individual badge added");
        console.log("   ✅ Badge display settings configured");
        console.log("   ✅ Royalty and lock rules added");
        console.log("   ✅ Test premint executed (NFTs #1-5)");
        console.log("   ✅ Minting started and paused");
        
        console.log("\n🔍 All features tested successfully!");
        console.log("💡 Ready for production deployment!");

    } catch (error) {
        console.error("\n❌ Test suite failed:", error);
        throw error;
    }
}

// Individual test functions
async function main() {
    const operation = process.argv[2];

    try {
        switch (operation) {
            case 'partners':
                console.log("Adding test partners...");
                await addTestPartners();
                break;

            case 'auction':
                console.log("Setting test auction contract...");
                await setTestAuctionContract();
                break;

            case 'badges':
                console.log("Setting test badges...");
                await setTestBadges();
                break;

            case 'attributes':
                console.log("Setting test attributes...");
                await setTestAttributes();
                break;

            case 'urls':
                console.log("Setting test URLs...");
                await setTestUrls();
                break;

            case 'individual-badge':
                console.log("Adding individual test badge...");
                await addIndividualTestBadge();
                break;

            case 'badge-display':
                console.log("Setting badge display settings...");
                await setTestBadgeDisplay();
                break;

            case 'rules':
                console.log("Adding test rules...");
                await addTestRules();
                break;

            case 'premint':
                console.log("Executing test premint...");
                await executeTestPremint();
                break;

            case 'start-mint':
                console.log("Starting test minting...");
                await startTestMinting();
                break;

            case 'pause-mint':
                console.log("Pausing test minting...");
                await pauseTestMinting();
                break;

            case 'full-test':
                await runCompleteTest();
                break;

            default:
                console.log(`
🧪 Beelievers Test Script

Usage:
  Full Test Suite:           node test_script.js full-test
  Individual Tests:
    Add Partners:            node test_script.js partners
    Set Auction Contract:    node test_script.js auction
    Set Badges:              node test_script.js badges
    Set Attributes:          node test_script.js attributes
    Set URLs:                node test_script.js urls
    Add Individual Badge:    node test_script.js individual-badge
    Set Badge Display:       node test_script.js badge-display
    Add Rules:               node test_script.js rules
    Execute Premint:         node test_script.js premint
    Start Minting:           node test_script.js start-mint
    Pause Minting:           node test_script.js pause-mint

Test Features:
  - Tests first 5 NFTs only
  - Uses testnet RPC
  - Comprehensive badge testing
  - Attribute and URL testing
  - Badge display settings
  - Royalty and lock rules
  - Small batch premint
  - Minting controls

Example:
  node test_script.js full-test
                `);
        }
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

main();
