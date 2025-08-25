/// Module: mock
module mock::auction;

use sui::balance::Balance;
use sui::coin::Coin;
use sui::sui::SUI;
use sui::table::{Self, Table};

const ENoBidFound: u64 = 6;
const EInsufficientBidForWinner: u64 = 14;

public struct Auction has key, store {
    id: UID,
    vault: Balance<SUI>,
    winners: vector<address>,
    bidders: Table<address, u64>,
    clearing_price: u64,
}

public fun new_mock_auction(
    vault: Coin<SUI>,
    clearing_price: u64,
    bidders: vector<address>,
    winners: vector<address>,
    ctx: &mut TxContext,
): Auction {
    let auction = Auction {
        id: object::new(ctx),
        vault: vault.into_balance(),
        winners: winners,
        clearing_price,
        bidders: table::new(ctx),
    };

    auction
}

public fun withdraw(auction: &mut Auction, ctx: &mut TxContext) {
    let sender = ctx.sender();
    assert!(auction.bidders.contains(sender), ENoBidFound);

    let bid = auction.bidders.remove(sender);
    let is_winner = auction.winners.contains(&sender);

    let refund = if (is_winner) {
        assert!(bid >= auction.clearing_price, EInsufficientBidForWinner);
        bid - auction.clearing_price
    } else {
        bid
    };
    transfer::public_transfer(
        sui::coin::from_balance(auction.vault.split(refund), ctx),
        sender,
    );
}
