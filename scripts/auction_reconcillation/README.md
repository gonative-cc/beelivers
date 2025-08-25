# Auction reconciliation

The `data.tgz` archive contains dumped events from the BTCFi Beelievers Auction:

- `bid_events.csv` - all `BidEvent` events emitted by the auction.
- `boosted.csv` - list of whitelisted community members that qualified for a boost.

Auction Object ID: [`0x161524be15687cca96dec58146568622458905c30479452351f231cac5d64c41`](https://suivision.xyz/object/0x161524be15687cca96dec58146568622458905c30479452351f231cac5d64c41)

## Dependencies

- [Bun](https://bun.com/)

## Running

```sh
tar -xvf data.tgz
bun install
bun run ./reconcille.ts bid_events.csv reconcilled.csv
```
