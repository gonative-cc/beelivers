#[test_only]
module beelivers_auction::admin_tests;

use beelivers_auction::beelivers_auction::{init_for_test, create_auction, Auction};
use std::unit_test::assert_eq;
use sui::clock;
use sui::test_scenario::{Self, take_shared};
use sui::test_utils::destroy;

// redefine constant status. Sui Move don't allow export constant
const Scheduled: u8 = 0;
const Active: u8 = 1;
const Pause: u8 = 2;
const Finalized: u8 = 3;

#[test]
fun create_auction_happy_case() {
    let sender = @0x01;
    let mut scenario = test_scenario::begin(sender);
    let ctx = scenario.ctx();

    let admin_cap = init_for_test(ctx);
    let clock = clock::create_for_testing(ctx);

    let total_item = 10;
    let start_timestamp = 100;
    let duration = 100;
    create_auction(&admin_cap, total_item, start_timestamp, duration, &clock, ctx);

    scenario.next_tx(sender);

    let auction = take_shared<Auction>(&scenario);

    assert_eq!(auction.total_item(), total_item);
    assert_eq!(auction.start_timestamp_ms(), start_timestamp);
    assert_eq!(auction.end_timestamp_ms(), 200);
    assert_eq!(auction.status(), Scheduled);

    destroy(admin_cap);
    destroy(clock);
    destroy(auction);
    scenario.end();
}
