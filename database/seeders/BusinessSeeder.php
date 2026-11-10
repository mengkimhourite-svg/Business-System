<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Business;
use App\Models\ExchangeRate;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Exception;

/** Business, branches, system roles with permission sets, and one demo user per role. */
class BusinessSeeder extends Seeder
{
    /**
     * Reset auto-increment counters so seeded primary keys stay deterministic.
     *
     * MySQL does not roll back AUTO_INCREMENT when a transaction (e.g. the test
     * rollback used by RefreshDatabase) is rolled back, so re-seeding inside a
     * fresh transaction would otherwise assign ever-increasing IDs and break
     * code/tests that reference stable logical IDs (e.g. category_id = 1).
     * This only touches empty tables, leaving any committed production data alone.
     *
     * @return void
     */
    protected function resetAutoIncrement(array $tables): void
    {
        foreach ($tables as $table) {
            $exists = DB::table($table)->count();
            if ($exists) continue;
            try {
                DB::statement("ALTER TABLE `{$table}` AUTO_INCREMENT = 1");
            } catch (Exception $e) {
                // A table may use a non-increment key; ignore quietly.
            }
        }
    }

    public function run(): void
    {
        $this->resetAutoIncrement([
            'businesses', 'branches', 'roles', 'permission_role', 'users',
            'categories', 'brands', 'suppliers', 'customers', 'products',
            'inventory', 'sales', 'sale_items', 'payments', 'purchases',
            'purchase_items', 'expenses', 'notifications',
        ]);
        $business = Business::firstOrCreate(['name' => 'Angkor Mart'], ['subtitle' => 'Smart Business System', 'email' => 'hello@angkormart.com', 'phone' => '855 23 900 100', 'address' => 'St. 63, BKK1, Phnom Penh, Cambodia', 'currency' => 'USD', 'exchange_rate' => 4047, 'tax_rate' => 10, 'receipt_footer' => 'Thank you for shopping with us!', 'notification_settings' => ['notify_low_stock' => true, 'notify_orders' => true, 'notify_reports' => false]]);
        ExchangeRate::firstOrCreate(['business_id' => $business->id, 'from_currency' => 'USD', 'to_currency' => 'KHR', 'effective_date' => now()->toDateString()], ['rate' => 4047]);

        $pp = Branch::firstOrCreate(['business_id' => $business->id, 'code' => 'PP-01'], ['name' => 'Phnom Penh Main', 'address' => 'St. 63, BKK1, Phnom Penh', 'phone' => '855 23 111 222', 'manager' => 'Vanna Ly']);
        $sr = Branch::firstOrCreate(['business_id' => $business->id, 'code' => 'SR-01'], ['name' => 'Siem Reap', 'address' => 'Sivatha Blvd, Siem Reap', 'phone' => '855 63 333 444', 'manager' => 'Malis Nguon']);

        $all = Permission::pluck('id', 'name');
        $by = fn (array $groups, array $extra = []) => $all->filter(fn ($id, $name) => in_array(explode('.', $name)[0], $groups, true) || in_array($name, $extra, true))->values()->all();
        $roles = [
            'super_admin' => ['Super Admin', 'Full access to all features.', true, $all->values()->all()],
            'admin' => ['Admin', 'Administrative access to the whole system.', true, $all->except(['roles.delete', 'branches.delete'])->values()->all()],
            'manager' => ['Manager', 'Manages products, sales, purchases and reports.', true, $by(['dashboard', 'products', 'categories', 'brands', 'customers', 'suppliers', 'sales', 'orders', 'purchases', 'inventory', 'reports', 'ai'], ['expenses.view', 'expenses.create', 'branches.view'])],
            'accountant' => ['Accountant', 'Finance, expenses and reports.', false, $by(['expenses', 'reports'], ['dashboard.view', 'purchases.view', 'orders.view', 'customers.view', 'suppliers.view', 'ai.view', 'settings.view', 'settings.update'])],
            'sales' => ['Sales / Cashier', 'POS, orders and customers.', false, $by(['sales', 'customers'], ['dashboard.view', 'orders.view', 'orders.update', 'products.view', 'categories.view', 'brands.view', 'ai.view', 'settings.view', 'settings.update'])],
            'inventory' => ['Inventory', 'Products, purchases and stock control.', false, $by(['products', 'categories', 'brands', 'suppliers', 'purchases', 'inventory'], ['dashboard.view', 'reports.view', 'ai.view', 'settings.view', 'settings.update'])],
            'purchase' => ['Purchase', 'Purchasing and supplier management.', false, $by(['purchases', 'suppliers'], ['dashboard.view', 'products.view', 'inventory.view', 'ai.view', 'settings.view', 'settings.update'])],
            'warehouse' => ['Warehouse', 'Stock movements and receiving.', false, $by(['inventory'], ['dashboard.view', 'products.view', 'purchases.view', 'purchases.update', 'settings.view', 'settings.update'])],
            'customer_service' => ['Customer Service', 'Customers and order support.', false, $by(['customers'], ['dashboard.view', 'orders.view', 'orders.update', 'products.view', 'ai.view', 'settings.view', 'settings.update'])],
            'auditor' => ['Auditor', 'Read-only access to financial data.', false, $by([], ['dashboard.view', 'reports.view', 'reports.export', 'orders.view', 'purchases.view', 'expenses.view', 'inventory.view', 'ai.view', 'settings.view'])],
        ];
        $models = [];
        foreach ($roles as $slug => [$name, $desc, $system, $perms]) {
            $role = Role::updateOrCreate(['business_id' => $business->id, 'slug' => $slug], ['name' => $name, 'description' => $desc, 'is_system' => $system]);
            $role->permissions()->sync($perms);
            $models[$slug] = $role;
        }

        $users = [['Sokha Chan', 'sokha@sbs.com', 'super_admin', $pp], ['Dara Kim', 'dara@sbs.com', 'admin', $pp], ['Vanna Ly', 'vanna@sbs.com', 'manager', $pp], ['Sreyneang Heng', 'sreyneang@sbs.com', 'accountant', $pp], ['Piseth Meas', 'piseth@sbs.com', 'sales', $pp], ['Bopha Pich', 'bopha@sbs.com', 'inventory', $sr], ['Rithy Ouk', 'rithy@sbs.com', 'sales', $sr], ['Malis Nguon', 'malis@sbs.com', 'manager', $sr]];
        foreach ($users as [$name, $email, $slug, $branch]) {
            User::updateOrCreate(['email' => $email], ['name' => $name, 'password' => 'admin123', 'business_id' => $business->id, 'branch_id' => $branch->id, 'role_id' => $models[$slug]->id, 'status' => 'active']);
        }
    }
}
