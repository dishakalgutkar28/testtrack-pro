#!/bin/bash
# Create .env file from Railway environment variables

echo "Creating .env file from Railway environment..."

cat > /app/backend/.env << EOF
NODE_ENV=${NODE_ENV:-production}
PORT=${PORT:-3000}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
JWT_SECRET=${JWT_SECRET}
REFRESH_SECRET=${REFRESH_SECRET}
CORS_ORIGIN=${CORS_ORIGIN:-*}
EOF

echo ".env file created successfully"
cat /app/backend/.env | sed 's/PASSWORD=.*/PASSWORD=****/g' | sed 's/SECRET=.*/SECRET=****/g'

# Start the server
echo "Starting server..."
exec node /app/backend/server.js
