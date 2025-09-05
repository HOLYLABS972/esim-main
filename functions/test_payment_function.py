#!/usr/bin/env python3
"""
Test script for the create_payment_intent Cloud Function
This script helps verify that the function is working correctly
"""

import requests
import json
import os
from datetime import datetime

def test_payment_function():
    """Test the create_payment_intent function"""
    
    # Function URL (replace with your actual project ID)
    PROJECT_ID = "esim-f0e3e"
    FUNCTION_NAME = "createPaymentIntent"
    REGION = "us-central1"
    
    function_url = f"https://{REGION}-{PROJECT_ID}.cloudfunctions.net/{FUNCTION_NAME}"
    
    print(f"🧪 Testing payment function at: {function_url}")
    print("=" * 60)
    
    # Test data
    test_data = {
        "amount": 1000,  # $10.00 in cents
        "currency": "usd",
        "metadata": {
            "test": True,
            "timestamp": datetime.now().isoformat()
        }
    }
    
    print(f"📤 Sending test data: {json.dumps(test_data, indent=2)}")
    
    try:
        # Make the request
        response = requests.post(
            function_url,
            json=test_data,
            headers={
                "Content-Type": "application/json",
                "Origin": "https://esim-main-4sys.vercel.app"
            },
            timeout=30
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        print(f"📥 Response Headers:")
        for key, value in response.headers.items():
            print(f"   {key}: {value}")
        
        if response.status_code == 200:
            print(f"\n✅ Function responded successfully!")
            try:
                response_data = response.json()
                print(f"📄 Response data: {json.dumps(response_data, indent=2)}")
            except json.JSONDecodeError:
                print(f"📄 Response text: {response.text}")
        else:
            print(f"\n❌ Function returned error status: {response.status_code}")
            print(f"📄 Response text: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Request failed: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

def test_cors_preflight():
    """Test CORS preflight request"""
    
    PROJECT_ID = "esim-f0e3e"
    FUNCTION_NAME = "createPaymentIntent"
    REGION = "us-central1"
    
    function_url = f"https://{REGION}-{PROJECT_ID}.cloudfunctions.net/{FUNCTION_NAME}"
    
    print(f"\n🌐 Testing CORS preflight request...")
    
    try:
        # Make OPTIONS request (CORS preflight)
        response = requests.options(
            function_url,
            headers={
                "Origin": "https://esim-main-4sys.vercel.app",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            },
            timeout=30
        )
        
        print(f"📥 Preflight Response Status: {response.status_code}")
        print(f"📥 CORS Headers:")
        
        cors_headers = [
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Methods", 
            "Access-Control-Allow-Headers",
            "Access-Control-Max-Age"
        ]
        
        for header in cors_headers:
            value = response.headers.get(header)
            if value:
                print(f"   {header}: {value}")
            else:
                print(f"   {header}: ❌ Missing")
                
        if response.status_code == 200:
            print("✅ CORS preflight successful")
        else:
            print("❌ CORS preflight failed")
            
    except Exception as e:
        print(f"❌ CORS preflight test failed: {e}")

def main():
    """Main test function"""
    print("🧪 Payment Function Test Suite")
    print("=" * 40)
    
    # Test CORS preflight first
    test_cors_preflight()
    
    # Test the actual function
    test_payment_function()
    
    print("\n📝 Test Summary:")
    print("- If you see CORS errors, the function needs proper CORS configuration")
    print("- If you see authentication errors, the function requires Firebase Auth")
    print("- If you see function not found, the function needs to be deployed")
    print("- If you see internal errors, check the function logs in Firebase Console")

if __name__ == "__main__":
    main()
