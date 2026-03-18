
function isValidUrl(urlString: string): boolean {
	try {
		const url = new URL(urlString)
		return url.protocol === "http:" || url.protocol === "https:"
	} catch {
		return false
	}
}

function isPrivateHost(hostname: string): boolean {
	const lowerHost = hostname.toLowerCase()

	if (
		lowerHost === "localhost" ||
		lowerHost === "127.0.0.1" ||
		lowerHost === "::1" ||
		lowerHost.startsWith("127.") ||
		lowerHost.startsWith("0.0.0.0")
	) {
		return true
	}

	const privateIpPatterns = [
		/^10\./,
		/^172\.(1[6-9]|2[0-9]|3[01])\./,
		/^192\.168\./,
		/^169\.254\./,
		/^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./,
	]

	return privateIpPatterns.some((pattern) => pattern.test(hostname))
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const url = searchParams.get("url")

		if (!url || !url.trim()) {
			return Response.json(
				{ error: "Missing or invalid url parameter" },
				{ status: 400 },
			)
		}

		let currentUrl = url.trim()
		let redirectsCount = 0
		const maxRedirects = 5

		while (redirectsCount <= maxRedirects) {
			if (!isValidUrl(currentUrl)) {
				return Response.json(
					{ error: "Invalid URL. Must be http:// or https://" },
					{ status: 400 },
				)
			}

			const urlObj = new URL(currentUrl)
			if (isPrivateHost(urlObj.hostname)) {
				return Response.json(
					{ error: "Private/localhost URLs are not allowed" },
					{ status: 403 },
				)
			}

			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), 10000)

			const response = await fetch(currentUrl, {
				signal: controller.signal,
				redirect: "manual",
				headers: {
					"User-Agent":
						"Mozilla/5.0 (compatible; SuperMemory/1.0; +https://supermemory.ai)",
				},
			})

			clearTimeout(timeoutId)

			if (response.status >= 300 && response.status < 400) {
				const location = response.headers.get("location")
				if (!location) {
					break
				}
				currentUrl = new URL(location, currentUrl).toString()
				redirectsCount++
				continue
			}

			if (!response.ok) {
				return Response.json(
					{ error: `Failed to fetch URL: ${response.statusText}` },
					{ status: response.status },
				)
			}

			const contentType = response.headers.get("Content-Type")

			// Use streaming response to avoid large memory usage
			return new Response(response.body, {
				status: 200,
				headers: {
					"Content-Type": contentType || "application/octet-stream",
					"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
					"Access-Control-Allow-Origin": "*",
				},
			})
		}

		return Response.json(
			{ error: "Too many redirects or redirect loop" },
			{ status: 400 },
		)
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			return Response.json({ error: "Request timeout" }, { status: 504 })
		}
		console.error("Proxy route error:", error)
		return Response.json({ error: "Internal server error" }, { status: 500 })
	}
}
