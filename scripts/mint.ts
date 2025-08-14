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

	let allEntries = await getEntriesFromCSV(filePath);
	if (offset > 0) {
		console.log(`↪️ Applying offset: Skipping first ${offset} entries.`);
		allEntries = allEntries.slice(offset);
	}

	const { validAddresses, reportEntries } = await processAddresses(client, allEntries);

	if (validAddresses.length === 0) {
		console.log("No valid addresses to process. Exiting.");
		await writeReportCSV(reportEntries, reportFilename);
		return;
	}

	const batches: string[][] = [];
	for (let i = 0; i < validAddresses.length; i += batchSize) {
		batches.push(validAddresses.slice(i, i + batchSize));
	}

	console.log(`\n⚙️  Preparing to add ${batches.length} batches to a single transaction.`);
	console.log("---");

	const tx = buildTransaction(batches);

	let transactionSuccess = false;
	try {
		console.log("\n✅ All batches prepared. Executing the single transaction now...");
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

main().catch((error) => {
	console.error("A fatal error occurred in the main function:", error);
});

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

async function resolveEntry(client: SuiClient, entry: string): Promise<string | null> {
	if (!entry.trim().endsWith(".sui")) {
		return entry.startsWith("0x") ? entry : null;
	}

	try {
		return await client.resolveNameServiceAddress({ name: entry });
	} catch (error) {
		console.warn(`   ⚠️ Could not resolve SuiNS name: ${entry}`);
		return null;
	}
}

async function processAddresses(client: SuiClient, entries: string[]) {
	const reportEntries: ReportEntry[] = [];
	const validAddresses: string[] = [];

	console.log("Resolving and validating all entries...");
	for (const entry of entries) {
		const resolved = await resolveEntry(client, entry);
		if (!resolved) {
			reportEntries.push({
				originalEntry: entry,
				finalAddress: "",
				status: "Failed - SuiNS Resolution",
				reason: "Could not resolve to a valid Sui address.",
			});
			continue;
		}

		if (!isValidSuiAddress(resolved)) {
			reportEntries.push({
				originalEntry: entry,
				finalAddress: resolved,
				status: "Failed - Invalid Format",
				reason: "The resolved address has an invalid format.",
			});
			continue;
		}

		validAddresses.push(resolved);
		reportEntries.push({
			originalEntry: entry,
			finalAddress: resolved,
			status: "Pending",
			reason: "",
		});
	}

	console.log(`✅ Found ${validAddresses.length} valid addresses to process.`);
	return { validAddresses, reportEntries };
}

function buildTransaction(batches: string[][]): Transaction {
	const { PACKAGE_ID, PUBLISHER_ID } = process.env;
	const MODULE_NAME = "nft";
	const MINT_FUNCTION = "mint_many_and_transfer";
	const mintTarget = `${PACKAGE_ID}::${MODULE_NAME}::${MINT_FUNCTION}` as const;

	const tx = new Transaction();

	console.log(`\n⚙️  Preparing to add ${batches.length} batches to a single transaction.`);
	for (const batch of batches) {
		if (batch.length > 0) {
			tx.moveCall({
				target: mintTarget,
				arguments: [tx.object(PUBLISHER_ID!), tx.pure.vector("address", batch)],
			});
		}
	}
	return tx;
}
