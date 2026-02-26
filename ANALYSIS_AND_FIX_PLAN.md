# Codebase Analysis & Fix Plan (Revised)

## Executive Summary

This document outlines critical bugs, potential issues, and gaps found in the termtype codebase, with proper understanding of Bun's file I/O APIs and OpenTUI patterns.

---

## 🔴 Critical Bugs

### 1. **Incorrect Directory Existence Check**
**Location:** `src/context/SettingsContext.tsx:56-58` and `src/utils/monkeyTypeApi.ts:37-38`

**Issue:** Using `Bun.file(SETTINGS_DIR)` to check if a directory exists is incorrect. `Bun.file()` is designed for files, not directories. While `Bun.write()` may create parent directories automatically, the existence check logic is wrong and the `.keep` file creation is unnecessary.

**Impact:** 
- The directory check will always return false (since it's checking a directory as a file)
- Unnecessary `.keep` file creation
- Code is confusing and may fail in edge cases

**Current Code:**
```typescript
const dir = Bun.file(SETTINGS_DIR)
if (!(await dir.exists())) {
  await Bun.write(join(SETTINGS_DIR, ".keep"), "")
}
```

**Fix:** According to Bun docs, use `mkdir` from `node:fs/promises`:
```typescript
import { mkdir } from "node:fs/promises"
import { existsSync } from "node:fs"

// Option 1: Use mkdir with recursive (idempotent)
await mkdir(SETTINGS_DIR, { recursive: true })

// Option 2: Check first, then create
if (!existsSync(SETTINGS_DIR)) {
  await mkdir(SETTINGS_DIR, { recursive: true })
}
```

**Note:** `Bun.write()` may create parent directories automatically, but it's better to be explicit and use the proper API.

---

### 2. **Missing Directory Creation in wordsApi.ts**
**Location:** `src/utils/wordsApi.ts:41-51`

**Issue:** The `writeWordsCache()` function doesn't ensure the cache directory exists before writing, unlike `monkeyTypeApi.ts` which has `ensureCacheDir()` (though that function has the bug mentioned above).

**Impact:** Cache writes may fail if directory doesn't exist.

**Fix:** Add proper directory creation using `mkdir`:
```typescript
import { mkdir } from "node:fs/promises"

async function writeWordsCache(words: string[]): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true })
    const cacheData: WordsCacheData = {
      timestamp: Date.now(),
      words,
    }
    await Bun.write(WORDS_CACHE_FILE, JSON.stringify(cacheData))
  } catch {
    // Cache write failed
  }
}
```

---

### 3. **Quote Change Doesn't Reset Typing State**
**Location:** `src/hooks/useTypingTest.ts:43`

**Issue:** When the `quote` prop changes (e.g., user changes settings), the `userInput` state doesn't reset. This can cause:
- User typing against old quote while new quote is displayed
- Metrics calculated against wrong quote
- Cursor position issues
- Progress calculation errors

**Impact:** Broken typing test when quote changes mid-session.

**Fix:** Add `useEffect` to reset state when quote changes:
```typescript
useEffect(() => {
  reset()
}, [quote, reset]) // reset is stable due to useCallback
```

**Note:** This is a legitimate bug regardless of framework.

---

### 4. **CommandPalette Section Index Bug**
**Location:** `src/components/CommandPalette.tsx:34, 111-158`

**Issue:** The `activeSection` index is hardcoded (0, 1, 2), but sections are conditionally rendered based on `settings.mode`. When mode is "words", section 1 is wordCount; when mode is "quotes", section 1 is quoteLength. This causes navigation issues when switching modes.

**Impact:** Arrow key navigation in settings palette doesn't work correctly when switching modes - user can navigate to non-existent sections.

**Fix:** Calculate section indices dynamically based on current mode:
```typescript
const getAvailableSections = (): Section[] => {
  const sections: Section[] = ["mode"]
  if (settings.mode === "words") {
    sections.push("wordCount")
  } else {
    sections.push("quoteLength")
  }
  return sections
}

const availableSections = getAvailableSections()

// Update navigation to use availableSections instead of SECTIONS
if (key.name === "down") {
  setActiveSection((prev) => Math.min(availableSections.length - 1, prev + 1))
}
```

---

## ⚠️ Important Issues

### 5. **Missing useEffect Dependencies**
**Location:** `src/components/TypingTest.tsx:76-87, 98-102`

**Issue:** Multiple `useEffect` hooks are missing `fetchNewText` in their dependency arrays. This violates React's exhaustive-deps rule and can cause:
- Stale closures
- Missing updates when dependencies change
- React warnings in development

**Impact:** Potential race conditions, unnecessary re-renders, or missing updates.

**Current Code:**
```typescript
useEffect(() => {
  if (!settingsLoading) {
    fetchNewText()
  }
}, [settingsLoading]) // Missing fetchNewText

useEffect(() => {
  if (testState === "idle" && !settingsLoading) {
    fetchNewText()
  }
}, [settings.mode, settings.wordCount, settings.quoteLength]) // Missing fetchNewText, testState, settingsLoading
```

**Fix:** Add missing dependencies or restructure:
```typescript
useEffect(() => {
  if (!settingsLoading) {
    fetchNewText()
  }
}, [settingsLoading, fetchNewText])

useEffect(() => {
  if (testState === "idle" && !settingsLoading) {
    fetchNewText()
  }
}, [testState, settings.mode, settings.wordCount, settings.quoteLength, settingsLoading, fetchNewText])
```

**Note:** Since `fetchNewText` is wrapped in `useCallback`, adding it to deps is safe.

---

### 6. **No Settings Validation**
**Location:** `src/context/SettingsContext.tsx:40-50`

**Issue:** Loaded settings from JSON are not validated. Corrupted or invalid JSON could cause:
- Runtime errors when accessing invalid properties
- Unexpected behavior with invalid values
- Type safety bypassed

**Impact:** App could crash or behave unexpectedly with invalid settings.

**Fix:** Add runtime validation:
```typescript
function validateSettings(data: unknown): Settings {
  if (typeof data !== "object" || data === null) {
    return DEFAULT_SETTINGS
  }
  
  const partial = data as Partial<Settings>
  return {
    mode: partial.mode === "words" || partial.mode === "quotes" ? partial.mode : DEFAULT_SETTINGS.mode,
    wordCount: [10, 25, 50, 100].includes(partial.wordCount as number) 
      ? (partial.wordCount as WordCount) 
      : DEFAULT_SETTINGS.wordCount,
    quoteLength: ["short", "medium", "long"].includes(partial.quoteLength as string)
      ? (partial.quoteLength as QuoteLength)
      : DEFAULT_SETTINGS.quoteLength,
  }
}

async function loadSettings(): Promise<Settings> {
  try {
    const file = Bun.file(SETTINGS_FILE)
    if (await file.exists()) {
      const data = await file.json()
      return validateSettings(data)
    }
  } catch {
    // Settings load failed, use defaults
  }
  return DEFAULT_SETTINGS
}
```

---

### 7. **Race Conditions in Text Fetching**
**Location:** `src/components/TypingTest.tsx:49-73`

**Issue:** Multiple `useEffect` hooks can trigger `fetchNewText()` simultaneously, causing race conditions where:
- Older requests overwrite newer ones
- Loading states become inconsistent
- Wrong text displayed

**Impact:** User may see incorrect text or loading states flicker.

**Fix:** Use request cancellation with `AbortController`:
```typescript
const fetchNewText = useCallback(async () => {
  if (settingsLoading) return
  
  // Cancel previous request
  abortControllerRef.current?.abort()
  abortControllerRef.current = new AbortController()
  const signal = abortControllerRef.current.signal
  
  setIsLoading(true)
  try {
    if (settings.mode === "quotes") {
      const { min, max } = getQuoteLengthRange()
      const result = await getRandomMonkeyTypeQuote(min, max)
      if (!signal.aborted && result.text) {
        setText(result.text)
      } else if (!signal.aborted) {
        setText(getRandomQuote())
      }
    } else {
      const words = await generateRandomWords(settings.wordCount)
      if (!signal.aborted) {
        setText(words)
      }
    }
  } catch (err) {
    if (signal.aborted) return
    // ... fallback logic
  } finally {
    if (!signal.aborted) {
      setIsLoading(false)
    }
  }
}, [settings.mode, settings.wordCount, settings.quoteLength, settingsLoading])
```

---

### 8. **No Network Request Timeouts**
**Location:** `src/utils/monkeyTypeApi.ts:101` and `src/utils/wordsApi.ts:77`

**Issue:** `fetch()` calls have no timeout. Slow networks or hanging requests could cause the app to hang indefinitely.

**Impact:** Poor user experience on slow networks, app appears frozen.

**Fix:** Add timeout wrapper:
```typescript
async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === "AbortError") {
      throw new Error("Request timeout")
    }
    throw error
  }
}
```

---

### 9. **Missing Return Statement**
**Location:** `src/context/SettingsContext.tsx:40-51`

**Issue:** The `loadSettings()` function has a missing return statement. If the file doesn't exist, the function doesn't return `DEFAULT_SETTINGS` explicitly (though it falls through to the return at the end).

**Impact:** Code works but is confusing - the catch block doesn't return, relying on fallthrough.

**Current Code:**
```typescript
async function loadSettings(): Promise<Settings> {
  try {
    const file = Bun.file(SETTINGS_FILE)
    if (await file.exists()) {
      const data = (await file.json()) as Partial<Settings>
      return { ...DEFAULT_SETTINGS, ...data }
    }
  } catch {
    // Settings load failed, use defaults
  }
  return DEFAULT_SETTINGS // This is reached, but catch should also return
}
```

**Fix:** Make return explicit in catch:
```typescript
async function loadSettings(): Promise<Settings> {
  try {
    const file = Bun.file(SETTINGS_FILE)
    if (await file.exists()) {
      const data = (await file.json()) as Partial<Settings>
      return { ...DEFAULT_SETTINGS, ...data }
    }
  } catch {
    // Settings load failed, use defaults
    return DEFAULT_SETTINGS
  }
  return DEFAULT_SETTINGS
}
```

---

## 🟡 Code Quality Issues

### 10. **Unused Component Export**
**Location:** `src/components/ModeSelector.tsx` and `src/components/index.ts:7`

**Issue:** `ModeSelector` component is exported but never used in the codebase. The mode switching is handled in `CommandPalette` instead.

**Impact:** Dead code, potential confusion, unnecessary bundle size.

**Fix:** Remove if unused, or integrate if intended to be used (perhaps as a quick-switch UI element).

---

### 11. **No Error Boundaries**
**Location:** Entire app

**Issue:** No React error boundaries to catch and handle component errors gracefully.

**Impact:** App crashes completely on any unhandled error in component tree.

**Fix:** Add error boundary component:
```typescript
class ErrorBoundary extends React.Component<{children: ReactNode}, {hasError: boolean}> {
  constructor(props: {children: ReactNode}) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <text>Something went wrong. Press Ctrl+C to exit.</text>
    }
    return this.props.children
  }
}
```

---

### 12. **Silent Error Handling**
**Location:** Multiple locations (SettingsContext, API utils)

**Issue:** Many errors are caught and silently ignored with empty catch blocks. This makes debugging difficult.

**Impact:** Difficult to debug issues, users don't know when things fail.

**Fix:** Add proper error logging (at least in development):
```typescript
catch (error) {
  if (process.env.NODE_ENV === "development") {
    console.error("Settings save failed:", error)
  }
  // In production, could show user-friendly message or use logging service
}
```

---

### 13. **Progress Calculation Edge Case**
**Location:** `src/components/TypingTest.tsx:95`

**Issue:** Progress can theoretically exceed 100% if user types beyond quote length, though input is limited. The calculation could be clearer.

**Impact:** Minor - already clamped in ProgressBar, but calculation could be cleaner.

**Fix:** Ensure input length never exceeds quote length (already enforced, but could add explicit check):
```typescript
const progress = text.length > 0 
  ? Math.min(100, Math.round((userInput.length / text.length) * 100))
  : 0
```

---

### 14. **Hardcoded Fallback Text**
**Location:** `src/components/TypingTest.tsx:69` and `src/utils/wordsApi.ts:95-116`

**Issue:** Fallback text is hardcoded in multiple places, making it hard to maintain.

**Impact:** Code duplication, harder to update fallbacks.

**Fix:** Extract to constants file:
```typescript
// src/constants/fallbacks.ts
export const FALLBACK_WORDS = "the be to of and a in that have it for not on with as you do at"
```

---

### 15. **Console.error in Production Code**
**Location:** `src/utils/monkeyTypeApi.ts:113` and `src/utils/wordsApi.ts:86`

**Issue:** `console.error()` used for error logging. Should use proper logging system or at least guard with environment check.

**Impact:** Inconsistent error handling, potential performance issues in production.

**Fix:** Use environment-aware logging:
```typescript
if (process.env.NODE_ENV === "development") {
  console.error("Error fetching MonkeyType words:", error)
}
```

---

## 📚 Documentation & Testing Gaps

### 16. **No Tests**
**Location:** Entire codebase

**Issue:** No test files found. No unit tests, integration tests, or E2E tests.

**Impact:** No confidence in code correctness, difficult to refactor safely.

**Fix:** Add comprehensive test suite:
- Unit tests for utilities (metrics, API functions)
- Hook tests for custom hooks
- Component tests for UI components
- Integration tests for user flows

---

### 17. **Incomplete README**
**Location:** `README.md`

**Issue:** README is minimal, doesn't explain:
- Features
- Usage instructions
- Keyboard shortcuts
- Configuration
- Troubleshooting

**Impact:** Poor developer and user experience.

**Fix:** Expand README with:
- Feature list
- Installation instructions
- Usage guide
- Keyboard shortcuts reference
- Configuration options
- Troubleshooting section
- Contributing guidelines

---

## 🔍 OpenTUI-Specific Considerations

### 18. **useKeyboard Hook Usage**
**Location:** Multiple components using `useKeyboard`

**Analysis:** The `useKeyboard` hook from OpenTUI appears to be used correctly. It's a hook that registers keyboard handlers, and OpenTUI likely handles cleanup automatically when components unmount. However, verify this is the case.

**Recommendation:** Test that keyboard handlers are properly cleaned up when components unmount. If not, may need to add cleanup logic.

---

### 19. **Component Patterns**
**Location:** All components

**Analysis:** Components follow React patterns correctly. OpenTUI's `box` and `text` components are used appropriately. The JSX import source is correctly configured in `tsconfig.json`.

**Recommendation:** No changes needed, but could benefit from:
- Component composition patterns
- Shared style constants
- Theme system if OpenTUI supports it

---

## 📋 Detailed Fix Plan

### Phase 1: Critical Bug Fixes (Priority: P0)

1. **Fix Directory Creation Logic**
   - [ ] Replace `Bun.file()` directory checks with `mkdir` from `node:fs/promises`
   - [ ] Update `SettingsContext.tsx`
   - [ ] Update `monkeyTypeApi.ts`
   - [ ] Update `wordsApi.ts`
   - [ ] Test on fresh install (no `.termtype` directory)

2. **Fix Quote Reset Bug**
   - [ ] Add `useEffect` in `useTypingTest.ts` to reset when quote changes
   - [ ] Test by changing settings mid-typing
   - [ ] Ensure metrics recalculate correctly

3. **Fix CommandPalette Navigation**
   - [ ] Refactor section indexing to be dynamic
   - [ ] Calculate available sections based on mode
   - [ ] Test navigation in both modes

4. **Fix Missing Return Statement**
   - [ ] Add explicit return in `loadSettings()` catch block
   - [ ] Improve code clarity

### Phase 2: Important Stability Fixes (Priority: P1)

5. **Fix useEffect Dependencies**
   - [ ] Add missing dependencies to all `useEffect` hooks
   - [ ] Run React exhaustive-deps check
   - [ ] Refactor if needed to avoid infinite loops

6. **Add Settings Validation**
   - [ ] Create `validateSettings()` function
   - [ ] Validate on load
   - [ ] Handle invalid settings gracefully

7. **Fix Race Conditions**
   - [ ] Add `AbortController` to fetch requests
   - [ ] Cancel previous requests when new one starts
   - [ ] Test rapid setting changes

8. **Add Network Timeouts**
   - [ ] Create `fetchWithTimeout()` utility
   - [ ] Wrap all `fetch()` calls
   - [ ] Set reasonable timeout (10 seconds)
   - [ ] Test on slow network

### Phase 3: Code Quality Improvements (Priority: P2)

9. **Remove Dead Code**
   - [ ] Remove `ModeSelector` if unused
   - [ ] Or integrate it if intended

10. **Add Error Boundaries**
    - [ ] Create `ErrorBoundary` component
    - [ ] Wrap main app components
    - [ ] Add error recovery UI

11. **Improve Error Handling**
    - [ ] Add environment-aware logging
    - [ ] Replace `console.error` with proper logging
    - [ ] Add user-facing error messages where appropriate

12. **Extract Constants**
    - [ ] Move fallback text to constants file
    - [ ] Consolidate hardcoded strings
    - [ ] Create constants for timeouts, cache expiry, etc.

### Phase 4: Documentation & Testing (Priority: P2)

13. **Expand README**
    - [ ] Add feature list
    - [ ] Document keyboard shortcuts
    - [ ] Add installation instructions
    - [ ] Add configuration guide
    - [ ] Add troubleshooting section

14. **Add Test Suite**
    - [ ] Set up testing framework (Vitest recommended for Bun)
    - [ ] Add unit tests for utilities
    - [ ] Add unit tests for hooks
    - [ ] Add component tests
    - [ ] Add integration tests
    - [ ] Aim for >80% coverage

---

## 🎯 Implementation Order

### Week 1: Critical Fixes
- Fix directory creation (Bug #1, #2)
- Fix quote reset (Bug #3)
- Fix CommandPalette navigation (Bug #4)
- Fix missing return (Bug #9)

### Week 2: Stability
- Fix useEffect dependencies (#5)
- Add settings validation (#6)
- Fix race conditions (#7)
- Add network timeouts (#8)

### Week 3: Quality
- Add error boundaries (#11)
- Improve error handling (#12)
- Extract constants (#14)
- Remove dead code (#10)

### Week 4: Documentation & Testing
- Expand README (#17)
- Add test suite (#16)

---

## 📊 Risk Assessment

| Issue | Severity | Impact | Effort | Priority |
|-------|----------|--------|--------|----------|
| Directory creation bug | HIGH | App may not save settings | LOW | P0 |
| Quote reset bug | HIGH | Broken typing test | LOW | P0 |
| CommandPalette bug | MEDIUM | Poor UX | MEDIUM | P0 |
| Missing return | LOW | Code clarity | LOW | P0 |
| Missing dependencies | MEDIUM | Potential bugs | LOW | P1 |
| No validation | MEDIUM | Crashes possible | MEDIUM | P1 |
| Race conditions | MEDIUM | Wrong text displayed | MEDIUM | P1 |
| No timeouts | LOW | Poor UX on slow networks | LOW | P1 |
| No tests | HIGH | No confidence | HIGH | P2 |
| Poor docs | LOW | Poor DX/UX | LOW | P2 |

---

## ✅ Success Criteria

- All critical bugs fixed and tested
- Settings save/load reliably with proper directory creation
- Typing test works correctly when settings change
- No React warnings in console
- Network requests have timeouts
- Race conditions eliminated
- Error boundaries catch and handle errors gracefully
- Test coverage >80%
- README is comprehensive
- Code passes all linters and type checks

---

## 🔍 Additional Recommendations

1. **Consider adding:**
   - Keyboard shortcut help screen (press `?` twice?)
   - Test history/statistics persistence
   - Multiple language support
   - Custom themes
   - Sound effects/feedback

2. **Performance optimizations:**
   - Memoize expensive calculations
   - Debounce settings updates
   - Optimize re-renders with React.memo where appropriate

3. **Developer experience:**
   - Add pre-commit hooks (Husky + lint-staged)
   - Add CI/CD pipeline
   - Add changelog
   - Add contributing guide

4. **OpenTUI-specific:**
   - Explore OpenTUI's theming capabilities
   - Check if there are better patterns for keyboard handling
   - Verify component lifecycle and cleanup behavior
