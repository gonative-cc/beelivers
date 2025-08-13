import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import * as dotenv from "dotenv";
import { isValidSuiAddress } from "@mysten/sui/utils";
import { promises as fs } from "fs";
import { parse } from "csv-parse/sync";
import { Command } from "commander";
import * as path from "path";

dotenv.config();

type ReportStatus = "Pending" | "Success" | "Failed - Invalid Format" | "Failed - SuiNS Resolution";
interface ReportEntry {
	originalEntry: string;
	finalAddress: string;
	status: ReportStatus;
	reason: string;
}

async function getEntriesFromCSV(filePath: string): Promise<string[]> {
	console.log(`📄 Reading entries from ${filePath}...`);
	const content = await fs.readFile(filePath, "utf8");
	const records = parse(content, {
		columns: false,
		skip_empty_lines: true,
	});

	const entries = records.flat().map((entry: string) => entry.trim());
	console.log(`✅ Found ${entries.length} total entries.`);
	return entries;
}

async function resolveAddress(client: SuiClient, nameOrAddress: string): Promise<string | null> {
	if (!nameOrAddress.trim().endsWith(".sui")) {
		// Basic validation for a Sui address
		return nameOrAddress.startsWith("0x") ? nameOrAddress : null;
	}

	try {
		console.log(`🔍 Resolving SuiNS name: ${nameOrAddress}...`);
		const resolvedAddress = await client.resolveNameServiceAddress({
			name: nameOrAddress,
		});

		if (resolvedAddress) {
			console.log(`   ✅ Resolved to: ${resolvedAddress}`);
		} else {
			console.warn(`   ⚠️ Could not resolve SuiNS name: ${nameOrAddress}`);
		}
		return resolvedAddress;
	} catch (error) {
		console.error(`   ❌ Error resolving ${nameOrAddress}:`, error);
		return null;
	}
}

async function writeReportCSV(reportEntries: ReportEntry[], filename: string) {
	console.log(`\n✍️  Writing final report to ${filename}...`);
	const header = "Original Entry,Final Address,Status,Reason\n";
	const rows = reportEntries
		.map(
			(entry) =>
				`"${entry.originalEntry.replace(/"/g, '""')}",${entry.finalAddress},${
					entry.status
				},"${entry.reason.replace(/"/g, '""')}"`
		)
		.join("\n");

	try {
		await fs.writeFile(filename, header + rows);
		console.log("✅ Report saved successfully.");
	} catch (error) {
		console.error("❌ Failed to write report file:", error);
	}
}

async function main() {
	const program = new Command();
	program
		.requiredOption("-f, --file <path>", "Path to the CSV file with addresses/SuiNS names")
		.option("-b, --batch-size <number>", "Number of addresses per transaction", "50")
		.option("-o, --offset <number>", "Start minting from this entry index (for resuming)", "0");

	program.parse(process.argv);
	const options = program.opts();

	const filePath: string = options.file;
	const batchSize = parseInt(options.batchSize, 10);
	const offset = parseInt(options.offset, 10);

	const inputFilename = path.basename(filePath, path.extname(filePath));
	const reportFilename = `report_${inputFilename}.csv`;

	const { MNEMONIC, PACKAGE_ID, PUBLISHER_ID, NETWORK } = process.env;

	if (!MNEMONIC || !PACKAGE_ID || !PUBLISHER_ID || !NETWORK) {
		console.error("❌ Error: Missing required environment variables. Check your .env file.");
		process.exit(1);
	}

	const MODULE_NAME = "nft";
	const MINT_FUNCTION = "mint_many_and_transfer";

	const rpcUrl = getFullnodeUrl(NETWORK as "mainnet" | "testnet" | "devnet" | "localnet");
	const client = new SuiClient({ url: rpcUrl });

	const keypair = Ed25519Keypair.deriveKeypair(MNEMONIC);

	console.log(`📦 Package ID: ${PACKAGE_ID}`);
	console.log(`👨‍⚖️ Publisher ID: ${PUBLISHER_ID}`);
	console.log("---");

	let allEntries = await getEntriesFromCSV(filePath);

	if (offset > 0) {
		console.log(`↪️ Applying offset: Skipping first ${offset} entries.`);
		allEntries = allEntries.slice(offset);
	}

	const reportEntries: ReportEntry[] = [];

	console.log("Resolving all addresses and SuiNS names...");
	for (const entry of allEntries) {
		const resolved = await resolveAddress(client, entry);
		if (resolved) {
			reportEntries.push({
				originalEntry: entry,
				finalAddress: resolved,
				status: "Pending",
				reason: "",
			});
		} else {
			reportEntries.push({
				originalEntry: entry,
				finalAddress: "",
				status: "Failed - SuiNS Resolution",
				reason: "Could not resolve to a valid Sui address.",
			});
		}
	}

	console.log("Validating all resolved addresses...");
	const validAddresses: string[] = [];
	reportEntries.forEach((entry) => {
		if (entry.finalAddress) {
			const isValid = isValidSuiAddress(entry.finalAddress);
			if (isValid) {
				validAddresses.push(entry.finalAddress);
			} else {
				entry.status = "Failed - Invalid Format";
				entry.reason = "The resolved address has an invalid format.";
			}
		}
	});

	if (validAddresses.length === 0) {
		console.log("No valid addresses to process after validation. Exiting.");
		await writeReportCSV(reportEntries, reportFilename);
		return;
	}

	const batches: string[][] = [];
	for (let i = 0; i < validAddresses.length; i += batchSize) {
		batches.push(validAddresses.slice(i, i + batchSize));
	}

	console.log(`\n⚙️  Preparing to add ${batches.length} batches to a single transaction.`);
	console.log("---");

	const tx = new Transaction();
	const mintTarget = `${PACKAGE_ID}::${MODULE_NAME}::${MINT_FUNCTION}` as const;

	for (let i = 0; i < batches.length; i++) {
		const batch = batches[i];
		const batchNumber = i + 1;

		console.log(`⏳ Preparing Batch ${batchNumber}/${batches.length}...`);

		if (batch.length === 0) {
			console.log(`   Skipping empty batch.`);
			continue;
		}

		tx.moveCall({
			target: mintTarget,
			arguments: [tx.object(PUBLISHER_ID), tx.pure.vector("address", batch)],
		});
	}

	console.log("\n✅ All batches prepared. Executing the transaction now...");
	let transactionSuccess = false;
	try {
		const result = await client.signAndExecuteTransaction({
			transaction: tx,
			signer: keypair,
			options: { showEffects: true },
		});

		if (result.effects?.status.status === "success") {
			console.log(`✅ Transaction successful! All NFTs minted.`);
			console.log(`   🔗 Transaction Digest: ${result.digest}`);
			transactionSuccess = true;
		} else {
			console.error(`❌ Transaction FAILED!`);
			console.error(`   Status: ${result.effects?.status.status}`);
			console.error(`   Error: ${result.effects?.status.error}`);
		}
	} catch (error) {
		console.error(`❌ An unexpected error occurred during execution:`, error);
	}

	if (transactionSuccess) {
		reportEntries.forEach((entry) => {
			if (entry.status === "Pending") {
				entry.status = "Success";
			}
		});
	}

	await writeReportCSV(reportEntries, reportFilename);
	console.log("🎉 Script finished.");
}

main();
