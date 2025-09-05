#!/bin/bash

echo "🚀 Starting local payments service..."

# Navigate to payments directory
cd payments

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📥 Installing requirements..."
pip install -r requirements.txt

# Set Flask environment variables
export FLASK_APP=app.py
export FLASK_ENV=development
export FLASK_DEBUG=1

# Start the service
echo "🌐 Starting Flask payments service on http://localhost:5001..."
echo "Press Ctrl+C to stop the service"
python app.py
