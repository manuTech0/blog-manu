# 📘 API Documentation (English)

## Table of Contents

* [GET /api/protected/user/admin/permanent](#get-apiprotecteduseradminpermanent)
* [DELETE /api/protected/user/admin/permanent](#delete-apiprotecteduseradminpermanent)
* [PUT /api/protected/user/password-reset](#put-apiprotecteduserpassword-reset)

---

## GET `/api/protected/user/admin/permanent`

### Description

Retrieve a list of permanently deleted users (soft-deleted).

### Authentication

Requires a valid JWT token with `role: ADMIN`.

### Query Parameters

| Name   | Type   | Description                                     |
| ------ | ------ | ----------------------------------------------- |
| `page` | number | Page number to paginate the result (default: 1) |

### Response

**200 OK**

```json
{
  "message": "Success get data",
  "data": [User, ...],
  "error": false
}
```

**404 Not Found**

```json
{
  "message": "Data is empty",
  "error": true
}
```

**501 Unauthorized**

```json
{
  "message": "Access not granted",
  "error": true
}
```

**500 Internal Server Error**

```json
{
  "message": "Unknown error, please report to admin or customer service, time error: <timestamp>",
  "error": true
}
```

---

## DELETE `/api/protected/user/admin/permanent`

### Description

Permanently delete users from the database.

### Authentication

Requires a valid JWT token with `role: ADMIN`.

### Request Body

```json
[1, 2, 3]
```

> An array of `userId` (number) to be permanently deleted.

### Response

**200 OK**

```json
{
  "messgae": "Success deleted with data :",
  "data": {
    "count": 3
  },
  "error": false
}
```

**200 Validation Error**

```json
{
  "message": "Error Validating",
  "data": [
    { "path": "[0]", "message": "Expected number" }
  ],
  "error": true
}
```

**501 Unauthorized**

```json
{
  "message": "Access not granted",
  "error": true
}
```

**500 Internal Server Error**

```json
{
  "message": "Unknown error, please report to admin or customer service, time error: <timestamp>",
  "error": true
}
```

---

## PUT `/api/protected/user/password-reset`

### Description

Reset the password of a user who has a verified OTP and valid token.

### Authentication

Requires a valid JWT token.

### Request Body

```json
{
  "password": "CurrentPassword1",
  "newPassword": "NewPassword1",
  "newRetryPassword": "NewPassword1"
}
```

### Validation Rules

* Minimum 8 characters.
* Must include at least 1 uppercase letter and 1 number.
* `newPassword` must match `newRetryPassword`.

### Response

**200 OK**

```json
{
  "message": "Success reset password",
  "data": {
    "userId": 1,
    "email": "user@example.com",
    ...
  },
  "error": false
}
```

**401 OTP Expired**

```json
{
  "message": "OTP Expired",
  "error": true
}
```

**401 Not Verified**

```json
{
  "message": "OTP Verify vailed",
  "error": true
}
```

**Validation Error**

```json
{
  "message": "Error Validating",
  "data": [
    {
      "path": "newPassword",
      "message": "Password not same"
    }
  ],
  "error": true
}
```

**500 Internal Server Error**

```json
{
  "message": "Unknown error, please report to admin or customer service, time error: <timestamp>",
  "error": true
}
```