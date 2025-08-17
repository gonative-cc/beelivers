import { expect, test, describe } from "vitest";

import { sortAddresses } from "./beelievers_auction_finalize.js";

// sample function for Vu
function sum(a: number, b: number) {
	return a + b;
}

describe("sort addresses", () => {
	test("adds 1 + 2 to equal 3", () => {
		expect(sum(1, 2)).toBe(3);
	});

	test("sorts single address", () => {
		const addr = "0x0123";
		expect(sortAddresses([addr])).toEqual([addr]);
	});
});
