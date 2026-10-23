"""
Lexra — Run Server
Run this file to start the API server.
Usage: python run.py
"""
import sys
import os

# Add lexra root to path
sys.path.insert(0, os.path.dirname(__file__))

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "src.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
