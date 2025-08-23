export type Auction = {
	package_id: string,
	auction_id: string,
	admin_cap_id: string,
	auction_item: number,
	clearing_price: number,
	network: string
}
export const auction_conf: Auction = {
	package_id: "0xff4982cd449809676699d1a52c5562fc15b9b92cb41bde5f8845a14647186704",
	auction_id: "0x161524be15687cca96dec58146568622458905c30479452351f231cac5d64c41",
	admin_cap_id: "0xe0b2e857aaa3120b7c4e3f2e5f5073e2b603719bbfcdcd0ce8e138b49922f27c",
	auction_item: 5810,
	clearing_price: 0,
	network: "testnet"
}
