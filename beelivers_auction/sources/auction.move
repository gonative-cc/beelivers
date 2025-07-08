/// Module: beelivers_auction
module beelivers_auction::beelivers_auction;

use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::sui::SUI;

const EAuctionNotFinalized: u64 = 2;
const EInvaidAuctionDuration: u64 = 3;


// One day in MS
const ONE_DAY: u64 = 24 * 60 * 60 * 1000;

public struct AdminCap has key, store {
    id: UID,
}

public struct AuctionStatus has key, store {
    id: UID,
    paused: bool,
}

// Auction object manage all partial object.
public struct Auction has key, store {
    id: UID,
    size: u32,
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

    // only admin can update status
    let status = AuctionStatus {
        id: object::new(ctx),
        status: UnScheduled,
    };

    transfer::public_share_object(status);
    transfer::public_transfer(admin_cap, ctx.sender());
}

public fun status(status: &AuctionStatus): u8 {
    status.status
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

// ==================== Admin methods ===================================
fun new_auction(
    _: &AdminCap,
    szie: u64,
    starts_at: u64,
    duration: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(starts_at > clock.timestamp_ms() + 3600*1000, EInvaidAuctionDuration); // must start at least 1h in the future
    let auction = Auction {
        id: object::new(ctx),
        number_items,
        starts_at,
        ends_at: starts_at + duration - 1,
        vault: balance::zero(),
    };

    transfer::public_share_object(auction)
}

public fun new_auctions(
    _: &AdminCap,
    status: &mut AuctionStatus,
    size_per_auction: u32,
    number_of_auctions: u32,
    starts_at: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    status.status = Scheduled;
    number_sub_auctions.do!(|i| {
        sub_auction(_, number_items, starts_at + i * ONE_DAY, ONE_DAY, clock, ctx);
    });
}

public fun pause(status: &mut AuctionStatus, _: &AdminCap) {
    status.status = Pause;
}

public fun activate(status: &mut AuctionStatus, _: &AdminCap) {
    status.status = Active;
}

public fun isFinalized(auction: &mut Auction, clock: &Clock): bool {
    clock.timestamp_ms() >= auction.ends_at()
}

public fun withdraw_all(auction: &mut Auction, _: &AdminCap, clock: &Clock, ctx: &mut TxContext) {
    assert!(auction.isFinalized(clock), EAuctionNotFinalized);
    let total_balance = auction.vault.value();
    let sui_coin = coin::take(&mut auction.vault, total_balance, ctx);
    transfer::public_transfer(sui_coin, ctx.sender());
}

#[test_only]
public fun init_for_test(ctx: &mut TxContext): (AuctionStatus, AdminCap) {
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };

    let status = AuctionStatus {
        id: object::new(ctx),
        status: UnScheduled,
    };

    (status, admin_cap)
}
