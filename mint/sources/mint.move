//@author - null
#[allow(lint(public_random))]
module beelievers_mint::mint {
    use sui::clock::{Self, Clock};
    use sui::package;
    use sui::display;
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::{Self, String};
    use sui::url::{Self, Url};
    use sui::random::{Self, Random};
    use sui::transfer_policy;
    use sui::kiosk;
    use sui::vec_map::{Self, VecMap};

    use beelivers_auction::auction::{Self, Auction};

    const TOTAL_SUPPLY: u64 = 6021;
    const MYTHIC_SUPPLY: u64 = 21;
    const NORMAL_SUPPLY: u64 = 6000;
    const NATIVE_MYTHICS: u64 = 10;
    const NATIVE_NORMALS: u64 = 200;

    const EInsufficientSupply: u64 = 1;
    const EMintingNotActive: u64 = 2;
    const EUnauthorized: u64 = 3;
    const EAlreadyMinted: u64 = 4;
    const EInvalidQuantity: u64 = 6;
    const EInvalidTokenId: u64 = 7;
    const EPremintNotCompleted: u64 = 8;
    const EPremintAlreadyCompleted: u64 = 9;
    const EWrongAuctionContract: u64 = 10;
    const EPostMintNotActive: u64 = 11;
    const EInvalidIndex: u64 = 12;

    public struct NFTMinted has copy, drop {
        nft_id: object::ID,
        token_id: u64,
        minter: address,
    }

    public struct MintingStarted has copy, drop {
        timestamp: u64,
    }

    public struct MINT has drop {}

    public struct AdminCap has key, store {
        id: UID,
    }

    public struct BeelieversCollection has key {
        id: UID,
        /// Unix time in ms, when admin can claim not minted tokens back to the treasury.
        postmint_start: u64,
        remaining_mythic: u64,
        remaining_supply: u64,
        // vector values make a list nfts that are remaining to mint.
        // each time we mint an NFT, we probe it from a specific index:
        //   token_id = remaining_nfts[probe],
        // and then swap that element in the vector with the last element and remove the last
        // element to effectively remove that nft id from available nfts.
        remaining_nfts: vector<u64>,
        mythic_eligible_list: Table<address, bool>,
        minted_addresses: Table<address, bool>,
        // amount of remaining addresses eligible to mint a mythic nft
        remaining_mythic_eligible: u64,
        premint_completed: bool,
        minting_active: bool,
        mint_start_time: u64,
        auction_contract: address,
        treasury_address: address,
        nft_metadata: Table<u64, VecMap<String, String>>,
        minter_badges: Table<address, vector<u64>>,
        // REVIEW: since this is a small list (only 21 entries), it should be vector.
        badge_names: Table<u64, String>,
        displayable_badges: Table<String, bool>,
        preset_urls: Table<u64, Url>,
    }

    public struct BeelieverNFT has store, key {
        id: UID,
        name: String,
        image_url: Url,
        attributes: VecMap<String, String>,
        token_id: u64,
        badges: vector<String>,
    }

    #[allow(lint(share_owned))]
    fun init(witness: MINT, ctx: &mut TxContext) {
        let publisher = package::claim(witness, ctx);

        let collection = BeelieversCollection {
            id: object::new(ctx),
            postmint_start: 1760054400000, // October 10, 2025 00:00:00 UTC.
            remaining_supply: TOTAL_SUPPLY,
            remaining_mythic: MYTHIC_SUPPLY,
            remaining_nfts: vector::tabulate!(TOTAL_SUPPLY+1, |i| i),
            premint_completed: false,
            minting_active: false,
            mint_start_time: 0,
            mythic_eligible_list: table::new<address, bool>(ctx),
            minted_addresses: table::new<address, bool>(ctx),
            remaining_mythic_eligible: 0, 
            auction_contract: @beelivers_auction,
            treasury_address: @treasury_address,
            nft_metadata: table::new<u64, VecMap<String, String>>(ctx),
            minter_badges: table::new<address, vector<u64>>(ctx),
            badge_names: table::new<u64, String>(ctx),
            displayable_badges: table::new<String, bool>(ctx),
            preset_urls: table::new<u64, Url>(ctx)
        };

        let _admin_cap = AdminCap { id: object::new(ctx) };

        let mut nft_display = display::new<BeelieverNFT>(&publisher, ctx);
        display::add(&mut nft_display, string::utf8(b"name"), string::utf8(b"{name}"));
        display::add(&mut nft_display, string::utf8(b"description"), string::utf8(b"BTCFi Beelievers is more than an NFT- it's a movement to make Bitcoin work in DeFi without bridges, wrappers, or custodians. The Beeliever NFT is your badge of conviction, fueling Native's nBTC and BYield on Sui."));
        display::add(&mut nft_display, string::utf8(b"image_url"), string::utf8(b"https://walrus.tusky.io/{image_url}"));
        display::add(&mut nft_display, string::utf8(b"attributes"), string::utf8(b"{attributes}"));
        display::add(&mut nft_display, string::utf8(b"badges"), string::utf8(b"{badges}"));
        display::update_version(&mut nft_display);

        let (transfer_policy, transfer_policy_cap) = transfer_policy::new<BeelieverNFT>(&publisher, ctx);

        transfer::transfer(_admin_cap, tx_context::sender(ctx));
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(nft_display, tx_context::sender(ctx));
        transfer::public_transfer(transfer_policy_cap, tx_context::sender(ctx));
        transfer::public_share_object(transfer_policy);
        transfer::share_object(collection);
    }


    fun create_nft(
        collection: &BeelieversCollection,
        token_id: u64,
        minter: address,
        ctx: &mut TxContext
    ): BeelieverNFT {
        let mut name = string::utf8(b"Beelievers #");
        string::append(&mut name, u64_to_string(token_id));
        

        let attributes = if (table::contains<u64, VecMap<String, String>>(&collection.nft_metadata, token_id)) {
            *table::borrow<u64, VecMap<String, String>>(&collection.nft_metadata, token_id)
        } else {
            vec_map::empty<String, String>()
        };

        let image_url = if (table::contains<u64, Url>(&collection.preset_urls, token_id)) {
            *table::borrow<u64, Url>(&collection.preset_urls, token_id)
        } else {
            let default_url_string = string::utf8(b"");
            url::new_unsafe_from_bytes(*string::as_bytes(&default_url_string))
        };

        let badge_numbers = if (table::contains<address, vector<u64>>(&collection.minter_badges, minter)) {
            *table::borrow<address, vector<u64>>(&collection.minter_badges, minter)
        } else {
            vector::empty<u64>()
        };

        let mut badges = vector::empty<String>();
        let mut i = 0;
        while (i < vector::length(&badge_numbers)) {
            let badge_num = *vector::borrow(&badge_numbers, i);
            let badge_name = badge_number_to_name(collection, badge_num);
            vector::push_back(&mut badges, badge_name);
            i = i + 1;
        };

        BeelieverNFT {
            id: object::new(ctx),
            name,
            image_url,
            attributes,
            token_id,
            badges,
        }
    }

    fun badge_number_to_name(collection: &BeelieversCollection, badge_num: u64): String {
        if (table::contains(&collection.badge_names, badge_num)) {
            *table::borrow(&collection.badge_names, badge_num)
        } else {
            string::utf8(b"unknown_badge")
        }
    }

    // REVIEW: should use string method
    fun u64_to_string(value: u64): String {
        if (value == 0) {
            return string::utf8(b"0")
        };

        let mut buffer = vector::empty<u8>();
        let mut temp_value = value;

        while (temp_value != 0) {
            vector::push_back(&mut buffer, ((temp_value % 10 + 48) as u8));
            temp_value = temp_value / 10;
        };

        vector::reverse(&mut buffer);
        string::utf8(buffer)
    }

    // REVIEW: should be called before minting
    public entry fun add_mythic_eligible(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        mythic_eligible: vector<address>
    ) {
        let mut i = 0;
        while (i < vector::length(&mythic_eligible)) {
            let eligible = *vector::borrow(&mythic_eligible, i);
            
            if (!table::contains(&collection.mythic_eligible_list, eligible)) {
                table::add(&mut collection.mythic_eligible_list, eligible, true);
                collection.remaining_mythic_eligible = collection.remaining_mythic_eligible + 1;
            };
            
            i = i + 1;
        };
    }


    public entry fun start_minting(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        start_time: u64
    ) {
        assert!(collection.premint_completed, EPremintNotCompleted);
        
        collection.minting_active = true;
        collection.mint_start_time = start_time;

        event::emit(MintingStarted {
            timestamp: collection.mint_start_time,
        });
    }

    public entry fun pause_minting(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection
    ) {
        collection.minting_active = false;
    }

    public entry fun set_treasury(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        treasury_address: address
    ) {
        collection.treasury_address = treasury_address;
    }

    public entry fun set_premint_completed(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        completed: bool
    ) {
        collection.premint_completed = completed;
    }

    public entry fun set_bulk_minter_badges(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        addresses: vector<address>,
        badges: vector<vector<u64>>
    ) {
        assert!(vector::length(&addresses) == vector::length(&badges), EInvalidQuantity);

        let mut index = 0;
        while (index < vector::length(&addresses)) {
            let addr = *vector::borrow(&addresses, index);
            let badge_list = *vector::borrow(&badges, index);

            if (table::contains(&collection.minter_badges, addr)) {
                let mut existing_badges = *table::borrow(&collection.minter_badges, addr);
                let mut i = 0;
                while (i < vector::length(&badge_list)) {
                    vector::push_back(&mut existing_badges, *vector::borrow(&badge_list, i));
                    i = i + 1;
                };
                *table::borrow_mut(&mut collection.minter_badges, addr) = existing_badges;
            } else {
                table::add(&mut collection.minter_badges, addr, badge_list);
            };
            
            index = index + 1;
        };
    }

    public entry fun set_bulk_badge_names(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        badge_ids: vector<u64>,
        badge_names: vector<String>
    ) {
        assert!(vector::length(&badge_ids) == vector::length(&badge_names), EInvalidQuantity);

        let mut index = 0;
        while (index < vector::length(&badge_ids)) {
            let badge_id = *vector::borrow(&badge_ids, index);
            let badge_name = *vector::borrow(&badge_names, index);
            
            if (table::contains(&collection.badge_names, badge_id)) {
                *table::borrow_mut(&mut collection.badge_names, badge_id) = badge_name;
            } else {
                table::add(&mut collection.badge_names, badge_id, badge_name);
            };
            
            index = index + 1;
        };
    }

    public entry fun set_badge_displayable(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        badge_name: String,
        displayable: bool,
    ) {
        if (table::contains(&collection.displayable_badges, badge_name)) {
            *table::borrow_mut(&mut collection.displayable_badges, badge_name) = displayable;
        } else {
            table::add(&mut collection.displayable_badges, badge_name, displayable);
        };
    }

    public entry fun add_post_mint_minter_badge(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        addr: address,
        badge: u64,
    ) {
        if (table::contains(&collection.minter_badges, addr)) {
            let mut badges = *table::borrow(&collection.minter_badges, addr);
            vector::push_back(&mut badges, badge);
            *table::borrow_mut(&mut collection.minter_badges, addr) = badges;
        } else {
            let mut badges = vector::empty<u64>();
            vector::push_back(&mut badges, badge);
            table::add(&mut collection.minter_badges, addr, badges);
        };
    }

    public entry fun set_nft_url(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        nft_id: u64,
        url_bytes: vector<u8>,
    ) {
        assert!(nft_id > 0 && nft_id <= TOTAL_SUPPLY, EInvalidTokenId);

        let nft_url = url::new_unsafe_from_bytes(url_bytes);

        if (table::contains(&collection.preset_urls, nft_id)) {
            *table::borrow_mut(&mut collection.preset_urls, nft_id) = nft_url;
        } else {
            table::add(&mut collection.preset_urls, nft_id, nft_url);
        };
    }

    public entry fun set_bulk_nft_urls(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        nft_ids: vector<u64>,
        urls: vector<vector<u8>>
    ) {
        assert!(vector::length(&nft_ids) == vector::length(&urls), EInvalidQuantity);

        let mut index = 0;
        while (index < vector::length(&nft_ids)) {
            set_nft_url(
                _admin_cap,
                collection,
                *vector::borrow(&nft_ids, index),
                *vector::borrow(&urls, index)
            );
            index = index + 1;
        };
    }
      public entry fun set_bulk_nft_attributes(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        nft_ids: vector<u64>,
        keys: vector<vector<String>>,
        values: vector<vector<String>>
    ) {
        let total_nfts = vector::length(&nft_ids);
        assert!(total_nfts == vector::length(&keys) && total_nfts == vector::length(&values), EInvalidQuantity);

        let mut index = 0;
        while (index < total_nfts) {
            set_nft_attributes(
                _admin_cap,
                collection,
                *vector::borrow(&nft_ids, index),
                *vector::borrow(&keys, index),
                *vector::borrow(&values, index)
            );
            index = index + 1;
        };
    }

    /// sets attributes (metadata) for a given NFT. keys and values are lists that makes the
    /// key -> value mapping and has to have the same size.
    /// NOTE: It overwrites the previous set of attributes.
    public entry fun set_nft_attributes(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        nft_id: u64,
        keys: vector<String>,
        values: vector<String>
    ) {
        assert!(nft_id > 0 && nft_id <= TOTAL_SUPPLY, EInvalidTokenId);
        assert!(vector::length(&keys) == vector::length(&values), EInvalidQuantity);

        let mut attributes_map = vec_map::empty<String, String>();
        let mut index = 0;

        while (index < vector::length(&keys)) {
            vec_map::insert(
                &mut attributes_map,
                *vector::borrow(&keys, index),
                *vector::borrow(&values, index)
            );
            index = index + 1;
        };

        if (table::contains(&collection.nft_metadata, nft_id)) {
            *table::borrow_mut(&mut collection.nft_metadata, nft_id) = attributes_map;
        } else {
            table::add(&mut collection.nft_metadata, nft_id, attributes_map);
        };
    }

    // TODO: needs an ability to add new badges in the future, without overwriting.

    // mints an NFT for the ctx sender
    fun mint_for_sender(
        collection: &mut BeelieversCollection,
        probe_idx: u64,
        transfer_policy: &transfer_policy::TransferPolicy<BeelieverNFT>,
        kiosk: &mut kiosk::Kiosk,
        kiosk_owner_cap: &kiosk::KioskOwnerCap,
        ctx: &mut TxContext
    ) {
        let recipient = tx_context::sender(ctx);
        let token_id = collection.remaining_nfts.swap_remove(probe_idx);
        let nft = collection.create_nft(token_id, recipient, ctx);

        collection.remaining_supply = collection.remaining_supply - 1;
        let is_mythic = token_id <= MYTHIC_SUPPLY;
        if (is_mythic) {
            collection.remaining_mythic = collection.remaining_mythic - 1;
        };

        event::emit(NFTMinted {
            nft_id: object::id(&nft),
            token_id,
            // NOTE: technically this is the AdminCap owner
            // REVIEW: do we need it? Event already contains sender info.
            minter: recipient,
        });

        kiosk::lock(kiosk, kiosk_owner_cap, transfer_policy, nft);
    }

    /// Mints (end_id - start_id + 1) NFTs to the
    public entry fun premint_to_native(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        tp: &transfer_policy::TransferPolicy<BeelieverNFT>,
        kiosk: &mut kiosk::Kiosk,
        kiosk_cap: &kiosk::KioskOwnerCap,
        r: &Random,
        ctx: &mut TxContext
    ) {
        assert!(!collection.premint_completed, EPremintAlreadyCompleted);
        let mut g = r.new_generator(ctx);

        // mint NATIVE_MYTHICS to the treasury
        let mut i = 1;
        while (i <= NATIVE_MYTHICS ) {
            // NOTE: token_id starts from 1, and our remaining mapping also starts from idx 1.
            let probe = g.generate_u64_in_range(1, collection.remaining_mythic);
            collection.mint_for_sender(probe, tp, kiosk, kiosk_cap, ctx);
            i = i+1;
        };

        // mint NATIVE_NORMALS to the treasury
        i = 1;
        let start_normal = collection.remaining_mythic+1;
        while (i <= NATIVE_NORMALS ) {
            let probe = g.generate_u64_in_range(start_normal, collection.remaining_supply);
            collection.mint_for_sender(probe, tp, kiosk, kiosk_cap, ctx);
            i = i+1;
        };

        collection.premint_completed = true;
    }

    /// Allows admint to claim not minted NFTs to the admin treasury.
    /// `num` is the amount of NFTs admin will try to claim. Claim wil start from the last index
    /// in the `remaining_nfts` and keep poping from the end.
    public fun postmint_to_native(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        num: u64,
        tp: &transfer_policy::TransferPolicy<BeelieverNFT>,
        kiosk: &mut kiosk::Kiosk,
        kiosk_cap: &kiosk::KioskOwnerCap,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(collection.postmint_start >= current_time, EPostMintNotActive);
        assert!(num <= collection.remaining_supply, EInvalidIndex);

        let mut i = 0;
        while (i < num) {
            let probe = collection.remaining_supply;
            collection.mint_for_sender(probe, tp, kiosk, kiosk_cap, ctx);
            i = i+1;
        };
    }

    public entry fun mint(
        collection: &mut BeelieversCollection,
        transfer_policy: &transfer_policy::TransferPolicy<BeelieverNFT>,
        // REVIEW: standard objects should be at the end (so Auction should be before random etc...)
        random: &Random,
        clock: &Clock,
        auction: &Auction,
        kiosk: &mut kiosk::Kiosk,
        kiosk_owner_cap: &kiosk::KioskOwnerCap,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        assert!(collection.minting_active, EMintingNotActive);
        assert!(current_time >= collection.mint_start_time, EMintingNotActive);
        assert!(!has_minted(collection, sender), EAlreadyMinted);
        assert!(collection.remaining_supply > 0, EInsufficientSupply);
        assert!(object::id(auction).to_address() == collection.auction_contract, EWrongAuctionContract);

        let (is_eligible, can_mythic) = collection.determine_mint_eligibility(sender, auction);
        assert!(is_eligible, EUnauthorized);

        let remaining_mythic = collection.remaining_mythic;
        let start = if (can_mythic) 1 else remaining_mythic+1;
        // we need to make sure that mythics will be all minted to eligible users
        // so if number of eligible users gets to the remining mythics, we assure that
        // they mint mythic
        let end = if (can_mythic && remaining_mythic <= collection.remaining_mythic_eligible)
            remaining_mythic else collection.remaining_supply;
        let probe = random.new_generator(ctx).generate_u64_in_range(start, end);
        collection.mint_for_sender(probe, transfer_policy, kiosk, kiosk_owner_cap, ctx);

        collection.minted_addresses.add(sender, true);
        if (can_mythic)
            collection.remaining_mythic_eligible = collection.remaining_mythic_eligible - 1;
    }

    /// returns (is_auction_winner, can_mint_mythic)
    fun determine_mint_eligibility(
        collection: &BeelieversCollection,
        sender: address,
        auction: &Auction,
    ): (bool, bool) {
      
        if (is_mythic_eligible(collection, sender)) {
            return (true, true)
        };

        (auction::is_winner(auction, sender), false)
    }

    /// returns: (total_minted, mythic_minted, normal_minted)
    public fun get_collection_stats(c: &BeelieversCollection): (u64, u64, u64) {
        let total_minted = TOTAL_SUPPLY - c.remaining_supply;
        let mythic_minted = MYTHIC_SUPPLY - c.remaining_mythic;
        (total_minted, mythic_minted, total_minted - mythic_minted)
    }

    public fun is_mythic_eligible(collection: &BeelieversCollection, addr: address): bool {
        table::contains(&collection.mythic_eligible_list, addr)
    }

    public fun has_minted(collection: &BeelieversCollection, addr: address): bool {
        table::contains(&collection.minted_addresses, addr)
    }

    public fun get_minter_badges(collection: &BeelieversCollection, addr: address): vector<u64> {
        if (table::contains(&collection.minter_badges, addr)) {
            *table::borrow(&collection.minter_badges, addr)
        } else {
            vector::empty<u64>()
        }
    }

    public fun get_badge_name(collection: &BeelieversCollection, badge_id: u64): String {
        if (table::contains(&collection.badge_names, badge_id)) {
            *table::borrow(&collection.badge_names, badge_id)
        } else {
            string::utf8(b"unknown_badge")
        }
    }

    public fun is_badge_displayable(collection: &BeelieversCollection, badge_name: String): bool {
        if (table::contains(&collection.displayable_badges, badge_name)) {
            *table::borrow(&collection.displayable_badges, badge_name)
        } else {
            false 
        }
    }

    public fun get_total_supply(): u64 { TOTAL_SUPPLY }

    public fun get_mythic_supply(): u64 { MYTHIC_SUPPLY }

    public fun get_normal_supply(): u64 { NORMAL_SUPPLY }

    public fun is_premint_completed(collection: &BeelieversCollection): bool {
        collection.premint_completed
    }

    public fun is_minting_active(collection: &BeelieversCollection): bool {
        collection.minting_active
    }

    public fun is_minting_active_with_time(collection: &BeelieversCollection, clock: &Clock): bool {
        let current_time = clock::timestamp_ms(clock);
        collection.minting_active && current_time >= collection.mint_start_time
    }

    public fun get_mint_start_time(collection: &BeelieversCollection): u64 {
        collection.mint_start_time
    }


    //
    // Helper functions
    //

    /// creates a boolean vector of size `size` with all elements set to false.
    public fun create_boolean_vector(size: u64, val: bool): vector<bool> {
        vector::tabulate!(size, |_| val)
    }

    //
    // TESTS
    //

    #[test]
    fun test_create_boolean_vector() {
        let vec = create_boolean_vector(21, false);
        assert!(vector::length(&vec) == 21, 0);
        let mut i = 0;
        while (i < 21) {
            assert!(vec[i] == false);
            i = i + 1;
        };

        let vec = create_boolean_vector(5, true);
        assert!(vector::length(&vec) == 5, 0);
        i = 0;
        while (i < 5) {
            assert!(vec[i]);
            i = i + 1;
        };
    }
}
