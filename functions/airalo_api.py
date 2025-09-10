# Airalo API Integration

from firebase_functions import https_fn
from firebase_admin import firestore
import json
import requests
import logging
from datetime import datetime, timedelta
from functools import wraps
import config

def get_db():
    """Lazy initialization of Firestore client"""
    return firestore.client()

class AiraloAPI:
    """Airalo Partner API client for eSIM operations"""
    
    def __init__(self, environment='sandbox', credentials=None):
        self.environment = environment
        if credentials:
            # Use provided credentials
            self.client_id = credentials['client_id']
            self.client_secret = credentials['client_secret']
            self.api_environment = environment
        else:
            # Load from Firestore (legacy)
            self.config = self._get_airalo_config()
            self.client_id = self.config['client_id']
            self.client_secret = self.config['client_secret']
            self.api_environment = self.config.get('environment', 'sandbox')
        
        # Set base URL based on environment
        if self.api_environment == 'production':
            self.base_url = 'https://partners-api.airalo.com/v2'
        else:
            self.base_url = 'https://sandbox-partners-api.airalo.com/v2'
        
        self.access_token = None
        self.token_expires_at = None
    
    def _get_airalo_config(self):
        """Get Airalo API configuration from Firestore and environment variables"""
        client_id = None
        client_secret = None
        environment = 'sandbox'  # Default to sandbox
        
        # Try to get client_id from Firestore
        try:
            db = firestore.client()
            doc_ref = db.collection('config').document('airalo')
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                client_id = data.get('client_id')
                environment = data.get('environment', 'sandbox')  # Get environment setting
                if client_id:
                    print(f"✅ Airalo client_id loaded from Firestore: {client_id[:8]}...")
                    print(f"🌍 Environment: {environment}")
        except Exception as e:
            print(f"⚠️ Could not load Airalo client_id from Firestore: {e}")
        
        # Try to get client_secret from environment variables
        try:
            import os
            client_secret = os.getenv('AIRALO_CLIENT_SECRET')
            if client_secret:
                print(f"✅ Airalo client_secret loaded from environment: {client_secret[:8]}...")
        except Exception as e:
            print(f"⚠️ Could not load Airalo client_secret from environment: {e}")
        
        # Use production API URL for both sandbox and production (Airalo's new structure)
        base_url = 'https://partners-api.airalo.com/v2'
        
        # Check if both credentials are available
        if client_id and client_secret:
            print(f"✅ Airalo credentials loaded successfully")
            return {
                'base_url': base_url,
                'client_id': client_id,
                'client_secret': client_secret,
                'environment': environment
            }
        
        # Provide specific error messages
        if not client_id and not client_secret:
            raise ValueError("Airalo client_id not found in Firestore and client_secret not found in environment variables")
        elif not client_id:
            raise ValueError("Airalo client_id not found in Firestore. Please set it in the admin panel.")
        elif not client_secret:
            raise ValueError("Airalo client_secret not found in environment variables. Please set it using: firebase functions:config:set airalo.client_secret=\"your_secret\"")
    
    def _authenticate(self):
        """Authenticate with Airalo API and get access token"""
        # Check if we have a valid token in memory
        if self.access_token and self.token_expires_at and datetime.now() < self.token_expires_at:
            return self.access_token
        
        # Try to load token from Firestore
        try:
            from firebase_admin import firestore
            db = firestore.client()
            token_doc = db.collection('airalo_tokens').document(f'{self.api_environment}_token').get()
            
            if token_doc.exists:
                token_data = token_doc.to_dict()
                stored_token = token_data.get('access_token')
                expires_at = token_data.get('expires_at')
                
                if stored_token and expires_at:
                    expires_datetime = datetime.fromisoformat(expires_at)
                    if datetime.now() < expires_datetime:
                        self.access_token = stored_token
                        self.token_expires_at = expires_datetime
                        print(f"✅ Using cached Airalo token from Firestore")
                        return self.access_token
                    else:
                        print("🔄 Cached token expired, getting new one...")
        except Exception as e:
            print(f"⚠️ Could not load token from Firestore: {e}")
        
        print("🔐 Authenticating with Airalo API...")
        
        # Prepare form data for authentication
        form_data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'grant_type': 'client_credentials'
        }
        
        try:
            response = requests.post(
                f'{self.base_url}/token',
                data=form_data,
                headers={
                    'Accept': 'application/json'
                },
                timeout=30
            )
            response.raise_for_status()
            
            auth_data = response.json()
            if 'data' in auth_data:
                self.access_token = auth_data['data']['access_token']
                expires_in = auth_data['data'].get('expires_in', 3600)  # Default to 1 hour if not provided
                self.token_expires_at = datetime.now() + timedelta(seconds=expires_in - 300)  # Refresh 5 minutes early
                
                # Store token in Firestore
                try:
                    from firebase_admin import firestore
                    db = firestore.client()
                    token_ref = db.collection('airalo_tokens').document(f'{self.api_environment}_token')
                    token_ref.set({
                        'access_token': self.access_token,
                        'expires_at': self.token_expires_at.isoformat(),
                        'created_at': datetime.now().isoformat(),
                        'environment': self.api_environment
                    })
                    print(f"✅ Airalo token stored in Firestore")
                except Exception as e:
                    print(f"⚠️ Could not store token in Firestore: {e}")
                
                print(f"✅ Successfully authenticated with Airalo API")
                return self.access_token
            else:
                raise ValueError("Invalid authentication response from Airalo API")
                
        except Exception as e:
            print(f"❌ Authentication failed: {e}")
            raise ValueError(f"Failed to authenticate with Airalo API: {str(e)}")
    
    def _get_headers(self):
        """Get API headers with valid access token"""
        access_token = self._authenticate()
        return {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    
    def get_client_secret(self):
        """Get Airalo client secret"""
        return self.client_secret
    
    def get_environment(self):
        """Get current API environment (sandbox or production)"""
        return self.api_environment
    
    def set_environment(self, environment):
        """Set API environment and update base URL"""
        if environment not in ['sandbox', 'production']:
            raise ValueError("Environment must be 'sandbox' or 'production'")
        
        self.api_environment = environment
        if environment == 'production':
            self.base_url = 'https://partners-api.airalo.com/v2'
        else:
            self.base_url = 'https://sandbox-partners-api.airalo.com/v2'
        
        # Clear cached token when switching environments
        self.access_token = None
        self.token_expires_at = None
        
        print(f"🌍 Switched to {environment} environment: {self.base_url}")
    
    def get_packages(self, country_code=None, region_slug=None):
        """
        Get available eSIM packages from Airalo API
        Args:
            country_code: Specific country code (e.g., 'US', 'GB')
            region_slug: Specific region slug (e.g., 'europe', 'asia')
        """
        try:
            url = f'{self.base_url}/packages'
            params = {}
            
            if country_code:
                params['country_code'] = country_code
            elif region_slug:
                params['region_slug'] = region_slug
            
            response = requests.get(url, headers=self._get_headers(), params=params, timeout=30)
            response.raise_for_status()
            
            packages_data = response.json()
            
            # Transform Airalo packages to our expected format
            packages = []
            for package in packages_data.get('data', []):
                packages.append({
                    'id': package.get('id'),
                    'slug': package.get('slug'),
                    'name': package.get('name'),
                    'description': package.get('description'),
                    'data': package.get('data_amount', 0),
                    'data_unit': package.get('data_unit', 'GB'),
                    'validity': package.get('validity', 0),
                    'validity_unit': package.get('validity_unit', 'days'),
                    'price': package.get('price', 0),
                    'currency': package.get('currency', 'USD'),
                    'country_code': package.get('country_code'),
                    'region_slug': package.get('region_slug'),
                    'operator': package.get('operator', {}).get('name', ''),
                    'operator_slug': package.get('operator', {}).get('slug', ''),
                    'is_roaming': package.get('is_roaming', False),
                    'coverage': package.get('coverage', []),
                    'activation_type': package.get('activation_type', 'qr_code'),
                    'compatible_devices': package.get('compatible_devices', []),
                    'features': package.get('features', []),
                    'created_at': package.get('created_at'),
                    'updated_at': package.get('updated_at')
                })
            
            return {
                'success': True,
                'packages': packages,
                'total': len(packages)
            }
            
        except Exception as e:
            logging.error(f"Failed to fetch packages: {e}")
            return {
                'success': False,
                'error': f'Failed to fetch packages: {str(e)}'
            }
    
    def get_package_details(self, package_slug):
        """Get detailed information about a specific package"""
        try:
            url = f'{self.base_url}/packages/{package_slug}'
            response = requests.get(url, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            package_data = response.json()
            
            return {
                'success': True,
                'package': package_data.get('data', {})
            }
            
        except Exception as e:
            logging.error(f"Failed to get package details: {e}")
            return {
                'success': False,
                'error': f'Failed to get package details: {str(e)}'
            }
    
    def submit_order(self, package_slug, customer_email, customer_name=None):
        """
        Submit an eSIM order to Airalo
        Args:
            package_slug: The package slug to order
            customer_email: Customer email address
            customer_name: Optional customer name
        """
        try:
            url = f'{self.base_url}/orders'
            
            order_data = {
                'package_slug': package_slug,
                'customer_email': customer_email
            }
            
            if customer_name:
                order_data['customer_name'] = customer_name
            
            response = requests.post(url, json=order_data, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            order_response = response.json()
            
            return {
                'success': True,
                'order': order_response.get('data', {})
            }
            
        except Exception as e:
            logging.error(f"Failed to submit order: {e}")
            return {
                'success': False,
                'error': f'Failed to submit order: {str(e)}'
            }
    
    def get_order(self, order_id):
        """Get order details by order ID"""
        try:
            url = f'{self.base_url}/orders/{order_id}'
            response = requests.get(url, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            order_data = response.json()
            
            return {
                'success': True,
                'order': order_data.get('data', {})
            }
            
        except Exception as e:
            logging.error(f"Failed to get order: {e}")
            return {
                'success': False,
                'error': f'Failed to get order: {str(e)}'
            }
    
    def get_esim(self, esim_id):
        """Get eSIM details and installation instructions"""
        try:
            url = f'{self.base_url}/esims/{esim_id}'
            response = requests.get(url, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            esim_data = response.json()
            
            return {
                'success': True,
                'esim': esim_data.get('data', {})
            }
            
        except Exception as e:
            logging.error(f"Failed to get eSIM: {e}")
            return {
                'success': False,
                'error': f'Failed to get eSIM: {str(e)}'
            }
    
    def get_installation_instructions(self, esim_id):
        """Get installation instructions for an eSIM"""
        try:
            url = f'{self.base_url}/esims/{esim_id}/instructions'
            response = requests.get(url, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            instructions_data = response.json()
            
            return {
                'success': True,
                'instructions': instructions_data.get('data', {})
            }
            
        except Exception as e:
            logging.error(f"Failed to get installation instructions: {e}")
            return {
                'success': False,
                'error': f'Failed to get installation instructions: {str(e)}'
            }
    
    def get_usage(self, esim_id):
        """Get usage statistics for an eSIM"""
        try:
            url = f'{self.base_url}/esims/{esim_id}/usage'
            response = requests.get(url, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            usage_data = response.json()
            
            return {
                'success': True,
                'usage': usage_data.get('data', {})
            }
            
        except Exception as e:
            logging.error(f"Failed to get usage: {e}")
            return {
                'success': False,
                'error': f'Failed to get usage: {str(e)}'
            }
    
    def get_balance(self):
        """Get account balance"""
        try:
            url = f'{self.base_url}/balance'
            response = requests.get(url, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            balance_data = response.json()
            
            return {
                'success': True,
                'balance': balance_data.get('data', {})
            }
            
        except Exception as e:
            logging.error(f"Failed to get balance: {e}")
            return {
                'success': False,
                'error': f'Failed to get balance: {str(e)}'
            }
    
    def get_countries(self):
        """Get available countries"""
        try:
            url = f'{self.base_url}/countries'
            response = requests.get(url, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            countries_data = response.json()
            
            # Transform to our expected format
            countries = []
            for country in countries_data.get('data', []):
                countries.append({
                    'code': country.get('code'),
                    'name': country.get('name'),
                    'flag': country.get('flag_url', ''),
                    'region_slug': country.get('region_slug'),
                    'is_roaming': country.get('is_roaming', False)
                })
            
            return {
                'success': True,
                'countries': countries
            }
            
        except Exception as e:
            logging.error(f"Failed to get countries: {e}")
            return {
                'success': False,
                'error': f'Failed to get countries: {str(e)}'
            }
    
    def get_regions(self):
        """Get available regions"""
        try:
            url = f'{self.base_url}/regions'
            response = requests.get(url, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            regions_data = response.json()
            
            # Transform to our expected format
            regions = []
            for region in regions_data.get('data', []):
                regions.append({
                    'slug': region.get('slug'),
                    'name': region.get('name'),
                    'description': region.get('description', ''),
                    'country_count': region.get('country_count', 0),
                    'package_count': region.get('package_count', 0)
                })
            
            return {
                'success': True,
                'regions': regions
            }
            
        except Exception as e:
            logging.error(f"Failed to get regions: {e}")
            return {
                'success': False,
                'error': f'Failed to get regions: {str(e)}'
            }
