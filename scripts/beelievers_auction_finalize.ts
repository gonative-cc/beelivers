import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { isValidSuiAddress } from "@mysten/sui/utils";
import * as dotenv from "dotenv";
import { promises as fs } from "fs";
import { Command } from "commander";
import _ from "lodash";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

const MAX_ADDRESSES_PER_VECTOR = 500;

dotenv.config();

const PACKAGE_ID = "";
const PUBLISHER_ID = "";
const NETWORK = "";
const ADMIN_CAP_ID = "";
const AUCTION_ID = "";
const CLEAR_PRICE = "";
async function main() {
	const program = new Command();
	program.argument("<file...>", "A finalized addresses file");

	program.parse(process.argv);

	if (program.args.length != 1) {
		console.error("❌ Error: Please provide at least one file to process.");
		process.exit(1);
	}
	const file = program.args[0];

	const { MNEMONIC } = process.env;

	if (!MNEMONIC || !PACKAGE_ID || !NETWORK || !ADMIN_CAP_ID || !AUCTION_ID || !CLEAR_PRICE) {
		console.error("❌ Error: Missing required environment variables. Check your .env file.");
		process.exit(1);
	}

	const rpcUrl = getFullnodeUrl(NETWORK as "mainnet" | "testnet" | "devnet" | "localnet");
	const client = new SuiClient({ url: rpcUrl });
	const keypair = Ed25519Keypair.deriveKeypair(MNEMONIC);

	console.log(`📦 Package ID: ${PACKAGE_ID}`);
	console.log(`👨‍⚖️ Publisher ID: ${PUBLISHER_ID}`);
	console.log("---");
	if (!NETWORK) {
		console.error("❌ Error: SUI_RPC_URL is not set in your .env file.");
		process.exit(1);
	}

	try {
		let addresses = await readAddressesFromFile(file);
		addresses = preprocessAddresses(addresses);
		let bAddreses = batchAddresses(addresses, MAX_ADDRESSES_PER_VECTOR);

		console.log(bAddreses);
		await createPTB(client, keypair, bAddreses);
	} catch (err) {
		console.error("❌ Error: ", err);
		process.exit(1);
	}
}

export async function readAddressesFromFile(filePath: string): Promise<string[]> {
	const content = await fs.readFile(filePath, "utf8");
	return content
		.trim()
		.split("\n")
		.map((addr) => addr.trim());
}

export function preprocessAddresses(addresses: string[]): string[] {
	addresses.forEach((address) => {
		if (!isValidSuiAddress(address)) {
			throw new Error("invalid sui address in finalize list");
		}
	});

	addresses.sort((x, y) => {
		const xx = BigInt(x);
		const yy = BigInt(y);
		if (xx < yy) return -1;
		return xx > yy ? 1 : 0;
	});
	return addresses;
}

export function batchAddresses(addresses: string[], slot: number): string[][] {
	// split addresses to chuck
	if (addresses.length == 0) {
		throw new Error("list address is empty");
	}
	return _.chunk(addresses, slot);
}

async function createPTB(client: SuiClient, keypair: Ed25519Keypair, addresses: string[][]) {
	let number_txn = addresses.length;

	await start(client, keypair, addresses[0]);
	for (let i = 1; i < number_txn; i++) {
		await next(client, keypair, addresses[i]);
	}

	await finalize(client, keypair);
}

//
// START
//

async function start(client: SuiClient, keypair: Ed25519Keypair, addresses: string[]) {
	let txn = new Transaction();

	let auction = txn.object(AUCTION_ID as string);
	let admin_cap = txn.object(ADMIN_CAP_ID as string);
	txn.moveCall({
		target: `${PACKAGE_ID}::auction::finalize_start`,
		arguments: [admin_cap, auction, txn.pure("vector<address>", addresses), txn.object.clock()],
	});

	const result = await client.signAndExecuteTransaction({
		transaction: txn,
		signer: keypair,
		options: {
			showEvents: true,
			showEffects: true,
		},
	});

	await client.waitForTransaction({ digest: result.digest });
	if (result.effects?.status.status === "success") {
		console.log(`   🔗 Digest: ${result.digest}`);
	} else {
		throw new Error(`Transaction failed: ${result.effects?.status.error}`);
	}
}
async function next(client: SuiClient, keypair: Ed25519Keypair, addresses: string[]) {
	let txn = new Transaction();

	let auction = txn.object(AUCTION_ID as string);
	let admin_cap = txn.object(ADMIN_CAP_ID as string);
	txn.moveCall({
		target: `${PACKAGE_ID}::auction::finalize_continue`,
		arguments: [admin_cap, auction, txn.pure("vector<address>", addresses), txn.object.clock()],
	});

	const result = await client.signAndExecuteTransaction({
		transaction: txn,
		signer: keypair,
		options: {
			showEvents: true,
			showEffects: true,
		},
	});
	await client.waitForTransaction({ digest: result.digest });
	if (result.effects?.status.status === "success") {
		console.log(`   🔗 Digest: ${result.digest}`);
	} else {
		throw new Error(`Transaction failed: ${result.effects?.status.error}`);
	}
}

async function finalize(client: SuiClient, keypair: Ed25519Keypair) {
	let txn = new Transaction();
	let auction = txn.object(AUCTION_ID as string);
	let admin_cap = txn.object(ADMIN_CAP_ID as string);
	txn.moveCall({
		target: `${PACKAGE_ID}::auction::finalize_end`,
		arguments: [admin_cap, auction, txn.pure("u64", parseInt(CLEAR_PRICE as string))],
	});

	const result = await client.signAndExecuteTransaction({
		transaction: txn,
		signer: keypair,
		options: {
			showEvents: true,
			showEffects: true,
		},
	});
	await client.waitForTransaction({ digest: result.digest });
	if (result.effects?.status.status === "success") {
		console.log(`✅ Auction finalize successful!`);
		console.log(`   🔗 Digest: ${result.digest}`);
	} else {
		throw new Error(`Transaction failed: ${result.effects?.status.error}`);
	}
}

main().catch((error) => {
	console.error("A fatal error occurred in the main function:", error);
});
