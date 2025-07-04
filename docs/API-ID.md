# 📘 API Documentation (Indonesia)

Dokumentasi ini mencakup semua endpoint backend beserta informasi lengkap terkait method, input (request), output (response), serta kemungkinan error.

---

## 📁 AUTH ENDPOINTS

### 🔐 `POST /api/auth/login`

Autentikasi pengguna dan mengembalikan JWT.

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

#### Response

```json
// Success
{
  "message": "Success get token",
  "data": {
    "accessToken": "...",
    "expiresIn": "14d"
  },
  "error": false
}
```

```json
// Error: Email not found / Password salah
{
  "message": "The user was not found / The password is incorrect",
  "error": true
}
```

---

### ✉️ `POST /api/auth/otp/request`

Mengirimkan OTP ke email dari user yang terautentikasi.

#### Header

```
Authorization: Bearer <token>
```

#### Response

```json
{
  "message": "OTP Succes sending",
  "error": false
}
```

---

### ✅ `POST /api/auth/otp/validate`

Validasi OTP yang diterima pengguna.

#### Request Body

```json
{
  "otp": "ABC123"
}
```

#### Response

```json
{
  "message": "OTP Verified",
  "error": false
}
```

```json
// OTP salah / expired
{
  "message": "OTP expired",
  "error": true
}
```

---

### 📝 `POST /api/auth/register`

Mendaftarkan user baru.

#### Request Body

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "Password123"
}
```

#### Response

```json
{
  "message": "Success create user",
  "data": {
    "uniqueId": "USR001",
    "email": "newuser@example.com",
    "otp": "",
    "role": "USER"
  },
  "error": false
}
```

---

## 📝 POST ENDPOINTS

### 📄 `GET /api/post?page=1`

Mengambil daftar post yang belum dihapus.

#### Response

```json
{
  "message": "Success get data",
  "data": [
    {
      "postId": 1,
      "title": "Judul Post",
      "content": "Konten",
      "user": {
        "userId": 1,
        "username": "user1",
        "role": "USER"
      }
    }
  ],
  "error": false
}
```

---

### ✍️ `POST /api/protected/post/[id]`

Membuat post baru. Butuh token dan ID user.

#### Request Body

```json
{
  "userId": 1,
  "title": "Judul Baru",
  "content": "Isi konten minimal 30 karakter"
}
```

#### Response

```json
{
  "message": "Success create data with data :",
  "data": {
    "postId": 1,
    "title": "Judul Baru",
    "content": "...",
    "slug": "judul-baru"
  },
  "error": false
}
```

---

### 🛠️ `PUT /api/protected/post/[id]`

Update post berdasarkan ID.

#### Request Body

```json
{
  "title": "Judul Baru",
  "content": "Konten diperbarui",
  "slug": "judul-baru"
}
```

---

### ❌ `DELETE /api/protected/post/[id]`

Soft-delete post (ubah `isDeleted: true`).

---

### 🗑️ `GET /api/protected/post/permanent`

List post yang sudah dihapus (soft delete).

#### Query

```
?page=1
```

---

### ❌ `DELETE /api/protected/post/permanent/delete`

Hapus permanen daftar post berdasarkan ID.

#### Request Body

```json
[1, 2, 3]
```

---

### ♻️ `DELETE /api/protected/post/permanent/recovery`

Mengembalikan post dari tempat sampah (ubah `isDeleted: false`).

#### Request Body

```json
[1, 2, 3]
```

---

## 👤 USER ENDPOINTS

### 👥 `GET /api/protected/user?page=1`

Ambil user aktif dan semua post miliknya.

---

### 🧑‍💼 `POST /api/protected/user/admin/[params]`

Admin membuat user baru.

#### Request Body

```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "Password123",
  "role": "ADMIN"
}
```

---

### 🛠️ `PUT /api/protected/user/admin/[params]`

Admin update user tertentu.

#### Request Body sama dengan POST di atas.

---

### ❌ `DELETE /api/protected/user/admin/[params]`

Soft delete user (ubah `isDeleted: true`).

---

### 🗑️ `GET /api/protected/user/admin/permanent?page=1`

List user yang sudah dihapus (untuk admin).

---

### ❌ `DELETE /api/protected/user/admin/permanent`

Hapus permanen user berdasarkan ID.

#### Request Body

```json
[1, 2, 3]
```

---

### 🔑 `PUT /api/protected/user/password-reset`

Reset password setelah verifikasi OTP.

#### Request Body

```json
{
  "password": "PasswordLama1",
  "newPassword": "PasswordBaru1",
  "newRetryPassword": "PasswordBaru1"
}
```

#### Response

```json
{
  "message": "Success reset password",
  "data": {},
  "error": false
}
```

---

## ❗ Common Error Format

```json
{
  "message": "Error message",
  "error": true,
  "data": [
    {
      "path": "field",
      "message": "validation error"
    }
  ]
}
```
