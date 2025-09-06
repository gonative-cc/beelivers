#[test_only]
module beelievers_mint::mint_tokens_tests;

use beelievers_mint::mint::{
    Self,
    MINT,
    witness_for_test,
    init_for_testing,
    AdminCap,
    BeelieverNFT,
    premint_to_native,
    NFTMinted,
    mint
};
use beelivers_auction::auction::{Self, Auction, create, create_admin_cap};
use std::debug;
use std::unit_test::{assert_eq, assert_ref_eq};
use sui::event::events_by_type;
use sui::random::{create_for_testing, Random};
use sui::test_scenario::{Self, return_shared, Scenario, next_tx, return_to_address};
use sui::transfer_policy;

const ADMIN: address = @0x1001;
const MINER: address = @0x1002;

#[test_only]
fun create_auction_for_testing(mut scenario: Scenario): Scenario {
    scenario.next_tx(ADMIN);
    let admin = create_admin_cap(scenario.ctx());
    let clock = sui::clock::create_for_testing(scenario.ctx());
    create(&admin, 10000_000, 10000_000, 5810, &clock, scenario.ctx());
    sui::test_utils::destroy(clock);
    sui::test_utils::destroy(admin);
    scenario
}

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

        // Mint mythic token
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

        assert_eq!(kiosk.item_count(), 211);

        let mut mythic_count = 0;
        minted_events.do!(|mint_event| {
            assert_eq!(kiosk.is_locked(mint_event.nft_id()), true);
            if (mint_event.token_id() <= 21) {
                mythic_count = mythic_count + 1;
            }
        });

        assert_eq!(mythic_count, 11);
        return_shared(kiosk);
    };

    scenario = create_auction_for_testing(scenario);

    let v = 5810;

    scenario.next_tx(ADMIN);
    {
        let admin_cap: AdminCap = scenario.take_from_address(ADMIN);
        let mut auction: Auction = scenario.take_shared();
        let mut c: mint::BeelieversCollection = scenario.take_shared();

        auction.set_winners(vector::tabulate!(v, |i| i as u256).map!(
            |addr| sui::address::from_u256(addr),
        ));
        c.set_auction(object::id(&auction).to_address());
        admin_cap.add_mythic_eligible(
            &mut c,
            vector::tabulate!(2750, |i| i as u256).map!(|addr| sui::address::from_u256(addr)),
        );
        admin_cap.start_minting(&mut c, 0);
        return_shared(c);
        return_shared(auction);
        return_to_address(ADMIN, admin_cap);
    };

    let result = vector::tabulate!(5810, |i| i as u256).map!(|minter| {
        let minter_addr: address = sui::address::from_u256(minter);
        scenario.next_tx(minter_addr);
        scenario.next_tx(minter_addr);
        {
            let mut c: mint::BeelieversCollection = scenario.take_shared();
            let (mut kiosk, kiosk_cap) = sui::kiosk::new(scenario.ctx());
            let tp: transfer_policy::TransferPolicy<BeelieverNFT> = scenario.take_shared();
            let r: Random = scenario.take_shared();
            let clock = sui::clock::create_for_testing(scenario.ctx());
            let auction: Auction = scenario.take_shared();

            c.mint(&tp, &r, &clock, &auction, &mut kiosk, &kiosk_cap, scenario.ctx());

            return_shared(c);
            return_shared(r);
            return_shared(tp);
            return_shared(auction);

            sui::test_utils::destroy(clock);
            sui::test_utils::destroy(kiosk);
            sui::test_utils::destroy(kiosk_cap);
            let events = events_by_type<NFTMinted>();
            assert_eq!(events.length(), 1);
            events[0]
        }
    });

    assert_eq!(result.length(), v);
    let mc = result.count!(|token_event| { token_event.token_id() <= 21 });
    assert_eq!(mc, 10);

    let mut ids = sui::table::new<u16, bool>(scenario.ctx());
    result.do!(|t| {
        ids.add(t.token_id(), true)
    });

    minted_events.do!(|t| {
        ids.add(t.token_id(), true)
    });

    sui::test_utils::destroy(ids);
    scenario.end();
}
