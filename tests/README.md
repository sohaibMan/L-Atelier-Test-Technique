# Tennis API - Test Suite Documentation

This document describes the comprehensive test suite for the Tennis Player Management API.

## 🧪 Test Structure

The test suite is organized into three levels:

### 1. Unit Tests (`tests/unit/`)
- **Purpose**: Test individual functions and services in isolation
- **Scope**: PlayerService business logic, data validation, calculations
- **Mocking**: Database calls are mocked using Jest
- **Speed**: Fast (< 1 second per test)

### 2. Integration Tests (`tests/integration/`)
- **Purpose**: Test API endpoints without database dependencies
- **Scope**: Request validation, response formats, error handling, security headers
- **Mocking**: No database connection required
- **Speed**: Medium (1-5 seconds per test)

### 3. End-to-End Tests (`tests/e2e/`)
- **Purpose**: Test complete workflows with real database operations
- **Scope**: Full API functionality including database persistence
- **Database**: In-memory MongoDB using `mongodb-memory-server`
- **Speed**: Slower (5-30 seconds per test)

## 🚀 Running Tests

### Quick Commands

```bash
# Run all tests
npm test

# Run specific test types
npm run test -- --selectProjects=unit
npm run test -- --selectProjects=integration  
npm run test -- --selectProjects=e2e

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run complete test suite with summary
./scripts/test-all.sh
```

### Detailed Test Commands

```bash
# Unit tests only
npm run test -- tests/unit --verbose

# Integration tests only  
npm run test -- tests/integration --verbose

# E2E tests only (requires MongoDB Memory Server)
npm run test:e2e

# Run tests matching a pattern
npm run test -- --testNamePattern="should create player"

# Run tests for specific file
npm run test -- tests/unit/playerService.test.ts
```

## 📋 Test Coverage

### What's Tested

#### ✅ Player Creation
- Valid player data validation
- Duplicate ID/shortname detection
- Field validation (age, weight, height, etc.)
- URL format validation
- Array length and value validation

#### ✅ Player Retrieval
- Get player by valid ID
- Handle non-existent players (404)
- Invalid ID format handling
- Parameter validation

#### ✅ Statistics Calculation
- IMC (BMI) calculation accuracy
- Median height calculation (odd/even counts)
- Win rate calculation by country
- Best country determination
- Edge cases (single player, zero wins)

#### ✅ API Security & Performance
- CORS headers
- Security headers (Helmet)
- Rate limiting
- Request size limits
- Malformed JSON handling
- Concurrent request handling

#### ✅ Error Handling
- Validation errors with detailed messages
- Database connection errors
- Malformed requests
- Non-existent routes
- Server errors

### Coverage Targets
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 95%
- **Lines**: > 90%

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: Node.js
- **Preset**: TypeScript with ESM support
- **Timeout**: 30 seconds for E2E, 10-15s for others
- **Projects**: Separate configurations for unit/integration/e2e

### Test Setup (`tests/setup.mjs`)
- Environment variables for testing
- Logging level configuration
- Port configuration for test server

## 📊 Test Data

### Sample Player Data
The tests use realistic tennis player data:

```javascript
const validPlayerData = {
  id: 999,
  firstname: "Roger",
  lastname: "Federer", 
  shortname: "R.FED",
  sex: "M",
  country: {
    picture: "https://tenisu.latelier.co/resources/Suisse.png",
    code: "SUI"
  },
  picture: "https://tenisu.latelier.co/resources/Federer.png",
  data: {
    rank: 3,
    points: 2500,
    weight: 85000, // grams
    height: 185,   // cm
    age: 35,
    last: [1, 1, 0, 1, 1] // last 5 match results
  }
}
```

### Edge Cases Tested
- Minimum/maximum values for all numeric fields
- Invalid formats for strings and URLs
- Boundary conditions for arrays
- Empty and malformed data
- Concurrent operations
- Large payloads

## 🎯 Test Scenarios

### Complete Workflow Test
The E2E tests include a comprehensive workflow:

1. **Create multiple players** with different countries and stats
2. **Retrieve individual players** by ID
3. **Calculate statistics** including:
   - Best win rate by country
   - Average IMC (BMI) of all players
   - Median height calculation
4. **Verify calculations** are mathematically correct

### Error Scenarios
- Duplicate player creation attempts
- Invalid data validation
- Non-existent resource access
- Malformed request handling
- Database connection failures

### Performance Tests
- Concurrent request handling (10 simultaneous requests)
- Large payload processing
- Rate limiting verification
- Memory usage with in-memory database

## 🐛 Debugging Tests

### Common Issues

1. **MongoDB Memory Server fails to start**
   ```bash
   # Install dependencies
   npm install mongodb-memory-server --save-dev
   
   # Check Node.js version (requires 16+)
   node --version
   ```

2. **ESM import issues**
   ```bash
   # Ensure .js extensions in imports
   import { Player } from "../../src/models/Player.js";
   ```

3. **Test timeouts**
   ```bash
   # Increase timeout for specific tests
   jest.setTimeout(30000);
   ```

### Debugging Commands

```bash
# Run tests with debug output
npm run test -- --verbose --no-cache

# Run single test file with debugging
npm run test -- tests/e2e/players.e2e.test.ts --verbose

# Check test coverage details
npm run test:coverage -- --verbose
```

## 📈 Continuous Integration

### GitHub Actions (Recommended)
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
```

### Pre-commit Hooks
```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit test hook
npx husky add .husky/pre-commit "npm run test:ci"
```

## 🔍 Test Metrics

### Performance Benchmarks
- **Unit Tests**: < 5 seconds total
- **Integration Tests**: < 15 seconds total  
- **E2E Tests**: < 60 seconds total
- **Memory Usage**: < 512MB peak

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- No console errors or warnings
- Response times < 100ms for simple operations

## 🚀 Adding New Tests

### For New Endpoints
1. Add unit tests for service logic
2. Add integration tests for API validation
3. Add E2E tests for complete workflows
4. Update this documentation

### Test Naming Convention
```javascript
describe("Feature/Component", () => {
  describe("specific functionality", () => {
    it("should do something specific when condition", () => {
      // Test implementation
    });
  });
});
```

### Best Practices
- Use descriptive test names
- Test both happy path and error cases
- Mock external dependencies in unit tests
- Use realistic test data
- Clean up after each test
- Keep tests independent and isolated

---

## 📞 Support

For questions about the test suite:
1. Check this documentation
2. Review existing test examples
3. Run tests with `--verbose` flag for detailed output
4. Check Jest documentation for advanced features