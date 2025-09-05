#!/usr/bin/env python3
"""
Deployment verification script for Firebase Cloud Functions
This script helps diagnose and fix deployment issues
"""

import subprocess
import sys
import os
import json
from pathlib import Path

def run_command(command, description):
    """Run a shell command and return the result"""
    print(f"\n🔧 {description}")
    print(f"Running: {command}")
    
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
            if result.stdout:
                print(f"Output: {result.stdout}")
            return True
        else:
            print(f"❌ {description} failed")
            if result.stderr:
                print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error running {description}: {e}")
        return False

def check_firebase_cli():
    """Check if Firebase CLI is installed and accessible"""
    return run_command("firebase --version", "Checking Firebase CLI version")

def check_firebase_login():
    """Check if user is logged into Firebase"""
    return run_command("firebase projects:list", "Checking Firebase authentication")

def deploy_functions():
    """Deploy the Cloud Functions"""
    print("\n🚀 Deploying Cloud Functions...")
    
    # Change to functions directory
    os.chdir("functions")
    
    # Install dependencies
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        print("❌ Failed to install dependencies")
        return False
    
    # Go back to root directory
    os.chdir("..")
    
    # Deploy functions
    if not run_command("firebase deploy --only functions", "Deploying Cloud Functions"):
        print("❌ Failed to deploy functions")
        return False
    
    return True

def verify_functions():
    """Verify that functions are properly deployed"""
    print("\n🔍 Verifying function deployment...")
    
    # List deployed functions
    if not run_command("firebase functions:list", "Listing deployed functions"):
        print("❌ Failed to list functions")
        return False
    
    return True

def check_function_logs():
    """Check function logs for any errors"""
    print("\n📋 Checking function logs...")
    
    # Get recent logs
    if not run_command("firebase functions:log --limit 20", "Getting recent function logs"):
        print("❌ Failed to get function logs")
        return False
    
    return True

def main():
    """Main deployment verification process"""
    print("🚀 Firebase Cloud Functions Deployment Verification")
    print("=" * 50)
    
    # Check prerequisites
    if not check_firebase_cli():
        print("❌ Firebase CLI not available. Please install it first.")
        print("   npm install -g firebase-tools")
        return False
    
    if not check_firebase_login():
        print("❌ Not logged into Firebase. Please run 'firebase login' first.")
        return False
    
    # Deploy functions
    if not deploy_functions():
        print("❌ Function deployment failed")
        return False
    
    # Verify deployment
    if not verify_functions():
        print("❌ Function verification failed")
        return False
    
    # Check logs
    if not check_function_logs():
        print("⚠️ Could not check function logs")
    
    print("\n✅ Deployment verification completed!")
    print("\n📝 Next steps:")
    print("1. Test your payment function from the frontend")
    print("2. Check the Firebase console for any deployment errors")
    print("3. Verify the function is accessible at the correct URL")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
