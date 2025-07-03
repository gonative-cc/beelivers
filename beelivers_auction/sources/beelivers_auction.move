/// Module: beelivers_auction
module beelivers_auction::beelivers_auction;

use sui::sui::SUI;
use sui::coin::{Self, Coin};
use sui::balance::{Self, Balance};

const EWithdrawWhenAuctionNotEnd: u64 = 1;

public struct AdminCap has key, store {
    id: UID
}

// Auction object manage all partial object.
public struct Auction has key, store {
    id: UID,
    status: u8, // 0 is pause, 1 is start auction, 2 auction end
    total_item: u64,
    vault: Balance<SUI>
}

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap {
        id: object::new(ctx)
    };
    let auction = Auction {
        id: object::new(ctx),
        status: 0,
        total_item: 0,
        vault: balance::zero()
    };
    transfer::public_transfer(admin_cap, ctx.sender());
    transfer::public_share_object(auction);
}

public fun pause(auction: &mut Auction, _: &AdminCap) {
    auction.status = 0;
}

public fun start(auction: &mut Auction, _: &AdminCap) {
    auction.status = 1;
}

public fun end(auction: &mut Auction, _: &AdminCap) {
    // TODO: Check timestamp, this action should automatic
    auction.status = 2;
}

public fun withdraw_all(auction: &mut Auction, _: &AdminCap, ctx:&mut TxContext) {
    assert!(auction.status == 2, EWithdrawWhenAuctionNotEnd);
    let total_balance = auction.vault.value();
    let sui_coin = coin::take(&mut auction.vault, total_balance, ctx);
    transfer::public_transfer(sui_coin, ctx.sender());
}
