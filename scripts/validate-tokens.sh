#!/bin/bash

# Compilo Design System Token Validator

set -e

echo "🔍 Compilo Design System Validation"
echo "=================================="

ERRORS=0
WARNINGS=0
PATHS="packages/ui/src apps/web/src"
EXCLUDE="node_modules|.next|dist|globals.css|tokens.json"

echo ""
echo "📁 Scanning: $PATHS"
echo ""

# 1. Hard-coded hex colors
echo "1️⃣  Hard-coded colors..."
HEX=$(grep -rn "#[0-9A-Fa-f]\{3,6\}" $PATHS --include="*.tsx" 2>/dev/null | grep -vE "$EXCLUDE" || true)
if [ -n "$HEX" ]; then
    echo "❌ Found:"
    echo "$HEX" | head -5
    ERRORS=$((ERRORS + $(echo "$HEX" | wc -l)))
else
    echo "✅ None"
fi

# 2. OKLCH values
echo ""
echo "2️⃣  Hard-coded OKLCH..."
OKLCH=$(grep -rn "oklch(" $PATHS --include="*.tsx" 2>/dev/null | grep -vE "$EXCLUDE" || true)
if [ -n "$OKLCH" ]; then
    echo "❌ Found:"
    echo "$OKLCH" | head -5
    ERRORS=$((ERRORS + $(echo "$OKLCH" | wc -l)))
else
    echo "✅ None"
fi

# 3. Arbitrary spacing
echo ""
echo "3️⃣  Arbitrary spacing..."
SPACING=$(grep -rn "\[[0-9]*px\]" $PATHS --include="*.tsx" 2>/dev/null | grep -vE "$EXCLUDE" || true)
if [ -n "$SPACING" ]; then
    echo "❌ Found:"
    echo "$SPACING" | head -5
    ERRORS=$((ERRORS + $(echo "$SPACING" | wc -l)))
else
    echo "✅ None"
fi

# 4. Non-semantic clickable
echo ""
echo "4️⃣  Non-semantic clickable elements..."
A11Y=$(grep -rn "<div.*onClick\|<span.*onClick" $PATHS --include="*.tsx" 2>/dev/null | grep -vE "$EXCLUDE" || true)
if [ -n "$A11Y" ]; then
    echo "❌ Found:"
    echo "$A11Y" | head -5
    ERRORS=$((ERRORS + $(echo "$A11Y" | wc -l)))
else
    echo "✅ None"
fi

# 5. Hidden focus
echo ""
echo "5️⃣  Hidden focus indicators..."
FOCUS=$(grep -rn "outline-none" $PATHS --include="*.tsx" 2>/dev/null | grep -vE "$EXCLUDE" | grep -v "focus-visible" || true)
if [ -n "$FOCUS" ]; then
    echo "⚠️  Found:"
    echo "$FOCUS" | head -5
    WARNINGS=$((WARNINGS + $(echo "$FOCUS" | wc -l)))
else
    echo "✅ None"
fi

# 6. Generic Tailwind colors
echo ""
echo "6️⃣  Generic Tailwind colors..."
GENERIC=$(grep -rn "text-blue-\|bg-blue-\|text-red-\|bg-red-\|text-gray-\|bg-gray-" $PATHS --include="*.tsx" 2>/dev/null | grep -vE "$EXCLUDE" || true)
if [ -n "$GENERIC" ]; then
    echo "❌ Found:"
    echo "$GENERIC" | head -5
    ERRORS=$((ERRORS + $(echo "$GENERIC" | wc -l)))
else
    echo "✅ None"
fi

# Summary
echo ""
echo "=================================="
echo "📊 Summary"
echo "=================================="
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo "❌ FAILED - Fix $ERRORS error(s)"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo "⚠️  PASSED with $WARNINGS warning(s)"
    exit 0
else
    echo "✅ PASSED"
    exit 0
fi