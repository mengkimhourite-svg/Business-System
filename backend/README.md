# Smart Business System — Laravel 10 API
Requires PHP 8.2+, Composer, MySQL 8.
```bash
cp .env.example .env && composer install && php artisan key:generate
php artisan migrate:fresh --seed   # development
php artisan test
php artisan serve                  # API at http://127.0.0.1:8000/api/v1
```
Frontend: `VITE_USE_MOCK=false VITE_API_URL=http://127.0.0.1:8000/api/v1`. AI: run `ai/` (FastAPI) and set `AI_SERVICE_URL` / `AI_SERVICE_INTERNAL_KEY`.
Seeded login: `sokha@sbs.com` / `password` (Super Admin) plus admin/manager/accountant/sales/inventory users.
