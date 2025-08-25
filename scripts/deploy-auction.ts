import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

import * as dotenv from "dotenv";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

dotenv.config();

const PACKAGE_ID = "";
const START_MS = "";
const DURATION_MS = "";
const AUCTION_SIZE = "";

async function main() {
	const { MNEMONIC, NETWORK } = process.env;

	if (!MNEMONIC || !PACKAGE_ID || !START_MS || !DURATION_MS || !AUCTION_SIZE) {
		console.error("❌ Error: Missing required environment variables. Check your .env file.");
		process.exit(1);
	}

	if (!NETWORK) {
		console.error("❌ Error: SUI_RPC_URL is not set in your .env file.");
		process.exit(1);
	}

	const rpcUrl = getFullnodeUrl(NETWORK as "mainnet" | "testnet" | "devnet" | "localnet");
	const client = new SuiClient({ url: rpcUrl });
	const keypair = Ed25519Keypair.deriveKeypair(MNEMONIC);

	console.log(`📦 Package ID: ${PACKAGE_ID}`);

	const txn = new Transaction();

	let admin = txn.moveCall({
		target: `${PACKAGE_ID}::auction::create_admin_cap`,
		arguments: [],
	});

	txn.moveCall({
		target: `${PACKAGE_ID}::auction::create`,
		arguments: [
			admin,
			txn.pure("u64", parseInt(START_MS)),
			txn.pure("u64", parseInt(DURATION_MS)),
			txn.pure("u32", parseInt(AUCTION_SIZE)),
			txn.object.clock(),
		],
	});

	txn.transferObjects([admin], keypair.toSuiAddress());

	await client.signAndExecuteTransaction({
		transaction: txn,
		signer: keypair,
		options: {
			showEvents: true,
			showEffects: true,
		},
	});

	let result = await client.waitForTransaction({
		digest: await txn.getDigest(),
		options: {
			showEffects: true,
			showEvents: true,
		},
	});

	if (result.effects?.status.status === "success") {
		console.log(`✅ Auction finalize successful!`);
		console.log(`   🔗 Digest: ${result.digest}`);
		const data = result.events?.[0].parsedJson as any;
		console.log(`ADMIN_CAP_ID = ${data["admin_cap_id"]}`);
		console.log(`AUCTION_ID= ${data["auction_id"]}`);
	} else {
		throw new Error(`Transaction failed: ${result.effects?.status.error}`);
	}
}

//
// START
//

main().catch((error) => {
	console.error("A fatal error occurred in the main function:", error);
});
