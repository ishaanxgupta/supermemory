with open("apps/web/components/settings/account.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
imports = []
use_client_idx = -1
for i, line in enumerate(lines):
    if line.strip() == '"use client"':
        use_client_idx = i

if use_client_idx > 0:
    for i in range(use_client_idx):
        if "import" in lines[i]:
            imports.append(lines[i])
    new_lines = ['"use client"\n'] + imports + lines[use_client_idx+1:]
else:
    new_lines = lines

with open("apps/web/components/settings/account.tsx", "w") as f:
    f.writelines(new_lines)
