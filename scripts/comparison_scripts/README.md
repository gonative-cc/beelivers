# Badge Processing and Winner Comparison Scripts

This directory contains scripts and data for processing auction badges and generating winner data.

## Workflow

1. **Input Data** (`data/`)
   - `db-with-badges.csv` - Original bidder data with existing badges
   - `winners-rank.txt` - Winner ranking data for comparison

2. **Processing Scripts** (`scripts/`)
   - `process-badges.ts` - Main script to process and clean badges with cumulative logic
   - `generate-winners-json.ts` - Converts processed data to JSON format
   - `compare_winners.py` - Python script for data comparison and validation

3. **Generated Output** (`output/`)
   - `processed-badges.csv` - Cleaned badge data sorted by rank
   - `winners.json` - Final JSON format for 5810 winners with badges
   - `matched-winners.csv` - Comparison results

## Usage

```bash
# Process badges (from project root)
bun scripts/comparison_scripts/scripts/process-badges.ts

# Generate JSON output
bun scripts/comparison_scripts/scripts/generate-winners-json.ts

# Compare data (requires Python)
python scripts/comparison_scripts/scripts/compare_winners.py
```
