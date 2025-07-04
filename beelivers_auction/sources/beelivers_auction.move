/// Module: beelivers_auction
module beelivers_auction::beelivers_auction;

use sui::sui::SUI;
use sui::coin::{Self, Coin};
use sui::balance::{Self, Balance};
use sui::clock::Clock;

const ETryFinalizeWhenAuctionTimeOpen: u64 = 1;
const EAuctionNotFinalize: u64 = 2;

public enum AuctionStatus has copy, drop, store {
    Scheduled,
    Active,
    Pause,
    Finalized
}

public struct AdminCap has key, store {
    id: UID
}

// Auction object manage all partial object.
public struct Auction has key, store {
    id: UID,
    status: AuctionStatus,
    total_item: u64,
    start_timestamp_ms: u64,
    end_timestamp_ms: u64,
    vault: Balance<SUI>
}

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap {
        id: object::new(ctx)
    };
    transfer::public_transfer(admin_cap, ctx.sender());
}

public fun create_auction(_: &AdminCap, total_item: u64, start_timestamp_ms: u64, duration: u64, ctx: &mut TxContext) {
    let auction = Auction {
        id: object::new(ctx),
        status: AuctionStatus::Scheduled,
        total_item,
        start_timestamp_ms,
        end_timestamp_ms: start_timestamp_ms + duration,
        vault: balance::zero()
    };

    transfer::public_share_object(auction)
}


public fun pause(auction: &mut Auction, _: &AdminCap) {
    auction.status = AuctionStatus::Pause;
}

public fun active(auction: &mut Auction, _: &AdminCap) {
    auction.status = AuctionStatus::Active;
}

public fun finalize(auction: &mut Auction, _: &AdminCap, clock: &Clock) {
    assert!(clock.timestamp_ms() >= auction.end_timestamp_ms, ETryFinalizeWhenAuctionTimeOpen);
    auction.status = AuctionStatus::Finalized
}

public fun withdraw_all(auction: &mut Auction, _: &AdminCap, ctx:&mut TxContext) {
    assert!(auction.status == AuctionStatus::Finalized, EAuctionNotFinalize);
    let total_balance = auction.vault.value();
    let sui_coin = coin::take(&mut auction.vault, total_balance, ctx);
    transfer::public_transfer(sui_coin, ctx.sender());
}
