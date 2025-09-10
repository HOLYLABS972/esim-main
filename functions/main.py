# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_admin import initialize_app, firestore
import json
import stripe
import os
import requests
from datetime import datetime
from functools import wraps
import config  # Load environment variables

# Initialize Firebase app
initialize_app()

# Import Airalo API
try:
    from airalo_api import AiraloAPI
    print("✅ Airalo API imported successfully")
except ImportError as e:
    print(f"⚠️ Airalo API not imported: {e}")
except Exception as e:
    print(f"⚠️ Error importing Airalo API: {e}")

# Import registration functions
try:
    from registration_functions import (
        generate_registration_code,
        validate_registration_code,
        mark_registration_code_used,
        cleanup_expired_codes
    )
    print("✅ Registration functions imported successfully")
except ImportError as e:
    print(f"⚠️ Registration functions not imported: {e}")
except Exception as e:
    print(f"⚠️ Error importing registration functions: {e}")

def get_db():
    """Lazy initialization of Firestore client"""
    return firestore.client()

def init_stripe():
    """Initialize Stripe with production key"""
    try:
        from config import get_stripe_key
        stripe_key = get_stripe_key()
        stripe.api_key = stripe_key
        print(f"✅ Stripe initialized in production mode")
        return True
    except Exception as e:
        print(f"❌ Error initializing Stripe: {e}")
        return False

def get_stripe_mode_from_firestore():
    """Get the current Stripe mode from Firestore"""
    try:
        db = firestore.client()
        doc_ref = db.collection('config').document('stripe')
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            mode = data.get('mode', 'test')
            print(f"🔧 Retrieved Stripe mode from Firestore: {mode}")
            return mode
        else:
            print("⚠️ No Stripe config found in Firestore, defaulting to test mode")
            return 'test'
    except Exception as e:
        print(f"❌ Error getting Stripe mode from Firestore: {e}")
        return 'test'

def get_environment_from_firestore():
    """Get the current environment (DataPlans) from Firestore"""
    try:
        db = firestore.client()
        # Check if there's a specific environment config
        doc_ref = db.collection('config').document('environment')
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            env = data.get('mode', 'test')
            print(f"🔧 Retrieved environment mode from Firestore: {env}")
            return env
        else:
            # Fallback to checking the admin panel's localStorage equivalent
            # For now, we'll use the same as Stripe mode since they're often linked
            stripe_mode = get_stripe_mode_from_firestore()
            env = 'prod' if stripe_mode == 'live' else 'test'
            print(f"⚠️ No environment config found, using Stripe mode as fallback: {env}")
            return env
    except Exception as e:
        print(f"❌ Error getting environment from Firestore: {e}")
        return 'test'

def ensure_stripe_initialized(mode=None):
    """Ensure Stripe is initialized with the correct mode"""
    if mode is None:
        mode = get_stripe_mode_from_firestore()
    
    # Always reinitialize to ensure we have the correct key
    return init_stripe(mode)


def require_stripe(f):
    """Decorator to ensure Stripe is initialized before function execution"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        ensure_stripe_initialized()
        return f(*args, **kwargs)
    return wrapper

@https_fn.on_call()
@require_stripe
def create_customer(req: https_fn.CallableRequest) -> any:
    """Create a Stripe customer for the user"""
    try:
        data = req.data
        user_id = req.auth.uid if req.auth else None
        email = data.get('email')
        name = data.get('name')

        if not user_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message='User must be authenticated'
            )

        # Check if customer already exists for current mode
        db = get_db()
        current_mode = get_stripe_mode_from_firestore()
        customer_ref = db.collection('stripe_customers').document(user_id)
        customer_doc = customer_ref.get()

        if customer_doc.exists:
            customer_data = customer_doc.to_dict()
            mode_specific_key = f'customerId_{current_mode}'
            if mode_specific_key in customer_data:
                return {'customerId': customer_data[mode_specific_key]}

        # Create new Stripe customer
        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata={'firebaseUID': user_id, 'mode': current_mode}
        )

        # Save customer ID to Firestore with mode-specific key
        mode_specific_key = f'customerId_{current_mode}'
        update_data = {
            mode_specific_key: customer.id,
            'email': email,
            'name': name,
            f'created_{current_mode}': firestore.SERVER_TIMESTAMP
        }
        
        # Use merge=True to preserve existing data for other modes
        customer_ref.set(update_data, merge=True)

        return {'customerId': customer.id}

    except Exception as e:
        print(f"❌ Error creating customer: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Error creating customer: {str(e)}'
        )

@https_fn.on_call()
@require_stripe
def create_setup_intent(req: https_fn.CallableRequest) -> any:
    """Create a SetupIntent for saving a payment method"""
    try:
        user_id = req.auth.uid if req.auth else None
        
        if not user_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message='User must be authenticated'
            )

        # Get customer ID from Firestore for current mode
        db = get_db()
        current_mode = get_stripe_mode_from_firestore()
        customer_doc = db.collection('stripe_customers').document(user_id).get()
        if not customer_doc.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message='Customer not found. Please create customer first.'
            )

        customer_data = customer_doc.to_dict()
        mode_specific_key = f'customerId_{current_mode}'
        if mode_specific_key not in customer_data:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message=f'Customer not found for {current_mode} mode. Please create customer first.'
            )

        customer_id = customer_data[mode_specific_key]

        # Create SetupIntent
        setup_intent = stripe.SetupIntent.create(
            customer=customer_id,
            payment_method_types=['card'],
            usage='off_session'  # Allow using this payment method for future payments
        )

        return {'clientSecret': setup_intent.client_secret}

    except Exception as e:
        print(f"❌ Error creating setup intent: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Error creating setup intent: {str(e)}'
        )

@https_fn.on_call()
@require_stripe
def list_payment_methods(req: https_fn.CallableRequest) -> any:
    """List saved payment methods for a customer"""
    try:
        user_id = req.auth.uid if req.auth else None
        
        if not user_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message='User must be authenticated'
            )

        # Get customer ID from Firestore for current mode
        db = get_db()
        current_mode = get_stripe_mode_from_firestore()
        customer_doc = db.collection('stripe_customers').document(user_id).get()
        if not customer_doc.exists:
            return {'paymentMethods': []}

        customer_data = customer_doc.to_dict()
        mode_specific_key = f'customerId_{current_mode}'
        if mode_specific_key not in customer_data:
            return {'paymentMethods': []}

        customer_id = customer_data[mode_specific_key]

        # Get customer info to check default payment method
        customer = stripe.Customer.retrieve(customer_id)
        default_payment_method_id = customer.invoice_settings.default_payment_method

        # List payment methods
        payment_methods = stripe.PaymentMethod.list(
            customer=customer_id,
            type='card'
        )

        # Format payment methods for response
        formatted_methods = [{
            'id': pm.id,
            'brand': pm.card.brand,
            'last4': pm.card.last4,
            'expMonth': pm.card.exp_month,
            'expYear': pm.card.exp_year,
            'isDefault': pm.id == default_payment_method_id
        } for pm in payment_methods.data]

        return {'paymentMethods': formatted_methods}

    except Exception as e:
        print(f"❌ Error listing payment methods: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Error listing payment methods: {str(e)}'
        )

@https_fn.on_call()
@require_stripe
def create_payment_intent(req: https_fn.CallableRequest) -> any:
    """Create a payment intent with optional saved payment method"""
    try:
        data = req.data
        user_id = req.auth.uid if req.auth else None
        
        if not user_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message='User must be authenticated'
            )

        amount = data.get('amount')
        currency = data.get('currency', 'usd')
        payment_method_id = data.get('paymentMethodId')  # Optional
        payment_method_types = data.get('payment_method_types', ['card'])  # Default to card

        # Debug logging
        print(f"🔍 Received data: {data}")
        print(f"🔍 Amount received: {amount} (type: {type(amount)})")
        print(f"🔍 Currency: {currency}")
        print(f"🔍 Payment Method ID: {payment_method_id}")
        print(f"🔍 Payment Method Types: {payment_method_types}")

        # Validate amount
        if amount is None:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message=f'Amount is missing from request'
            )

        # Handle different amount formats
        try:
            if isinstance(amount, dict):
                # If amount is a dict, it might have a 'value' key or similar
                if 'value' in amount:
                    amount_value = amount['value']
                elif '_value' in amount:
                    amount_value = amount['_value']
                else:
                    # Take the first numeric value found
                    amount_value = next((v for v in amount.values() if isinstance(v, (int, float, str))), None)
                    if amount_value is None:
                        raise ValueError(f"No numeric value found in amount dict: {amount}")
                print(f"🔍 Extracted amount value from dict: {amount_value}")
                amount = amount_value
            
            amount_int = int(float(amount))
        except (ValueError, TypeError) as e:
            print(f"❌ Amount conversion error: {e}")
            print(f"❌ Amount value: {amount} (type: {type(amount)})")
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message=f'Invalid amount format: {amount}. Expected a number, got {type(amount).__name__}'
            )

        if amount_int <= 0:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message=f'Invalid amount: {amount_int}'
            )

        # Get customer ID for current mode
        db = get_db()
        current_mode = get_stripe_mode_from_firestore()
        customer_doc = db.collection('stripe_customers').document(user_id).get()
        if not customer_doc.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message='Customer not found'
            )

        customer_data = customer_doc.to_dict()
        mode_specific_key = f'customerId_{current_mode}'
        if mode_specific_key not in customer_data:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message=f'Customer not found for {current_mode} mode. Please create customer first.'
            )

        customer_id = customer_data[mode_specific_key]

        # Create payment intent
        payment_intent_params = {
            'amount': amount_int,
            'currency': currency,
            'customer': customer_id,
        }

        if payment_method_id:
            # Use specific payment method but don't auto-confirm
            # Let the client handle confirmation
            payment_intent_params['payment_method'] = payment_method_id
        else:
            # Always use automatic payment methods for Apple Pay support
            # This enables both Apple Pay and card payments
            payment_intent_params['automatic_payment_methods'] = {'enabled': True}
            print("🍎 Automatic payment methods enabled (includes Apple Pay and cards)")

        payment_intent = stripe.PaymentIntent.create(**payment_intent_params)
        
        # Try to confirm the payment if we have a payment method
        if payment_method_id:
            try:
                # For saved payment methods, we can confirm immediately using off_session
                confirmed_intent = stripe.PaymentIntent.confirm(
                    payment_intent.id,
                    payment_method=payment_method_id,
                    off_session=True  # This indicates we can charge without customer interaction
                )
                payment_intent = confirmed_intent
                print(f"✅ Payment confirmed successfully for saved payment method")
            except stripe.error.StripeError as confirm_error:
                print(f"⚠️ Payment confirmation failed: {confirm_error}")
                # If off_session fails, it might require customer authentication
                # Return the intent for client-side handling
                if 'authentication_required' in str(confirm_error):
                    print("🔐 Payment requires customer authentication")
                else:
                    # For other errors, raise the exception
                    raise confirm_error

        return {
            'clientSecret': payment_intent.client_secret,
            'requiresAction': payment_intent.status == 'requires_action'
        }

    except stripe.error.StripeError as e:
        print(f"❌ Stripe error: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Stripe error: {str(e)}'
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Error creating payment intent: {str(e)}")
        print(f"❌ Full error traceback: {error_details}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Error creating payment intent: {str(e)}'
        )

@https_fn.on_call()
@require_stripe
def delete_payment_method(req: https_fn.CallableRequest) -> any:
    """Delete a saved payment method"""
    try:
        data = req.data
        user_id = req.auth.uid if req.auth else None
        payment_method_id = data.get('paymentMethodId')

        if not user_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message='User must be authenticated'
            )

        if not payment_method_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message='Payment method ID is required'
            )

        # Verify the payment method belongs to the user
        db = get_db()
        current_mode = get_stripe_mode_from_firestore()
        customer_doc = db.collection('stripe_customers').document(user_id).get()
        if not customer_doc.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message='Customer not found'
            )

        customer_data = customer_doc.to_dict()
        mode_specific_key = f'customerId_{current_mode}'
        if mode_specific_key not in customer_data:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message=f'Customer not found for {current_mode} mode'
            )

        customer_id = customer_data[mode_specific_key]

        # Detach payment method from customer
        payment_method = stripe.PaymentMethod.retrieve(payment_method_id)
        if payment_method.customer != customer_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message='Payment method does not belong to this customer'
            )

        payment_method.detach()
        return {'success': True}

    except stripe.error.StripeError as e:
        print(f"❌ Stripe error: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Stripe error: {str(e)}'
        )
    except Exception as e:
        print(f"❌ Error deleting payment method: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Error deleting payment method: {str(e)}'
        )

@https_fn.on_call()
@require_stripe
def set_default_payment_method(req: https_fn.CallableRequest) -> any:
    """Set a payment method as the default for a customer"""
    try:
        data = req.data
        user_id = req.auth.uid if req.auth else None
        payment_method_id = data.get('paymentMethodId')

        if not user_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message='User must be authenticated'
            )

        if not payment_method_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message='Payment method ID is required'
            )

        # Get customer ID from Firestore for current mode
        db = get_db()
        current_mode = get_stripe_mode_from_firestore()
        customer_doc = db.collection('stripe_customers').document(user_id).get()
        if not customer_doc.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message='Customer not found'
            )

        customer_data = customer_doc.to_dict()
        mode_specific_key = f'customerId_{current_mode}'
        if mode_specific_key not in customer_data:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message=f'Customer not found for {current_mode} mode. Please create customer first.'
            )

        customer_id = customer_data[mode_specific_key]

        # Verify the payment method belongs to this customer
        payment_method = stripe.PaymentMethod.retrieve(payment_method_id)
        if payment_method.customer != customer_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message='Payment method does not belong to this customer'
            )

        # Update customer's default payment method in Stripe
        stripe.Customer.modify(
            customer_id,
            invoice_settings={
                'default_payment_method': payment_method_id
            }
        )

        return {'success': True, 'defaultPaymentMethodId': payment_method_id}

    except stripe.error.StripeError as e:
        print(f"❌ Stripe error: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Stripe error: {str(e)}'
        )
    except Exception as e:
        print(f"❌ Error setting default payment method: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Error setting default payment method: {str(e)}'
        )

def get_airalo_api_key():
    """Get Airalo API key from Firestore"""
    try:
        db = firestore.client()
        doc_ref = db.collection('config').document('airalo')
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            api_key = data.get('api_key')
            if api_key:
                print("✅ Airalo API key loaded from Firestore")
                return api_key
        
        print("❌ Airalo API key not found in Firestore")
        return None
    except Exception as e:
        print(f"❌ Error loading Airalo API key from Firestore: {e}")
        return None

def get_airalo_environment():
    """Get Airalo environment (test/prod) from Firestore"""
    try:
        db = firestore.client()
        doc_ref = db.collection('config').document('airalo')
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            env_mode = data.get('environment', 'test')
            print(f"✅ Airalo environment loaded from Firestore: {env_mode}")
            return env_mode
        
        print("⚠️ Airalo environment not found in Firestore, defaulting to test")
        return 'test'
    except Exception as e:
        print(f"❌ Error loading Airalo environment: {e}")
        return 'test'

def save_airalo_client_secret(client_secret):
    """Save Airalo client secret to Firestore"""
    try:
        db = firestore.client()
        doc_ref = db.collection('config').document('airalo')
        
        # Update the document with client secret
        doc_ref.set({
            'client_secret': client_secret,
            'updated_at': firestore.SERVER_TIMESTAMP,
            'updated_by': 'admin'
        }, merge=True)
        
        print(f"✅ Airalo client secret saved to Firestore")
        return True
    except Exception as e:
        print(f"❌ Error saving Airalo client secret: {e}")
        return False

@https_fn.on_call()
def save_airalo_client_secret_fn(req: https_fn.CallableRequest) -> any:
    """Save Airalo client secret from frontend"""
    try:
        client_secret = req.data.get('client_secret')
        
        if not client_secret:
            return {
                'success': False,
                'error': 'Client secret is required'
            }
        
        # Save to Firestore
        success = save_airalo_client_secret(client_secret)
        
        if success:
            return {
                'success': True,
                'message': 'Airalo client secret saved successfully'
            }
        else:
            return {
                'success': False,
                'error': 'Failed to save client secret'
            }
            
    except Exception as e:
        print(f"❌ Error in save_airalo_client_secret_fn: {e}")
        return {
            'success': False,
            'error': f'Error saving client secret: {str(e)}'
        }

@https_fn.on_call()
def sync_countries_from_airalo(req: https_fn.CallableRequest) -> any:
    """Admin function: Manually sync countries from Airalo API"""
    try:
        from datetime import datetime
        
        # Get API key from Firestore
        api_token = get_airalo_api_key()
        if not api_token:
            return {
                'success': False,
                'error': 'Airalo API key not configured in Firestore. Please set it in the admin panel.'
            }
        
        # Get environment from Firestore
        env_mode = get_airalo_environment()
        
        print(f"🔧 Using Airalo API in {env_mode} mode")
        
        # Initialize Airalo API
        api = AiraloAPI(env_mode)
        
        # Fetch countries from API
        print("🌍 Fetching countries from Airalo API...")
        countries_result = api.get_countries()
        
        if not countries_result['success']:
            return {
                'success': False,
                'error': f"Failed to fetch countries: {countries_result['error']}"
            }
        
        countries_list = countries_result['countries']
        
        # Save to Firestore
        db = get_db()
        batch = db.batch()
        synced_count = 0
        
        for country in countries_list:
            country_code = country.get('code', '')
            country_name = country.get('name', '')
            
            if not country_code or not country_name:
                continue
                
            country_ref = db.collection('countries').document(country_code)
            batch.set(country_ref, {
                'name': country_name,
                'code': country_code,
                'flag': country.get('flag', ''),
                'region_slug': country.get('region_slug', ''),
                'is_roaming': country.get('is_roaming', False),
                'status': 'active',
                'updated_at': firestore.SERVER_TIMESTAMP,
                'synced_at': datetime.now().isoformat(),
                'provider': 'airalo'
            }, merge=True)
            synced_count += 1
        
        batch.commit()
        
        # Create sync log
        log_ref = db.collection('sync_logs').document()
        log_ref.set({
            'timestamp': firestore.SERVER_TIMESTAMP,
            'countries_synced': synced_count,
            'regions_synced': 0,
            'plans_synced': 0,
            'status': 'completed',
            'source': 'admin_manual_sync',
            'sync_type': 'countries_only',
            'provider': 'airalo'
        })
        
        print(f"✅ Successfully synced {synced_count} countries from Airalo")
        
        return {
            'success': True,
            'message': f'Successfully synced {synced_count} countries from Airalo',
            'countries_synced': synced_count
        }
        
    except Exception as e:
        print(f"❌ Error syncing countries from Airalo: {e}")
        return {
            'success': False,
            'error': str(e)
        }

@https_fn.on_call()
def sync_all_data_from_airalo(req: https_fn.CallableRequest) -> any:
    """Admin function: Sync all data (countries, regions, packages) from Airalo API"""
    try:
        import requests
        from datetime import datetime
        
        # Get API key from Firestore (same as working function)
        api_token = get_dataplans_api_key()
        if not api_token:
            return {
                'success': False,
                'error': 'DataPlans API key not configured in Firestore. Please set it in the admin panel.'
            }
        
        # Get environment from Firestore (same as working function)
        env_mode = get_dataplans_environment()
        base_url = 'https://sandbox.dataplans.io/api/v1' if env_mode == 'test' else 'https://api.dataplans.io/api/v1'
        
        print(f"🔧 Using DataPlans API: {base_url}")
        
        headers = {
            'Authorization': f'Bearer {api_token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        db = get_db()
        total_synced = {'countries': 0, 'regions': 0, 'plans': 0}
        
        # Fetch and sync countries
        try:
            print("🌍 Fetching countries from DataPlans API...")
            response = requests.get(f'{base_url}/countries', headers=headers, timeout=30)
            response.raise_for_status()
            countries_list = response.json()
            
            batch = db.batch()
            for country in countries_list:
                country_code = country.get('countryCode', '')
                country_name = country.get('countryName', '')
                
                if not country_code or not country_name:
                    continue
                    
                country_ref = db.collection('countries').document(country_code)
                batch.set(country_ref, {
                    'name': country_name,
                    'code': country_code,
                    'status': 'active',
                    'updated_at': firestore.SERVER_TIMESTAMP,
                    'synced_at': datetime.now().isoformat()
                }, merge=True)
                total_synced['countries'] += 1
            batch.commit()
            print(f"✅ Synced {total_synced['countries']} countries")
        except Exception as e:
            print(f"⚠️ Error syncing countries: {e}")
        
        # Fetch and sync plans
        try:
            print("📱 Fetching plans from DataPlans API...")
            response = requests.get(f'{base_url}/plans', headers=headers, timeout=30)
            response.raise_for_status()
            plans_list = response.json()
            
            batch = db.batch()
            for plan in plans_list:
                plan_slug = plan.get('slug', '')
                plan_name = plan.get('name', '')
                
                if not plan_slug or not plan_name:
                    continue
                    
                plan_ref = db.collection('plans').document(plan_slug)
                country_codes = [country.get('countryCode', '') for country in plan.get('countries', [])]
                
                # Debug: Log the first plan to see its structure
                if total_synced['plans'] == 0:
                    print(f"🔍 Sample plan data from API: {plan}")
                    print(f"🔍 Available fields: {list(plan.keys())}")
                    print(f"🔍 Price fields: price={plan.get('price')}, priceAmount={plan.get('priceAmount')}, cost={plan.get('cost')}, amount={plan.get('amount')}")
                    print(f"🔍 All numeric fields: {[(k, v) for k, v in plan.items() if isinstance(v, (int, float))]}")
                    print(f"🔍 All string fields: {[(k, v) for k, v in plan.items() if isinstance(v, str)]}")
                
                # Try different possible price field names - be more aggressive
                price = (plan.get('price') or 
                        plan.get('priceAmount') or 
                        plan.get('cost') or 
                        plan.get('amount') or 
                        plan.get('price_amount') or
                        plan.get('price_value') or
                        plan.get('value') or
                        plan.get('rate') or
                        plan.get('fee') or
                        0)
                
                # Try different currency field names
                currency = (plan.get('priceCurrency') or 
                          plan.get('currency') or 
                          plan.get('price_currency') or 
                          plan.get('priceCurrencyCode') or
                          plan.get('currencyCode') or
                          plan.get('price_code') or
                          'USD')
                
                # Handle -1 capacity (unlimited data)
                capacity = plan.get('capacity', 0)
                if capacity == -1:
                    capacity = 'Unlimited'
                
                # Debug: Log what we found
                if total_synced['plans'] == 0:
                    print(f"🔍 Extracted: price={price}, currency={currency}, capacity={capacity}")
                
                batch.set(plan_ref, {
                    'slug': plan_slug,
                    'name': plan_name,
                    'description': plan.get('description', ''),
                    'price': price,
                    'currency': currency,
                    'capacity': capacity,
                    'period': plan.get('period', 0),
                    'country_codes': country_codes,
                    'operator': plan.get('operator', ''),
                    'status': 'active',
                    'updated_at': firestore.SERVER_TIMESTAMP,
                    'synced_at': datetime.now().isoformat()
                }, merge=True)
                total_synced['plans'] += 1
            batch.commit()
            print(f"✅ Synced {total_synced['plans']} plans")
        except Exception as e:
            print(f"⚠️ Error syncing plans: {e}")
        
        # Create comprehensive sync log
        log_ref = db.collection('sync_logs').document()
        log_ref.set({
            'timestamp': firestore.SERVER_TIMESTAMP,
            'countries_synced': total_synced['countries'],
            'regions_synced': total_synced['regions'],
            'plans_synced': total_synced['plans'],
            'status': 'completed',
            'source': 'admin_manual_sync',
            'sync_type': 'complete_sync'
        })
        
        total_items = sum(total_synced.values())
        print(f"🎉 Successfully synced all data: {total_items} total items")
        
        return {
            'success': True,
            'message': f'Successfully synced all data: {total_items} total items',
            'countries_synced': total_synced['countries'],
            'regions_synced': total_synced['regions'],
            'plans_synced': total_synced['plans'],
            'total_synced': total_items
        }
        
    except Exception as e:
        print(f"❌ Error syncing all data: {e}")
        return {
            'success': False,
            'error': str(e)
        }

@https_fn.on_call()
def create_order(req: https_fn.CallableRequest) -> any:
    """
    Create eSIM order HTTP endpoint
    """
    try:
        # Check authentication
        if not req.auth or not req.auth.uid:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message='User must be authenticated'
            )

        # Get plan ID from request
        plan_id = req.data.get('planId')
        if not plan_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message='planId is required'
            )

        print(f"📱 Creating eSIM order for plan: {plan_id} (User: {req.auth.uid})")

        # Import and call the create_order function
        from esim_functions import create_order as create_esim_order
        result = create_esim_order(plan_id)

        return result

    except https_fn.HttpsError:
        raise
    except Exception as e:
        print(f"❌ Error in create_order endpoint: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Failed to create order: {str(e)}'
        )

@https_fn.on_call()
def process_wallet_payment(req: https_fn.CallableRequest) -> any:
    """
    Process wallet payment HTTP endpoint
    """
    try:
        # Check authentication
        if not req.auth or not req.auth.uid:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message='User must be authenticated'
            )

        # Get parameters
        order_id = req.data.get('orderId')
        amount = req.data.get('amount')

        if not order_id or not amount:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message='orderId and amount are required'
            )

        print(f"💰 Processing wallet payment: ${amount} for order {order_id} (User: {req.auth.uid})")

        # Import and call the wallet payment function
        from esim_functions import process_wallet_payment as process_wallet
        result = process_wallet(order_id, req.auth.uid, float(amount))

        return result

    except https_fn.HttpsError:
        raise
    except Exception as e:
        print(f"❌ Error in process_wallet_payment endpoint: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Failed to process wallet payment: {str(e)}'
        )

@https_fn.on_call()
def fetch_plans(req: https_fn.CallableRequest) -> any:
    """
    Get countries + packages from Airalo API with CORS support
    """
    try:
        print("🌍 Fetch plans endpoint called")
        
        # Import Airalo API
        from airalo_api import AiraloAPI
        
        # Initialize API client
        env_mode = get_airalo_environment()
        api = AiraloAPI(env_mode)
        
        print("🌍 Getting countries from Airalo API...")
        countries_result = api.get_countries()
        if not countries_result['success']:
            raise Exception(f"Failed to get countries: {countries_result['error']}")
        
        print("📱 Getting packages from Airalo API...")
        packages_result = api.get_packages()
        if not packages_result['success']:
            raise Exception(f"Failed to get packages: {packages_result['error']}")
        
        print(f"✅ Got {len(countries_result['countries'])} countries and {len(packages_result['packages'])} packages")
        
        return {
            'success': True,
            'countries': countries_result['countries'],
            'plans': packages_result['packages']  # Keep 'plans' key for backward compatibility
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        print(f"❌ Error in fetch_plans endpoint: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Failed to get plans: {str(e)}'
        )

@https_fn.on_call()
def getEsimQrCode(req: https_fn.CallableRequest) -> any:
    """
    Get eSIM QR code from Airalo API
    """
    try:
        # Check authentication
        if not req.auth or not req.auth.uid:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message='User must be authenticated'
            )

        # Get order ID from request
        order_id = req.data.get('orderId')
        if not order_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message='orderId is required'
            )

        print(f"📱 Getting eSIM QR code for order: {order_id} (User: {req.auth.uid})")

        # Get order details from Firestore (mobile app collection structure)
        db = get_db()
        user_id = req.auth.uid
        
        # Try to find order in users/{userId}/esims collection first
        order_doc = db.collection('users').document(user_id).collection('esims').document(order_id).get()
        
        if not order_doc.exists:
            # Fallback: try the old orders collection
            order_doc = db.collection('orders').document(order_id).get()
            
            if not order_doc.exists:
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.NOT_FOUND,
                    message='Order not found in either users/{userId}/esims or orders collection'
                )
        
        order_data = order_doc.to_dict()
        esim_id = order_data.get('esimId') or order_data.get('esim_id')
        
        if not esim_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message='Order has no eSIM ID'
            )

        # Initialize Airalo API
        from airalo_api import AiraloAPI
        api = AiraloAPI('test')
        
        print(f"🔍 Getting eSIM details for eSIM ID: {esim_id}")
        
        # Get eSIM details from Airalo API
        esim_result = api.get_esim(esim_id)
        if not esim_result['success']:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message=f'eSIM not found: {esim_result["error"]}'
            )
        
        esim_data = esim_result['esim']
        print(f"✅ Found eSIM: {esim_data.get('name', 'Unknown')}")
        
        # Get installation instructions
        instructions_result = api.get_installation_instructions(esim_id)
        instructions = instructions_result.get('instructions', {}) if instructions_result['success'] else {}
        
        # Generate eSIM data for response
        response_data = {
            'type': 'eSIM',
            'provider': 'Airalo',
            'esimId': esim_id,
            'orderId': order_id,
            'planName': esim_data.get('package_name', 'Unknown Plan'),
            'dataLimit': f"{esim_data.get('data_amount', 0)} {esim_data.get('data_unit', 'GB')}",
            'validity': f"{esim_data.get('validity', 0)} {esim_data.get('validity_unit', 'days')}",
            'countries': esim_data.get('coverage', []),
            'customerEmail': order_data.get('customerEmail'),
            'amount': order_data.get('amount'),
            'currency': order_data.get('currency'),
            'status': esim_data.get('status', 'active'),
            'timestamp': datetime.now().isoformat()
        }

        # Get QR code from Airalo eSIM data
        qr_code = esim_data.get('qr_code') or esim_data.get('qr_code_string')
        
        if not qr_code:
            # If no QR code provided, create LPA format
            qr_code = f"LPA:1$airalo.com${esim_id}"
        
        # Generate QR code data
        qr_data = {
            'qr_code': qr_code,
            'esim_data': esim_data,
            'instructions': instructions,
            'activation_url': esim_data.get('activation_url', 'https://airalo.com/activate'),
            'support_url': "https://airalo.com/support"
        }

        return {
            'success': True,
            'qrCode': qr_code,
            'qrCodeData': qr_data,
            'orderId': order_id,
            'esimId': esim_id,
            'esimData': response_data,
            'instructions': instructions
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        print(f"❌ Error in getEsimQrCode endpoint: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Failed to get eSIM QR code: {str(e)}'
        )

@https_fn.on_call()
def createAiraloOrder(req: https_fn.CallableRequest) -> any:
    """
    Create an eSIM order using Airalo API
    """
    try:
        # Check authentication
        if not req.auth or not req.auth.uid:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                message='User must be authenticated'
            )

        # Get order data from request
        data = req.data
        package_slug = data.get('packageSlug')
        customer_email = data.get('customerEmail')
        customer_name = data.get('customerName')
        
        if not package_slug or not customer_email:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message='packageSlug and customerEmail are required'
            )

        print(f"📱 Creating Airalo order for package: {package_slug} (User: {req.auth.uid})")

        # Initialize Airalo API
        from airalo_api import AiraloAPI
        api = AiraloAPI('test')
        
        # Submit order to Airalo
        order_result = api.submit_order(package_slug, customer_email, customer_name)
        if not order_result['success']:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INTERNAL,
                message=f'Failed to create order: {order_result["error"]}'
            )
        
        order_data = order_result['order']
        order_id = order_data.get('id')
        esim_id = order_data.get('esim_id')
        
        if not order_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INTERNAL,
                message='Order created but no order ID returned'
            )

        # Save order to Firestore
        db = get_db()
        user_id = req.auth.uid
        
        # Save to users/{userId}/esims collection (mobile app structure)
        esim_doc_data = {
            'id': order_id,
            'esimId': esim_id,
            'packageSlug': package_slug,
            'customerEmail': customer_email,
            'customerName': customer_name,
            'status': order_data.get('status', 'pending'),
            'amount': order_data.get('price', 0),
            'currency': order_data.get('currency', 'USD'),
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
            'provider': 'airalo'
        }
        
        db.collection('users').document(user_id).collection('esims').document(order_id).set(esim_doc_data)
        
        # Also save to orders collection for backward compatibility
        db.collection('orders').document(order_id).set(esim_doc_data)
        
        print(f"✅ Airalo order created successfully: {order_id}")
        
        return {
            'success': True,
            'orderId': order_id,
            'esimId': esim_id,
            'order': order_data,
            'message': 'Order created successfully'
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        print(f"❌ Error in createAiraloOrder endpoint: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f'Failed to create order: {str(e)}'
        )
