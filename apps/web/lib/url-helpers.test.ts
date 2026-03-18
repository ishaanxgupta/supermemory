import { describe, expect, it } from "vitest"
import {
	isValidUrl,
	normalizeUrl,
	isTwitterUrl,
	isLinkedInProfileUrl,
	collectValidUrls,
	parseXHandle,
	parseLinkedInHandle,
	toXProfileUrl,
	toLinkedInProfileUrl,
	getFaviconUrl,
	extractGoogleDocId,
	getGoogleEmbedUrl,
} from "./url-helpers"

describe("url-helpers", () => {
	describe("isValidUrl", () => {
		it("should return true for valid URLs", () => {
			expect(isValidUrl("https://google.com")).toBe(true)
			expect(isValidUrl("http://localhost:3000")).toBe(true)
			expect(isValidUrl("https://sub.domain.co.uk/path?query=1#hash")).toBe(true)
		})

		it("should return false for invalid URLs", () => {
			expect(isValidUrl("not a url")).toBe(false)
			expect(isValidUrl("http://")).toBe(false)
			expect(isValidUrl("google.com")).toBe(false) // Needs protocol
		})

		it("should return false for empty strings", () => {
			expect(isValidUrl("")).toBe(false)
			expect(isValidUrl("   ")).toBe(false)
		})
	})

	describe("normalizeUrl", () => {
		it("should add https:// if protocol is missing", () => {
			expect(normalizeUrl("google.com")).toBe("https://google.com")
		})

		it("should not add prefix if http:// or https:// is present", () => {
			expect(normalizeUrl("http://google.com")).toBe("http://google.com")
			expect(normalizeUrl("https://google.com")).toBe("https://google.com")
		})

		it("should return empty string for empty input", () => {
			expect(normalizeUrl("")).toBe("")
			expect(normalizeUrl("  ")).toBe("")
		})
	})

	describe("isTwitterUrl", () => {
		it("should identify twitter.com and x.com URLs", () => {
			expect(isTwitterUrl("https://twitter.com/user")).toBe(true)
			expect(isTwitterUrl("https://x.com/user")).toBe(true)
			expect(isTwitterUrl("https://mobile.twitter.com/user")).toBe(true)
		})

		it("should return false for non-Twitter URLs", () => {
			expect(isTwitterUrl("https://google.com")).toBe(false)
			expect(isTwitterUrl("https://linkedin.com/twitter")).toBe(false)
		})
	})

	describe("isLinkedInProfileUrl", () => {
		it("should identify LinkedIn profile URLs", () => {
			expect(isLinkedInProfileUrl("https://linkedin.com/in/user")).toBe(true)
			expect(isLinkedInProfileUrl("https://www.linkedin.com/in/user")).toBe(true)
		})

		it("should return false for LinkedIn company URLs", () => {
			expect(isLinkedInProfileUrl("https://linkedin.com/company/repo")).toBe(
				false,
			)
		})

		it("should return false for non-LinkedIn URLs", () => {
			expect(isLinkedInProfileUrl("https://google.com")).toBe(false)
		})
	})

	describe("collectValidUrls", () => {
		it("should collect valid LinkedIn and other URLs", () => {
			const result = collectValidUrls("linkedin.com/in/user", [
				"google.com",
				"https://x.com/user", // Should be filtered out
				"invalid-url",
			])
			expect(result).toContain("https://linkedin.com/in/user")
			expect(result).toContain("https://google.com")
			expect(result).not.toContain("https://x.com/user")
		})
	})

	describe("parseXHandle", () => {
		it("should parse handles with @", () => {
			expect(parseXHandle("@user")).toBe("user")
		})

		it("should parse handles from URLs", () => {
			expect(parseXHandle("https://x.com/user")).toBe("user")
			expect(parseXHandle("twitter.com/user")).toBe("user")
		})

		it("should ignore status paths", () => {
			expect(parseXHandle("https://x.com/user/status/123")).toBe("user")
		})

		it("should return the input if it's just a handle", () => {
			expect(parseXHandle("user")).toBe("user")
		})
	})

	describe("parseLinkedInHandle", () => {
		it("should parse handles from URLs", () => {
			expect(parseLinkedInHandle("https://linkedin.com/in/user")).toBe("user")
			expect(parseLinkedInHandle("linkedin.com/pub/user")).toBe("user")
		})

		it("should return handle if already provided", () => {
			expect(parseLinkedInHandle("user")).toBe("user")
			expect(parseLinkedInHandle("@user")).toBe("user")
		})
	})

	describe("toXProfileUrl and toLinkedInProfileUrl", () => {
		it("should convert handle to full URL", () => {
			expect(toXProfileUrl("user")).toBe("https://x.com/user")
			expect(toLinkedInProfileUrl("user")).toBe("https://linkedin.com/in/user")
		})
	})

	describe("getFaviconUrl", () => {
		it("should return google favicon URL", () => {
			expect(getFaviconUrl("https://google.com")).toContain("google.com")
		})

		it("should return null for invalid URLs", () => {
			expect(getFaviconUrl("not a url")).toBeNull()
			expect(getFaviconUrl(null)).toBeNull()
		})
	})

	describe("extractGoogleDocId", () => {
		it("should extract ID from various Google URLs", () => {
			expect(
				extractGoogleDocId(
					"https://docs.google.com/document/d/1abc-123/edit",
				),
			).toBe("1abc-123")
			expect(
				extractGoogleDocId(
					"https://docs.google.com/spreadsheets/d/ss-id/edit#gid=0",
				),
			).toBe("ss-id")
		})

		it("should return null if no ID found", () => {
			expect(extractGoogleDocId("https://google.com")).toBeNull()
		})
	})

	describe("getGoogleEmbedUrl", () => {
		it("should generate correct embed URLs", () => {
			expect(getGoogleEmbedUrl("id123", "google_doc")).toBe(
				"https://docs.google.com/document/d/id123/preview",
			)
			expect(getGoogleEmbedUrl("id123", "google_sheet")).toBe(
				"https://docs.google.com/spreadsheets/d/id123/preview",
			)
		})
	})
})
