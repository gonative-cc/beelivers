// SPDX-License-Identifier: Apache-2.0

/// Non transferrable NFT, used to activate users for the auction.
/// Code based on: https://docs.sui.io/guides/developer/nft/nft-soulbound
module beelivers_auction::nft;

use std::string;
use sui::event;
use sui::package::Publisher;
use sui::url::{Self, Url};

// ========== Errors ==========
const ENotAuthorized: u64 = 1;

// ========== Structs ==========

/// Whitelist NFT for Beelievers
/// The `store` ablity is remove to prevent transfers.
public struct WlNFT has key {
    id: UID,
    /// Name for the token
    name: string::String,
    /// Description of the token
    description: string::String,
    /// URL for the token
    image_url: Url,
}

/// The OTW for the module.
public struct NFT has drop {}

fun init(otw: NFT, ctx: &mut TxContext) {
    // Claim the Publisher object.
    let publisher: Publisher = sui::package::claim(otw, ctx);
    transfer::public_transfer(publisher, ctx.sender())
}

// ===== Events =====

public struct NFTMinted has copy, drop {
    object_id: ID,
    name: string::String,
    // TODO: can we rename this to "recipient"?
    creator: address,
}

// ===== Public view functions =====

public fun name(nft: &WlNFT): &string::String {
    &nft.name
}

public fun description(nft: &WlNFT): &string::String {
    &nft.description
}

public fun image_url(nft: &WlNFT): &Url {
    &nft.image_url
}

// ===== Entrypoints and functions =====

/// Create a new devnet_nft
public fun mint_many(cap: &Publisher, recipients: vector<address>, ctx: &mut TxContext) {
    assert!(cap.from_module<WlNFT>(), ENotAuthorized);
    let mut i = 0;
    while (i < vector::length(&recipients)) {
        let r = *vector::borrow(&recipients, i);
        mint_and_transfer(ctx, r);
        i = i + 1;
    }
}

fun mint_and_transfer(ctx: &mut TxContext, recipient: address) {
    let nft = WlNFT {
        id: object::new(ctx),
        name: b"WL BTCFi Beeleievers".to_string(),
        description: b"www.gonative.cc/beelievers".to_string(),
        image_url: url::new_unsafe_from_bytes(b"https://todo-image-url.com"), // TODO, need to set URL
    };

    event::emit(NFTMinted {
        object_id: object::id(&nft),
        creator: recipient,
        name: nft.name,
    });

    transfer::transfer(nft, recipient);
}

/// Permanently delete `nft`
public fun burn(nft: WlNFT, _: &mut TxContext) {
    let WlNFT { id, name: _, description: _, image_url: _ } = nft;
    id.delete()
}
