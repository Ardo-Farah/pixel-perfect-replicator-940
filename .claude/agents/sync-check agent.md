---
name: sync-check
description: Run this at the start of every coding session. 
Checks if local code matches GitHub, pulls if behind, pushes 
if ahead, so Lovable always has the latest code.
tools: Bash
model: haiku
---

Run these steps in order:

1. Run: git fetch origin
   This checks GitHub without changing anything locally

2. Run: git status
   Check for uncommitted local changes

3. If there are uncommitted local changes:
   - Run: git add -A
   - Run: git commit -m "local changes before sync"
   - Report what was committed

4. Run: git rev-list HEAD..origin/main --count
   If result is greater than 0, GitHub has newer code.
   Run: git pull origin main
   Report how many files were updated from GitHub

5. Run: git rev-list origin/main..HEAD --count
   If result is greater than 0, local has commits GitHub 
   does not have.
   Run: git push origin main
   Report what was pushed so Lovable gets the updates

6. Run: bun run build
   Report pass or fail

7. Print final summary:
   - Pulled from GitHub: yes with X files / already up to date
   - Pushed to GitHub: yes with X commits / nothing to push
   - Build: passing / failing
   - Local and GitHub: in sync yes or no