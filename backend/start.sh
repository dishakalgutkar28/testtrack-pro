#!/bin/bash
# Railway Startup Script - Set environment variables from Railway service references

echo "🚀 Starting backend server..."
echo "📋 Checking environment variables..."

# Export Railway MySQL variables if they exist
if [ -n "$MYSQLHOST" ]; then
  export DB_HOST="$MYSQLHOST"
  echo "✅ DB_HOST set from Railway MySQL"
fi

if [ -n "$MYSQLUSER" ]; then
  export DB_USER="$MYSQLUSER"
  echo "✅ DB_USER set from Railway MySQL"
fi

if [ -n "$MYSQLPASSWORD" ]; then
  export DB_PASSWORD="$MYSQLPASSWORD"
  echo "✅ DB_PASSWORD set from Railway MySQL"
fi

if [ -n "$MYSQLDATABASE" ]; then
  export DB_NAME="$MYSQLDATABASE"
  echo "✅ DB_NAME set from Railway MySQL"
fi

if [ -n "$MYSQLPORT" ]; then
  export DB_PORT="$MYSQLPORT"
  echo "✅ DB_PORT set from Railway MySQL"
fi

# Set defaults if not provided
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3000}"

echo "🔧 Environment configured"
echo "🎯 Starting Node.js server..."

# Start the server
exec node server.js
