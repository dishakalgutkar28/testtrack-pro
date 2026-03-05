#!/bin/bash

# TestTrack Pro - Docker Deployment Script
# This script helps deploy TestTrack Pro using Docker

set -e

echo "=================================="
echo "TestTrack Pro - Docker Setup"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker installation
echo -e "${BLUE}Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please edit .env with your configuration!${NC}"
    echo "Edit .env and set these values:"
    echo "  - MYSQL_PASSWORD"
    echo "  - JWT_SECRET"
    echo "  - GMAIL_USER and GMAIL_PASSWORD"
    echo ""
    read -p "Press ENTER after updating .env file..."
fi

# Start services
echo -e "${BLUE}Building Docker images...${NC}"
docker-compose build

echo -e "${BLUE}Starting services...${NC}"
docker-compose up -d

# Wait for database to be ready
echo -e "${BLUE}Waiting for database to start...${NC}"
for i in {1..30}; do
    if docker-compose exec -T database mysql -u testtrack -ptesttrack123 testtrack -e "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✓ Database is ready${NC}"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 1
done

# Run migrations
echo -e "${BLUE}Running database migrations...${NC}"
docker-compose exec -T backend mysql -h database -u testtrack -ptesttrack123 testtrack < backend/migrations/001_add_indexes.sql || echo "Migrations may have already been applied"

# Wait for services to be healthy
echo -e "${BLUE}Waiting for services to start...${NC}"
sleep 5

# Check health
echo -e "${BLUE}Checking services health...${NC}"
if curl -f http://localhost:5000/api/health &> /dev/null; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Backend is not responding yet, it may need more time${NC}"
fi

if curl -f http://localhost:3000 &> /dev/null; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Frontend is not responding yet, it may need more time${NC}"
fi

# Display service information
echo ""
echo "=================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=================================="
echo ""
echo "Services are running at:"
echo -e "${BLUE}Frontend:   http://localhost:3000${NC}"
echo -e "${BLUE}Backend:    http://localhost:5000${NC}"
echo -e "${BLUE}API Docs:   http://localhost:5000/api/docs${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:           docker-compose logs -f"
echo "  Stop services:       docker-compose down"
echo "  Run tests:           docker-compose exec backend npm test"
echo "  Access database:     docker-compose exec database mysql -u testtrack -p testtrack"
echo ""
echo -e "${YELLOW}Note: Allow 30-60 seconds for all services to fully start${NC}"
