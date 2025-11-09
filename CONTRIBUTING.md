# Contributing to Eterna

Thank you for your interest in contributing to Eterna! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the coding standards

## Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/HymaJayaram-067/Eterna.git
   cd Eterna
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

5. **Test your changes**
   ```bash
   npm run lint
   npm run build
   npm test
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

7. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Setup

### Using the Helper Script

```bash
./dev.sh setup    # Complete setup
./dev.sh dev      # Start development server
./dev.sh test     # Run tests
```

### Manual Setup

1. Copy environment file:
   ```bash
   cp .env.example .env
   ```

2. Start Redis (optional):
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types when possible
- Document complex functions

### Code Style

- Use ESLint configuration provided
- Run `npm run lint:fix` before committing
- Use meaningful variable names
- Keep functions small and focused

### Testing

- Write tests for all new features
- Maintain >50% code coverage
- Test both success and error cases
- Use descriptive test names

### Commit Messages

Follow the Conventional Commits specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

Examples:
```
feat: add cursor-based pagination to tokens endpoint
fix: resolve rate limiting issue with DexScreener API
docs: update API documentation with examples
test: add integration tests for WebSocket events
```

## Pull Request Process

1. **Update documentation**
   - Update README.md if needed
   - Add API documentation for new endpoints
   - Update CHANGELOG.md (if exists)

2. **Ensure tests pass**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

3. **Create pull request**
   - Use descriptive title
   - Explain what changed and why
   - Reference related issues
   - Add screenshots for UI changes

4. **Code review**
   - Address reviewer feedback
   - Keep discussions constructive
   - Update PR as needed

## Project Structure

```
Eterna/
├── src/
│   ├── __tests__/       # Test files
│   ├── config/          # Configuration
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── websocket/       # WebSocket server
│   ├── app.ts           # Express app
│   └── index.ts         # Entry point
├── dist/                # Compiled output
├── docs/                # Documentation
└── tests/               # Additional tests
```

## Adding New Features

### New API Endpoint

1. Add route in `src/routes/`
2. Implement service in `src/services/`
3. Add types in `src/types/`
4. Write tests in `src/__tests__/`
5. Update API documentation

### New Data Source

1. Create service in `src/services/`
2. Implement rate limiting
3. Add error handling
4. Update aggregation service
5. Add tests

### New WebSocket Event

1. Add event type in `src/types/`
2. Implement in `src/websocket/`
3. Update demo page
4. Document in API docs

## Testing Guidelines

### Unit Tests

Test individual functions and classes:
```typescript
describe('RateLimiter', () => {
  it('should throttle requests', async () => {
    // Test implementation
  });
});
```

### Integration Tests

Test API endpoints:
```typescript
describe('GET /api/tokens', () => {
  it('should return tokens', async () => {
    const response = await request(app).get('/api/tokens');
    expect(response.status).toBe(200);
  });
});
```

### WebSocket Tests

Test real-time functionality:
```typescript
describe('WebSocket', () => {
  it('should send initial data on connect', (done) => {
    socket.on('initial_data', (data) => {
      expect(data).toBeDefined();
      done();
    });
  });
});
```

## Documentation

### Code Comments

Add comments for:
- Complex algorithms
- Business logic
- Non-obvious decisions
- API integrations

### API Documentation

Update `API_DOCUMENTATION.md` for:
- New endpoints
- Changed request/response formats
- New query parameters
- Error codes

### README Updates

Update README.md for:
- New features
- Setup changes
- Deployment updates
- Breaking changes

## Performance Guidelines

- Cache frequently accessed data
- Use pagination for large datasets
- Implement rate limiting
- Optimize database queries
- Profile before optimizing

## Security Guidelines

- Never commit secrets or API keys
- Validate all user input
- Use environment variables for config
- Follow OWASP best practices
- Keep dependencies updated

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. Build and test
5. Deploy to staging
6. Test staging deployment
7. Deploy to production
8. Monitor for issues

## Getting Help

- Check existing issues and PRs
- Read the documentation
- Ask in discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

## Questions?

Feel free to open an issue or reach out to the maintainers.

Thank you for contributing to Eterna! 🚀
