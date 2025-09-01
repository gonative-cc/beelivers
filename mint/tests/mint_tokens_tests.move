#[test_only]
module beelievers_mint::mint_tokens_tests;

use beelievers_mint::mint::{Self, MINT, witness_for_test, init_for_testing, AdminCap, BeelieverNFT, premint_to_native, NFTMinted};
use sui::test_scenario::{Self, return_shared, Scenario, next_tx};
use sui::transfer_policy;
use sui::random::{create_for_testing, Random};
use std::unit_test::{assert_eq, assert_ref_eq};
use sui::event::events_by_type;

#[test_only]
public struct Auction has key, store{
    id: UID,
    winners: vector<address>
}

#[test_only]
public fun is_winner(auction: &Auction, addr: address): bool {
    auction.winners.contains(&addr)
}

const ADMIN: address = @0x1001;

#[test]
fun premint_for_native_happy_test_cases() {
    let mut scenario = test_scenario::begin(ADMIN);
    let witness = witness_for_test();
    init_for_testing(witness, scenario.ctx());

    scenario.next_tx(@0x0);
    sui::random::create_for_testing(scenario.ctx());


    scenario.next_tx(ADMIN);
    let minted_events: vector<NFTMinted> = {
	let admin_cap: AdminCap = scenario.take_from_address(ADMIN);
	let mut c: mint::BeelieversCollection = scenario.take_shared();
	let (mut kiosk, kiosk_cap) = sui::kiosk::new(scenario.ctx());
	let tp: transfer_policy::TransferPolicy<BeelieverNFT> = scenario.take_shared();
	let r: Random = scenario.take_shared();

	// 10 mythic token
	premint_to_native(&admin_cap, &mut c, &tp, &mut kiosk, &kiosk_cap, &r, scenario.ctx());

	scenario.return_to_sender(admin_cap);
	return_shared(c);
	return_shared(r);
	return_shared(tp);
	sui::transfer::public_share_object(kiosk);
	sui::transfer::public_transfer(kiosk_cap, ADMIN);
	events_by_type<NFTMinted>()
    };


    scenario.next_tx(ADMIN);
    {
	let kiosk: sui::kiosk::Kiosk = scenario.take_shared();


	assert_eq!(kiosk.item_count(), 210);
	let mut mythic_count = 0;

	minted_events.do!(|mint_event| {
	    assert_eq!(kiosk.is_locked(mint_event.nft_id()), true);
	    if (mint_event.token_id() <= 21) {
		mythic_count = mythic_count + 1;
	    }
	});

	assert_eq!(mythic_count, 10);

	return_shared(kiosk);
    };
    scenario.end();
}
