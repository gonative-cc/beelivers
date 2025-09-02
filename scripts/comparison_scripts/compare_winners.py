#!/usr/bin/env python3

import csv
import sys
from pathlib import Path
from typing import Optional


def parse_winners(path: Path):
	winners = []
	with path.open("r", encoding="utf-8") as f:
		for ln, line in enumerate(f, 1):
			line = line.strip()
			if not line or line.startswith("#"):
				continue
			try:
				addr, amt = line.split("|", 1)
			except ValueError:
				raise ValueError(f"Bad winners line {ln}")
			amt_s = amt.strip().replace(",", "")
			try:
				if "." in amt_s:
					amt_i = int(float(amt_s))
				else:
					amt_i = int(amt_s)
			except ValueError:
				raise ValueError(f"Bad amount at line {ln}")
			winners.append((addr.strip().lower(), amt_i))
	return winners


def _read_reconcilled(path: Path):
	rows = []
	with path.open("r", encoding="utf-8", newline="") as f:
		reader = csv.reader(f)
		all_rows = list(reader)
		if not all_rows:
			return rows
		header = [h.strip().lower() for h in all_rows[0]]
		try:
			idx_rank = header.index("rank")
			idx_bidder = header.index("bidder")
			idx_amount = header.index("boostedamount")
		except ValueError:
			raise ValueError("reconcilled.csv must have columns: rank,bidder,boostedAmount")
		for r in all_rows[1:]:
			if not r:
				continue
			try:
				rank = int(r[idx_rank])
				bidder = (r[idx_bidder] or "").strip().lower()
				amount = int(str(r[idx_amount]).replace(",", "").strip())
			except Exception:
				continue
			rows.append((rank, bidder, amount))
	# Ensure sorted by rank
	rows.sort(key=lambda x: x[0])
	return rows


def compare_from_reconcilled(reconcilled_csv: Path, winners_path: Path, limit: int = 5810, out_path: Optional[Path] = None) -> int:
	recon = _read_reconcilled(reconcilled_csv)
	winners = parse_winners(winners_path)

	n = min(limit, len(recon), len(winners))
	mismatches = []
	matched_rows = []

	for i in range(n):
		expected_rank = i + 1
		r_rank, r_addr, r_amt = recon[i]
		w_addr, w_amt = winners[i]

		row_ok = True
		if r_rank != expected_rank:
			mismatches.append(f"Rank mismatch at index {i}: recon_rank={r_rank}, expected={expected_rank}")
			row_ok = False
		if r_addr != w_addr:
			mismatches.append(f"Address mismatch at rank {expected_rank}: recon={r_addr}, winners={w_addr}")
			row_ok = False
		if r_amt != w_amt:
			mismatches.append(f"Amount mismatch at rank {expected_rank}: recon={r_amt}, winners={w_amt}")
			row_ok = False
		if row_ok:
			matched_rows.append((r_rank, r_addr, r_amt))

	if out_path is None:
		out_path = winners_path.parent / "matched-winners.csv"
	with out_path.open("w", encoding="utf-8", newline="") as f:
		w = csv.writer(f)
		w.writerow(["rank", "address", "amount"])
		for rnk, addr, amt in matched_rows:
			w.writerow([rnk, addr, amt])
	print(f"Wrote {len(matched_rows)} matched rows to {out_path}")

	print(f"Compared first {n} ranks.")
	if n < limit:
		print(f"Warning: fewer than {limit} rows available (compared {n}).")

	if not mismatches:
		print("All rows match in order and amount.")
		return 0

	print(f"Found {len(mismatches)} mismatches:")
	for m in mismatches:
		print("- " + m)
	return 2


def main():
	if len(sys.argv) < 3:
		print("Usage: compare_winners.py <path/to/reconcilled.csv> <path/to/winners-rank.txt> [limit=5810] [out_csv]")
		sys.exit(1)
	csv_path = Path(sys.argv[1]).expanduser().resolve()
	winners = Path(sys.argv[2]).expanduser().resolve()
	limit = int(sys.argv[3]) if len(sys.argv) >= 4 and sys.argv[3].isdigit() else 5810
	out_csv = None
	if len(sys.argv) >= 5:
		out_csv = Path(sys.argv[4]).expanduser().resolve()
	elif len(sys.argv) >= 4 and not sys.argv[3].isdigit():
		out_csv = Path(sys.argv[3]).expanduser().resolve()
	code = compare_from_reconcilled(csv_path, winners, limit, out_csv)
	sys.exit(code)


if __name__ == "__main__":
	main()


