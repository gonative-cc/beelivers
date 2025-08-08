/// Module: beelivers_auction
module beelivers_auction::auction;

use std::option::{Self, Option};
use std::vector;
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::table::{Self, Table};

// ======== Constants ========

// One hour in milliseconds
const ONE_HOUR: u64 = 60 * 60 *1000;
const MIN_BID: u64 = 1000000000; // 1SUI = MIST_PER_SUI;

// ======== Errors ========
const ENotStarted: u64 = 1;
const EEnded: u64 = 2;
const ENotEnded: u64 = 3;

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
    /// SUI deposits
    vault: Balance<SUI>,
    users: Table<address, UserRecord>,
    winning_queue: vector<Winner>,
    /// The price winning bidders are going to pay
    clearing_price: u64,
}

/// Aggregated user deposits
public struct UserRecord has store {
    amount: u64,
    withdrawn: bool,
    is_winner: u8,
}

/// Entry for the bid queue
public struct Winner has copy, drop, store {
    bidder: address,
    amount: u64,
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

public fun is_finalized(auction: &mut Auction, clock: &Clock): bool {
    clock.timestamp_ms() >= auction.ends_at()
}

// ==================== Admin methods ===================================

public(package) fun create_auction(
    _: &AdminCap,
    starts_at: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(starts_at >= clock.timestamp_ms() + ONE_HOUR); // must start at least 1h in the future
    let auction = Auction {
        id: object::new(ctx),
        size: 5810,
        starts_at,
        // auction takes 2 days
        ends_at: starts_at + ONE_HOUR*48 - 1,
        paused: false,
        vault: balance::zero(),
        users: table::new(ctx),
        winning_queue: vector::empty(),
        clearing_price: 0,
    };

    transfer::public_share_object(auction)
}

/// Withdraws all stored SUI
#[allow(lint(self_transfer))]
public fun withdraw_auction_proceedings(
    auction: &mut Auction,
    _: &AdminCap,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(auction.is_finalized(clock), EEnded);
    // TODO: compute the amount we can withdraw here
    let total_balance = auction.vault.value();
    let sui_coin = coin::take(&mut auction.vault, total_balance, ctx);
    transfer::public_transfer(sui_coin, ctx.sender());
}

public fun set_paused(auction: &mut Auction, _: &AdminCap, pause: bool) {
    auction.paused = pause;
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
