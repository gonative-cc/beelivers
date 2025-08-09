import {
	JsonRpcProvider,
	Connection,
	Ed25519Keypair,
	fromB64,
	TransactionBlock,
	devnetConnection,
} from "@mysten/sui.js";

const PACKAGE_ID = "0xYOUR_PACKAGE_ID";
const MODULE_NAME = "nft";
const FUNCTION_NAME = "mint_many";
const SENDER_MNEMONIC = "your wallet mnemonic here";

function mkLocalProvider() {
	const connection = new Connection({
		fullnode: "http://127.0.0.1:9000", // Default local RPC URL
	});
	return new JsonRpcProvider(connection);
}

function mkNetProvider() {
	// other options: `mainnetConnection` or `testnetConnection` if needed.
	return new JsonRpcProvider(devnetConnection);
}

async function main() {
	const provider = mkLocalProvider();

	const signerKey = Ed25519Keypair.fromSecretKey(fromB64(SENDER_MNEMONIC));
	const senderAddress = signerKey.getPublicKey().toSuiAddress();
	console.log(`Sender Address: ${senderAddress}`);

	const recipients = ["0xRECIPIENT_ADDRESS_1", "0xRECIPIENT_ADDRESS_2", "0xRECIPIENT_ADDRESS_3"];

	// other solution: https://docs.sui.io/guides/developer/sui-101/sign-and-send-txn

	// Construct the Transaction Block
	const txb = new TransactionBlock();
	txb.moveCall({
		target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTION_NAME}`,
		arguments: [
			txb.pure(recipients), // vector<address>
		],
	});

	// Sign and Execute the Transaction
	try {
		console.log("Sending transaction...");
		const result = await provider.signAndExecuteTransactionBlock({
			signer: signerKey,
			transactionBlock: txb,
		});

		console.log("Transaction successful!");
		console.log("Digest:", result.digest);
		console.log("Check the transaction on the Sui Explorer:");
		console.log(`https://suiexplorer.com/txblock/${result.digest}?network=devnet`);
	} catch (error) {
		console.error("Transaction failed:", error);
	}
}

main().catch(console.error);
