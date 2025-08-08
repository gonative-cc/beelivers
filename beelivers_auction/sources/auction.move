/// Module: beelivers_auction
module beelivers_auction::beelivers_auction;

use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::sui::SUI;

const EAuctionNotFinalized: u64 = 2;
const EInvaidAuctionDuration: u64 = 3;

// One hour in milliseconds
const ONE_HOUR: u64 = 60 * 60 *1000;

public struct AdminCap has key, store {
    id: UID,
}

// Auction object manage all partial object.
public struct Auction has key, store {
    id: UID,
    paused: bool,
    /// number of items to bid
    size: u64,
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

/// returns auction start timestamp in ms
public fun starts_at(auction: &Auction): u64 {
    auction.starts_at
}

/// returns auction end timestamp in ms
public fun ends_at(auction: &Auction): u64 {
    auction.ends_at
}

public fun size(auction: &Auction): u64 {
    auction.size
}

public fun is_paused(auction: &Auction): bool {
    auction.paused
}

// ==================== Admin methods ===================================
public(package) fun initialize(
    _: &AdminCap,
    size: u64,
    starts_at: u64,
    duration: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(starts_at >= clock.timestamp_ms() + ONE_HOUR, EInvaidAuctionDuration); // must start at least 1h in the future
    assert!(duration >= ONE_HOUR);
    let auction = Auction {
        id: object::new(ctx),
        size,
        starts_at,
        ends_at: starts_at + duration - 1,
        paused: false,
        vault: balance::zero(),
    };

    transfer::public_share_object(auction)
}

public fun set_paused(auction: &mut Auction, _: &AdminCap, pause: bool) {
    auction.paused = pause;
}

public fun is_finalized(auction: &mut Auction, clock: &Clock): bool {
    clock.timestamp_ms() >= auction.ends_at()
}

/// Withdraws all stored SUI
public fun withdraw_all(
    auction: &mut Auction,
    _: &AdminCap,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(auction.is_finalized(clock), EAuctionNotFinalized);
    let total_balance = auction.vault.value();
    let sui_coin = coin::take(&mut auction.vault, total_balance, ctx);
    transfer::public_transfer(sui_coin, ctx.sender());
}

#[test_only]
public fun init_for_test(ctx: &mut TxContext): (Auction, AdminCap) {
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };

    let auction = Auction {
        id: object::new(ctx),
        paused: false,
        size: 4,
        starts_at: 10,
        ends_at: 20,
        vault: balance::create_for_testing(0),
    };

    (auction, admin_cap)
}
