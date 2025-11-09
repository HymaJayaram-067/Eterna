# Contributing to Eterna

Thank you for your interest in contributing to Eterna! This document provides guidelines and information for contributors.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Redis 6 or higher
- Git
- Basic knowledge of TypeScript, Express, and WebSocket

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Eterna.git
   cd Eterna
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Setup environment:
   ```bash
   cp .env.example .env
   ```

5. Start Redis:
   ```bash
   # macOS
   brew services start redis
   
   # Ubuntu/Debian
   sudo systemctl start redis
   
   # Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

6. Run in development mode:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/your-feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/what-you-changed` - Documentation updates
- `refactor/what-you-refactored` - Code refactoring
- `test/what-you-tested` - Test additions/updates

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests:
   ```bash
   npm test
   ```

4. Run linter:
   ```bash
   npm run lint
   ```

5. Format code:
   ```bash
   npm run format
   ```

6. Build to verify:
   ```bash
   npm run build
   ```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

Examples:
```
feat(api): add token filtering by protocol

fix(websocket): handle connection drops gracefully

docs(readme): update deployment instructions

test(cache): add tests for TTL expiration
```

## Testing Guidelines

### Writing Tests

- Place tests in `src/__tests__/`
- Name test files: `*.test.ts`
- Aim for >80% code coverage
- Test both happy paths and edge cases

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = setupInput();
      
      // Act
      const result = method(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- cache.service.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Code Style

### TypeScript Guidelines

1. **Use TypeScript strict mode**: Already configured
2. **Define interfaces for all data structures**
3. **Avoid `any` type**: Use proper types or `unknown`
4. **Use async/await** over promises
5. **Export interfaces** from types/index.ts

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Interfaces**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private members**: `_prefixedCamelCase`

### Code Organization

```typescript
// 1. Imports (external first, then internal)
import express from 'express';
import { config } from '../config';

// 2. Interfaces/Types
interface MyData {
  field: string;
}

// 3. Constants
const MAX_RETRIES = 3;

// 4. Class/Functions
export class MyService {
  // Private fields
  private _cache: Map<string, any>;
  
  // Constructor
  constructor() {
    this._cache = new Map();
  }
  
  // Public methods
  public async fetch(): Promise<void> {
    // Implementation
  }
  
  // Private methods
  private validate(): boolean {
    // Implementation
  }
}
```

## Adding New Features

### New API Endpoint

1. Define route in `src/api/routes.ts`
2. Add types in `src/types/index.ts`
3. Implement logic in service layer
4. Add tests
5. Update Postman collection
6. Update README

Example:
```typescript
// src/api/routes.ts
router.get('/api/tokens/trending', async (req, res) => {
  try {
    const tokens = await tokenService.getTrending();
    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### New DEX Integration

1. Create client in `src/services/dex.clients.ts`
2. Implement rate limiting
3. Add conversion logic
4. Update aggregation service
5. Add tests
6. Update documentation

Example:
```typescript
export class NewDexClient {
  private rateLimiter: RateLimiter;
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.api.newDex.baseUrl;
    this.rateLimiter = new RateLimiter(30, 60000);
  }

  async getTokens(): Promise<Token[]> {
    // Implementation
  }
}
```

## Documentation

### What to Document

- New features
- API changes
- Configuration options
- Breaking changes
- Migration guides

### Where to Document

- **README.md**: Overview, setup, basic usage
- **ARCHITECTURE.md**: System design, data flow
- **DEPLOYMENT.md**: Deployment instructions
- **QUICKSTART.md**: Quick start guide
- **Code comments**: Complex logic only

### Documentation Style

- Use clear, concise language
- Provide code examples
- Include expected outputs
- Add diagrams for complex flows

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**: `npm test`
4. **Ensure linter passes**: `npm run lint`
5. **Build successfully**: `npm run build`
6. **Update CHANGELOG** (if significant change)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added and passing
```

## Performance Considerations

### Guidelines

1. **Use caching** appropriately
2. **Minimize API calls** to external services
3. **Implement pagination** for large datasets
4. **Use async operations** to avoid blocking
5. **Monitor memory usage** with large caches

### Benchmarking

Before submitting performance improvements:

```bash
# Run load test
./scripts/load-test.sh http://localhost:3000 50

# Check memory usage
node --inspect dist/index.js
```

## Security

### Security Checklist

- [ ] No secrets in code
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] CORS configured properly
- [ ] Dependencies updated
- [ ] No SQL/NoSQL injection risks

### Reporting Security Issues

Please email security issues privately to maintainers. Do not open public issues for security vulnerabilities.

## Review Process

### What We Look For

1. **Correctness**: Does it work?
2. **Tests**: Are there adequate tests?
3. **Style**: Does it follow conventions?
4. **Performance**: Is it efficient?
5. **Documentation**: Is it documented?
6. **Breaking Changes**: Are they necessary and documented?

### Timeline

- Initial review: 1-3 days
- Revisions: As needed
- Final approval: 1-2 days after final review

## Getting Help

- 📖 Read the documentation
- 💬 Open a [Discussion](https://github.com/HymaJayaram-067/Eterna/discussions)
- 🐛 Report bugs via [Issues](https://github.com/HymaJayaram-067/Eterna/issues)
- 📧 Contact maintainers

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in commit history

Thank you for contributing to Eterna! 🚀
