#!/bin/bash

# Microservices E-Commerce Setup Script
echo "🚀 Setting up Microservices E-Commerce Platform..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create directories if they don't exist
echo "📁 Creating project structure..."
mkdir -p {api-gateway,user-service,inventory-service,payment-service,proto,scripts}/{src,target,node_modules}

# Function to check if required tools are installed
check_tools() {
    echo "🔍 Checking required tools..."

    # Check Node.js
    if ! command -v node &>/dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi

    # Check Java
    if ! command -v java &>/dev/null; then
        echo "❌ Java is not installed. Please install Java 17+ and try again."
        exit 1
    fi

    # Check Maven
    if ! command -v mvn &>/dev/null; then
        echo "❌ Maven is not installed. Please install Maven and try again."
        exit 1
    fi

    echo "✅ All required tools are available."
}

# Initialize Node.js services
init_node_services() {
    echo "📦 Initializing Node.js services..."

    # API Gateway
    if [ ! -f "api-gateway/package.json" ]; then
        cd api-gateway
        npm init -y
        npm install express cors helmet morgan dotenv
        npm install --save-dev nodemon
        cd ..
    fi

    # Inventory Service
    if [ ! -f "inventory-service/package.json" ]; then
        cd inventory-service
        npm init -y
        npm install express mongoose cors helmet morgan dotenv @grpc/grpc-js @grpc/proto-loader
        npm install --save-dev nodemon
        cd ..
    fi
}

# Build Java services
build_java_services() {
    echo "⚙️ Building Java services..."

    # User Service
    if [ -f "user-service/pom.xml" ]; then
        cd user-service
        mvn clean compile -q
        cd ..
    fi

    # Payment Service
    if [ -f "payment-service/pom.xml" ]; then
        cd payment-service
        mvn clean compile -q
        cd ..
    fi
}

# Start development environment
start_dev() {
    echo "🔄 Starting development environment..."
    docker-compose up -d postgres-user postgres-payment mongodb
    echo "✅ Databases are starting up..."
    echo "📊 You can now start individual services for development:"
    echo "   - User Service: cd user-service && mvn spring-boot:run"
    echo "   - Inventory Service: cd inventory-service && npm run dev"
    echo "   - Payment Service: cd payment-service && mvn spring-boot:run"
    echo "   - API Gateway: cd api-gateway && npm run dev"
}

# Stop development environment
stop_dev() {
    echo "🛑 Stopping development environment..."
    docker-compose down
    echo "✅ All services stopped."
}

# Build and start all services
start_all() {
    echo "🚀 Building and starting all services..."
    docker-compose up --build
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup     - Initial project setup"
    echo "  dev       - Start databases for development"
    echo "  stop      - Stop all services"
    echo "  build     - Build and start all services"
    echo "  help      - Show this help message"
    echo ""
    echo "Development workflow:"
    echo "1. Run './scripts/setup.sh setup' for initial setup"
    echo "2. Run './scripts/setup.sh dev' to start databases"
    echo "3. Start individual services in separate terminals"
    echo "4. Use './scripts/setup.sh stop' when done"
}

# Main script logic
case "$1" in
setup)
    check_tools
    init_node_services
    build_java_services
    echo "✅ Setup complete! Run './scripts/setup.sh help' for next steps."
    ;;
dev)
    start_dev
    ;;
stop)
    stop_dev
    ;;
build)
    start_all
    ;;
help)
    show_help
    ;;
*)
    echo "❓ Unknown command: $1"
    show_help
    exit 1
    ;;
esac
