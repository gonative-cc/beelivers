#[test_only]
module beelivers_auction::admin_tests;

use beelivers_auction::beelivers_auction::{
    init_for_test,
    sub_auction,
    new_auction,
    Auction,
    EInvaidAuctionDuration
};
use std::unit_test::assert_eq;
use sui::clock;
use sui::test_scenario::{Self, take_shared};
use sui::test_utils::destroy;

// redefine constant status. Sui Move doesn't allow exporting constants
const UnScheduled: u8 = 0;
const Scheduled: u8 = 1;
const Active: u8 = 2;
const Pause: u8 = 3;
const ONE_DAY: u64 = 24 * 60 * 60 * 1000;

#[test]
fun sub_auction_happy_case() {
    let sender = @0x01;
    let mut scenario = test_scenario::begin(sender);
    let ctx = scenario.ctx();

    let (status, admin_cap) = init_for_test(ctx);
    let clock = clock::create_for_testing(ctx);

    let number_items = 10;
    let start_timestamp = 100;
    let duration = 100;
    sub_auction(&admin_cap, number_items, start_timestamp, duration, &clock, ctx);

    scenario.next_tx(sender);

    let auction = take_shared<Auction>(&scenario);

    assert_eq!(auction.number_items(), number_items);
    assert_eq!(auction.starts_at(), start_timestamp);
    assert_eq!(auction.ends_at(), 199);

    destroy(admin_cap);
    destroy(clock);
    destroy(auction);
    destroy(status);
    scenario.end();
}

#[test, expected_failure(abort_code = EInvaidAuctionDuration)]
fun sub_auction_invalid_timestamp_should_fail() {
    let sender = @0x01;
    let mut scenario = test_scenario::begin(sender);
    let ctx = scenario.ctx();

    let (_status, admin_cap) = init_for_test(ctx);
    let mut clock = clock::create_for_testing(ctx);

    clock.set_for_testing(120);

    let number_items = 10;
    let start_timestamp = 100;
    let duration = 100;
    sub_auction(&admin_cap, number_items, start_timestamp, duration, &clock, ctx);

    abort
}

#[test]
fun status_setting_happy_case() {
    let sender = @0x01;
    let mut scenario = test_scenario::begin(sender);
    let ctx = scenario.ctx();

    let (mut status, admin_cap) = init_for_test(ctx);

    assert_eq!(status.status(), UnScheduled);

    // only admin can change status
    status.pause(&admin_cap);
    assert_eq!(status.status(), Pause);

    status.activate(&admin_cap);
    assert_eq!(status.status(), Active);

    destroy(admin_cap);
    destroy(status);
    scenario.end();
}

#[test]
fun new_auction_happy_case() {
    let sender = @0x01;
    let mut scenario = test_scenario::begin(sender);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);
    let (mut status, admin_cap) = init_for_test(ctx);

    assert_eq!(status.status(), UnScheduled);

    let number_items = 10;
    let number_sub_auctions = 5;
    let starts_at = 1000;
    new_auction(&admin_cap, &mut status, number_items, number_sub_auctions, starts_at, &clock, ctx);
    assert_eq!(status.status(), Scheduled);

    scenario.next_tx(sender);

    let starts_at_vec = vector::tabulate!(number_sub_auctions, |i| starts_at + i * ONE_DAY);
    let ends_at_vec = starts_at_vec.map!(|starts_at| starts_at + ONE_DAY - 1);

    std::debug::print(&starts_at_vec);
    std::debug::print(&ends_at_vec);
    let mut i = number_sub_auctions;

    // order when query share object is reverse.
    loop {
        if (i == 0) {
            break
        };
        i = i - 1;
        let auction = take_shared<Auction>(&scenario);
        assert_eq!(auction.number_items(), number_items);
        assert_eq!(auction.starts_at(), starts_at_vec[i]);
        assert_eq!(auction.ends_at(), ends_at_vec[i]);
        destroy(auction);
    };

    destroy(admin_cap);
    destroy(status);
    destroy(clock);

    scenario.end();
}
