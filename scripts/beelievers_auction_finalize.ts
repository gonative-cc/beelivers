import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { isValidSuiAddress } from "@mysten/sui/utils";
import * as dotenv from "dotenv";
import { promises as fs } from "fs";
import { Command } from "commander";
import _ from "lodash";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { auction_conf, type Auction } from "./auction.config.js";

const MAX_ADDRESSES_PER_VECTOR = 500;

dotenv.config();


async function main() {
	const program = new Command();

	const { MNEMONIC } = process.env;

	if (!MNEMONIC) {
		console.error("❌ Error: Missing required environment variables. Check your .env file.");
		process.exit(1);
	}

	const rpcUrl = getFullnodeUrl(auction_conf.network as "mainnet" | "testnet" | "devnet" | "localnet");
	const client = new SuiClient({ url: rpcUrl });
	const keypair = Ed25519Keypair.deriveKeypair(MNEMONIC);

	program.command("set-winner")
		.argument("<file...>", "A finalized addresses file")
		.action(async (options) => {
			const file = options[0];
			console.log(`📦 Package ID: ${auction_conf.package_id}`);
			console.log("---");
			try {
				let addresses = await readAddressesFromFile(file);
				addresses = preprocessAddresses(addresses);
				let bAddreses = batchAddresses(addresses, MAX_ADDRESSES_PER_VECTOR);

				console.log(bAddreses);
				await set_winner(client, keypair, auction_conf, bAddreses);
			} catch (err) {
				console.error("❌ Error: ", err);
				process.exit(1);
			}
		});

	program.command("finalize")
		.action(async () => {
			await finalize(client, keypair, auction_conf);
		})

	// if (program.args.length != 1) {
	// 	console.error("❌ Error: Please provide at least one file to process.");
	// 	process.exit(1);
	// }

	program.parse(process.argv);
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

async function set_winner(client: SuiClient, keypair: Ed25519Keypair, acof: Auction, addresses: string[][]) {
	let number_txn = addresses.length;

	await start(client, keypair, acof, addresses[0]);
	for (let i = 1; i < number_txn; i++) {
		await next(client, keypair, acof, addresses[i]);
	}
}

async function start(client: SuiClient, keypair: Ed25519Keypair, acof: Auction, addresses: string[]) {
	let txn = new Transaction();

	let auction = txn.object(acof.auction_id);
	let admin_cap = txn.object(acof.admin_cap_id);
	txn.moveCall({
		target: `${acof.package_id}::auction::finalize_start`,
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
async function next(client: SuiClient, keypair: Ed25519Keypair, acof: Auction, addresses: string[]) {
	let txn = new Transaction();


	let auction = txn.object(acof.auction_id);
	let admin_cap = txn.object(acof.admin_cap_id);

	txn.moveCall({
		target: `${acof.package_id}::auction::finalize_continue`,
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


async function finalize(client: SuiClient, keypair: Ed25519Keypair, acof: Auction) {
	let txn = new Transaction();

	let auction = txn.object(acof.auction_id);
	let admin_cap = txn.object(acof.admin_cap_id);

	if (acof.clearing_price < 1e9) {
		throw new Error("Invalid clearing price")
	}

	txn.moveCall({
		target: `${acof.package_id}::auction::finalize_end`,
		arguments: [admin_cap, auction, txn.pure("u64", acof.clearing_price)],
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
