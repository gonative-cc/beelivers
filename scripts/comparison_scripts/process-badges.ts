#!/usr/bin/env bun

import { parse } from "csv-parse";
import { promises as fs } from "fs";
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
  first_500 = 15,
  first_1000 = 16,
  last_bid = 20,
  every_10th_position = 21,
  nbtc_every_21st_bidder = 22,
  made_2_bids = 23,
  made_3_bids = 24,
  made_4_bids = 25,
  dethrone = 26,
}

interface BidderData {
  bidder: string;
  amount: number;
  timestamp: number;
  wlStatus: number;
  note: string;
  badges: number[];
  bids: number;
  rank: number;
}

async function readCSVData(filePath: string): Promise<BidderData[]> {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  
  return new Promise((resolve, reject) => {
    const records: BidderData[] = [];
    
    parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      
      for (const row of data) {
        try {
          let badges: number[] = [];
          if (row.badges && row.badges.trim() !== '') {
            badges = JSON.parse(row.badges);
          }
          
          records.push({
            bidder: row.bidder.toLowerCase(),
            amount: parseInt(row.amount),
            timestamp: parseInt(row.timestamp),
            wlStatus: parseInt(row.wlStatus),
            note: row.note || '',
            badges,
            bids: parseInt(row.bids),
            rank: parseInt(row.rank),
          });
        } catch (error) {
          console.error(`Error parsing row for bidder ${row.bidder}:`, error);
        }
      }
      
      resolve(records);
    });
  });
}

function processAndCleanBadges(bidders: BidderData[]): BidderData[] {
  const excludedBadges = new Set([14, 17, 18, 15, 16, 8, 9, 10]); // partner_wl, climb_up_210, climb_up_10, first_500, first_1000, bid_over_10, bid_over_5, bid_over_3
  const latestTimestamp = Math.max(...bidders.map(b => b.timestamp));
  const highestBidAmount = Math.max(...bidders.map(b => b.amount));
  
  // Sort by timestamp, then by bidder address for tie-breaking
  const biddersByTimestamp = [...bidders].sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp;
    }
    return a.bidder.localeCompare(b.bidder);
  });
  
  // Get  the first 500 and first 1000 bidders
  const first500Bidders = new Set(biddersByTimestamp.slice(0, 500).map(b => b.bidder));
  const first1000Bidders = new Set(biddersByTimestamp.slice(0, 1000).map(b => b.bidder));
  
  return bidders.map(bidder => {
    const badges = new Set(bidder.badges.filter(badge => !excludedBadges.has(badge)));
    
    // Rank-based badges
    if (bidder.rank === 1) {
      badges.add(Badge.first_place);
    }
    if (bidder.rank >= 1 && bidder.rank <= 3) {
      badges.add(Badge.top_3);
    }
    if (bidder.rank >= 1 && bidder.rank <= 10) {
      badges.add(Badge.top_10);
    }
    if (bidder.rank >= 1 && bidder.rank <= 21) {
      badges.add(Badge.top_21);
    }
    if (bidder.rank >= 1 && bidder.rank <= 100) {
      badges.add(Badge.top_100);
    }
    if (bidder.rank >= 1 && bidder.rank <= 5810) {
      badges.add(Badge.top_5810);
    }
    
    // Position-based badges
    if (bidder.rank % 10 === 0) {
      badges.add(Badge.every_10th_position);
    }
    if (bidder.rank % 21 === 0) {
      badges.add(Badge.nbtc_every_21st_bidder);
    }
    
    // Last bid badge
    if (bidder.timestamp === latestTimestamp) {
      badges.add(Badge.last_bid);
    }
    
    // Bid count badges
    if (bidder.bids >= 2) {
      badges.add(Badge.made_2_bids);
    }
    if (bidder.bids >= 3) {
      badges.add(Badge.made_3_bids);
    }
    if (bidder.bids >= 4) {
      badges.add(Badge.made_4_bids);
    }
    if (bidder.bids >= 5) {
      badges.add(Badge.made_5_bids);
    }
    if (bidder.bids >= 10) {
      badges.add(Badge.made_10_bids);
    }
    if (bidder.bids >= 20) {
      badges.add(Badge.made_20_bids);
    }
    
    // Bid amount badges 
    const bidAmountInSui = bidder.amount / 1e9; 
    if (bidAmountInSui >= 3) {
      badges.add(Badge.bid_over_3);
    }
    if (bidAmountInSui >= 5) {
      badges.add(Badge.bid_over_5);
    }
    if (bidAmountInSui >= 10) {
      badges.add(Badge.bid_over_10);
    }
    
    // Highest bid badge
    if (bidder.amount === highestBidAmount) {
      badges.add(Badge.highest_bid);
    }
    
    // First bidder badges 
    if (first500Bidders.has(bidder.bidder)) {
      badges.add(Badge.first_500);
    }
    if (first1000Bidders.has(bidder.bidder)) {
      badges.add(Badge.first_1000);
    }
    
    const sortedBadges = Array.from(badges).sort((a, b) => a - b);
    
    return {
      ...bidder,
      badges: sortedBadges,
    };
  });
}

async function main() {
  const inputFile = "/Users/rayanecharif/gonative/beelivers/scripts/comparison_scripts/db-with-badges.csv";
  const outputFile = "/Users/rayanecharif/gonative/beelivers/scripts/comparison_scripts/processed-badges.csv";
  
  console.log("Reading CSV data...");
  const bidders = await readCSVData(inputFile);
  console.log(`Loaded ${bidders.length} bidders`);
  
  console.log("Processing and cleaning badges...");
  console.log("Removing badges: partner_wl (14), climb_up_210 (17), climb_up_10 (18)");
  console.log("Recalculating bid_over badges: (8, 9, 10) with cumulative logic");
  console.log("Adding dynamic badges: [1, 2, 3, 4, 5, 6, 21, 22, 20, 11, 12, 13, 23, 24, 25]");
  console.log("Adding: highest_bid (7), first_500 (15), first_1000 (16)");
  
  const processedBidders = processAndCleanBadges(bidders);
  
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
  console.log(`Output saved to: ${outputFile}`);
  
  const badgeCounts: Record<number, number> = {};
  for (const bidder of sortedBidders) {
    for (const badge of bidder.badges) {
      badgeCounts[badge] = (badgeCounts[badge] || 0) + 1;
    }
  }
  
  console.log("\nBadge Statistics:");
  Object.entries(badgeCounts)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([badge, count]) => {
      const badgeName = Badge[parseInt(badge) as keyof typeof Badge] || `Badge_${badge}`;
      console.log(`  ${badge} (${badgeName}): ${count} users`);
    });
  
  console.log("\nExcluded badges: 14 (partner_wl), 17 (climb_up_210), 18 (climb_up_10)");
}

if (import.meta.main) {
  main().catch(console.error);
}