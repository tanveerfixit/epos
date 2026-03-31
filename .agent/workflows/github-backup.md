---
description: How to link and update your EPOS code to GitHub
---

# GitHub Backup Workflow

This workflow helps you keep your code safe on GitHub. All commands are designed to work even if Git is not in your standard Windows PATH.

### 1. Linking your project for the first time
// turbo
1. Initialize and Link to GitHub:
```powershell
& "C:\Program Files\Git\bin\git.exe" init
& "C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/tanveerfixit/data-epos.git
& "C:\Program Files\Git\bin\git.exe" branch -M main
```

### 2. Backing up your code (Pushing updates)
Whenever you make changes and want to save them to GitHub:
// turbo
1. Add, Commit, and Push:
```powershell
& "C:\Program Files\Git\bin\git.exe" add .
& "C:\Program Files\Git\bin\git.exe" commit -m "Update from EPOS Assistant"
& "C:\Program Files\Git\bin\git.exe" push -u origin main
```

> [!NOTE]
> If a login window appears, please sign in to your GitHub account to authorize the upload.
