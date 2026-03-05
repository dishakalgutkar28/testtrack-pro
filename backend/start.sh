#!/bin/bash
# Railway Startup Script - Set environment variables from Railway service references

echo "🚀 Starting backend server..."
echo "📋 Checking environment variables..."
echo "🔍 Available MySQL variables:"
env | grep -i mysql || echo "⚠️  No MYSQL variables found"
echo ""

# Export Railway MySQL variables if they exist
if [ -n "$MYSQLHOST" ]; then
  export DB_HOST="$MYSQLHOST"
  echo "✅ DB_HOST set from MYSQLHOST: $MYSQLHOST"
else
  echo "❌ MYSQLHOST not found"
fi

if [ -n "$MYSQLUSER" ]; then
  export DB_USER="$MYSQLUSER"
  echo "✅ DB_USER set from MYSQLUSER: $MYSQLUSER"
else
  echo "❌ MYSQLUSER not found"
fi

if [ -n "$MYSQLPASSWORD" ]; then
  export DB_PASSWORD="$MYSQLPASSWORD"
  echo "✅ DB_PASSWORD set"
else
  echo "❌ MYSQLPASSWORD not found"
fi

if [ -n "$MYSQLDATABASE" ]; then
  export DB_NAME="$MYSQLDATABASE"
  echo "✅ DB_NAME set from MYSQLDATABASE: $MYSQLDATABASE"
else
  echo "❌ MYSQLDATABASE not found"
fi

if [ -n "$MYSQLPORT" ]; then
  export DB_PORT="$MYSQLPORT"
  echo "✅ DB_PORT set from MYSQLPORT: $MYSQLPORT"
else
  echo "❌ MYSQLPORT not found"
fi

# Set defaults if not provided
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3000}"

echo ""
echo "📦 Final DB config:"
echo "  DB_HOST: $DB_HOST"
echo "  DB_USER: $DB_USER"
echo "  DB_NAME: $DB_NAME"
echo "  DB_PORT: $DB_PORT"
echo "  JWT_SECRET: ${JWT_SECRET:0:10}..."
echo ""
echo "🔧 Environment configured"
echo "🎯 Starting Node.js server..."

# Start the server
exec node server.js
