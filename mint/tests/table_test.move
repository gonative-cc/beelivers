module beelievers_mint::table_test;

use sui::table::{Self, Table};
use sui::test_scenario as ts;

public struct WithTable {
    badges: Table<u64, vector<u32>>,
}

#[test]
fun test_badges_update() {
    let user = @0x10;
    let mut ts = ts::begin(user);
    let mut o = WithTable {
        badges: table::new(ts.ctx()),
    };
    let id = 1;
    ts.next_tx(@0x11);
    {
        o.badges.add(id, vector[1]);
        let existing = table::borrow_mut(&mut o.badges, id);
        existing.push_back(22);
    };

    ts.next_tx(@0x12);
    {
        let badges = o.badges[id];
        assert!(badges == vector[1, 22]);
    };

    sui::test_utils::destroy(o);
    ts.end();
}
