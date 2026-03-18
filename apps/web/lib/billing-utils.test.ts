import { describe, expect, it } from "vitest"
import {
	calculateUsagePercent,
	formatUsageNumber,
	getDaysRemaining,
	tokensToCredits,
} from "./billing-utils"

describe("billing-utils", () => {
	describe("tokensToCredits", () => {
		it("converts tokens to credits using floor division by 100,000", () => {
			expect(tokensToCredits(100_000)).toBe(1)
			expect(tokensToCredits(290_000)).toBe(2)
			expect(tokensToCredits(300_000)).toBe(3)
			expect(tokensToCredits(0)).toBe(0)
			expect(tokensToCredits(99_999)).toBe(0)
		})
	})

	describe("formatUsageNumber", () => {
		it("formats numbers in millions with M suffix", () => {
			expect(formatUsageNumber(1_000_000)).toBe("1M")
			expect(formatUsageNumber(1_500_000)).toBe("1.5M")
			expect(formatUsageNumber(2_000_000)).toBe("2M")
			expect(formatUsageNumber(1_550_000)).toBe("1.6M") // 1.55 rounded up to 1.6
			expect(formatUsageNumber(10_000_000)).toBe("10M")
		})

		it("formats numbers in thousands with K suffix", () => {
			expect(formatUsageNumber(1_000)).toBe("1K")
			expect(formatUsageNumber(1_500)).toBe("1.5K")
			expect(formatUsageNumber(50_000)).toBe("50K")
			expect(formatUsageNumber(50_500)).toBe("50.5K")
			expect(formatUsageNumber(999_000)).toBe("999K")
			expect(formatUsageNumber(999_900)).toBe("999.9K")
		})

		it("returns string representation for numbers under 1000", () => {
			expect(formatUsageNumber(999)).toBe("999")
			expect(formatUsageNumber(500)).toBe("500")
			expect(formatUsageNumber(0)).toBe("0")
		})

		it("handles negative numbers properly", () => {
			// Negative numbers won't trigger >= 1_000_000 or >= 1_000 conditions
			expect(formatUsageNumber(-1_000_000)).toBe("-1000000")
			expect(formatUsageNumber(-100)).toBe("-100")
		})
	})

	describe("calculateUsagePercent", () => {
		it("calculates percentage correctly", () => {
			expect(calculateUsagePercent(50, 100)).toBe(50)
			expect(calculateUsagePercent(25, 100)).toBe(25)
			expect(calculateUsagePercent(0, 100)).toBe(0)
		})

		it("clamps percentage between 0 and 100", () => {
			expect(calculateUsagePercent(150, 100)).toBe(100)
			expect(calculateUsagePercent(200, 100)).toBe(100)
			expect(calculateUsagePercent(-10, 100)).toBe(0)
		})

		it("returns 0 if limit is less than or equal to 0", () => {
			expect(calculateUsagePercent(50, 0)).toBe(0)
			expect(calculateUsagePercent(50, -10)).toBe(0)
		})
	})

	describe("getDaysRemaining", () => {
		it("returns null if resetAt is not provided", () => {
			expect(getDaysRemaining(null)).toBeNull()
			expect(getDaysRemaining(undefined)).toBeNull()
		})

		it("calculates days remaining correctly and rounds up (ceil)", () => {
			const now = new Date()
			// Create a date 5.5 days in the future
			const future = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5.5)
			expect(getDaysRemaining(future.getTime())).toBe(6)

			// Create a date exactly 5 days in the future
			const futureExact = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5)
			expect(getDaysRemaining(futureExact.getTime())).toBe(5)
		})

		it("returns 0 for past dates (Math.max(0, ...))", () => {
			const now = new Date()
			const past = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5)
			expect(getDaysRemaining(past.getTime())).toBe(0)
		})
	})
})
