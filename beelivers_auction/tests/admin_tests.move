#[test_only]
module beelivers_auction::admin_tests;



/*
use beelivers_auction::beelivers_auction::{
    init_for_test,
    create_auction,
    Auction,
    EInvaidAuctionDuration
};
use std::unit_test::assert_eq;
use sui::clock;
use sui::test_scenario::{Self, take_shared};
use sui::test_utils::destroy;

// redefine constant status. Sui Move doesn't allow exporting constants
const ONE_DAY: u64 = 24 * 60 * 60 * 1000;
const ONE_HOUR: u64 = 60 * 60 *1000;

#[test]
fun new_auction_happy_case() {
    let sender = @0x01;
    let mut scenario = test_scenario::begin(sender);
    let ctx = scenario.ctx();

    let (status, admin_cap) = init_for_test(ctx);
    let clock = clock::create_for_testing(ctx);

    let size = 10;
    let start_timestamp = ONE_HOUR + 1;
    create_auction(&admin_cap, start_timestamp, &clock, ctx);

    scenario.next_tx(sender);

    let auction = take_shared<Auction>(&scenario);

    assert_eq!(auction.size(), size);
    assert_eq!(auction.starts_at(), start_timestamp);
    assert_eq!(auction.ends_at(), ONE_HOUR + 100);

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

    clock.set_for_testing(ONE_HOUR - 10);

    let number_items = 10;
    let start_timestamp = 100;
    let duration = 100;
    new_auction(&admin_cap, number_items, start_timestamp, duration, &clock, ctx);

    abort
}

#[test]
fun status_setting_happy_case() {
    let sender = @0x01;
    let mut scenario = test_scenario::begin(sender);
    let ctx = scenario.ctx();

    let (mut status, admin_cap) = init_for_test(ctx);

    assert_eq!(status.is_pause(), false);

    // only admin can change status
    status.set_pause(&admin_cap, true);
    assert_eq!(status.is_pause(), true);

    destroy(admin_cap);
    destroy(status);
    scenario.end();
}

#[test]
fun new_auctions_happy_case() {
    let sender = @0x01;
    let mut scenario = test_scenario::begin(sender);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);
    let (mut status, admin_cap) = init_for_test(ctx);

    assert_eq!(status.is_pause(), false);

    let size = 10;
    let number_per_auctions = 5;
    let starts_at = ONE_HOUR + 1;

    new_auctions(&admin_cap, &mut status, size, number_per_auctions, starts_at, &clock, ctx);
    scenario.next_tx(sender);

    let starts_at_vec = vector::tabulate!(number_per_auctions, |i| starts_at + i * ONE_DAY);
    let ends_at_vec = starts_at_vec.map!(|starts_at| starts_at + ONE_DAY - 1);

    let mut i = number_per_auctions;
    loop {
        // order when query share object is reverse.
        if (i == 0) {
            break
        };
        i = i - 1;
        let auction = take_shared<Auction>(&scenario);
        assert_eq!(auction.size(), size);
        assert_eq!(auction.starts_at(), starts_at_vec[i]);
        assert_eq!(auction.ends_at(), ends_at_vec[i]);
        destroy(auction);
    };

    destroy(admin_cap);
    destroy(status);
    destroy(clock);

    scenario.end();
}
*/
