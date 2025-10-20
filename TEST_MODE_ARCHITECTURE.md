# Test Mode Architecture - Frontend to Backend

## 🎯 Overview

The frontend now **always calls the API** at `api.roamjet.net`, and the **backend decides** whether to return mock data (test mode) or create real Airalo orders (live mode).

## 📋 How It Works

### Frontend Flow

1. **Payment Success Screen** detects Stripe mode
2. **Always calls** `apiService.createOrder()` 
3. **Passes `mode` parameter** to backend: `"test"` or `"live"`
4. Backend decides what to do based on mode

### Backend Responsibility

The backend at `api.roamjet.net` receives the `mode` parameter and should:

#### Test Mode (`mode: "test"` or `mode: "sandbox"`)
- ✅ Return **mock eSIM data**
- ✅ Generate fake ICCID, QR codes, activation codes
- ✅ **DO NOT** make real Airalo API calls
- ✅ **DO NOT** charge anything
- ✅ Log as test transaction

#### Live Mode (`mode: "live"` or `mode: "production"`)
- ✅ Make **real Airalo API calls**
- ✅ Create actual eSIM
- ✅ Return real QR codes and activation data
- ✅ Log as live transaction

## 🔧 Frontend Changes

### 1. PaymentSuccess.jsx
```javascript
// Detects Stripe mode
const stripeMode = await configService.getStripeMode();
const isTestMode = stripeMode === 'test' || stripeMode === 'sandbox';

// ALWAYS calls API, passes mode
const airaloOrderResult = await apiService.createOrder({
  package_id: orderData.planId,
  quantity: "1",
  to_email: orderData.customerEmail,
  description: `eSIM order for ${orderData.customerEmail}`,
  mode: stripeMode // ← Backend uses this to decide mock vs real
});
```

### 2. apiService.js
```javascript
async createOrder({ package_id, quantity, to_email, description, mode }) {
  console.log('📦 Creating order via Python API:', { package_id, quantity, to_email, mode });
  
  const result = await makeAuthenticatedRequest('/api/user/order', {
    method: 'POST',
    body: JSON.stringify({
      package_id,
      quantity,
      to_email,
      description,
      mode, // ← Sent to backend
    }),
  });
  
  return result;
}
```

### 3. configService.js
```javascript
async getStripeMode() {
  // HARDCODED: Always returns "test"
  console.log('🧪 HARDCODED: Using TEST mode');
  return 'test';
}
```

## 🔐 Backend Implementation Needed

### API Endpoint: `/api/user/order`

**Request Body:**
```json
{
  "package_id": "kargi-mobile-7days-1gb",
  "quantity": "1",
  "to_email": "user@example.com",
  "description": "eSIM order for user@example.com",
  "mode": "test"  // ← NEW: "test" or "live"
}
```

**Backend Logic:**
```python
@app.route('/api/user/order', methods=['POST'])
def create_order():
    data = request.json
    mode = data.get('mode', 'test')  # Default to test for safety
    
    if mode in ['test', 'sandbox']:
        # Return MOCK data - no real Airalo call
        return jsonify({
            'success': True,
            'airaloOrderId': f'TEST_{uuid.uuid4()}',
            'orderData': {
                'id': f'TEST_{uuid.uuid4()}',
                'package_id': data['package_id'],
                'status': 'active',
                'iccid': f'TEST_ICCID_{random_string()}',
                'smdp_address': 'test.smdp.address',
                'matching_id': f'TEST_MATCH_{random_string()}',
                'activation_code': f'TEST_CODE_{random_string()}',
                'is_test': True
            }
        })
    
    elif mode in ['live', 'production']:
        # Create REAL Airalo order
        airalo_result = create_real_airalo_order(data)
        return jsonify(airalo_result)
    
    else:
        return jsonify({'error': 'Invalid mode'}), 400
```

### API Endpoint: `/api/user/qr-code`

Should also respect the mode (get from Firebase order record's `isTestMode` flag):

```python
@app.route('/api/user/qr-code', methods=['POST'])
def get_qr_code():
    data = request.json
    order_id = data['orderId']
    
    # Get order from Firebase
    order = get_order_from_firebase(order_id)
    
    if order.get('isTestMode'):
        # Return mock QR code
        return jsonify({
            'success': True,
            'qrCode': 'LPA:1$test.smdp.address$TEST_MOCK_CODE',
            'activationCode': f'TEST_CODE_{random_string()}',
            'iccid': f'TEST_ICCID_{random_string()}',
            'smdpAddress': 'test.smdp.address',
            'lpa': f'LPA:1$test.smdp.address$TEST_MATCH_{random_string()}'
        })
    else:
        # Get real QR code from Airalo
        return get_real_qr_code(order)
```

## 📊 Data Flow

```
┌─────────────┐
│   Frontend  │
│  (Test Mode)│
└──────┬──────┘
       │
       │ POST /api/user/order
       │ { mode: "test", ... }
       │
       ▼
┌──────────────────┐
│   Backend API    │
│  api.roamjet.net │
└──────┬───────────┘
       │
       ├── mode === "test" ───► Return Mock Data
       │                         ✓ No Airalo call
       │                         ✓ Fake ICCID
       │                         ✓ Test QR code
       │
       └── mode === "live" ───► Create Real Order
                                 ✓ Call Airalo API
                                 ✓ Real ICCID
                                 ✓ Real QR code
```

## ✅ Benefits of This Architecture

1. **Centralized Logic**: Backend controls mock vs real
2. **Frontend Simplicity**: Just passes mode, no complex logic
3. **Easy Testing**: Change mode in one place (configService)
4. **Security**: Backend validates and decides
5. **Consistency**: Same API call for test and live
6. **Debugging**: Backend logs show test vs live clearly

## 🧪 Current Status

### Frontend ✅ DONE
- Detects Stripe mode (`test` hardcoded)
- Always calls API with `mode` parameter
- Marks Firebase orders with `isTestMode` flag
- Logs clearly show test vs live

### Backend ⏳ TODO
You need to implement:
1. Check `mode` parameter in `/api/user/order`
2. Return mock data for `mode: "test"`
3. Create real Airalo orders for `mode: "live"`
4. Handle QR code retrieval based on `isTestMode` flag

## 🔍 Testing

### To Test Mode:
1. Frontend mode is hardcoded to `"test"`
2. Make a test Stripe payment (test card: `4242 4242 4242 4242`)
3. Backend should receive `mode: "test"` and return mock data
4. Check console logs: `🧪 TEST MODE: Creating MOCK order`

### To Live Mode:
1. Edit `configService.js`, uncomment dynamic mode code
2. Set Firebase `config/stripe` document: `mode: "live"`
3. Make a real payment
4. Backend should receive `mode: "live"` and create real Airalo order

## 📝 Summary

**Frontend**: ✅ Complete
- Always calls API
- Passes mode parameter
- Logs everything

**Backend**: ⏳ Implement
- Check mode parameter
- Return mock for test
- Create real order for live

This ensures **test Stripe payments never create real Airalo orders**! 🎉

