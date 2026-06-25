# AI Image Generator SaaS — Architecture Document

**Stack:** React + Vite + Tailwind · Node.js + Express · MongoDB Atlas · JWT (Bearer, localStorage) · Groq Image API · Razorpay · Cloudinary

This document is the contract between frontend and backend. As long as both sides honor the request/response shapes and route names defined here, they can be built and tested independently (frontend can mock these exact JSON shapes).

---

## 1. Folder Structure

### 1.1 Frontend (`client/`)

```
client/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/          # Button, Input, Loader, Modal, Toast, CreditBadge
│   │   ├── layout/           # Navbar, Footer, Sidebar
│   │   ├── auth/              # LoginForm, SignupForm
│   │   ├── generator/        # PromptInput, GeneratedImageCard, GenerateButton
│   │   ├── history/           # ImageGrid, ImageHistoryCard
│   │   └── pricing/           # PlanCard, PaymentButton
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Generate.jsx
│   │   ├── History.jsx
│   │   ├── Pricing.jsx
│   │   ├── Profile.jsx
│   │   └── NotFound.jsx
│   ├── context/
│   │   └── AuthContext.jsx    # user, token, login(), logout(), credits
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useCredits.js
│   ├── services/              # one file per API resource — mirrors backend routes
│   │   ├── api.js             # axios instance, interceptors (attach token, handle 401)
│   │   ├── authService.js
│   │   ├── imageService.js
│   │   ├── paymentService.js
│   │   └── userService.js
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   └── ProtectedRoute.jsx
│   ├── utils/
│   │   └── constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env                        # VITE_API_BASE_URL, VITE_RAZORPAY_KEY_ID
├── vite.config.js
└── package.json
```

### 1.2 Backend (`server/`)

```
server/
├── src/
│   ├── config/
│   │   ├── db.js               # MongoDB Atlas connection
│   │   ├── cloudinary.js
│   │   ├── razorpay.js
│   │   └── imageProvider.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Image.js
│   │   ├── Transaction.js
│   │   └── CreditPlan.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── imageController.js
│   │   ├── paymentController.js
│   │   └── userController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── imageRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── userRoutes.js
│   ├── middlewares/
│   │   ├── authMiddleware.js     # verifies JWT, attaches req.user
│   │   ├── creditMiddleware.js   # blocks request if credits <= 0
│   │   ├── errorMiddleware.js    # central error handler
│   │   └── validateMiddleware.js # request body validation
│   ├── services/
│   │   ├── imageProviderService.js        
│   │   ├── cloudinaryService.js  # upload/delete
│   │   └── razorpayService.js    # order creation, signature verification
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── asyncHandler.js
│   │   ├── apiResponse.js        # uniform success shape
│   │   └── apiError.js           # uniform error shape
│   ├── validators/
│   │   ├── authValidator.js
│   │   └── imageValidator.js
│   └── app.js                    # express app, middlewares, route mounting
├── server.js                     # entry point, starts http server
├── .env
└── package.json
```

---

## 2. Database Schema (MongoDB / Mongoose)

### 2.1 `User`
```js
{
  _id: ObjectId,
  name: String,
  email: String,         // unique, indexed, lowercase
  password: String,      // bcrypt hash, select:false
  credits: {
    type: Number,
    default: 5         
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },       
  avatar: String,        // optional, cloudinary URL
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2 `Image`
```js
{
  _id: ObjectId,
  user: ObjectId,         // ref: 'User', indexed
  prompt: String,
  imageUrl: String,        // Cloudinary secure_url
  publicId: String,        // Cloudinary public_id (for deletion)
  creditsUsed: Number,      // default: 1
  status: {
    type: String,
    enum: ["pending","completed","failed"]
  }, 

  isFavorite: {
    type: Boolean,
    default: false
  },         
  errorMessage: String,    
  createdAt: Date,
  updatedAt: Date
}
```

### 2.3 `Transaction`
```js
{
  _id: ObjectId,
  user: ObjectId,                 // ref: 'User', indexed
  plan: ObjectId,                  // ref: 'CreditPlan'
  razorpayOrderId: String,         // indexed
  razorpayPaymentId: String,
  razorpaySignature: String,
  amount: Number,                   // in smallest currency unit (paise)
  currency: String,                  // 'INR'
  creditsPurchased: Number,
  status: String,                    // enum: ['created','paid','failed']
  createdAt: Date
}
```

### 2.4 `CreditPlan`
```js
{
  _id: ObjectId,
  name: String,            // "Starter", "Pro", "Business"
  price: Number,            // in smallest currency unit (paise)
  currency: String,          // 'INR'
  credits: Number,
  isActive: Boolean,         // default: true
  createdAt: Date
}
```

> `CreditPlan` can be seeded once and treated as near-static; the Pricing page always reads it from `/api/payments/plans` so prices are never hardcoded on the frontend.

---

## 3, 4, 5. API Endpoints, Request Bodies, Response Bodies

**Uniform response envelope** (used by every endpoint):

Success:
```json
{ "success": true, "message": "string", "data": { } }
```

Error:
```json
{ "success": false, "message": "string", "error": "ERROR_CODE" }
```

HTTP status codes used: `200` OK, `201` Created, `400` Bad Request, `401` Unauthorized, `402` Payment/Credits Required, `403` Forbidden, `404` Not Found, `409` Conflict, `500` Server Error.

---

### 3.1 Auth — `/api/auth`

#### `POST /api/auth/signup`
Request:
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "Secret123!" }
```
Response (201):
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": { "id": "664f...", "name": "Jane Doe", "email": "jane@example.com", "credits": 5 },
    "token": "eyJhbGciOi..."
  }
}
```
Errors: `409 EMAIL_ALREADY_EXISTS`, `400 VALIDATION_ERROR`

---

#### `POST /api/auth/login`
Request:
```json
{ "email": "jane@example.com", "password": "Secret123!" }
```
Response (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "664f...", "name": "Jane Doe", "email": "jane@example.com", "credits": 7 },
    "token": "eyJhbGciOi..."
  }
}
```
Errors: `401 INVALID_CREDENTIALS`

---

#### `POST /api/auth/logout`
Request: *(empty body, requires Bearer token)*
Response (200):
```json
{ "success": true, "message": "Logged out successfully", "data": null }
```
> Logout is primarily a frontend action (clear localStorage). This endpoint exists for symmetry/audit logging and can be a no-op on the backend since JWT is stateless.

---

#### `GET /api/auth/me`
*(requires Bearer token — used on app load to rehydrate session)*
Response (200):
```json
{
  "success": true,
  "message": "User fetched",
  "data": { "user": { "id": "664f...", "name": "Jane Doe", "email": "jane@example.com", "credits": 7 } }
}
```
Errors: `401 UNAUTHORIZED`

---

### 3.2 User — `/api/users`

#### `GET /api/users/credits`
*(requires Bearer token)*
Response (200):
```json
{ "success": true, "message": "Credits fetched", "data": { "credits": 7 } }
```

---

### 3.3 Image — `/api/images`

#### `POST /api/images/generate`
*(requires Bearer token + credits > 0)*
Request:
```json
{ "prompt": "a cyberpunk city at night, neon lights, ultra detailed" }
```
Response (201):
```json
{
  "success": true,
  "message": "Image generated successfully",
  "data": {
    "image": {
      "id": "665a...",
      "prompt": "a cyberpunk city at night, neon lights, ultra detailed",
      "imageUrl": "https://res.cloudinary.com/.../image.png",
      "creditsUsed": 1,
      "status": "completed",
      "createdAt": "2026-06-25T10:00:00.000Z"
    },
    "remainingCredits": 6
  }
}
```
Errors:
- `402 INSUFFICIENT_CREDITS` — no credits left, generation never attempted
- `502 GROQ_GENERATION_FAILED` — Groq API failed, credit NOT deducted
- `500 IMAGE_UPLOAD_FAILED` — Cloudinary failed after generation, credit NOT deducted

---

#### `GET /api/images/history`
*(requires Bearer token, supports pagination)*
Query params: `?page=1&limit=12`
Response (200):
```json
{
  "success": true,
  "message": "History fetched",
  "data": {
    "images": [
      {
        "id": "665a...",
        "prompt": "a cyberpunk city at night...",
        "imageUrl": "https://res.cloudinary.com/.../image.png",
        "creditsUsed": 1,
        "createdAt": "2026-06-25T10:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 12, "totalPages": 4, "totalItems": 42 }
  }
}
```

#### `GET /api/images/:id`
Response (200): same single `image` object shape as above.
Errors: `404 IMAGE_NOT_FOUND`, `403 FORBIDDEN` (not the owner)

#### `DELETE /api/images/:id` *(optional feature)*
Response (200):
```json
{ "success": true, "message": "Image deleted", "data": null }
```

---

### 3.4 Payment — `/api/payments`

#### `GET /api/payments/plans`
*(public, no auth required — Pricing page needs this pre-login too)*
Response (200):
```json
{
  "success": true,
  "message": "Plans fetched",
  "data": {
    "plans": [
      { "id": "plan_1", "name": "Starter", "price": 19900, "currency": "INR", "credits": 50 },
      { "id": "plan_2", "name": "Pro", "price": 49900, "currency": "INR", "credits": 150 }
    ]
  }
}
```
> `price` is in paise (smallest unit), matching Razorpay convention. Frontend divides by 100 for display.

---

#### `POST /api/payments/create-order`
*(requires Bearer token)*
Request:
```json
{ "planId": "plan_1" }
```
Response (201):
```json
{
  "success": true,
  "message": "Order created",
  "data": {
    "orderId": "order_NXyz123",
    "amount": 19900,
    "currency": "INR",
    "razorpayKeyId": "rzp_test_xxxxx"
  }
}
```
> Frontend uses `orderId` + `razorpayKeyId` to open the Razorpay Checkout widget.

---

#### `POST /api/payments/verify`
*(requires Bearer token — called after Razorpay checkout success callback)*
Request:
```json
{
  "razorpay_order_id": "order_NXyz123",
  "razorpay_payment_id": "pay_NXabc456",
  "razorpay_signature": "9ef4dd...sig"
}
```
Response (200):
```json
{
  "success": true,
  "message": "Payment verified, credits added",
  "data": { "creditsAdded": 50, "totalCredits": 56 }
}
```
Errors: `400 SIGNATURE_VERIFICATION_FAILED`, `404 ORDER_NOT_FOUND`, `409 ALREADY_PROCESSED`

---

## 6. JWT Flow

1. **Signup / Login** → backend validates credentials → signs a JWT (`{ userId, exp }`, e.g. 7-day expiry) → returns it in the `data.token` field of the response body (never as a cookie, since the project uses Bearer auth).
2. **Frontend** stores the token in `localStorage` (e.g. key `auth_token`) and the user object in `AuthContext`.
3. **Every protected request** attaches it via an axios interceptor:
   `Authorization: Bearer <token>`
4. **Backend `authMiddleware`**:
   - Reads `Authorization` header → verifies signature & expiry with `jsonwebtoken`.
   - On success: fetches the `User` from DB, attaches as `req.user` (excluding password), calls `next()`.
   - On failure (missing/expired/invalid): responds `401 UNAUTHORIZED` immediately.
5. **Frontend axios response interceptor**: on any `401`, clears localStorage + `AuthContext`, redirects to `/login`.
6. **Logout**: frontend clears `localStorage` + context state and redirects to `/login`. No server-side token blacklist is needed for v1 since JWT is stateless; this can be upgraded later with a token-blacklist collection if instant revocation is required.
7. **`GET /api/auth/me`** is called once on app boot (if a token exists in localStorage) to validate the token and rehydrate `AuthContext` on page refresh.

---

## 7. Credit Flow

| Event | Effect on `User.credits` |
|---|---|
| Signup | Set to a free starting balance (e.g. `5`) |
| Successful image generation | `-1` (or per-image cost, deducted **after** confirmed success) |
| Failed generation (Groq/Cloudinary error) | `0` — no deduction, user is not charged for failures |
| Successful Razorpay payment (`/payments/verify`) | `+ plan.credits` |

**Deduction ordering (avoids charging for failures, avoids race conditions):**

1. `creditMiddleware` checks `req.user.credits > 0` before allowing `/images/generate` to proceed. If `0`, short-circuit with `402 INSUFFICIENT_CREDITS` — Groq is never called.
2. Controller calls Groq → uploads to Cloudinary → **only after both succeed**, it does an atomic decrement:
   ```
   findOneAndUpdate({ _id: userId, credits: { $gt: 0 } }, { $inc: { credits: -1 } })
   ```
   This atomic, conditional update prevents two concurrent requests from both passing the initial check and over-spending credits (a classic race condition with a "read-then-write" pattern).
3. If the atomic decrement fails (credits hit 0 between the check and this point), the already-generated image is discarded/not saved, and `402 INSUFFICIENT_CREDITS` is returned.
4. The new `credits` balance is returned in the generation response (`remainingCredits`) so the frontend can update the UI without a separate fetch.

**Top-up flow** (`/payments/verify`) uses a similar atomic `$inc` after signature verification succeeds, and writes the `Transaction.status = 'paid'` only once (checked via `ALREADY_PROCESSED` guard on `razorpayOrderId` to make the endpoint idempotent against duplicate client retries).

---

## 8. Image Generation Flow (end-to-end)

```
[Frontend: Generate page]
   │  user types prompt, clicks "Generate"
   ▼
POST /api/images/generate  { prompt }   (Authorization: Bearer <token>)
   │
   ▼
[authMiddleware] → verifies JWT, loads req.user
   │
   ▼
[creditMiddleware] → req.user.credits > 0 ?  ── No ──► 402 INSUFFICIENT_CREDITS (stop)
   │ Yes
   ▼
[imageController.generate]
   │  1. Save Image doc with status:"pending"
   │  2. Call imageProviderService.generateImage(prompt) → returns image buffer/URL
│          └─ on failure: update Image.status:"failed", return 502 IMAGE_GENERATION_FAILED
   │  3. Call cloudinaryService.upload(image) → returns { secure_url, public_id }
   │       └─ on failure: update Image.status:"failed", return 500 IMAGE_UPLOAD_FAILED
   │  4. Update Image doc → status:"completed", imageUrl, publicId
   │  5. Atomically decrement User.credits by 1 (see Section 7)
   ▼
Response 201 { image, remainingCredits }
   │
   ▼
[Frontend]
   │  - render returned imageUrl in GeneratedImageCard
   │  - update credits in AuthContext/useCredits
   │  - "Download" button does a direct browser download of imageUrl
   │    (Cloudinary URL supports fl_attachment for forced download)
   ▼
[History page] → GET /api/images/history → renders ImageGrid from past Image docs
```

---

## 9. Frontend Routes (React Router)

| Path | Component | Access | Notes |
|---|---|---|---|
| `/` | `Home.jsx` | Public | Landing page |
| `/signup` | `Signup.jsx` | Public only | Redirect to `/generate` if already logged in |
| `/login` | `Login.jsx` | Public only | Redirect to `/generate` if already logged in |
| `/pricing` | `Pricing.jsx` | Public | Fetches `/api/payments/plans`; "Buy" triggers login if not authenticated |
| `/generate` | `Generate.jsx` | Protected | Main app screen |
| `/history` | `History.jsx` | Protected | |
| `/profile` | `Profile.jsx` | Protected | Shows credits, account info |
| `*` | `NotFound.jsx` | Public | |

`ProtectedRoute.jsx` wraps protected pages: checks `AuthContext.token` (and optionally re-validates via `/api/auth/me` on first load); redirects to `/login` if absent.

---

## 10. Backend Routes (Express Routers)

| Router file | Mounted at | Routes |
|---|---|---|
| `authRoutes.js` | `/api/auth` | `POST /signup`, `POST /login`, `POST /logout` *(auth)*, `GET /me` *(auth)* |
| `userRoutes.js` | `/api/users` | `GET /credits` *(auth)* |
| `imageRoutes.js` | `/api/images` | `POST /generate` *(auth, credits)*, `GET /history` *(auth)*, `GET /:id` *(auth)*, `DELETE /:id` *(auth)* |
| `paymentRoutes.js` | `/api/payments` | `GET /plans` *(public)*, `POST /create-order` *(auth)*, `POST /verify` *(auth)* |

`(auth)` = passes through `authMiddleware`. `(credits)` = additionally passes through `creditMiddleware`.

All routers are mounted in `app.js`:
```
/api/auth      → authRoutes
/api/users     → userRoutes
/api/images    → imageRoutes
/api/payments  → paymentRoutes
```

A central `errorMiddleware` is registered last, catching anything thrown by `asyncHandler`-wrapped controllers and formatting it into the uniform error envelope from Section 3.

---

## Why this enables independent development

- **Frontend** can build every page against the exact JSON shapes above using a mock service layer (e.g. `msw` or static JSON), then swap in real `axios` calls with zero shape changes.
- **Backend** can build and Postman-test every route against this same contract without a single line of frontend code.
- The **uniform envelope** (`success/message/data` or `success/message/error`) means the frontend never needs route-specific response parsing logic — one response handler works everywhere.
- **Credit and image-generation ordering rules** (Section 7 & 8) are pinned down up front, so there's no ambiguity later about whether failed generations cost credits or whether race conditions are possible.

---

## Environment Variables

### Backend

```env
PORT=5000

MONGODB_URI=

JWT_SECRET=

IMAGE_PROVIDER=groq

GROQ_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### Frontend

```env
VITE_API_BASE_URL=http://localhost:5000/api

VITE_RAZORPAY_KEY_ID=
```