# Airalo Order API Examples

This document provides comprehensive examples of how to use the updated Airalo Order API with all the new features.

## Basic Order Creation

### Simple Order (Required Fields Only)
```javascript
import { esimService } from '../services/esimService';

// Basic order with only required fields
const basicOrder = await esimService.createAiraloOrderV2({
  package_id: "kallur-digital-7days-1gb"
});
```

### Order with Description
```javascript
const orderWithDescription = await esimService.createAiraloOrderV2({
  package_id: "kallur-digital-7days-1gb",
  description: "Order for customer John Doe - Travel to Europe"
});
```

### Order with Custom Quantity
```javascript
const multiQuantityOrder = await esimService.createAiraloOrderV2({
  package_id: "kallur-digital-7days-1gb",
  quantity: "3",
  description: "Bulk order for team travel"
});
```

## Email Sharing Features

### Order with Email Sharing (Link Only)
```javascript
const orderWithEmail = await esimService.createAiraloOrderV2({
  package_id: "kallur-digital-7days-1gb",
  to_email: "customer@example.com",
  sharing_option: ["link"],
  description: "eSIM for customer@example.com"
});
```

### Order with Email Sharing (Link + PDF)
```javascript
const orderWithEmailAndPdf = await esimService.createAiraloOrderV2({
  package_id: "kallur-digital-7days-1gb",
  to_email: "customer@example.com",
  sharing_option: ["link", "pdf"],
  description: "eSIM with PDF instructions"
});
```

### Order with Email Sharing and CC
```javascript
const orderWithEmailAndCC = await esimService.createAiraloOrderV2({
  package_id: "kallur-digital-7days-1gb",
  to_email: "customer@example.com",
  sharing_option: ["link"],
  copy_address: ["admin@yourcompany.com", "support@yourcompany.com"],
  description: "eSIM order with admin notifications"
});
```

## Brand Settings

### Order with Brand Settings
```javascript
const brandedOrder = await esimService.createAiraloOrderV2({
  package_id: "kallur-digital-7days-1gb",
  brand_settings_name: "Your Company Name",
  description: "Branded eSIM order"
});
```

### Complete Order with All Features
```javascript
const completeOrder = await esimService.createAiraloOrderV2({
  package_id: "kallur-digital-7days-1gb",
  quantity: "2",
  type: "sim",
  description: "Complete order with all features",
  brand_settings_name: "Your Company Name",
  to_email: "customer@example.com",
  sharing_option: ["link", "pdf"],
  copy_address: ["admin@yourcompany.com"]
});
```

## Response Handling

The API returns a comprehensive response with all the eSIM data:

```javascript
const response = await esimService.createAiraloOrderV2({
  package_id: "kallur-digital-7days-1gb",
  to_email: "customer@example.com",
  sharing_option: ["link"]
});

console.log('Order Response:', response);

// Access eSIM data
const esimData = response.orderData.sims[0];
console.log('QR Code:', esimData.qrcode);
console.log('QR Code URL:', esimData.qrcode_url);
console.log('Apple Installation URL:', esimData.direct_apple_installation_url);
console.log('ICCID:', esimData.iccid);
console.log('LPA:', esimData.lpa);

// Access installation instructions
console.log('Manual Installation:', response.orderData.manual_installation);
console.log('QR Code Installation:', response.orderData.qrcode_installation);
console.log('Installation Guides:', response.orderData.installation_guides);
```

## Error Handling

```javascript
try {
  const order = await esimService.createAiraloOrderV2({
    package_id: "invalid-package-id",
    to_email: "customer@example.com",
    sharing_option: ["link"]
  });
} catch (error) {
  console.error('Order creation failed:', error.message);
  // Handle specific error cases
  if (error.message.includes('Package not found')) {
    // Handle package not found
  } else if (error.message.includes('Invalid email')) {
    // Handle invalid email
  }
}
```

## Integration with React Components

### Example React Component
```jsx
import React, { useState } from 'react';
import { esimService } from '../services/esimService';

const OrderForm = () => {
  const [formData, setFormData] = useState({
    package_id: '',
    quantity: '1',
    description: '',
    brand_settings_name: '',
    to_email: '',
    sharing_option: ['link'],
    copy_address: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await esimService.createAiraloOrderV2(formData);
      
      if (result.success) {
        // Show success message
        console.log('Order created:', result);
        
        // Display eSIM data
        const esimData = result.orderData.sims[0];
        console.log('QR Code:', esimData.qrcode_url);
        console.log('Apple Link:', esimData.direct_apple_installation_url);
      }
    } catch (error) {
      console.error('Order failed:', error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Package ID"
        value={formData.package_id}
        onChange={(e) => setFormData({...formData, package_id: e.target.value})}
        required
      />
      
      <input
        type="number"
        placeholder="Quantity"
        value={formData.quantity}
        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
        min="1"
        max="50"
      />
      
      <input
        type="text"
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
      />
      
      <input
        type="text"
        placeholder="Brand Settings Name"
        value={formData.brand_settings_name}
        onChange={(e) => setFormData({...formData, brand_settings_name: e.target.value})}
      />
      
      <input
        type="email"
        placeholder="Customer Email"
        value={formData.to_email}
        onChange={(e) => setFormData({...formData, to_email: e.target.value})}
      />
      
      <select
        multiple
        value={formData.sharing_option}
        onChange={(e) => setFormData({...formData, sharing_option: Array.from(e.target.selectedOptions, option => option.value)})}
      >
        <option value="link">Link</option>
        <option value="pdf">PDF</option>
      </select>
      
      <button type="submit">Create Order</button>
    </form>
  );
};
```

## API Parameters Reference

### Required Parameters
- `package_id` (string): The package ID from the packages endpoint
- `quantity` (string): Number of eSIMs to order (1-50, default: "1")
- `type` (string): Type of eSIM ("sim", default: "sim")

### Optional Parameters
- `description` (string): Custom description for the order
- `brand_settings_name` (string): Brand name for white-labeling
- `to_email` (string): Customer email for eSIM sharing
- `sharing_option` (array): Sharing methods ["link", "pdf"]
- `copy_address` (array): CC email addresses

### Response Fields
- `orderId`: Internal order ID
- `airaloOrderId`: Airalo's order ID
- `orderData`: Complete order data from Airalo
- `esimData`: Extracted eSIM information including:
  - `qrcode`: QR code string
  - `qrcode_url`: QR code image URL
  - `direct_apple_installation_url`: Apple universal link
  - `iccid`: eSIM ICCID
  - `lpa`: LPA server address
  - `matching_id`: Matching ID for activation
  - `manual_installation`: Manual installation instructions
  - `qrcode_installation`: QR code installation instructions
  - `installation_guides`: Multi-language installation guides
