import { expect, test, describe } from "vitest";

// sample function for Vu
function sum(a: number, b: number) {
	return a + b;
}

describe("sort addresses", () => {
	test("adds 1 + 2 to equal 3", () => {
		expect(sum(1, 2)).toBe(3);
	});
});
