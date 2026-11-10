<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Notification;
use App\Models\Product;
use App\Models\Sale;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

/** Notifications, global search across products/customers/orders. */
class MiscController extends Controller
{
    /** List recent notifications for the authenticated user. */
    public function notifications(Request $request)
    {
        $list = Notification::where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $request->user()->id))->latest()->limit(30)->get()
            ->map(fn ($n) => ['id' => $n->id, 'type' => $n->type, 'title' => $n->title, 'message' => $n->message, 'link' => $n->link, 'read' => (bool) $n->read_at, 'created_at' => $n->created_at]);
        return ApiResponse::success($list);
    }

    /** Mark notifications as read. */
    public function markRead(Request $request)
    {
        $ids = $request->input('ids');
        Notification::where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $request->user()->id))->when(is_array($ids), fn ($q) => $q->whereIn('id', $ids))->whereNull('read_at')->update(['read_at' => now()]);
        return $this->notifications($request);
    }

    /** Global search across products, customers, and orders by name/sku/phone/number. */
    public function search(Request $request)
    {
        $q = trim((string) $request->validate(['q' => ['required', 'string', 'min:1', 'max:80']])['q']);
        $user = $request->user();
        return ApiResponse::success([
            'products' => $user->hasPermission('products.view') ? Product::where(fn ($w) => $w->where('name', 'like', "%$q%")->orWhere('sku', 'like', "%$q%"))->limit(5)->get(['id', 'name', 'sku']) : [],
            'customers' => $user->hasPermission('customers.view') ? Customer::where(fn ($w) => $w->where('name', 'like', "%$q%")->orWhere('phone', 'like', "%$q%"))->limit(4)->get(['id', 'name', 'phone']) : [],
            'orders' => $user->hasPermission('orders.view') ? Sale::where('number', 'like', "%$q%")->limit(4)->get(['id', 'number', 'status']) : [],
        ]);
    }
}
