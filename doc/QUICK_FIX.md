# Quick Fix Guide

## 🔴 Current Issue
SQLite database not working - app starts but receipts can't be saved.

## ✅ Quick Fix (5 minutes)

```bash
# 1. Clean everything
rm -rf node_modules android/app/build android/.gradle .expo

# 2. Reinstall
bun install

# 3. Rebuild and run
bun run android
```

## ✅ What Works Now (Without Fix)
- App launches ✅
- Settings work ✅
- Theme changes ✅
- OCR engine selection ✅
- AI vendor configuration ✅

## ❌ What Needs Fix
- Receipt storage ❌
- Receipt list ❌

## 📖 More Info
- Full details: `SQLITE_NATIVE_ERROR_FIX.md`
- OCR guide: `OCR_ENGINES_GUIDE.md`
- Complete status: `FINAL_STATUS.md`
