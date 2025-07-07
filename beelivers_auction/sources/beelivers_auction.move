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

// One day in MS
const ONE_DAY: u64 = 24 * 60 * 60 * 1000;

// Auction object manage all partial object.
public struct Auction has key, store {
    id: UID,
    status: u8,
    number_items: u64,
    /// timestamp in ms
    starts_at: u64,
    /// timestamp in ms
    ends_at: u64,
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

/// returns auction start timestamp in ms
public fun starts_at(auction: &Auction): u64 {
    auction.starts_at
}

/// returns auction end timestamp in ms
public fun ends_at(auction: &Auction): u64 {
    auction.ends_at
}

public fun number_items(auction: &Auction): u64 {
    auction.number_items
}

// ==================== Admin methods ===================================
public fun sub_auction(
    _: &AdminCap,
    number_items: u64,
    starts_at: u64,
    duration: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(starts_at > clock.timestamp_ms(), EInvaidAuctionDuration);
    let auction = Auction {
        id: object::new(ctx),
        status: Scheduled,
        number_items,
        starts_at,
        ends_at: starts_at + duration - 1,
        vault: balance::zero(),
    };

    transfer::public_share_object(auction)
}

public fun new_auction(_: &AdminCap, number_items: u64, number_sub_auctions: u64, starts_at: u64, clock: &Clock, ctx: &mut TxContext) {
    number_sub_auctions.do!(|i| {
        sub_auction(_, number_items, starts_at + i * ONE_DAY, ONE_DAY, clock, ctx);
    });
}
public fun pause(auction: &mut Auction, _: &AdminCap) {
    auction.status = Pause;
}

public fun activate(auction: &mut Auction, _: &AdminCap) {
    auction.status = Active;
}

public fun isFinalized(auction: &mut Auction, _: &AdminCap, clock: &Clock) {
    assert!(clock.timestamp_ms() >= auction.ends_at(), ETryFinalizeWhenAuctionIsOpen);
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
