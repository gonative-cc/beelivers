#[allow(lint(public_random))]
module beelievers_mint::mint {
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
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
    use sui::object::{Self, UID};

    use beelivers_auction::auction::{Self, Auction};

    const TOTAL_SUPPLY: u64 = 6021;
    const MYTHIC_SUPPLY: u64 = 21;
    const NORMAL_SUPPLY: u64 = 6000;
    const NATIVE_MYTHICS: u64 = 10; 

    const ERROR_INSUFFICIENT_SUPPLY: u64 = 1;
    const ERROR_MINTING_NOT_ACTIVE: u64 = 2;
    const ERROR_UNAUTHORIZED: u64 = 3;
    const ERROR_ALREADY_MINTED: u64 = 4;
    const ERROR_INSUFFICIENT_PAYMENT: u64 = 5;
    const ERROR_INVALID_QUANTITY: u64 = 6;
    const ERROR_INVALID_TOKEN_ID: u64 = 7;
    const ERROR_PREMINT_NOT_COMPLETED: u64 = 8;
    const ERROR_NO_MYTHICS_AVAILABLE: u64 = 9;
    const ERROR_INVALID_RANGE: u64 = 10;

    public struct NFTMinted has copy, drop {
        nft_id: object::ID,
        token_id: u64,
        badges: vector<String>,
        minter: address,
    }

    public struct PremintCompleted has copy, drop {
        mythics_minted: u64,
        normals_minted: u64,
        timestamp: u64,
    }

    public struct PartnerAdded has copy, drop {
        address: address,
    }

    public struct AuctionContractUpdated has copy, drop {
        new_contract: address,
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
        total_minted: u64,
        mythic_minted: u64,
        normal_minted: u64,
        available_mythics: vector<u64>, 
        available_normals: vector<u64>,         
        partner_list: Table<address, bool>,
        minted_addresses: Table<address, bool>,
        remaining_partners: u64, 
        premint_completed: bool,
        minting_active: bool,
        mint_start_time: u64,

        treasury_address: address,
        mint_price: u64,
        nft_metadata: Table<u64, VecMap<String, String>>,
        nft_badges: Table<u64, vector<String>>,
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

    fun init(witness: MINT, ctx: &mut TxContext) {
        let publisher = package::claim(witness, ctx);

        let mut collection = BeelieversCollection {
            id: object::new(ctx),
            total_minted: 0,
            mythic_minted: 0,
            normal_minted: 0,
            available_mythics: vector::empty<u64>(),
            available_normals: vector::empty<u64>(),
            premint_completed: false,
            minting_active: false,
            mint_start_time: 0,
            partner_list: table::new<address, bool>(ctx),
            minted_addresses: table::new<address, bool>(ctx),
            remaining_partners: 0, 

            treasury_address: @0xa30212c91b8fea7b494d47709d97be5774eee1e20c3515a88ec5684283b4430b,
            mint_price: 0,
            nft_metadata: table::new<u64, VecMap<String, String>>(ctx),
            nft_badges: table::new<u64, vector<String>>(ctx),
            displayable_badges: table::new<String, bool>(ctx),
            preset_urls: table::new<u64, Url>(ctx)
        };

        let mut mythic_id = 1;
        while (mythic_id <= MYTHIC_SUPPLY) {
            vector::push_back(&mut collection.available_mythics, mythic_id);
            mythic_id = mythic_id + 1;
        };

        let mut normal_id = MYTHIC_SUPPLY + 1;
        while (normal_id <= TOTAL_SUPPLY) {
            vector::push_back(&mut collection.available_normals, normal_id);
            normal_id = normal_id + 1;
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
        badges: vector<String>,
        ctx: &mut TxContext
    ): BeelieverNFT {
        let mut name = string::utf8(b"Beelievers #");
        string::append(&mut name, u64_to_string(token_id));

        let attributes = if (table::contains<u64, VecMap<String, String>>(&collection.nft_metadata, token_id)) {
            *table::borrow<u64, VecMap<String, String>>(&collection.nft_metadata, token_id)
        } else {
            vec_map::empty<String, String>()
        };

        // Get custom URL if it exists, otherwise use default
        let image_url = if (table::contains<u64, Url>(&collection.preset_urls, token_id)) {
            *table::borrow<u64, Url>(&collection.preset_urls, token_id)
        } else {
            let default_url_string = string::utf8(b"");
            url::new_unsafe_from_bytes(*string::as_bytes(&default_url_string))
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

    fun select_random_mythic(
        collection: &mut BeelieversCollection,
        random: &Random,
        ctx: &mut TxContext
    ): u64 {
        assert!(!vector::is_empty(&collection.available_mythics), ERROR_NO_MYTHICS_AVAILABLE);

        let mut generator = random::new_generator(random, ctx);
        let available_length = vector::length(&collection.available_mythics);
        let random_index = (random::generate_u64_in_range(&mut generator, 0, (available_length - 1) as u64)) as u64;

        vector::swap_remove(&mut collection.available_mythics, random_index)
    }

    fun select_random_normal(
        collection: &mut BeelieversCollection,
        random: &Random,
        ctx: &mut TxContext
    ): u64 {
        assert!(!vector::is_empty(&collection.available_normals), ERROR_INSUFFICIENT_SUPPLY);

        let mut generator = random::new_generator(random, ctx);
        let available_length = vector::length(&collection.available_normals);
        let random_index = (random::generate_u64_in_range(&mut generator, 0, (available_length - 1) as u64)) as u64;

        vector::swap_remove(&mut collection.available_normals, random_index)
    }

    fun is_partner(collection: &BeelieversCollection, addr: address): bool {
        table::contains(&collection.partner_list, addr)
    }

    fun has_minted(collection: &BeelieversCollection, addr: address): bool {
        table::contains(&collection.minted_addresses, addr)
    }

    fun roll_for_mythic(
        collection: &BeelieversCollection,
        random: &Random,
        ctx: &mut TxContext
    ): bool {
        let mut generator = random::new_generator(random, ctx);
        
        let remaining_partners = count_remaining_partners(collection);
        let remaining_mythics = vector::length(&collection.available_mythics);
        
        if (remaining_mythics == 0) {
            return false
        };
        
        if (remaining_partners <= remaining_mythics) {
            return true
        };
        
        let roll = random::generate_u64_in_range(&mut generator, 1, remaining_partners + 1);
        roll <= remaining_mythics
    }

    fun count_remaining_partners(collection: &BeelieversCollection): u64 {
        collection.remaining_partners
    }

    public entry fun add_partners(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        partners: vector<address>
    ) {
        let mut i = 0;
        while (i < vector::length(&partners)) {
            let partner = *vector::borrow(&partners, i);
            
            if (!table::contains(&collection.partner_list, partner)) {
                table::add(&mut collection.partner_list, partner, true);
                collection.remaining_partners = collection.remaining_partners + 1;
                
                event::emit(PartnerAdded {
                    address: partner,
                });
            };
            
            i = i + 1;
        };
    }

 

    public entry fun start_minting(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        start_time: u64
    ) {
        assert!(collection.premint_completed, ERROR_PREMINT_NOT_COMPLETED);
        
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

    public entry fun set_mint_price(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        price: u64
    ) {
        collection.mint_price = price;
    }

    public entry fun set_premint_completed(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        completed: bool
    ) {
        collection.premint_completed = completed;
    }

    public entry fun set_nft_badge(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        token_id: u64,
        badge: String
    ) {
        assert!(token_id <= TOTAL_SUPPLY, ERROR_INVALID_TOKEN_ID);

        if (table::contains(&collection.nft_badges, token_id)) {
            let mut badges = *table::borrow(&collection.nft_badges, token_id);
            vector::push_back(&mut badges, badge);
            *table::borrow_mut(&mut collection.nft_badges, token_id) = badges;
        } else {
            let mut badges = vector::empty<String>();
            vector::push_back(&mut badges, badge);
            table::add(&mut collection.nft_badges, token_id, badges);
        };
    }

    public entry fun set_bulk_nft_badges(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        token_ids: vector<u64>,
        badges: vector<vector<String>>
    ) {
        assert!(vector::length(&token_ids) == vector::length(&badges), ERROR_INVALID_QUANTITY);

        let mut index = 0;
        while (index < vector::length(&token_ids)) {
            let token_id = *vector::borrow(&token_ids, index);
            let badge_list = *vector::borrow(&badges, index);
            
            assert!(token_id <= TOTAL_SUPPLY, ERROR_INVALID_TOKEN_ID);

            if (table::contains(&collection.nft_badges, token_id)) {
                let mut existing_badges = *table::borrow(&collection.nft_badges, token_id);
                let mut i = 0;
                while (i < vector::length(&badge_list)) {
                    vector::push_back(&mut existing_badges, *vector::borrow(&badge_list, i));
                    i = i + 1;
                };
                *table::borrow_mut(&mut collection.nft_badges, token_id) = existing_badges;
            } else {
                table::add(&mut collection.nft_badges, token_id, badge_list);
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

    public entry fun add_post_mint_badge(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        token_id: u64,
        badge: String,
    ) {
        assert!(token_id <= TOTAL_SUPPLY, ERROR_INVALID_TOKEN_ID);
        
        // This allows adding new badges to existing ones
        if (table::contains(&collection.nft_badges, token_id)) {
            let mut badges = *table::borrow(&collection.nft_badges, token_id);
            vector::push_back(&mut badges, badge);
            *table::borrow_mut(&mut collection.nft_badges, token_id) = badges;
        } else {
            let mut badges = vector::empty<String>();
            vector::push_back(&mut badges, badge);
            table::add(&mut collection.nft_badges, token_id, badges);
        };
    }

    public entry fun set_nft_url(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        nft_id: u64,
        url_bytes: vector<u8>,
    ) {
        assert!(nft_id > 0 && nft_id <= TOTAL_SUPPLY, ERROR_INVALID_TOKEN_ID);

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
        assert!(vector::length(&nft_ids) == vector::length(&urls), ERROR_INVALID_QUANTITY);

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
        assert!(total_nfts == vector::length(&keys) && total_nfts == vector::length(&values), ERROR_INVALID_QUANTITY);

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
      public entry fun set_nft_attributes(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        nft_id: u64,
        keys: vector<String>,
        values: vector<String>
    ) {
        assert!(nft_id > 0 && nft_id <= TOTAL_SUPPLY, ERROR_INVALID_TOKEN_ID);
        assert!(vector::length(&keys) == vector::length(&values), ERROR_INVALID_QUANTITY);

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

    public entry fun premint_to_native_range(
        _admin_cap: &AdminCap,
        collection: &mut BeelieversCollection,
        transfer_policy: &transfer_policy::TransferPolicy<BeelieverNFT>,
        kiosk: &mut kiosk::Kiosk,
        kiosk_owner_cap: &kiosk::KioskOwnerCap,
        start_id: u64,
        end_id: u64,
        ctx: &mut TxContext
    ) {
        assert!(!collection.premint_completed, ERROR_PREMINT_NOT_COMPLETED);
        assert!(start_id <= end_id, ERROR_INVALID_RANGE);
        assert!(start_id > 0 && end_id <= TOTAL_SUPPLY, ERROR_INVALID_TOKEN_ID);


        let mut current_id = start_id;

        while (current_id <= end_id) {
            let is_mythic = current_id <= 21;
            
            let mythic_cap_reached = collection.mythic_minted >= NATIVE_MYTHICS;
            let normal_cap_reached = collection.normal_minted >= 200;
            
            if ((is_mythic && mythic_cap_reached) || (!is_mythic && normal_cap_reached)) {
                current_id = current_id + 1;
                continue
            };

            let token_id = if (is_mythic) {
                let (exists, index) = vector::index_of(&collection.available_mythics, &current_id);
                assert!(exists, ERROR_INVALID_TOKEN_ID);
                vector::remove(&mut collection.available_mythics, index)
            } else {
                let (exists, index) = vector::index_of(&collection.available_normals, &current_id);
                assert!(exists, ERROR_INVALID_TOKEN_ID);
                vector::remove(&mut collection.available_normals, index)
            };
            
            let badges = if (table::contains(&collection.nft_badges, token_id)) {
                *table::borrow(&collection.nft_badges, token_id)
            } else {
                vector::empty<String>()
            };
            
            let nft = create_nft(collection, token_id, badges, ctx);
            let nft_id = object::id(&nft);

            collection.total_minted = collection.total_minted + 1;

            if (is_mythic) {
                collection.mythic_minted = collection.mythic_minted + 1;
            } else {
                collection.normal_minted = collection.normal_minted + 1;
            };

            kiosk::lock(kiosk, kiosk_owner_cap, transfer_policy, nft);

            event::emit(NFTMinted {
                nft_id,
                token_id,
                badges,
                minter: tx_context::sender(ctx),
            });

            current_id = current_id + 1;
        };

        if (collection.mythic_minted >= NATIVE_MYTHICS && collection.normal_minted >= 200) {
            collection.premint_completed = true;
            
            event::emit(PremintCompleted {
                mythics_minted: collection.mythic_minted,
                normals_minted: collection.normal_minted,
                timestamp: 0,
            });
        };
    }

    public entry fun mint(
        collection: &mut BeelieversCollection,
        payment: Coin<SUI>,
        transfer_policy: &transfer_policy::TransferPolicy<BeelieverNFT>,
        random: &Random,
        clock: &Clock,
        auction: &Auction,
        kiosk: &mut kiosk::Kiosk,
        kiosk_owner_cap: &kiosk::KioskOwnerCap,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        assert!(collection.minting_active, ERROR_MINTING_NOT_ACTIVE);
        assert!(current_time >= collection.mint_start_time, ERROR_MINTING_NOT_ACTIVE);
        assert!(!has_minted(collection, sender), ERROR_ALREADY_MINTED);
        assert!(collection.total_minted < TOTAL_SUPPLY, ERROR_INSUFFICIENT_SUPPLY);
        
        if (collection.mint_price > 0) {
            assert!(coin::value(&payment) >= collection.mint_price, ERROR_INSUFFICIENT_PAYMENT);
        };

        let (is_eligible, is_mythic) = determine_mint_eligibility(collection, sender, random, auction, ctx);
        assert!(is_eligible, ERROR_UNAUTHORIZED);

        let token_id = if (is_mythic) {
            assert!(collection.mythic_minted < MYTHIC_SUPPLY, ERROR_NO_MYTHICS_AVAILABLE);
            select_random_mythic(collection, random, ctx)
        } else {
            // Auction winners try normal first, fall back to mythic if normals are exhausted
            if (vector::is_empty(&collection.available_normals) && !vector::is_empty(&collection.available_mythics)) {
                select_random_mythic(collection, random, ctx)
            } else {
                select_random_normal(collection, random, ctx)
            }
        };

        let badges = if (table::contains(&collection.nft_badges, token_id)) {
            *table::borrow(&collection.nft_badges, token_id)
        } else {
            vector::empty<String>()
        };

        let nft = create_nft(collection, token_id, badges, ctx);
        let nft_id = object::id(&nft);

        collection.total_minted = collection.total_minted + 1;
        if (is_mythic) {
            collection.mythic_minted = collection.mythic_minted + 1;
        } else {
            collection.normal_minted = collection.normal_minted + 1;
        };

        table::add(&mut collection.minted_addresses, sender, true);
        
        if (is_partner(collection, sender)) {
            collection.remaining_partners = collection.remaining_partners - 1;
        };

        kiosk::lock(kiosk, kiosk_owner_cap, transfer_policy, nft);

        event::emit(NFTMinted {
            nft_id,
            token_id,
            badges,
            minter: sender,
        });

        if (collection.mint_price > 0) {
         transfer::public_transfer(payment, collection.treasury_address);
        } else {
         coin::destroy_zero(payment);
        };
    }

    fun determine_mint_eligibility(
        collection: &BeelieversCollection,
        sender: address,
        random: &Random,
        auction: &Auction,
        ctx: &mut TxContext
    ): (bool, bool) {
      
        if (is_partner(collection, sender)) {
            let is_mythic = roll_for_mythic(collection, random, ctx);
            return (true, is_mythic)
        };

        if (auction::is_winner(auction, sender)) {
            return (true, false)
        };
        
        (false, false) 
    }

    public fun get_collection_stats(collection: &BeelieversCollection): (u64, u64, u64, u64, u64) {
        (
            collection.total_minted,
            collection.mythic_minted,
            collection.normal_minted,
            vector::length(&collection.available_mythics),
            vector::length(&collection.available_normals)
        )
    }

    public fun is_partner_public(collection: &BeelieversCollection, addr: address): bool {
        is_partner(collection, addr)
    }

    public fun has_minted_public(collection: &BeelieversCollection, addr: address): bool {
        has_minted(collection, addr)
    }

    public fun get_nft_badges(collection: &BeelieversCollection, token_id: u64): vector<String> {
        if (table::contains(&collection.nft_badges, token_id)) {
            *table::borrow(&collection.nft_badges, token_id)
        } else {
            vector::empty<String>()
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


} 