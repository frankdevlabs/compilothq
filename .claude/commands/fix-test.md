---
description: 'Run comprehensive test review, then fix all issues found.'
---

# Claude Command: Fix test

Run comprehensive test review, then fix all issues found.

## Usage

```
/fix-test [ file path ]
```

## Process

First: run 'cd app && npm run test "$ARGUMENTS"'
STEP 1: Output results.
STEP 2: Deep analysis via thinkdeep ('ultrahink on what you see').
STEP 3: Assess if any failing tests should be fixed or removed.
STEP 4: Fix categorized issues with Read/Edit tools.
STEP 5: Re-run the test command.
STEP 6: Finalize if no issues are found or start over with STEP 1.
