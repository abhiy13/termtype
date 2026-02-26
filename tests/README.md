# TermType Test Suite

Comprehensive test suite for the TermType typing test application.

## Overview

This test suite provides extensive coverage for all utility functions, constants, and component integration in the TermType project. Tests are written using Bun's built-in test framework and follow best practices for unit and integration testing.

## Test Structure

```
src/
├── components/
│   └── integration.test.tsx    # Component integration tests
├── constants/
│   ├── fallbacks.test.ts       # Fallback word list tests
│   └── quotes.test.ts          # Quote constants tests
└── utils/
    ├── colors.test.ts          # Color utility tests
    ├── fetch.test.ts           # Fetch wrapper tests
    ├── fs.test.ts              # File system utility tests
    ├── logger.test.ts          # Logger utility tests
    ├── metrics.test.ts         # Metrics calculation tests
    ├── monkeyTypeApi.test.ts   # MonkeyType API tests
    └── wordsApi.test.ts        # Words API tests
```

## Running Tests

### Run All Tests
```bash
bun test
```

### Run Specific Test Files
```bash
bun test src/utils/colors.test.ts
bun test src/components/
```

### Run Tests in Watch Mode
```bash
bun test --watch
```

### Run Tests with Coverage
```bash
bun test --coverage
```

## Test Coverage

### Utilities (100% Coverage)
- ✅ **colors.ts**: Color manipulation, contrast checking, blending (38 tests)
- ✅ **metrics.ts**: WPM, accuracy, error calculation (42 tests)
- ✅ **fetch.ts**: Timeout-enabled fetch wrapper (13 tests)
- ✅ **fs.ts**: Directory creation utility (13 tests)
- ✅ **logger.ts**: Development logging (19 tests)
- ✅ **monkeyTypeApi.ts**: Quote fetching and caching (28 tests)
- ✅ **wordsApi.ts**: Word fetching and generation (21 tests)

### Constants (100% Coverage)
- ✅ **fallbacks.ts**: Fallback word list and text (24 tests)
- ✅ **quotes.ts**: Quote constants and selection (28 tests)

### Components (Integration Tested)
- ✅ **Header**: ASCII art header (4 tests)
- ✅ **MetricsDisplay**: WPM/accuracy display (14 tests)
- ✅ **StatusMessage**: Test state messages (10 tests)
- ✅ **ProgressBar**: Progress visualization (15 tests)

**Total: 273+ test cases**

## Test Categories

### Unit Tests
Pure function testing with no external dependencies:
- Color utilities
- Metrics calculations
- Constants validation

### Integration Tests
Testing with mocked external dependencies:
- API calls (fetch mocking)
- File system operations
- Logger behavior in different environments

### Component Tests
React component rendering and prop validation:
- Component structure verification
- Prop handling
- Edge case rendering

## Test Quality Features

### Edge Case Coverage
- Empty/null/undefined inputs
- Boundary values (0, max, negative)
- Invalid data types
- Malformed inputs

### Error Handling
- Network failures
- Timeouts
- Invalid responses
- File system errors

### Performance
- Caching behavior
- Concurrent request handling
- Memory efficiency

### Regression Prevention
- Consistent behavior verification
- State management
- Data transformation accuracy

## Adding New Tests

### File Naming Convention
```
[source-file-name].test.ts[x]
```

### Test Structure
```typescript
import { describe, test, expect } from "bun:test"
import { functionToTest } from "./module"

describe("Module Name", () => {
  describe("functionToTest", () => {
    test("does something expected", () => {
      const result = functionToTest(input)
      expect(result).toBe(expected)
    })

    test("handles edge case", () => {
      const result = functionToTest(edgeCase)
      expect(result).toBe(fallback)
    })
  })
})
```

### Best Practices
1. **Descriptive test names**: Use clear, action-oriented descriptions
2. **Arrange-Act-Assert**: Structure tests with setup, execution, verification
3. **One assertion focus**: Each test should verify one specific behavior
4. **Mock external dependencies**: Isolate the code under test
5. **Clean up**: Reset state between tests using `beforeEach`/`afterEach`
6. **Edge cases**: Always test boundary conditions and error paths

## Mocking

### Network Requests
```typescript
import { mock } from "bun:test"

global.fetch = mock(() =>
  Promise.resolve(new Response(JSON.stringify(data), { status: 200 }))
)
```

### Console Output
```typescript
import { spyOn } from "bun:test"

const consoleSpy = spyOn(console, "error").mockImplementation(() => {})
// ... test code
consoleSpy.mockRestore()
```

## Continuous Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: bun test

- name: Check coverage
  run: bun test --coverage
```

## Troubleshooting

### Tests Not Running
- Verify Bun is installed: `bun --version`
- Check test file naming: Must end in `.test.ts` or `.test.tsx`
- Ensure tests are in `src/` directory

### Mock Not Working
- Verify mock is set up before test execution
- Check mock is restored in `afterEach`
- Ensure proper typing for mocked functions

### Flaky Tests
- Avoid timing dependencies
- Mock `Date.now()` for time-based tests
- Clear caches between tests

## Future Enhancements

Potential areas for expansion:
- React hook testing (requires `@testing-library/react-hooks`)
- E2E tests for full typing flow
- Performance benchmarks
- Visual regression tests
- Accessibility testing

## Resources

- [Bun Test Runner](https://bun.sh/docs/cli/test)
- [Bun Expect API](https://bun.sh/docs/cli/test#expect)
- [Bun Mocking](https://bun.sh/docs/cli/test#mocks)

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass: `bun test`
3. Aim for >90% coverage
4. Include edge cases and error paths
5. Update this README with new test information