const fs = require('fs');
let code = fs.readFileSync('apps/web/app/api/og/route.ts', 'utf8');

const regex = /function extractImageUrl\([^)]*\)[^\{]*\{[^}]*\}/g;
// actually there is an inner if block so it's safer to just replace the whole function block.
const block = `function extractImageUrl(image: unknown): string | undefined {
	if (!image) return undefined

	if (typeof image === "string") {
		return image
	}

	if (Array.isArray(image) && image.length > 0) {
		const first = image[0]
		if (first && typeof first === "object" && "url" in first) {
			return String(first.url)
		}
	}
	return ""
}`;

code = code.replace(block, "");
fs.writeFileSync('apps/web/app/api/og/route.ts', code);
