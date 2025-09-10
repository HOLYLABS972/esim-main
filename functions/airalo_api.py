# Airalo API Integration
# Replacing DataPlans API with Airalo Partner API

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
    
    def __init__(self, environment='test'):
        self.environment = environment
        self.config = self._get_airalo_config()
        self.base_url = self.config['base_url']
        self.api_token = self.config['api_token']
    
    def _get_airalo_config(self):
        """Get Airalo API configuration from Firestore or environment"""
        try:
            db = firestore.client()
            doc_ref = db.collection('config').document('airalo')
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                api_token = data.get('api_key')
                client_secret = data.get('client_secret')
                if api_token:
                    print(f"✅ Airalo API token loaded from Firestore")
                    return {
                        'base_url': 'https://api.airalo.com/v2' if self.environment == 'prod' else 'https://api.airalo.com/v2',
                        'api_token': api_token,
                        'client_secret': client_secret,
                        'headers': {
                            'Authorization': f'Bearer {api_token}',
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    }
        except Exception as e:
            print(f"⚠️ Could not load Airalo API token from Firestore: {e}")
        
        # Fallback to environment variable
        import os
        api_token = os.getenv('AIRALO_API_TOKEN')
        client_secret = os.getenv('AIRALO_CLIENT_SECRET')
        if api_token:
            print(f"✅ Using Airalo API token from environment")
            return {
                'base_url': 'https://api.airalo.com/v2' if self.environment == 'prod' else 'https://api.airalo.com/v2',
                'api_token': api_token,
                'client_secret': client_secret,
                'headers': {
                    'Authorization': f'Bearer {api_token}',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        
        raise ValueError("Airalo API token not found in Firestore or environment variables")
    
    def _get_headers(self):
        """Get API headers"""
        return self.config['headers']
    
    def get_client_secret(self):
        """Get Airalo client secret"""
        return self.config.get('client_secret')
    
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
