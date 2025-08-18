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

async function main() {
	const program = new Command();
	program.argument("<file...>", "A finalized addresses file");

	program.parse(process.argv);

	if (program.args.length != 1) {
		console.error("❌ Error: Please provide at least one file to process.");
		process.exit(1);
	}
	const file = program.args[0];

	const { MNEMONIC, PACKAGE_ID, PUBLISHER_ID, NETWORK, ADMIN_CAP_ID, AUCTION_ID, CLEAR_PRICE } =
		process.env;

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
		await createPTB(client, keypair, bAddreses);
	} catch (err) {
		console.error("❌ Error: ", err);
		process.exit(1);
	}
}

export async function readAddressesFromFile(filePath: string): Promise<string[]> {
	const content = await fs.readFile(filePath, "utf8");
	return content.split("\n");
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
	const { PACKAGE_ID, ADMIN_CAP_ID, AUCTION_ID, CLEAR_PRICE } = process.env;
	let number_txn = addresses.length;

	let txn = new Transaction();

	let auction = txn.object(ADMIN_CAP_ID as string);
	let admin_cap = txn.object(AUCTION_ID as string);
	let finalizer = txn.moveCall({
		target: `${PACKAGE_ID}::auction::finalize_start`,
		arguments: [
			admin_cap,
			auction,
			txn.pure("vector<address>", addresses[0]),
			txn.pure("u64", CLEAR_PRICE as string),
			txn.object.clock(),
		],
	});

	if (number_txn == 1) {
		txn.moveCall({
			target: `${PACKAGE_ID}::auction::finalize_end`,
			arguments: [finalizer, auction, txn.pure("vector<address>", [])],
		});
	} else {
		for (let i = 1; i < number_txn - 1; i++) {
			txn.moveCall({
				target: `${PACKAGE_ID}::auction::finalize_continue`,
				arguments: [finalizer, auction, txn.pure("vector<address>", addresses[i])],
			});
		}
		txn.moveCall({
			target: `${PACKAGE_ID}::auction::finalize_end`,
			arguments: [finalizer, auction, txn.pure("vector<address>", addresses[number_txn - 1])],
		});
	}

	const result = await client.signAndExecuteTransaction({
		transaction: txn,
		signer: keypair,
		options: {
			showEvents: true,
			showEffects: true,
		},
	});

	if (result.effects?.status.status === "success") {
		console.log(`✅ Auction finalize successful!`);
		console.log(`   🔗 Digest: ${result.digest}`);
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
