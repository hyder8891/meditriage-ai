# Dependabot Security Alerts - MediTriage AI (Mydoc Repository)

**Total Alerts:** 7 Open
**Repository:** hyder8891/Mydoc
**Last Checked:** 8 minutes ago

## High Severity (2 alerts)

### 1. qs's arrayLimit bypass - DoS via memory exhaustion
- **Alert #7**
- **Severity:** High
- **Package:** qs (npm)
- **Manifest:** pnpm-lock.yaml
- **Description:** qs's arrayLimit bypass in its bracket notation allows DoS via memory exhaustion

### 2. tRPC prototype pollution vulnerability
- **Alert #6**
- **Severity:** High
- **Package:** @trpc/server (npm)
- **Manifest:** pnpm-lock.yaml
- **Relationship:** Direct dependency
- **Pull Request:** #1
- **Description:** tRPC has possible prototype pollution in `experimental_nextAppDirCaller`

## Moderate Severity (5 alerts)

### 3. mdast-util-to-hast unsanitized class attribute
- **Alert #5**
- **Severity:** Moderate
- **Package:** mdast-util-to-hast (npm)
- **Manifest:** pnpm-lock.yaml
- **Description:** mdast-util-to-hast has unsanitized class attribute

### 4. node-tar race condition
- **Alert #4**
- **Severity:** Moderate
- **Package:** tar (npm)
- **Manifest:** pnpm-lock.yaml
- **Description:** node-tar has a race condition leading to uninitialized memory exposure

### 5. vite server.fs.deny bypass (first instance)
- **Alert #3**
- **Severity:** Moderate
- **Package:** vite (npm)
- **Manifest:** pnpm-lock.yaml
- **Pull Request:** #3
- **Description:** vite allows server.fs.deny bypass via backslash on Windows

### 6. vite server.fs.deny bypass (second instance)
- **Alert #2**
- **Severity:** Moderate
- **Package:** vite (npm)
- **Manifest:** pnpm-lock.yaml
- **Relationship:** Direct dependency
- **Pull Request:** #3
- **Description:** vite allows server.fs.deny bypass via backslash on Windows

### 7. esbuild development server vulnerability
- **Alert #1**
- **Severity:** Moderate
- **Package:** esbuild (npm)
- **Manifest:** pnpm-lock.yaml
- **Pull Request:** #2
- **Description:** esbuild enables any website to send any requests to the development server and read the response

## Action Plan

1. Review existing pull requests (#1, #2, #3) that may address some of these vulnerabilities
2. Update dependencies to patched versions
3. Test application after updates
4. Verify all alerts are resolved


## Detailed Analysis: Alert #7 - qs arrayLimit bypass

### Vulnerability Details
- **CVE ID:** CVE-2025-15284
- **GHSA ID:** GHSA-6rw7-vpxm-498p
- **CVSS Score:** 8.7/10 (High)
- **EPSS Score:** 0.142% (35th percentile)
- **Affected Version:** < 6.14.1
- **Patched Version:** 6.14.1
- **Current Version in Project:** 6.13.0

### Issue
The `arrayLimit` option in qs does not enforce limits for bracket notation (`a[]=1&a[]=2`), allowing attackers to cause denial-of-service via memory exhaustion. The vulnerability exists because:
- Bracket notation (`a[]=value`) bypasses the `arrayLimit` check
- Indexed notation (`a[0]=value`) properly enforces the limit
- Vulnerable code at `lib/parse.js:159-162` uses `utils.combine([], leaf)` without validation

### Impact
- **Denial of Service** via memory exhaustion
- Single malicious request can crash the server
- No authentication required
- Affects any endpoint parsing query strings with bracket notation

### Dependency Chain
The `qs` package is introduced as a transitive dependency via:
1. `express 4.21.2` → `qs 6.13.0`
2. `express-rate-limit 8.2.1` → `qs 6.13.0`
3. `stripe 20.1.0` → `qs 6.13.0`

### Resolution Status
⚠️ **Dependabot cannot auto-update** - The latest installable version (6.13.0) is still vulnerable. The earliest fixed version is 6.14.1. This requires manual intervention to update the parent packages (express, express-rate-limit, stripe) to versions that depend on qs >= 6.14.1.


## Current Package Versions (Before Fix)

Based on package.json analysis:
- **@trpc/server**: ^11.6.0 (needs update to 11.8.0 - PR #1 available)
- **esbuild**: ^0.25.0 (needs update to 0.25.12 - PR #2 available)  
- **vite**: ^7.1.7 (needs update to 7.1.11 - PR #3 available)

## Dependabot Pull Requests Status

Three pull requests have been automatically created by Dependabot:
1. **PR #3**: Bump vite from 7.1.9 to 7.1.11 (fixes 2 moderate severity alerts)
2. **PR #2**: Bump esbuild from 0.18.20 to 0.25.12 (fixes 1 moderate severity alert)
3. **PR #1**: Bump @trpc/server from 11.6.0 to 11.8.0 (fixes 1 high severity alert)

## Fix Strategy

### Phase 1: Merge Dependabot PRs
- Merge PR #1 to fix tRPC prototype pollution (High severity)
- Merge PR #2 to fix esbuild development server vulnerability (Moderate severity)
- Merge PR #3 to fix vite server.fs.deny bypass (Moderate severity)

### Phase 2: Manual Updates
- Update remaining vulnerable packages:
  - **qs** (via express, express-rate-limit, stripe) - No auto-fix available
  - **mdast-util-to-hast** - Needs manual update
  - **tar** (node-tar) - Needs manual update


## Final Resolution Status

**✅ ALL 7 SECURITY ALERTS SUCCESSFULLY RESOLVED**

**GitHub Status:** 0 Open | 7 Closed

### Commits Made

1. **Commit 728d897**: "fix: resolve 7 security vulnerabilities from Dependabot alerts"
   - Updated @trpc/server to 11.8.0
   - Updated esbuild to 0.25.12
   - Updated vite to 7.1.11
   - Updated express to 4.22.1
   - Updated mdast-util-to-hast
   - Updated tar
   - Added qs 6.14.1 as direct dependency

2. **Commit 997f984**: "fix: force patched versions for remaining vulnerabilities using pnpm overrides"
   - Added pnpm override for qs@6.14.1 to fix transitive dependencies
   - Added pnpm override for esbuild>=0.25.12
   - Removed wouter patch causing installation issues
   - Completely eliminated vulnerable versions from dependency tree

### Verification

All security alerts have been verified as closed on GitHub:
- **Repository**: hyder8891/Mydoc
- **URL**: https://github.com/hyder8891/Mydoc/security/dependabot
- **Status**: "There aren't any open alerts"
- **Last Checked**: January 2026

### Key Learnings

1. **Transitive Dependencies**: Direct package updates may not resolve vulnerabilities in transitive dependencies. Use `pnpm overrides` to force specific versions across the entire dependency tree.

2. **Lock File Management**: After adding overrides, delete `node_modules` and `pnpm-lock.yaml` and reinstall to ensure clean resolution.

3. **Build Verification**: Always run `pnpm run build` after security updates to ensure the application still builds correctly.

4. **GitHub Scanning Delay**: Dependabot may take 1-2 minutes to re-scan and close alerts after fixes are pushed.

### Maintenance Recommendations

1. Enable Dependabot automatic security updates in repository settings
2. Review and merge Dependabot PRs promptly when they appear
3. Run `pnpm update` regularly to keep dependencies current
4. Monitor the Security tab for new alerts
5. Keep pnpm overrides up to date as new versions are released
