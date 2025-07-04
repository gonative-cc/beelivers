/// Module: beelivers_auction
module beelivers_auction::beelivers_auction;

use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::sui::SUI;

const ETryFinalizeWhenAuctionIsOpen: u64 = 1;
const EAuctionNotFinalized: u64 = 2;
const EInvaidAuctionDuration: u64 = 3;

const Scheduled: u8 = 0;
const Active: u8 = 1;
const Pause: u8 = 2;
const Finalized: u8 = 3;

public struct AdminCap has key, store {
    id: UID,
}

// Auction object manage all partial object.
public struct Auction has key, store {
    id: UID,
    status: u8,
    total_item: u64,
    start_timestamp_ms: u64,
    end_timestamp_ms: u64,
    vault: Balance<SUI>,
}

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::public_transfer(admin_cap, ctx.sender());
}

public fun status(auction: &Auction): u8 {
    auction.status
}

public fun start_timestamp_ms(auction: &Auction): u64 {
    auction.start_timestamp_ms
}

public fun end_timestamp_ms(auction: &Auction): u64 {
    auction.end_timestamp_ms
}

public fun total_item(auction: &Auction): u64 {
    auction.total_item
}

// ==================== Admin methods ===================================
public fun create_auction(
    _: &AdminCap,
    total_item: u64,
    start_timestamp_ms: u64,
    duration: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(start_timestamp_ms > clock.timestamp_ms(), EInvaidAuctionDuration);
    let auction = Auction {
        id: object::new(ctx),
        status: Scheduled,
        total_item,
        start_timestamp_ms,
        end_timestamp_ms: start_timestamp_ms + duration,
        vault: balance::zero(),
    };

    transfer::public_share_object(auction)
}

public fun pause(auction: &mut Auction, _: &AdminCap) {
    auction.status = Pause;
}

public fun activate(auction: &mut Auction, _: &AdminCap) {
    auction.status = Active;
}

public fun finalize(auction: &mut Auction, _: &AdminCap, clock: &Clock) {
    assert!(clock.timestamp_ms() >= auction.end_timestamp_ms, ETryFinalizeWhenAuctionIsOpen);
    auction.status = Finalized
}

public fun withdraw_all(auction: &mut Auction, _: &AdminCap, ctx: &mut TxContext) {
    assert!(auction.status == Finalized, EAuctionNotFinalized);
    let total_balance = auction.vault.value();
    let sui_coin = coin::take(&mut auction.vault, total_balance, ctx);
    transfer::public_transfer(sui_coin, ctx.sender());
}

#[test_only]
public fun init_for_test(ctx: &mut TxContext): AdminCap {
    AdminCap {
        id: object::new(ctx),
    }
}
