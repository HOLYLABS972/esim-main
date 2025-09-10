import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_config_value(key, fallback_keys=None):
    """Get configuration value from multiple sources"""
    # Try environment variables first
    value = os.environ.get(key)
    if value:
        return value
    
    # Try fallback keys
    if fallback_keys:
        for fallback_key in fallback_keys:
            value = os.environ.get(fallback_key)
            if value:
                return value
    
    # Try Firebase Functions config
    try:
        import firebase_functions.config as config
        if key == 'STRIPE_SECRET_KEY' or key == 'STRIPE_LIVE_SECRET_KEY':
            return config.get('stripe', {}).get('secret_key')
        elif key.startswith('STRIPE_TEST_'):
            return config.get('stripe', {}).get('test_secret_key')
        elif key.startswith('AIRALO_'):
            if key == 'AIRALO_CLIENT_ID':
                # Try Firebase config first
                client_id = config.get('airalo', {}).get('client_id')
                if client_id:
                    return client_id
                # If not in config, try Firestore
                try:
                    from firebase_admin import firestore
                    db = firestore.client()
                    doc_ref = db.collection('config').document('airalo')
                    doc = doc_ref.get()
                    if doc.exists:
                        data = doc.to_dict()
                        # Try both client_id and api_key fields
                        return data.get('client_id') or data.get('api_key')
                except:
                    pass
                return None
            elif key == 'AIRALO_CLIENT_SECRET':
                return config.get('airalo', {}).get('client_secret')
    except:
        pass
    
    return None

# Stripe configuration - production only
STRIPE_SECRET_KEY = get_config_value('STRIPE_SECRET_KEY', ['STRIPE_LIVE_SECRET_KEY'])

# Airalo API configuration - production only
AIRALO_CLIENT_ID = get_config_value('AIRALO_CLIENT_ID')
AIRALO_CLIENT_SECRET = get_config_value('AIRALO_CLIENT_SECRET')

# Validate required environment variables
if not STRIPE_SECRET_KEY:
    print("⚠️ STRIPE_SECRET_KEY not found in environment - will try to load from Firebase config at runtime")
    # Don't raise error here, let it be handled at runtime

if AIRALO_CLIENT_ID:
    print("✅ Airalo client ID loaded from environment/config")
else:
    print("⚠️ Airalo client ID not found in environment - will try to load from Firestore")

if AIRALO_CLIENT_SECRET:
    print("✅ Airalo client secret loaded from environment/config")
else:
    print("⚠️ Airalo client secret not found in environment - will try to load from Firestore")

# Helper function to get Stripe key (production only)
def get_stripe_key():
    """Get Stripe secret key (production only)"""
    return STRIPE_SECRET_KEY

# Helper function to get Airalo client secret
def get_airalo_client_secret():
    """Get Airalo client secret"""
    return AIRALO_CLIENT_SECRET
