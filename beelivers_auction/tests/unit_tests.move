#[test_only]
module beelivers_auction::unit_tests;

use beelivers_auction::auction::{Self, Auction, AdminCap};
use sui::address;
use sui::clock::{Self, Clock};
use sui::random::{Self, Random};
use sui::test_scenario as ts;

const ONE_HOUR: u64 = 60 * 60 *1000;

// fun dummy_tx(sender: address, time_ms: u64): TxContext {
//     tx_context::new_from_hint(sender, 1, 1, time_ms, 0)
// }

/// creates test objects. Auction start == one_hour, duration=one hour, size = 100
/// and after setup, sets current timestamp = acution.start;
fun create_for_test(ctx: &mut TxContext): (Clock, AdminCap, Auction) {
    let mut c = clock::create_for_testing(ctx);
    let ac = auction::create_admin_cap(ctx);
    let a = auction::create_(&ac, ONE_HOUR, ONE_HOUR, 100, &c, ctx);
    c.set_for_testing(ONE_HOUR);
    (c, ac, a)
}

public(package) fun cleanup(a: Auction, ac: AdminCap, c: Clock) {
    sui::test_utils::destroy(a);
    sui::test_utils::destroy(ac);
    c.destroy_for_testing();
}

public(package) fun gen_addresses(num: u32): vector<address> {
    let mut a: u256 = 16;
    let max: u256 = a + (num as u256);
    let mut addrs = vector::empty();
    while (a < max) {
        addrs.push_back(address::from_u256(a));
        a = a + 1;
    };
    addrs
}

#[test]
fun test_raffle() {
    // let mut ctx = dummy_tx(@0x1, 1);
    let admin = @0x0;
    let mut ts = ts::begin(admin);
    let (clock, ac, mut a) = create_for_test(ts.ctx());
    a.set_winners(gen_addresses(100));

    // note: ts sender must be admin (0x0) to create abort
    random::create_for_testing(ts.ctx());
    ts.next_tx(admin);
    let rng: Random = ts.take_shared();
    let raffle_winners = a.run_raffle(&ac, 3, &rng, ts.ctx());
    assert!(raffle_winners.length() == 3);

    cleanup(a, ac, clock);
    ts::return_shared(rng);
    ts.end();
}
