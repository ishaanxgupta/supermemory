import type { Tweet } from "../types"
import { describe, it, expect } from "vitest"
import { tweetToMarkdown } from "../twitter-utils"

describe("tweetToMarkdown", () => {
	it("should correctly convert a basic tweet to markdown", () => {
		const mockTweet = {
			__typename: "Tweet",
			id_str: "12345",
			text: "Hello world! This is a test tweet.",
			created_at: "2023-01-01T12:00:00.000Z",
			favorite_count: 10,
			retweet_count: 5,
			reply_count: 2,
			user: {
				id_str: "98765",
				name: "Test User",
				screen_name: "testuser",
				profile_image_url_https: "https://example.com/image.png",
				verified: false,
				is_blue_verified: false,
			},
			entities: {
				hashtags: [],
				urls: [],
				user_mentions: [],
				symbols: [],
			},
			conversation_count: 2,
			quote_count: 0,
		}

		const markdown = tweetToMarkdown(mockTweet as unknown as Tweet)

		expect(markdown).toContain("# Tweet by @testuser (Test User)")
		expect(markdown).toContain(
			"**Likes:** 10 | **Retweets:** 5 | **Replies:** 2",
		)
		expect(markdown).toContain("Hello world! This is a test tweet.")
		expect(markdown).toContain("<summary>Raw Tweet Data</summary>")
	})

	it("should handle missing user information gracefully", () => {
		const mockTweet = {
			__typename: "Tweet",
			id_str: "12345",
			text: "Hello world! This is a test tweet.",
			created_at: "2023-01-01T12:00:00.000Z",
			favorite_count: 10,
			retweet_count: 5,
			reply_count: 2,
			entities: {
				hashtags: [],
				urls: [],
				user_mentions: [],
				symbols: [],
			},
			conversation_count: 2,
			quote_count: 0,
		}

		const markdown = tweetToMarkdown(mockTweet as unknown as Tweet)
		expect(markdown).toContain("# Tweet by @unknown (Unknown User)")
	})

	it("should handle missing count properties by falling back to 0", () => {
		const mockTweet = {
			__typename: "Tweet",
			id_str: "12345",
			text: "Test tweet with no counts",
			created_at: "2023-01-01T12:00:00.000Z",
			favorite_count: 0,
			user: {
				id_str: "98765",
				name: "Test User",
				screen_name: "testuser",
				profile_image_url_https: "https://example.com/image.png",
				verified: false,
				is_blue_verified: false,
			},
			entities: {
				hashtags: [],
				urls: [],
				user_mentions: [],
				symbols: [],
			},
			conversation_count: 0,
			quote_count: 0,
		}

		const markdown = tweetToMarkdown(mockTweet as unknown as Tweet)
		expect(markdown).toContain(
			"**Likes:** 0 | **Retweets:** 0 | **Replies:** 0",
		)
	})

	it("should correctly format media elements (photos and videos)", () => {
		const mockTweet = {
			__typename: "Tweet",
			id_str: "12345",
			text: "Tweet with media",
			created_at: "2023-01-01T12:00:00.000Z",
			favorite_count: 10,
			user: {
				id_str: "98765",
				name: "Test User",
				screen_name: "testuser",
				profile_image_url_https: "https://example.com/image.png",
				verified: false,
				is_blue_verified: false,
			},
			entities: {
				hashtags: [],
				urls: [],
				user_mentions: [],
				symbols: [],
			},
			conversation_count: 0,
			quote_count: 0,
			photos: [
				{ url: "https://example.com/photo1.jpg", width: 800, height: 600 },
				{ url: "https://example.com/photo2.jpg", width: 800, height: 600 },
			],
			videos: [
				{
					url: "https://example.com/video1.mp4",
					thumbnail_url: "https://example.com/thumb1.jpg",
					duration: 15000,
				},
			],
		}

		const markdown = tweetToMarkdown(mockTweet as unknown as Tweet)
		expect(markdown).toContain("**Images:**")
		expect(markdown).toContain("![Image 1](https://example.com/photo1.jpg)")
		expect(markdown).toContain("![Image 2](https://example.com/photo2.jpg)")
		expect(markdown).toContain("**Videos:**")
		expect(markdown).toContain("[Video 1](https://example.com/video1.mp4)")
	})

	it("should correctly format entities (hashtags and mentions)", () => {
		const mockTweet = {
			__typename: "Tweet",
			id_str: "12345",
			text: "Tweet with #test hashtag and @user mention",
			created_at: "2023-01-01T12:00:00.000Z",
			favorite_count: 10,
			user: {
				id_str: "98765",
				name: "Test User",
				screen_name: "testuser",
				profile_image_url_https: "https://example.com/image.png",
				verified: false,
				is_blue_verified: false,
			},
			entities: {
				hashtags: [{ text: "test" }, { text: "vitest" }],
				urls: [],
				user_mentions: [
					{ screen_name: "user" },
					{ screen_name: "anotheruser" },
				],
				symbols: [],
			},
			conversation_count: 0,
			quote_count: 0,
		}

		const markdown = tweetToMarkdown(mockTweet as unknown as Tweet)
		expect(markdown).toContain("**Hashtags:** #test, #vitest")
		expect(markdown).toContain("**Mentions:** @user, @anotheruser")
	})
})
