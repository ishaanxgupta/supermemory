#!/bin/bash
sed -i '1i import { toast } from "sonner"' apps/web/components/settings/account.tsx
sed -i '1i import { useRouter } from "next/navigation"' apps/web/components/settings/account.tsx
