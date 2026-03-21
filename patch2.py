with open("apps/web/components/settings/account.tsx", "r") as f:
    content = f.read()

# Add hooks
content = content.replace("const [deleteConfirmText, setDeleteConfirmText] = useState(\"\")", """const [deleteConfirmText, setDeleteConfirmText] = useState("")
	const [isDeleting, setIsDeleting] = useState(false)
	const router = useRouter()""")

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
			await authClient.deleteUser()
			toast.success("Account deleted successfully")
			setIsDeleteDialogOpen(false)
			setDeleteConfirmText("")
			router.push("/")
		} catch (error) {
			console.error("Failed to delete account:", error)
			toast.error("Failed to delete account. Please try again.")
		} finally {
			setIsDeleting(false)
		}
	}"""

content = content.replace(old_handle, new_handle)

# Fix isDeleteEnabled logic in button
old_button = """disabled={!isDeleteEnabled}"""
new_button = """disabled={!isDeleteEnabled || isDeleting}"""
content = content.replace(old_button, new_button)

# Also update the icon
old_icon = """<Trash2 className="size-[18px]" />
											<span>Delete</span>"""
new_icon = """{isDeleting ? (
												<>
													<LoaderIcon className="size-[18px] animate-spin" />
													<span>Deleting...</span>
												</>
											) : (
												<>
													<Trash2 className="size-[18px]" />
													<span>Delete</span>
												</>
											)}"""
content = content.replace(old_icon, new_icon)


with open("apps/web/components/settings/account.tsx", "w") as f:
    f.write(content)
