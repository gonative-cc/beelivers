#!/usr/bin/env bun

import { readAndParseCSV } from "../csv.ts";
import { writeToFile } from "../fileio.ts";

enum Badge {
	first_place = 1,
	top_3 = 2,
	top_10 = 3,
	top_21 = 4,
	top_100 = 5,
	top_5810 = 6,
	highest_bid = 7,
	bid_over_10 = 8,
	bid_over_5 = 9,
	bid_over_3 = 10,
	made_5_bids = 13,
	made_10_bids = 11,
	made_20_bids = 12,
	last_bid = 20,
	every_10th_position = 21,
	nbtc_every_21st_bidder = 22,
	made_2_bids = 23,
	made_3_bids = 24,
	made_4_bids = 25,
	dethrone = 26,
}

interface BidderData {
	rank: number;
	bidder: string;
	boostedAmount: number;
	timestamp: number;
	boosted: boolean;
	bids: number;
	highestSingleBid: number;
	badges: number[];
}

async function readCSVData(filePath: string): Promise<BidderData[]> {
	const parser = (row: string[]) => {
		return {
			rank: parseInt(row[0]),
			bidder: row[1].toLowerCase(),
			boostedAmount: parseInt(row[2]),
			timestamp: parseInt(row[3]),
			boosted: row[4] === "true",
			bids: parseInt(row[5]),
			highestSingleBid: parseInt(row[6]),
			badges: [], // Will be populated by processAndCleanBadges
		};
	};
	return readAndParseCSV(filePath, 7, parser);
}

function processAndCleanBadges(bidders: BidderData[]): BidderData[] {
	return bidders.map((bidder) => {
		const badges = new Set<number>();

		if (bidder.rank === 1) {
			badges.add(Badge.first_place);
		} else if (bidder.rank >= 2 && bidder.rank <= 3) {
			badges.add(Badge.top_3);
		} else if (bidder.rank >= 4 && bidder.rank <= 10) {
			badges.add(Badge.top_10);
		} else if (bidder.rank >= 22 && bidder.rank <= 100) {
			badges.add(Badge.top_100);
		}

		// All ranks 1-21 get top_21 badge
		if (bidder.rank >= 1 && bidder.rank <= 21) {
			badges.add(Badge.top_21);
		}

		if (bidder.rank % 10 === 0) {
			badges.add(Badge.every_10th_position);
		}
		if (bidder.rank % 21 === 0) {
			badges.add(Badge.nbtc_every_21st_bidder);
		}

		if (bidder.rank === 5810) {
			badges.add(Badge.last_bid);
		}

		if (bidder.bids >= 20) {
			badges.add(Badge.made_20_bids);
		} else if (bidder.bids >= 10) {
			badges.add(Badge.made_10_bids);
		} else if (bidder.bids >= 5) {
			badges.add(Badge.made_5_bids);
		} else if (bidder.bids >= 4) {
			badges.add(Badge.made_4_bids);
		} else if (bidder.bids >= 3) {
			badges.add(Badge.made_3_bids);
		} else if (bidder.bids >= 2) {
			badges.add(Badge.made_2_bids);
		}

		// Bid amount badges
		const bidAmountInSui = bidder.boostedAmount / 1000000000;
		if (bidAmountInSui >= 10) {
			badges.add(Badge.bid_over_10);
		} else if (bidAmountInSui >= 5) {
			badges.add(Badge.bid_over_5);
		} else if (bidAmountInSui >= 3) {
			badges.add(Badge.bid_over_3);
		}

		if (bidder.rank === 1) {
			badges.add(Badge.highest_bid);
		}

		const sortedBadges = Array.from(badges).sort((a, b) => a - b);

		return {
			...bidder,
			badges: sortedBadges,
		};
	});
}

async function main() {
	const inputFile = "scripts/auction_reconcillation/reconcilled.csv";
	const outputFile = "scripts/auction_reconcillation/processed-badges.csv";

	console.log("Reading CSV data...");
	const bidders = await readCSVData(inputFile);
	console.log(`Loaded ${bidders.length} bidders`);

	console.log("Filtering to first 5810 bidders...");
	const first5810Bidders = bidders.filter((bidder) => bidder.rank <= 5810);
	console.log(`Filtered to ${first5810Bidders.length} winners`);

	console.log("Processing and cleaning badges...");
	const processedBidders = processAndCleanBadges(first5810Bidders);

	console.log("Sorting by rank...");
	const sortedBidders = processedBidders.sort((a, b) => a.rank - b.rank);

	console.log("Generating output CSV...");
	let csvContent = "address,badges\n";

	for (const bidder of sortedBidders) {
		const badgesJson = JSON.stringify(bidder.badges);
		csvContent += `${bidder.bidder},${badgesJson}\n`;
	}

	await writeToFile(outputFile, csvContent);
	console.log("Badge processing complete!");
}

if (import.meta.main) {
	main().catch(console.error);
}
