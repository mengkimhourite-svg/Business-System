<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResourceRequest;
use App\Http\Resources\ApiResource;
use App\Models\{Branch, Brand, Category, Customer, Expense, Inventory, InventoryMovement, Product, Role, Supplier, User};
use App\Services\InventoryService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Config-driven CRUD for simple resources: list (search/filter/sort/pagination), show, store, update, destroy, bulk-delete.
 * Tenant isolation comes from the BelongsToBusiness global scope; permissions from route middleware.
 */
class ResourceController extends Controller
{
    private const CONFIG = [
        'products' => ['model' => Product::class, 'search' => ['name', 'sku', 'barcode'], 'filters' => ['category_id', 'brand_id', 'supplier_id', 'status'], 'with' => ['category:id,name', 'brand:id,name', 'supplier:id,name'], 'sort' => ['name', 'sku', 'selling_price', 'created_at', 'status']],
        'categories' => ['model' => Category::class, 'search' => ['name', 'description'], 'filters' => ['status'], 'withCount' => ['products'], 'sort' => ['name', 'created_at', 'status', 'products_count'], 'defaultSort' => ['name', 'asc']],
        'brands' => ['model' => Brand::class, 'search' => ['name', 'website'], 'filters' => ['status'], 'withCount' => ['products'], 'sort' => ['name', 'created_at', 'status'], 'defaultSort' => ['name', 'asc']],
        'suppliers' => ['model' => Supplier::class, 'search' => ['name', 'contact_name', 'email', 'phone'], 'filters' => ['status'], 'withCount' => ['products'], 'sort' => ['name', 'created_at', 'status'], 'defaultSort' => ['name', 'asc']],
        'customers' => ['model' => Customer::class, 'search' => ['name', 'email', 'phone'], 'filters' => ['status', 'type'], 'sort' => ['name', 'type', 'created_at', 'status', 'orders_count', 'total_spent', 'last_order_at']],
        'branches' => ['model' => Branch::class, 'search' => ['name', 'code', 'address', 'manager'], 'filters' => ['status'], 'withCount' => ['users'], 'sort' => ['name', 'created_at', 'status'], 'defaultSort' => ['name', 'asc']],
        'expenses' => ['model' => Expense::class, 'search' => ['reference', 'category', 'note'], 'filters' => ['status', 'category', 'branch_id'], 'with' => ['user:id,name'], 'sort' => ['date', 'amount', 'category', 'status', 'created_at'], 'dateField' => 'date'],
        'users' => ['model' => User::class, 'search' => ['name', 'email'], 'filters' => ['status', 'role_id', 'branch_id'], 'with' => ['role:id,name,slug', 'branch:id,name'], 'sort' => ['name', 'email', 'created_at', 'status', 'last_active_at']],
        'roles' => ['model' => Role::class, 'search' => ['name', 'description'], 'with' => ['permissions:id,name'], 'withCount' => ['users'], 'sort' => ['id', 'name'], 'defaultSort' => ['id', 'asc']],
    ];

    public function __construct(private InventoryService $inventory) {}

    private function cfg(string $resource): array
    {
        abort_unless(isset(self::CONFIG[$resource]), 404, 'Resource not found.');
        return self::CONFIG[$resource];
    }

    private function query(string $resource, Request $request)
    {
        $cfg = $this->cfg($resource);
        $q = $cfg['model']::query();
        if ($resource === 'users') $q->where('business_id', $request->user()->business_id);
        if ($resource === 'roles') $q->where(fn ($w) => $w->whereNull('business_id')->orWhere('business_id', $request->user()->business_id));
        if ($resource === 'products') {
            $sub = 'SELECT product_id, COALESCE(SUM(quantity),0) as stock FROM inventory GROUP BY product_id';
            $q->select('products.*')
              ->leftJoinSub($sub, 'inv', 'inv.product_id', '=', 'products.id')
              ->addSelect('inv.stock')
              ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
              ->addSelect('categories.name as category_name')
              ->leftJoin('brands', 'brands.id', '=', 'products.brand_id')
              ->addSelect('brands.name as brand_name')
              ->leftJoin('suppliers', 'suppliers.id', '=', 'products.supplier_id')
              ->addSelect('suppliers.name as supplier_name');
        }
        if ($resource === 'customers') {
            $sub = "SELECT customer_id, COUNT(*) as orders_count, COALESCE(SUM(total),0) as total_spent, MAX(created_at) as last_order_at FROM sales WHERE status != 'cancelled' AND customer_id IS NOT NULL GROUP BY customer_id";
            $q->select('customers.*')
              ->leftJoinSub($sub, 'agg', 'agg.customer_id', '=', 'customers.id')
              ->addSelect(DB::raw('COALESCE(agg.orders_count,0) as orders_count, COALESCE(agg.total_spent,0) as total_spent, agg.last_order_at'));
        }
        if ($resource === 'categories') $q->withCount(['products']);
        if ($resource === 'brands') $q->withCount(['products']);
        if ($resource === 'suppliers') $q->withCount(['products']);
        if ($resource === 'expenses') $q->with('user:id,name');
        if ($resource === 'users') $q->with('role:id,name,slug', 'branch:id,name');
        if ($resource === 'roles') $q->with('permissions:id,name');
        if ($resource === 'branches') $q->withCount(['users']);
        return $q;
    }

    public function index(Request $request, string $resource)
    {
        $cfg = $this->cfg($resource);
        $q = $this->query($resource, $request);
        if ($search = trim((string) $request->query('search'))) {
            $q->where(fn ($w) => collect($cfg['search'])->each(fn ($col) => $w->orWhere($col, 'like', "%{$search}%")));
        }
        $table = $cfg['model']::query()->getModel()->getTable();
        foreach ($cfg['filters'] ?? [] as $f) {
            if (($v = $request->query($f)) !== null && $v !== '' && $v !== 'all') $q->where("$table.$f", $v);
        }
        if ($resource === 'products' && ($ss = $request->query('stock_status'))) {
            $reorder = DB::getTablePrefix().'products.reorder_level';
            if ($ss === 'out_of_stock') {
                $q->whereRaw('COALESCE(inv.stock, 0) <= 0');
            } elseif ($ss === 'low_stock') {
                $q->whereRaw('COALESCE(inv.stock, 0) > 0')->whereRaw('COALESCE(inv.stock, 0) <= '.$reorder);
            } else {
                $q->whereRaw('COALESCE(inv.stock, 0) > '.$reorder);
            }
        }
        $dateField = $cfg['dateField'] ?? 'created_at';
        if ($from = $request->query('from')) $q->whereDate($dateField, '>=', $from);
        if ($to = $request->query('to')) $q->whereDate($dateField, '<=', $to);
        [$sortBy, $sortDir] = [$request->query('sort_by'), strtolower($request->query('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc'];
        if ($sortBy && in_array($sortBy, $cfg['sort'], true)) $q->orderBy("$table.$sortBy", $sortDir);
        else { [$dcol, $ddir] = $cfg['defaultSort'] ?? ['created_at', 'desc']; $q->orderBy($dcol, $ddir); }
        $perPage = min(500, max(1, (int) $request->query('per_page', 10)));
        return ApiResponse::paginated(ApiResource::collection($q->paginate($perPage)));
    }

    public function show(Request $request, int $id, string $resource)
    {
        return ApiResponse::success(new ApiResource($this->query($resource, $request)->findOrFail($id)));
    }

    public function store(ResourceRequest $request, string $resource)
    {
        $cfg = $this->cfg($resource);
        $data = $request->validated();
        // RBAC: admin must not create/assign super-admin
        if ($resource === 'roles' && isset($data['name']) && \Illuminate\Support\Str::slug($data['name'], '_') === 'super_admin' && $request->user()->role?->slug !== 'super_admin') {
            return ApiResponse::error('You cannot create a super-admin role.', 403);
        }
        $model = DB::transaction(function () use ($cfg, $resource, $data, $request) {
            $permissionIds = $data['permission_ids'] ?? null; unset($data['permission_ids']);
            $stock = $data['stock'] ?? null; unset($data['stock']);
            if ($resource === 'roles') $data += ['business_id' => $request->user()->business_id, 'slug' => \Illuminate\Support\Str::slug($data['name'], '_')];
            if ($resource === 'users') $data['business_id'] = $request->user()->business_id;
            if ($resource === 'expenses') $data += ['reference' => 'EXP-'.str_pad((string) ((Expense::max('id') ?? 0) + 3001), 5, '0', STR_PAD_LEFT), 'user_id' => $request->user()->id, 'currency' => $request->user()->business->currency, 'exchange_rate' => $request->user()->business->exchange_rate];
            $model = $cfg['model']::create($data);
            if ($resource === 'roles' && $permissionIds !== null) $model->permissions()->sync($permissionIds);
            if ($resource === 'products' && $stock !== null && (float) $stock > 0) {
                $branchId = $request->user()->branch_id;
                if (!$branchId) {
                    $branch = Branch::where('business_id', $request->user()->business_id)->where('status', 'active')->first();
                    $branchId = $branch?->id;
                }
                if ($branchId) {
                    $this->inventory->move($model, (int) $branchId, (string) $stock, 'in', 'Opening stock', null, $request->user()->id);
                }
            }
            return $model;
        });
        $q = $this->query($resource, $request);
        return ApiResponse::success(new ApiResource($q->findOrFail($model->id)), 'Created', 201);
    }

    public function update(ResourceRequest $request, int $id, string $resource)
    {
        $model = $this->query($resource, $request)->findOrFail($id);
        // RBAC: admin must not edit Super Admin permissions
        if ($resource === 'roles' && $model->slug === 'super_admin' && $request->user()->role?->slug !== 'super_admin') {
            return ApiResponse::error('You cannot edit the Super Admin role.', 403);
        }
        $data = $request->validated();
        if ($resource === 'roles' && $model->is_system && isset($data['name'])) unset($data['name']);
        if ($resource === 'users' && empty($data['password'])) unset($data['password']);
        unset($data['stock']);
        DB::transaction(function () use ($model, $data, $resource) {
            $permissionIds = $data['permission_ids'] ?? null; unset($data['permission_ids']);
            $model->update($data);
            if ($resource === 'roles' && $permissionIds !== null) $model->permissions()->sync($permissionIds);
        });
        return ApiResponse::success(new ApiResource($model->fresh($this->cfg($resource)['with'] ?? [])), 'Updated');
    }

    public function destroy(Request $request, int $id, string $resource)
    {
        $model = $this->query($resource, $request)->findOrFail($id);
        if ($resource === 'roles' && $model->is_system) return ApiResponse::error('System roles cannot be deleted.', 403);
        if ($resource === 'users' && $model->id === $request->user()->id) return ApiResponse::error('You cannot delete your own account.', 403);
        $model->delete();
        return ApiResponse::success(null, 'Deleted');
    }

    public function bulkDestroy(Request $request, string $resource)
    {
        $ids = $request->validate(['ids' => ['required', 'array', 'max:500'], 'ids.*' => ['integer']])['ids'];
        $q = $this->query($resource, $request)->whereIn('id', $ids);
        if ($resource === 'roles') $q->where('is_system', false);
        if ($resource === 'users') $q->where('id', '!=', $request->user()->id);
        $count = $q->count();
        $q->get()->each->delete();
        return ApiResponse::success(['deleted' => $count], 'Deleted');
    }
}
