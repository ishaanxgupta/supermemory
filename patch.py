import re

with open("apps/web/components/settings/account.tsx", "r") as f:
    content = f.read()

# Add hooks
hooks_str = """
	const [isDeleting, setIsDeleting] = useState(false)
	const router = useRouter()
"""

# Replace `const autumn = useCustomer()` with `const autumn = useCustomer()\n\tconst router = useRouter()\n\tconst [isDeleting, setIsDeleting] = useState(false)`

content = content.replace("const autumn = useCustomer()", "const autumn = useCustomer()\n\tconst router = useRouter()\n\tconst [isDeleting, setIsDeleting] = useState(false)")

# Replace handleDeleteAccount logic
old_handle = """	const handleDeleteAccount = () => {
		if (deleteConfirmText !== "DELETE") return
		// TODO: Implement account deletion API call
		console.log("Delete account requested")
		setIsDeleteDialogOpen(false)
		setDeleteConfirmText("")
	}"""

new_handle = """	const handleDeleteAccount = async () => {
		if (deleteConfirmText !== "DELETE") return
		setIsDeleting(true)
		try {
			const { error } = await authClient.deleteUser({})
			if (error) {
				console.error("Failed to delete account:", error)
				toast.error("Failed to delete account. Please try again.")
				setIsDeleting(false)
				return
			}

			toast.success("Account deleted successfully")
			setIsDeleteDialogOpen(false)
			setDeleteConfirmText("")
			router.push("/")
		} catch (error) {
			console.error("Error deleting account:", error)
			toast.error("An unexpected error occurred.")
			setIsDeleting(false)
		}
	}"""

content = content.replace(old_handle, new_handle)

# Update disabled state and button text
# from `disabled={!isDeleteEnabled}` to `disabled={!isDeleteEnabled || isDeleting}`
# Note: we need to find `isDeleteEnabled`. Wait, `isDeleteEnabled` is `deleteConfirmText === "DELETE"` inline probably? Let's check `disabled={!isDeleteEnabled}`.
# Wait, actually in my previous `head` output it showed `disabled={!isDeleteEnabled}`. Let me check the exact text.
