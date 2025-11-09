#!/bin/bash

# Development Helper Script

show_help() {
    echo "Eterna Development Helper"
    echo "========================="
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  install     - Install all dependencies"
    echo "  dev         - Start development server"
    echo "  build       - Build the project"
    echo "  test        - Run all tests"
    echo "  lint        - Run linter"
    echo "  format      - Format code"
    echo "  clean       - Clean build artifacts"
    echo "  redis       - Start Redis in Docker (if needed)"
    echo "  setup       - Complete setup (install + redis)"
    echo "  demo        - Start server and open WebSocket demo"
    echo ""
}

install_deps() {
    echo "Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
}

start_dev() {
    echo "Starting development server..."
    echo "Server will run at http://localhost:3000"
    echo "Press Ctrl+C to stop"
    npm run dev
}

build_project() {
    echo "Building project..."
    npm run build
    echo "✓ Build complete"
}

run_tests() {
    echo "Running tests..."
    npm test
}

run_lint() {
    echo "Running linter..."
    npm run lint
}

format_code() {
    echo "Formatting code..."
    npm run format
    echo "✓ Code formatted"
}

clean_artifacts() {
    echo "Cleaning build artifacts..."
    rm -rf dist/
    rm -rf node_modules/
    rm -rf coverage/
    echo "✓ Clean complete"
}

start_redis() {
    echo "Starting Redis in Docker..."
    if ! command -v docker &> /dev/null; then
        echo "Docker not found. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    docker run -d --name eterna-redis -p 6379:6379 redis:alpine
    echo "✓ Redis started at localhost:6379"
    echo "  To stop: docker stop eterna-redis"
    echo "  To remove: docker rm eterna-redis"
}

setup_complete() {
    echo "Setting up Eterna development environment..."
    install_deps
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        echo "Creating .env file..."
        cp .env.example .env
        echo "✓ .env created"
    fi
    
    # Start Redis
    read -p "Do you want to start Redis in Docker? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_redis
    else
        echo "Skipping Redis setup"
        echo "Note: The app will work without Redis using in-memory cache"
    fi
    
    echo ""
    echo "✓ Setup complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Review and update .env file if needed"
    echo "  2. Run './dev.sh dev' to start the development server"
    echo "  3. Open http://localhost:3000 in your browser"
}

start_demo() {
    echo "Starting server and demo..."
    
    # Start server in background
    npm run dev &
    SERVER_PID=$!
    
    echo "Server starting (PID: $SERVER_PID)..."
    echo "Waiting for server to be ready..."
    sleep 5
    
    # Open demo page
    if command -v xdg-open &> /dev/null; then
        xdg-open websocket-demo.html
    elif command -v open &> /dev/null; then
        open websocket-demo.html
    else
        echo "Demo page: websocket-demo.html"
        echo "Please open it manually in your browser"
    fi
    
    echo ""
    echo "Press Ctrl+C to stop the server"
    wait $SERVER_PID
}

# Main script
case "${1}" in
    install)
        install_deps
        ;;
    dev)
        start_dev
        ;;
    build)
        build_project
        ;;
    test)
        run_tests
        ;;
    lint)
        run_lint
        ;;
    format)
        format_code
        ;;
    clean)
        clean_artifacts
        ;;
    redis)
        start_redis
        ;;
    setup)
        setup_complete
        ;;
    demo)
        start_demo
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
