# Security Fixes Applied - January 2026

## Summary

Fixed **7 security vulnerabilities** identified by GitHub Dependabot alerts:
- **2 High severity** vulnerabilities
- **5 Moderate severity** vulnerabilities

## Packages Updated

### High Severity Fixes

1. **@trpc/server**: 11.6.0 → 11.8.0
   - **CVE**: Prototype pollution in `experimental_nextAppDirCaller`
   - **Impact**: High severity security vulnerability
   - **Status**: ✅ Fixed

2. **qs**: 6.13.0 → 6.14.1 (via express update)
   - **CVE**: CVE-2025-15284
   - **GHSA**: GHSA-6rw7-vpxm-498p
   - **Impact**: DoS via memory exhaustion (arrayLimit bypass)
   - **CVSS Score**: 8.7/10
   - **Status**: ✅ Fixed

### Moderate Severity Fixes

3. **esbuild**: 0.25.0 → 0.25.12
   - **Issue**: Development server vulnerability allowing unauthorized requests
   - **Status**: ✅ Fixed

4. **vite**: 7.1.7 → 7.1.11
   - **Issue**: server.fs.deny bypass via backslash on Windows
   - **Status**: ✅ Fixed (fixes 2 alerts)

5. **mdast-util-to-hast**: Updated to latest secure version
   - **Issue**: Unsanitized class attribute
   - **Status**: ✅ Fixed

6. **tar** (node-tar): Updated to latest secure version
   - **Issue**: Race condition leading to uninitialized memory exposure
   - **Status**: ✅ Fixed

## Additional Package Updates

The following packages were also updated as part of the security fix process:

- **@trpc/client**: 11.6.0 → 11.8.0
- **@trpc/react-query**: 11.6.0 → 11.8.0
- **express**: 4.21.2 → 4.22.1
- **@aws-sdk/client-s3**: 3.693.0 → 3.907.0
- **@aws-sdk/s3-request-presigner**: 3.693.0 → 3.907.0
- **axios**: 1.12.0 → 1.12.2
- **drizzle-orm**: 0.44.5 → 0.44.6
- **drizzle-kit**: 0.31.4 → 0.31.5
- **mysql2**: 3.15.0 → 3.15.1
- **nanoid**: 5.1.5 → 5.1.6
- **wouter**: 3.3.5 → 3.7.1
- **@tailwindcss/typography**: 0.5.15 → 0.5.19
- **@tailwindcss/vite**: 4.1.3 → 4.1.14
- **autoprefixer**: 10.4.20 → 10.4.21
- **pnpm**: 10.15.1 → 10.18.0
- **postcss**: 8.4.47 → 8.5.6
- **tsx**: 4.19.1 → 4.20.6
- **vitest**: 2.1.4 → 2.1.9

## Testing Required

Before pushing these changes, the following tests should be performed:

1. ✅ Dependency installation successful
2. ⏳ Application builds without errors
3. ⏳ Development server starts correctly
4. ⏳ All existing tests pass
5. ⏳ Core functionality works as expected:
   - User authentication
   - tRPC endpoints
   - Database operations
   - File uploads (S3)
   - API integrations

## Next Steps

1. Run comprehensive tests
2. Commit changes with descriptive message
3. Push to GitHub repository
4. Verify Dependabot alerts are resolved
5. Monitor application for any issues

## Files Modified

- `package.json` - Updated package versions
- `pnpm-lock.yaml` - Updated dependency lock file

## Commit Message Template

```
fix: resolve 7 security vulnerabilities from Dependabot alerts

- Update @trpc/server to 11.8.0 (fix prototype pollution - High)
- Update qs to 6.14.1 (fix DoS vulnerability CVE-2025-15284 - High)
- Update esbuild to 0.25.12 (fix dev server vulnerability - Moderate)
- Update vite to 7.1.11 (fix fs.deny bypass - Moderate)
- Update mdast-util-to-hast (fix unsanitized class attribute - Moderate)
- Update tar (fix race condition - Moderate)
- Update express to 4.22.1 (brings patched qs dependency)

All 7 Dependabot security alerts have been addressed.
```

## References

- GitHub Dependabot Alerts: https://github.com/hyder8891/Mydoc/security/dependabot
- CVE-2025-15284: https://github.com/advisories/GHSA-6rw7-vpxm-498p
