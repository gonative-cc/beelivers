export type Auction = {
	package_id: string,
	auction_id: string,
	admin_cap_id: string,
	auction_item: number,
	clearing_price: number,
	network: string
}
export const auction_conf: Auction = {
	package_id: "",
	auction_id: "",
	admin_cap_id: "",
	auction_item: 5810,
	clearing_price: 0,
	network: "testnet"
}
