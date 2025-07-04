#[test_only]
module beelivers_auction::bid_tests;


use beelivers_auction::beelivers_auction::{
    init_for_test,
    create_auction,
    Auction,
};
use std::unit_test::assert_eq;
use sui::clock;
use sui::test_scenario::{Self, take_shared};
use sui::test_utils::destroy;
use sui::coin::mint_for_testing;
use sui::sui::SUI;


#[test]
fun bid_happy_case() {
    let sender = @0x01;
    let mut scenario = test_scenario::begin(sender);
    let ctx = scenario.ctx();

    let admin_cap = init_for_test(ctx);
    let mut clock = clock::create_for_testing(ctx);
    let total_item = 600;
    let start_timestamp = 100;
    let duration = 100;
    create_auction(&admin_cap, total_item, start_timestamp, duration, &clock, ctx);
    let bid = mint_for_testing<SUI>(2_000_000_000, ctx);

    scenario.next_tx(sender);

    let mut auction = take_shared<Auction>(&scenario);
    auction.activate(&admin_cap);
    clock.set_for_testing(150);
    auction.bid(bid, &clock);

    assert_eq!(auction.auction_price(), 0);
    assert_eq!(auction.bid_winners()[0], 2_000_000_000);

    destroy(admin_cap);
    destroy(clock);
    destroy(auction);
    scenario.end();
}
