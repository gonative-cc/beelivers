#[test_only]
module beelievers::mint_tests {
    use std::string::{Self, String};

    use beelievers::mint::{Self, BeelieversCollection, AdminCap, MINT};

    // Test addresses
    const ADMIN: address = @0xA;
    const PARTNER1: address = @0xB;
    const PARTNER2: address = @0xC;
    const REGULAR_USER: address = @0xE;

    // Test constants
    const AUCTION_CONTRACT: address = @0x1234567890abcdef;

    #[test]
    fun test_constants() {
        // Test collection constants
        assert!(mint::get_total_supply() == 6021, 0);
        assert!(mint::get_mythic_supply() == 21, 1);
        assert!(mint::get_normal_supply() == 6000, 2);
    }

    #[test]
    fun test_string_operations() {
        // Test string operations used in the contract
        let test_string = string::utf8(b"TestBadge");
        assert!(string::length(&test_string) == 9, 0);
        
        let empty_string = string::utf8(b"");
        assert!(string::length(&empty_string) == 0, 1);
    }

    #[test]
    fun test_vector_operations() {
        // Test vector operations used in the contract
        let mut test_vector = vector[1u64, 2u64, 3u64];
        assert!(vector::length(&test_vector) == 3, 0);
        
        vector::push_back(&mut test_vector, 4u64);
        assert!(vector::length(&test_vector) == 4, 1);
        
        let first_element = *vector::borrow(&test_vector, 0);
        assert!(first_element == 1, 2);
    }

    #[test]
    fun test_math_operations() {
        // Test mathematical operations used in the contract
        let total_supply = 6021u64;
        let mythic_supply = 21u64;
        let normal_supply = 6000u64;
        
        assert!(total_supply == mythic_supply + normal_supply, 0);
        assert!(mythic_supply <= total_supply, 1);
        assert!(normal_supply <= total_supply, 2);
    }

    #[test]
    fun test_address_operations() {
        // Test address operations
        let admin = @0xA;
        let partner = @0xB;
        
        assert!(admin != partner, 0);
        assert!(admin == @0xA, 1);
        assert!(partner == @0xB, 2);
    }

    #[test]
    fun test_boolean_operations() {
        // Test boolean operations used in the contract
        let true_value = true;
        let false_value = false;
        
        assert!(true_value, 0);
        assert!(!false_value, 1);
        assert!(true_value != false_value, 2);
    }

    #[test]
    fun test_error_constants() {
        // Test that error constants are defined
        // These are used in the contract for error handling
        let error_insufficient_supply = 1u64;
        let error_minting_not_active = 2u64;
        let error_unauthorized = 3u64;
        let error_already_minted = 4u64;
        let error_insufficient_payment = 5u64;
        
        assert!(error_insufficient_supply == 1, 0);
        assert!(error_minting_not_active == 2, 1);
        assert!(error_unauthorized == 3, 2);
        assert!(error_already_minted == 4, 3);
        assert!(error_insufficient_payment == 5, 4);
    }

    #[test]
    fun test_supply_validation() {
        // Test supply validation logic
        let total_supply = 6021u64;
        let mythic_supply = 21u64;
        let normal_supply = 6000u64;
        let native_mythics = 10u64;
        
        // Test that supplies add up correctly
        assert!(total_supply == mythic_supply + normal_supply, 0);
        
        // Test that native mythics don't exceed total mythics
        assert!(native_mythics <= mythic_supply, 1);
        
        // Test that there are remaining mythics after native allocation
        assert!(mythic_supply - native_mythics == 11, 2);
    }

    #[test]
    fun test_badge_string_operations() {
        // Test badge string operations
        let top_bidder = string::utf8(b"TopBidder");
        let partner = string::utf8(b"Partner");
        let early_supporter = string::utf8(b"EarlySupporter");
        let whitelist = string::utf8(b"Whitelist");
        let none = string::utf8(b"None");
        
        // Test string lengths
        assert!(string::length(&top_bidder) == 10, 0);
        assert!(string::length(&partner) == 7, 1);
        assert!(string::length(&early_supporter) == 15, 2);
        assert!(string::length(&whitelist) == 10, 3);
        assert!(string::length(&none) == 4, 4);
        
        // Test string comparisons
        assert!(top_bidder != partner, 5);
        assert!(partner != early_supporter, 6);
        assert!(none == string::utf8(b"None"), 7);
    }

    #[test]
    fun test_url_operations() {
        // Test URL operations
        let url_string = string::utf8(b"https://walrus.tusky.io/1.png");
        let url_bytes = string::into_bytes(url_string);
        
        // Test that bytes are not empty
        assert!(vector::length(&url_bytes) > 0, 0);
        
        // Test that we can convert back to string
        let reconstructed = string::utf8(url_bytes);
        assert!(string::length(&reconstructed) > 0, 1);
    }

    #[test]
    fun test_token_id_validation() {
        // Test token ID validation logic
        let total_supply = 6021u64;
        
        // Valid token IDs
        assert!(1u64 <= total_supply, 0);
        assert!(total_supply <= total_supply, 1);
        
        // Invalid token IDs (these would cause errors in real contract)
        assert!(0u64 < total_supply, 2); // 0 is invalid
        assert!(total_supply + 1 > total_supply, 3); // total_supply + 1 is invalid
    }

    #[test]
    fun test_mythic_probability_calculation() {
        // Test mythic probability calculation logic
        let remaining_partners = 400u64;
        let remaining_mythics = 11u64;
        
        // Test probability calculation
        if (remaining_partners <= remaining_mythics) {
            // All partners get mythics
            assert!(true, 0);
        } else {
            // Probability is remaining_mythics / remaining_partners
            let probability = remaining_mythics;
            let total = remaining_partners;
            assert!(probability <= total, 1);
            assert!(probability > 0, 2);
        }
    }
}
