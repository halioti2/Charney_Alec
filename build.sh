#!/usr/bin/env bash
# Build script for Render deployment

set -o errexit  # Exit on error

echo "======================================"
echo "Building Charney Commission Tracker"
echo "======================================"

# Install Python dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
echo "Creating directories..."
mkdir -p logs
mkdir -p src

# Initialize database
echo "Initializing database..."
python -c "
from src.database.models import DatabaseManager
from config.config import config
db = DatabaseManager(config.get_database_url())
db.create_tables()
print('Database initialized successfully')
"

echo "======================================"
echo "Build completed successfully!"
echo "======================================"

