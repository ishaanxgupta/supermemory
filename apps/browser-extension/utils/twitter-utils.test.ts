import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { transformTweetData, type Tweet } from "./twitter-utils"

describe("transformTweetData", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("should return null for empty or invalid input", () => {
		expect(transformTweetData({})).toBeNull()
		expect(transformTweetData({ content: {} })).toBeNull()
		expect(transformTweetData({ content: { itemContent: {} } })).toBeNull()
		expect(
			transformTweetData({ content: { itemContent: { tweet_results: {} } } }),
		).toBeNull()
	})

	it("should return null if tweet.legacy is missing", () => {
		const input = {
			content: {
				itemContent: {
					tweet_results: {
						result: {
							__typename: "Tweet",
						},
					},
				},
			},
		}
		expect(transformTweetData(input)).toBeNull()
	})

	it("should return null on exception (e.g. invalid date)", () => {
		const input = {
			content: {
				itemContent: {
					tweet_results: {
						result: {
							legacy: {
								favorite_count: 0,
								id_str: "12345",
								full_text: "Hello world",
							},
						},
					},
				},
			},
		}
		expect(transformTweetData(input)).toBeNull()
		expect(console.error).toHaveBeenCalled()
	})

	it("should correctly transform a valid tweet without media", () => {
		const validRawTweet = {
			content: {
				itemContent: {
					tweet_results: {
						result: {
							__typename: "Tweet",
							core: {
								user_results: {
									result: {
										legacy: {
											id_str: "user123",
											name: "Test User",
											profile_image_url_https:
												"https://example.com/profile.jpg",
											screen_name: "testuser",
											verified: true,
										},
										is_blue_verified: false,
									},
								},
							},
							legacy: {
								lang: "en",
								favorite_count: 10,
								reply_count: 5,
								retweet_count: 2,
								quote_count: 1,
								created_at: "Wed Oct 10 20:19:24 +0000 2018",
								display_text_range: [0, 11],
								id_str: "tweet123",
								full_text: "Hello world",
								entities: {
									hashtags: [{ indices: [0, 5], text: "test" }],
									urls: [],
									user_mentions: [],
									symbols: [],
								},
							},
						},
					},
				},
			},
		}

		const expected: Tweet = {
			__typename: "Tweet",
			lang: "en",
			favorite_count: 10,
			created_at: new Date("Wed Oct 10 20:19:24 +0000 2018").toISOString(),
			display_text_range: [0, 11],
			entities: {
				hashtags: [{ indices: [0, 5], text: "test" }],
				urls: [],
				user_mentions: [],
				symbols: [],
			},
			id_str: "tweet123",
			text: "Hello world",
			user: {
				id_str: "user123",
				name: "Test User",
				profile_image_url_https: "https://example.com/profile.jpg",
				screen_name: "testuser",
				verified: true,
				is_blue_verified: false,
			},
			conversation_count: 5,
			retweet_count: 2,
			quote_count: 1,
			reply_count: 5,
		}

		expect(transformTweetData(validRawTweet)).toEqual(expected)
	})

	it("should correctly transform a tweet with media", () => {
		const rawTweetWithMedia = {
			content: {
				itemContent: {
					tweet_results: {
						result: {
							__typename: "Tweet",
							core: {
								user_results: {
									result: {
										legacy: {
											id_str: "user123",
											name: "Test User",
											screen_name: "testuser",
										},
									},
								},
							},
							legacy: {
								favorite_count: 0,
								created_at: "Wed Oct 10 20:19:24 +0000 2018",
								id_str: "tweet123",
								full_text: "Look at this media",
								entities: {
									media: [
										{
											type: "photo",
											media_url_https: "https://example.com/photo.jpg",
											sizes: {
												large: { w: 800, h: 600 },
											},
										},
										{
											type: "video",
											media_url_https: "https://example.com/video_thumb.jpg",
											video_info: {
												variants: [{ url: "https://example.com/video.mp4" }],
												duration_millis: 15000,
											},
										},
									],
								},
							},
						},
					},
				},
			},
		}

		const transformed = transformTweetData(rawTweetWithMedia)
		expect(transformed?.photos).toBeDefined()
		expect(transformed?.photos).toHaveLength(1)
		expect(transformed?.photos?.[0]).toEqual({
			url: "https://example.com/photo.jpg",
			width: 800,
			height: 600,
		})

		expect(transformed?.videos).toBeDefined()
		expect(transformed?.videos).toHaveLength(1)
		expect(transformed?.videos?.[0]).toEqual({
			url: "https://example.com/video.mp4",
			thumbnail_url: "https://example.com/video_thumb.jpg",
			duration: 15000,
		})
	})

	it("should handle missing optional user fields", () => {
		const rawTweetMissingUserFields = {
			content: {
				itemContent: {
					tweet_results: {
						result: {
							legacy: {
								favorite_count: 0,
								created_at: "Wed Oct 10 20:19:24 +0000 2018",
								id_str: "tweet123",
								full_text: "No user fields",
							},
						},
					},
				},
			},
		}

		const transformed = transformTweetData(rawTweetMissingUserFields)
		expect(transformed?.user).toBeDefined()
		expect(transformed?.user.id_str).toBe("")
		expect(transformed?.user.name).toBe("Unknown")
		expect(transformed?.user.profile_image_url_https).toBe("")
		expect(transformed?.user.screen_name).toBe("unknown")
		expect(transformed?.user.verified).toBe(false)
		expect(transformed?.user.is_blue_verified).toBe(false)
	})
})
