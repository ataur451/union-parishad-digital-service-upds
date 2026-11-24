## Local demo accounts

Demo accounts are seeded only when `DEMO_MODE=true` and `DATABASE_URL` points to SQLite. Set these values in the backend process environment; do not enable demo mode with a shared or production database:

```powershell
$env:DATABASE_URL = "sqlite:///./upds_local.db"
$env:DEMO_MODE = "true"
$env:DEMO_ADMIN_PASSWORD = "Admin1234"
$env:DEMO_USER_PASSWORD = "User1234"
python -m uvicorn main:app --reload
```

The seeded accounts are `admin@gmail.com` (admin) and `user@gmail.com` (user). Public registration always creates a user; the account-type selector does not grant admin access.