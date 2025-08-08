/// Module: beelivers_auction
#[allow(unused_const)]
module beelivers_auction::auction;

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
const ENoBidFound: u64 = 4;
const EInsufficientBid: u64 = 5;
const EAlreadyClaimed: u64 = 6;
const ENotWinner: u64 = 7;
const EWinnersNotDetermined: u64 = 8;
const EEntryBidTooSmall: u64 = 9;

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
}

/// Aggregated user deposits
public struct UserRecordDispl has store {
    amount: u64,
    withdrawn: bool,
    is_winning: bool,
}

/// Entry for the bid queue
public struct Winner has drop, store {
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

fun assert_is_active(auction: &Auction, clock: &Clock) {
    let now = clock.timestamp_ms();
    assert!(now >= auction.starts_at, ENotStarted);
    assert!(now < auction.ends_at, EEnded);
}

/// Place a bid or increase existing bid
public fun bid(auction: &mut Auction, payment: Coin<SUI>, clock: &Clock, ctx: &mut TxContext) {
    auction.assert_is_active(clock);
    let bidder = tx_context::sender(ctx);
    // TODO: handle boost
    let bid_amount = coin::value(&payment);
    balance::join(&mut auction.vault, coin::into_balance(payment));

    if (table::contains(&auction.users, bidder)) {
        // Update existing bid
        let bid_info = table::borrow_mut(&mut auction.users, bidder);
        let new_amount = bid_info.amount + bid_amount;
        bid_info.amount = new_amount;

        // Update bid queue
        // update_bid_in_queue(&mut auction.winning_queue, bidder, new_amount);
    } else {
        // Create new bid
        assert!(bid_amount >= MIN_BID, EEntryBidTooSmall);
        auction.insert_new_bid(bidder, bid_amount);
    }
}

/// Returns true if the bidder makes it to the winning list, otherwise returns false.
fun insert_new_bid(auction: &mut Auction, bidder: address, amount: u64): bool {
    let bid_info = UserRecord {
        amount: amount,
        withdrawn: false,
    };
    table::add(&mut auction.users, bidder, bid_info);

    let w = Winner {
        bidder,
        amount: amount,
    };
    let n = auction.winning_queue.length();
    if (n == 0) {
        auction.winning_queue.push_back(w);
        return true
    };

    let lowest_bid = auction.winning_queue[n-1].amount;
    if (amount <= lowest_bid) {
        if (n < auction.size) {
            auction.winning_queue.push_back(w);
            return true
        };
        if (auction.clearing_price < amount) {
            // the bid is smaller than the last element in the queue, but higher then the highest
            // bid outside (the clearing price). So we need to update it.
            auction.clearing_price = amount;
        };
        return false
    };

    if (n == auction.size) {
        auction.clearing_price = lowest_bid;
        auction.winning_queue.pop_back();
    };
    let idx = find_by_amount(&auction.winning_queue, amount);
    auction.winning_queue.insert(w, idx);
    true
}

/// Binary search for insertion position in a sorted winners vector.
/// Returns the first index where an item should be inserted to keep the vector sorted
/// descending by amount and descending by insertion order.
fun find_by_amount(v: &vector<Winner>, amount: u64): u64 {
    let mut lo = 0;
    let mut hi = vector::length(v);
    while (lo < hi) {
        let mid = lo + ((hi - lo) / 2);
        if (amount > v[mid].amount) {
            hi = mid;
        } else {
            lo = mid + 1;
        }
    };
    lo
}

public fun user_record(auction: &Auction, ctx: &mut TxContext): Option<UserRecordDispl> {
    let bidder = tx_context::sender(ctx);
    if (!auction.users.contains(bidder)) {
        return option::none()
    };
    let ur = auction.users.borrow(bidder);
    let amount = ur.amount;
    let mut i = auction.winning_queue.length()-1;
    let lowest_bid = auction.winning_queue[i].amount;
    let mut is_winning = lowest_bid < ur.amount;
    if (lowest_bid == ur.amount) {
        while (i >= 0) {
            let w = &auction.winning_queue[i];
            if (amount != w.amount) {
                break
            };
            if (bidder == w.bidder) {
                is_winning = true;
                break
            };
            i = i+1;
        };
    };
    option::some(UserRecordDispl {
        amount,
        withdrawn: ur.withdrawn,
        is_winning,
    })
}

// ==================== Admin methods ===================================

public fun create_auction(_: &AdminCap, starts_at: u64, clock: &Clock, ctx: &mut TxContext) {
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
