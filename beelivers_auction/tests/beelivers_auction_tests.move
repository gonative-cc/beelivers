// SPDX-License-Identifier: MPL-2.0

#[test_only]
module beelivers_auction::beelivers_auction_tests;
// uncomment this line to import the module
// use beelivers_auction::beelivers_auction;


use std::unit_test::{assert_eq, assert_ref_eq};
use sui::test_scenario::{Self, return_shared, Scenario};
use sui::coin::{mint_for_testing, Coin};
use sui::sui::SUI;
use sui::clock::create_for_testing;
use beelivers_auction::auction::{create, create_admin_cap, Auction, finalize_continue, finalize_end, finalize_start, AdminCap};

const ONE_SUI: u64 = 1_000_000_000;
const ONE_HOUR: u64 = 60 * 60 * 1000;
#[test]
fun flow_happy_tests() {
    let admin = @0x01;
    let bidder = vector[@0x100, @0x101, @0x102];
    let mut scenario = test_scenario::begin(admin);

    {
	let clock = create_for_testing(scenario.ctx());
	let admin_cap = create_admin_cap(scenario.ctx());

	create(&admin_cap, 2 * ONE_HOUR,  2 * ONE_HOUR, 5810, &clock, scenario.ctx());


	transfer::public_transfer(admin_cap, admin);
	sui::test_utils::destroy(clock);

    };

    scenario.next_tx(bidder[0]);
    {
	let mut clock = create_for_testing(scenario.ctx());
	clock.set_for_testing(3 * ONE_HOUR);

	let coin = mint_for_testing<SUI>(ONE_SUI, scenario.ctx());
	let mut auction: Auction = scenario.take_shared();

	auction.bid(coin, &clock, scenario.ctx());
	return_shared(auction);
	sui::test_utils::destroy(clock);
    };


    scenario.next_tx(bidder[1]);
    {
	let mut clock = create_for_testing(scenario.ctx());
	clock.set_for_testing(3 * ONE_HOUR);

	let coin = mint_for_testing<SUI>(ONE_SUI * 2, scenario.ctx());
	let mut auction: Auction = scenario.take_shared();

	auction.bid(coin, &clock, scenario.ctx());
	return_shared(auction);
	sui::test_utils::destroy(clock);
    };

     scenario.next_tx(bidder[2]);
    {
	let mut clock = create_for_testing(scenario.ctx());
	clock.set_for_testing(3 * ONE_HOUR);

	let coin = mint_for_testing<SUI>(ONE_SUI * 5, scenario.ctx());
	let mut auction: Auction = scenario.take_shared();

	auction.bid(coin, &clock, scenario.ctx());
	return_shared(auction);
	sui::test_utils::destroy(clock);
    };

    scenario.next_tx(admin);
    {
	let mut clock = create_for_testing(scenario.ctx());
	clock.set_for_testing(5 * ONE_HOUR);
	let mut auction: Auction = scenario.take_shared();
	let admin_cap: AdminCap = scenario.take_from_address(admin);

	finalize_start(&admin_cap, &mut auction, vector[bidder[1]], &clock);
	finalize_continue(&admin_cap, &mut auction, vector[bidder[2]], &clock);

	finalize_end(&admin_cap, &mut auction, 2 * ONE_SUI, scenario.ctx());

	assert_eq!(auction.clearing_price(), option::some(2 * ONE_SUI));

	assert_eq!(auction.is_winner(bidder[0]), false);
	assert_eq!(auction.is_winner(bidder[1]), true);
	assert_eq!(auction.is_winner(bidder[2]), true);
	return_shared(auction);
	scenario.return_to_sender(admin_cap);
	sui::test_utils::destroy(clock);
    };

    // withdraw, he can withdraw all
    scenario.next_tx(bidder[0]);
    {
	let mut clock = create_for_testing(scenario.ctx());
	clock.set_for_testing(5 * ONE_HOUR);
	let mut auction: Auction = scenario.take_shared();
	auction.withdraw(scenario.ctx());
	return_shared(auction);
	sui::test_utils::destroy(clock);
    };
    scenario.next_tx(bidder[0]);
    {
	let coin: Coin<SUI> = scenario.take_from_address(bidder[0]);
	assert_eq!(coin.balance().value(), ONE_SUI);
	scenario.return_to_sender(coin);
    };

     // withdraw, he can withdraw all
    scenario.next_tx(bidder[1]);
    {
	let mut clock = create_for_testing(scenario.ctx());
	clock.set_for_testing(5 * ONE_HOUR);
	let mut auction: Auction = scenario.take_shared();
	auction.withdraw(scenario.ctx());
	return_shared(auction);
	sui::test_utils::destroy(clock);
    };
    scenario.next_tx(bidder[1]);
    {
	let coin: Coin<SUI> = scenario.take_from_address(bidder[1]);
	assert_eq!(coin.balance().value(), 0);
	scenario.return_to_sender(coin);
    };


      // withdraw, he can withdraw all
    scenario.next_tx(bidder[2]);
    {
	let mut clock = create_for_testing(scenario.ctx());
	clock.set_for_testing(5 * ONE_HOUR);
	let mut auction: Auction = scenario.take_shared();
	auction.withdraw(scenario.ctx());
	return_shared(auction);
	sui::test_utils::destroy(clock);
    };
    scenario.next_tx(bidder[2]);
    {
	let coin: Coin<SUI> = scenario.take_from_address(bidder[2]);
	assert_eq!(coin.balance().value(), 3 * ONE_SUI);
	scenario.return_to_sender(coin);
    };


    scenario.end();
}
