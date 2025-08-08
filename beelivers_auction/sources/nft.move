// SPDX-License-Identifier: Apache-2.0

/// Non transferrable NFT, used to activate users for the auction.
/// Code based on: https://docs.sui.io/guides/developer/nft/nft-soulbound
module beelivers_auction::nft;

use std::string;
use sui::event;
use sui::url::{Self, Url};

/// Removing the `store` ablity prevents this NFT
/// from being transferred.
public struct NFT has key {
    id: UID,
    /// Name for the token
    name: string::String,
    /// Description of the token
    description: string::String,
    /// URL for the token
    url: Url,
}

public struct AdminCap has key, store {
    id: UID,
}

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };

    transfer::public_transfer(admin_cap, ctx.sender());
}

// ===== Events =====

public struct NFTMinted has copy, drop {
    object_id: ID,
    name: string::String,
    // TODO: can we rename this to "recipient"?
    creator: address,
}

// ===== Public view functions =====

public fun name(nft: &NFT): &string::String {
    &nft.name
}

public fun description(nft: &NFT): &string::String {
    &nft.description
}

public fun url(nft: &NFT): &Url {
    &nft.url
}

// ===== Entrypoints and functions =====

/// Create a new devnet_nft
public fun mint_many(_: &mut AdminCap, recipients: vector<address>, ctx: &mut TxContext) {
    let mut i = 0;
    while (i < vector::length(&recipients)) {
        let r = *vector::borrow(&recipients, i);
        mint_and_transfer(ctx, r);
        i = i + 1;
    }
}

fun mint_and_transfer(ctx: &mut TxContext, recipient: address) {
    let nft = NFT {
        id: object::new(ctx),
        name: b"Redacted Beeliever".to_string(),
        description: b"https://www.gonative.cc/beelievers".to_string(),
        url: url::new_unsafe_from_bytes(b"https://todo-image-url.com"), // TODO, need to set URL
    };

    event::emit(NFTMinted {
        object_id: object::id(&nft),
        creator: recipient,
        name: nft.name,
    });

    transfer::transfer(nft, recipient);
}

/// Permanently delete `nft`
public fun burn(nft: NFT, _: &mut TxContext) {
    let NFT { id, name: _, description: _, url: _ } = nft;
    id.delete()
}
