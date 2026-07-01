# MongoDB Schema Definitions & Types

This document defines the schema structure, object types, and field descriptions for each collection in the Drink Ordering System database.

---

## Table of Contents

1. [users](#1-users)
2. [stores](#2-stores)
3. [categories](#3-categories)
4. [products](#4-products)
5. [vouchers](#5-vouchers)
6. [carts](#6-carts)
7. [orders](#7-orders)
8. [reviews](#8-reviews)
9. [audit_logs](#9-audit_logs)
10. [notifications](#10-notifications)

---

## 1. `users`

### Document Structure
```javascript
{
  _id: ObjectId,
  email: String,
  phone: String,
  passwordHash: String,
  role: String,                  // "customer" | "owner" | "staff" | "admin"
  storeId: ObjectId,             // Nullable. Reference to 'stores'. Only for role = "staff"
  fullName: String,
  avatarUrl: String,
  dob: Date,                     // Date of birth
  gender: String,                // "male" | "female" | "other"
  isVerified: Boolean,
  isBanned: Boolean,
  addresses: [                   // Embedded Array of Address objects
    {
      _id: ObjectId,
      receiverName: String,
      receiverPhone: String,
      addressLine: String,
      isDefault: Boolean
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Field Definitions
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Primary key of the user document | Generated automatically |
| `email` | `String` | Email address used for authentication | Unique index |
| `phone` | `String` | Phone number for contact and login | Unique index |
| `passwordHash` | `String` | Bcrypt-hashed password | - |
| `role` | `String` | Authorization role | Enum: `"customer"`, `"owner"`, `"staff"`, `"admin"` |
| `storeId` | `ObjectId` | Reference to store user works at | Optional; required for `"staff"` role |
| `fullName` | `String` | User's full name | - |
| `avatarUrl` | `String` | Profile picture Cloudinary URL | Optional |
| `dob` | `Date` | Date of birth | Optional |
| `gender` | `String` | Gender identity | Enum: `"male"`, `"female"`, `"other"` |
| `isVerified` | `Boolean` | Account email/phone verification status | Default: `false` |
| `isBanned` | `Boolean` | Flag indicating if user is restricted | Default: `false` |
| `addresses` | `Array<Address>` | User's saved delivery addresses | Embedded schema; max size bounded |
| `createdAt` | `Date` | Timestamp when user was created | Set automatically by Mongoose |
| `updatedAt` | `Date` | Timestamp when user was last updated | Set automatically by Mongoose |

#### Address Embedded Object
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Unique identifier for the address object | Generated automatically |
| `receiverName` | `String` | Name of the order recipient | Required |
| `receiverPhone` | `String` | Phone number of the order recipient | Required |
| `addressLine` | `String` | Full delivery address text | Required |
| `isDefault` | `Boolean` | Indicates default selected address | Default: `false` |

---

## 2. `stores`

### Document Structure
```javascript
{
  _id: ObjectId,
  ownerId: ObjectId,             // Reference to 'users' (owner)
  name: String,
  phone: String,
  address: String,
  avatarUrl: String,
  coverUrl: String,
  status: String,                // "pending_approval" | "active" | "locked"
  isOpen: Boolean,
  openHours: {
    open: String,                // "HH:MM" format
    close: String                // "HH:MM" format
  },
  ratingAvg: Number,             // Computed Pattern
  ratingCount: Number,           // Computed Pattern
  createdAt: Date,
  updatedAt: Date
}
```

### Field Definitions
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Primary key of the store document | Generated automatically |
| `ownerId` | `ObjectId` | Reference to `users` collection | Required |
| `name` | `String` | Store business name | Required |
| `phone` | `String` | Store contact phone number | Required |
| `address` | `String` | Physical address location of the store | Required |
| `avatarUrl` | `String` | Store logo picture URL | Required |
| `coverUrl` | `String` | Store banner background image URL | Required |
| `status` | `String` | Operational registration status | Enum: `"pending_approval"`, `"active"`, `"locked"` |
| `isOpen` | `Boolean` | Active store open status indicator | Default: `true` |
| `openHours` | `Object` | Store operation hours limits | Required |
| `ratingAvg` | `Number` | Cached average ratings score | Default: `0.0`, Computed |
| `ratingCount` | `Number` | Cached total count of ratings | Default: `0`, Computed |
| `createdAt` | `Date` | Timestamp of creation | Set automatically |
| `updatedAt` | `Date` | Timestamp of last update | Set automatically |

---

## 3. `categories`

### Document Structure
```javascript
{
  _id: ObjectId,
  storeId: ObjectId,             // Reference to 'stores'
  name: String,
  displayOrder: Number,
  createdAt: Date
}
```

### Field Definitions
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Primary key of the category document | Generated automatically |
| `storeId` | `ObjectId` | Reference to the owning store | Required |
| `name` | `String` | Category title | Required |
| `displayOrder` | `Number` | Sequence ordering index on menu list | Default: `0`, Indexed with `storeId` |
| `createdAt` | `Date` | Timestamp of creation | Set automatically |

---

## 4. `products`

### Document Structure
```javascript
{
  _id: ObjectId,
  storeId: ObjectId,             // Reference to 'stores'
  categoryId: ObjectId,          // Reference to 'categories'
  name: String,
  description: String,
  basePrice: Number,
  images: Array<String>,
  status: String,                // "available" | "hidden" | "out_of_stock"
  optionGroups: [                // Embedded Array of OptionGroup objects
    {
      _id: ObjectId,
      name: String,
      type: String,              // "radio" | "checkbox"
      required: Boolean,
      options: [                 // Embedded Array of Option objects
        {
          _id: ObjectId,
          name: String,
          extraPrice: Number
        }
      ]
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Field Definitions
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Primary key of the product document | Generated automatically |
| `storeId` | `ObjectId` | Reference to the parent store | Required, Compound index with status |
| `categoryId` | `ObjectId` | Reference to the associated category | Required, Indexed |
| `name` | `String` | Product item name | Required |
| `description` | `String` | Details / ingredients description of product | Optional |
| `basePrice` | `Number` | Baseline item cost | Required, positive |
| `images` | `Array<String>` | List of product media image URLs | - |
| `status` | `String` | Availability status on customer interface | Enum: `"available"`, `"hidden"`, `"out_of_stock"` |
| `optionGroups` | `Array<OptionGroup>` | Configuration options for customized add-ons | Embedded schema |
| `createdAt` | `Date` | Timestamp of creation | Set automatically |
| `updatedAt` | `Date` | Timestamp of last update | Set automatically |

#### OptionGroup Embedded Object
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Unique identifier for option group | Generated automatically |
| `name` | `String` | Group title (e.g., "Size", "Toppings") | Required |
| `type` | `String` | Selection rules | Enum: `"radio"` (select one), `"checkbox"` (select multiple) |
| `required` | `Boolean` | Flag indicating selection is mandatory | Required |
| `options` | `Array<Option>` | Selection list of items | Required, min size: 1 |

#### Option Embedded Object
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Unique identifier for option choice | Generated automatically |
| `name` | `String` | Choice label (e.g., "M", "Boba") | Required |
| `extraPrice` | `Number` | Additional cost applied to the base price | Required, non-negative |

---

## 5. `vouchers`

### Document Structure
```javascript
{
  _id: ObjectId,
  storeId: ObjectId,             // Reference to 'stores'
  code: String,
  discountType: String,          // "percentage" | "fixed"
  discountValue: Number,
  maxDiscountAmount: Number,
  minOrderValue: Number,
  startDate: Date,
  endDate: Date,
  maxUsage: Number,
  usedCount: Number,             // Computed Pattern
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Field Definitions
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Primary key of the voucher document | Generated automatically |
| `storeId` | `ObjectId` | Reference to store offering voucher | Required, Unique compound index with `code` |
| `code` | `String` | Alphanumeric coupon redemption code | Required, Unique with `storeId` |
| `discountType` | `String` | Discount subtraction style | Enum: `"percentage"`, `"fixed"` |
| `discountValue` | `Number` | Discount value based on discountType | Required, positive |
| `maxDiscountAmount`| `Number` | Ceiling discount allowed for `"percentage"` type | Required |
| `minOrderValue` | `Number` | Threshold order value required to apply voucher | Required, positive |
| `startDate` | `Date` | Validity start timestamp | Required |
| `endDate` | `Date` | Validity expiration timestamp | Required |
| `maxUsage` | `Number` | Total allowed uses for voucher | Required |
| `usedCount` | `Number` | Counter incremented upon order completion | Default: `0`, Computed |
| `isActive` | `Boolean` | Operational toggle flag | Default: `true` |
| `createdAt` | `Date` | Timestamp of creation | Set automatically |
| `updatedAt` | `Date` | Timestamp of last update | Set automatically |

---

## 6. `carts`

### Document Structure
```javascript
{
  _id: ObjectId,
  customerId: ObjectId,          // Reference to 'users', UNIQUE
  storeId: ObjectId,             // Reference to 'stores' (1 store limit constraint)
  items: [                       // Embedded Array of CartItem objects
    {
      _id: ObjectId,
      productId: ObjectId,       // Reference to 'products'
      selectedOptions: [         // List of selected options
        {
          groupId: ObjectId,     // OptionGroup ID
          optionId: ObjectId      // Option ID
        }
      ],
      note: String,
      quantity: Number
    }
  ],
  updatedAt: Date
}
```

### Field Definitions
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Primary key of the cart document | Generated automatically |
| `customerId` | `ObjectId` | Reference to customer owner | Unique index |
| `storeId` | `ObjectId` | Restricting cart to items from a single store | Required |
| `items` | `Array<CartItem>` | Selected cart product list | Embedded schema, volatile |
| `updatedAt` | `Date` | Timestamp of last activity | Set automatically |

#### CartItem Embedded Object
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Unique identifier for cart line item | Generated automatically |
| `productId` | `ObjectId` | Reference to selected product | Required |
| `selectedOptions`| `Array<SelectedOption>`| Choices selected from product optionGroups | - |
| `note` | `String` | Custom instruction notes | Optional |
| `quantity` | `Number` | Count of identical items | Required, min: 1 |

#### SelectedOption Embedded Object
| Field | Type | Description | Constraints |
|---|---|---|---|
| `groupId` | `ObjectId` | ID matching original product OptionGroup | Required |
| `optionId` | `ObjectId` | ID matching original option selected | Required |

---

## 7. `orders`

### Document Structure
```javascript
{
  _id: ObjectId,
  orderCode: String,             // Short lookup code, UNIQUE
  customerId: ObjectId,          // Reference to 'users'
  storeId: ObjectId,             // Reference to 'stores'
  storeSnapshot: {               // Extended Reference Pattern
    name: String,
    avatarUrl: String
  },
  deliveryAddress: {             // Immutable Embedded Address Snapshot
    receiverName: String,
    receiverPhone: String,
    addressLine: String
  },
  items: [                       // Immutable Historical Snapshot Embedded Array
    {
      productId: ObjectId,       // Reference to 'products'
      productName: String,       // Snapshot name
      basePrice: Number,         // Snapshot price
      selectedOptions: [         // Embedded list of option snapshot text
        {
          groupName: String,
          optionName: String,
          extraPrice: Number
        }
      ],
      quantity: Number,
      note: String,
      lineTotal: Number
    }
  ],
  subtotal: Number,
  voucherId: ObjectId,           // Nullable. Reference to 'vouchers'
  discountAmount: Number,
  shippingFee: Number,
  totalAmount: Number,           // Calculated strictly on backend
  paymentMethod: String,         // "cod" | "e-wallet" | etc.
  status: String,                // "pending" | "confirmed" | "preparing" | "delivering" | "completed" | "cancelled"
  cancelReason: String,          // Nullable
  statusHistory: [               // Embedded audit trail log
    {
      status: String,
      at: Date,
      by: ObjectId               // Reference to user who performed action
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Field Definitions
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Primary key of the order document | Generated automatically |
| `orderCode` | `String` | Human-readable unique serial code | Unique index |
| `customerId` | `ObjectId` | Reference to placing customer | Required, Indexed |
| `storeId` | `ObjectId` | Reference to store fulfilling order | Required, Indexed |
| `storeSnapshot` | `Object` | Snapshot of store name and logo at checkout | Required |
| `deliveryAddress`| `Object` | Snapshot of recipient details at checkout | Required |
| `items` | `Array<OrderItem>` | Selected order product line snapshot | Required, min: 1 |
| `subtotal` | `Number` | Cumulative cost of items before discounts | Required, positive |
| `voucherId` | `ObjectId` | Reference to voucher applied | Optional |
| `discountAmount`| `Number` | Discount value subtracted from order | Required |
| `shippingFee` | `Number` | Delivery dispatch cost | Required |
| `totalAmount` | `Number` | Total cost calculated by backend | Required, positive |
| `paymentMethod` | `String` | Transaction style | Required |
| `status` | `String` | Current transactional status | Enum: `"pending"`, `"confirmed"`, `"preparing"`, `"delivering"`, `"completed"`, `"cancelled"` |
| `cancelReason` | `String` | Reason text detailing cancellations | Optional |
| `statusHistory` | `Array<StatusHistory>` | Order status lifecycle logs | Required |
| `createdAt` | `Date` | Timestamp of creation | Set automatically |
| `updatedAt` | `Date` | Timestamp of last update | Set automatically |

#### OrderItem Embedded Object
| Field | Type | Description | Constraints |
|---|---|---|---|
| `productId` | `ObjectId` | Reference to matching product | Required |
| `productName` | `String` | Copy of product name at order time | Required |
| `basePrice` | `Number` | Copy of product price at order time | Required, positive |
| `selectedOptions`| `Array<SelectedOptionSnapshot>`| Details of custom selections chosen | Required |
| `quantity` | `Number` | Count of items | Required, min: 1 |
| `note` | `String` | Custom instruction notes | Optional |
| `lineTotal` | `Number` | Final calculated price of this row | Required |

#### SelectedOptionSnapshot Embedded Object
| Field | Type | Description | Constraints |
|---|---|---|---|
| `groupName` | `String` | Name of parent customization option group | Required |
| `optionName` | `String` | Name of chosen customization option | Required |
| `extraPrice` | `Number` | Cost of chosen option at order time | Required, non-negative |

#### StatusHistory Embedded Object
| Field | Type | Description | Constraints |
|---|---|---|---|
| `status` | `String` | Target status transitioned to | Required |
| `at` | `Date` | Time of transition | Required |
| `by` | `ObjectId` | ID of user updating the status | Required |

---

## 8. `reviews`

### Document Structure
```javascript
{
  _id: ObjectId,
  orderId: ObjectId,             // Reference to 'orders', UNIQUE
  customerId: ObjectId,          // Reference to 'users'
  storeId: ObjectId,             // Reference to 'stores'
  stars: Number,                 // Integer 1 - 5
  comment: String,
  createdAt: Date
}
```

### Field Definitions
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Primary key of the review document | Generated automatically |
| `orderId` | `ObjectId` | Reference to rated order transaction | Unique index |
| `customerId` | `ObjectId` | Reference to reviewing customer | Required |
| `storeId` | `ObjectId` | Reference to rated store | Required, Indexed |
| `stars` | `Number` | Rating score | Required, integer: `1` to `5` |
| `comment` | `String` | User textual feedback commentary | Required |
| `createdAt` | `Date` | Timestamp of creation | Set automatically |

---

## 9. `audit_logs`

### Document Structure
```javascript
{
  _id: ObjectId,
  action: String,                // Action type identifier
  performedBy: ObjectId,         // Reference to 'users' actor
  targetType: String,            // Target type (e.g. "order", "user", "store")
  targetId: ObjectId,            // Reference ID of target object
  metadata: Object,              // Dynamic context information
  createdAt: Date
}
```

### Field Definitions
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Primary key of the audit log document | Generated automatically |
| `action` | `String` | Action performed (e.g., `"cancel_order"`) | Required |
| `performedBy` | `ObjectId` | Reference to user executing transaction | Required |
| `targetType` | `String` | String collection category of item | Required |
| `targetId` | `ObjectId` | ID referencing exact modified document | Required, Compound index with `targetType` |
| `metadata` | `Object` | Context values (e.g., previous state values) | Required |
| `createdAt` | `Date` | Timestamp of creation | Set automatically, can have TTL |

---

## 10. `notifications`

### Document Structure
```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // Reference to 'users'
  title: String,
  content: String,
  type: String,                  // "order_status" | "promotion" | "system"
  status: String,                // "unread" | "read"
  metadata: {                    // Optional extra contextual metadata
    orderId: ObjectId,           // Reference to 'orders'
    storeId: ObjectId            // Reference to 'stores'
  },
  createdAt: Date,
  readAt: Date                   // Nullable. Timestamp when user read the notification
}
```

### Field Definitions
| Field | Type | Description | Constraints |
|---|---|---|---|
| `_id` | `ObjectId` | Primary key of the notification document | Generated automatically |
| `userId` | `ObjectId` | Reference to recipient user | Required, Compound index with `status` and `createdAt` |
| `title` | `String` | Brief notification summary title | Required |
| `content` | `String` | Detailed body message of notification | Required |
| `type` | `String` | Category group of notification | Enum: `"order_status"`, `"promotion"`, `"system"` |
| `status` | `String` | Read status tracking flag | Enum: `"unread"`, `"read"`. Default: `"unread"` |
| `metadata` | `Object` | Context metadata containing key IDs | Optional |
| `createdAt` | `Date` | Timestamp of creation | Set automatically, TTL index of 30 days |
| `readAt` | `Date` | Timestamp when user marked notification as read | Nullable |
