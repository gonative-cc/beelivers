export type AuctionConf = {
	packageId: string;
	auctionId: string;
	adminCapId: string;
	clearingPrice: number;
	startMs: number;
	durationMs: number;
	auctionSize: number;
	network: string;
};

export const auctionConfMainnet: AuctionConf = {
	packageId: "",
	auctionId: "0x161524be15687cca96dec58146568622458905c30479452351f231cac5d64c41",
	adminCapId: "0xe0b2e857aaa3120b7c4e3f2e5f5073e2b603719bbfcdcd0ce8e138b49922f27c",
	clearingPrice: 0,
	network: "mainnet",
	startMs: 0,
	durationMs: 0,
	auctionSize: 5810,
};

export const auctionConfTestnet: AuctionConf = {
	packageId: "",
	auctionId: "",
	adminCapId: "",
	clearingPrice: 0,
	network: "testnet",
	startMs: 0,
	durationMs: 0,
	auctionSize: 0,
};
