import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import * as dotenv from "dotenv";
import { promises as fs } from "fs";
import { parse } from "csv-parse/sync";
import { Command } from "commander";
import * as path from "path";

dotenv.config();

type ReportStatus =
	| "Pending"
	| "Success"
	| "Failed - Invalid Format"
	| "Failed - SuiNS Resolution"
	| "Failed - Transaction";

interface ReportEntry {
	address: string;
	status: ReportStatus;
	reason: string;
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

	const rpcUrl = getFullnodeUrl(NETWORK as "mainnet" | "testnet" | "devnet" | "localnet");
	const client = new SuiClient({ url: rpcUrl });
	const keypair = Ed25519Keypair.deriveKeypair(MNEMONIC);

	console.log(`📦 Package ID: ${PACKAGE_ID}`);
	console.log(`👨‍⚖️ Publisher ID: ${PUBLISHER_ID}`);
	console.log("---");

	let validAddresses = await getEntriesFromCSV(filePath);
	if (offset > 0) {
		console.log(`↪️ Applying offset: Skipping first ${offset} entries.`);
		validAddresses = validAddresses.slice(offset);
	}

	const reportEntries: ReportEntry[] = validAddresses.map((address) => ({
		address,
		status: "Pending",
		reason: "",
	}));

	if (validAddresses.length === 0) {
		console.log("No valid addresses to process. Exiting.");
		await writeReportCSV(reportEntries, reportFilename);
		return;
	}

	const batches: string[][] = [];
	for (let i = 0; i < validAddresses.length; i += batchSize) {
		batches.push(validAddresses.slice(i, i + batchSize));
	}

	console.log(`\n⚙️  Executing ${batches.length} transactions in sequence...`);
	for (let i = 0; i < batches.length; i++) {
		const batch = batches[i];
		const batchNumber = i + 1;

		console.log(`\n--- Processing Batch ${batchNumber}/${batches.length} ---`);
		if (batch.length === 0) {
			console.log("   Skipping empty batch.");
			continue;
		}

		try {
			const tx = new Transaction();
			addMintCallToTransaction(tx, batch);
			const result = await client.signAndExecuteTransaction({
				transaction: tx,
				signer: keypair,
				options: { showEffects: true },
			});

			if (result.effects?.status.status === "success") {
				console.log(`✅ Batch ${batchNumber} successful!`);
				console.log(`   🔗 Digest: ${result.digest}`);
				batch.forEach((address) => {
					const reportEntry = reportEntries.find(
						(r) => r.address === address && r.status === "Pending",
					);
					if (reportEntry) {
						reportEntry.status = "Success";
					}
				});
				await sleep(1000); // NOTE: We have to wait in order for the RPC to be able to aquire the gas coin
			} else {
				throw new Error(`Transaction failed: ${result.effects?.status.error}`);
			}
		} catch (error) {
			console.error(`❌ An error occurred on Batch ${batchNumber}:`, error);
			batch.forEach((address) => {
				const reportEntry = reportEntries.find(
					(r) => r.address === address && r.status === "Pending",
				);
				if (reportEntry) {
					reportEntry.status = "Failed - Transaction";
					reportEntry.reason = (error as Error).message;
				}
			});
			console.log("Stopping script due to transaction failure.");
			break;
		}
	}

	await writeReportCSV(reportEntries, reportFilename);
	console.log("\n🎉 Script finished.");
}

main().catch((error) => {
	console.error("A fatal error occurred in the main function:", error);
});

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
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

async function writeReportCSV(reportEntries: ReportEntry[], filename: string) {
	console.log(`\n✍️  Writing final report to ${filename}...`);
	const header = "Original Entry,Final Address,Status,Reason\n";
	const rows = reportEntries
		.map((entry) => `${entry.address},${entry.status},"${entry.reason.replace(/"/g, '""')}"`)
		.join("\n");

	try {
		await fs.writeFile(filename, header + rows);
		console.log("✅ Report saved successfully.");
	} catch (error) {
		console.error("❌ Failed to write report file:", error);
	}
}

function addMintCallToTransaction(tx: Transaction, batch: string[]) {
	const { PACKAGE_ID, PUBLISHER_ID } = process.env;
	const MODULE_NAME = "nft";
	const MINT_FUNCTION = "mint_many_and_transfer";
	const mintTarget = `${PACKAGE_ID}::${MODULE_NAME}::${MINT_FUNCTION}` as const;

	tx.moveCall({
		target: mintTarget,
		arguments: [tx.object(PUBLISHER_ID!), tx.pure.vector("address", batch)],
	});
}
