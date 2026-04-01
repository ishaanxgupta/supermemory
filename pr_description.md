🧹 [code health improvement] Fix untyped form submission details

🎯 **What:** The `details` parameter in `trackFormSubmission`, `trackInteraction`, and `trackError` methods inside `packages/lib/error-tracking.tsx` was loosely typed as `Record<string, any>`. This was replaced with `Record<string, unknown>`.

💡 **Why:** Using `unknown` instead of `any` improves codebase strictness and type safety. It ensures that any code interacting with these utility functions handles the unknown types correctly, preventing subtle runtime bugs without changing the intended tracking behavior.

✅ **Verification:** I verified the change by running the linter/formatter (via biome check) and the test suite (`bun test`). The behavior of PostHog captures is unchanged since PostHog safely consumes standard JavaScript objects.

✨ **Result:** Better type safety in the error-tracking and interaction-tracking utility functions.
