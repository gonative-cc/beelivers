export type AuctionConf = {
	package_id: string;
	auction_id: string;
	admin_cap_id: string;
	auction_item: number;
	clearing_price: number;
	network: string;
};

export const auctionConfMainnet: AuctionConf = {
	package_id: "",
	auction_id: "0x161524be15687cca96dec58146568622458905c30479452351f231cac5d64c41",
	admin_cap_id: "0xe0b2e857aaa3120b7c4e3f2e5f5073e2b603719bbfcdcd0ce8e138b49922f27c",
	auction_item: 5810,
	clearing_price: 0,
	network: "mainnet",
};


export const auctionConfTestnet: AuctionConf = {
	package_id: "",
	auction_id: "",
	admin_cap_id: "",
	auction_item: 0,
	clearing_price: 0,
	network: "testnet",
}
