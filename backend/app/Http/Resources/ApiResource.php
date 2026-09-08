<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** Generic resource: exposes model attributes + loaded relations flattened as *_name fields expected by the UI. */
class ApiResource extends JsonResource
{
    public function toArray($request): array
    {
        $data = $this->resource->toArray();
        unset($data['password'], $data['remember_token']);
        foreach (['category', 'brand', 'supplier', 'customer', 'user', 'branch', 'role'] as $rel) {
            if ($this->resource->relationLoaded($rel)) {
                $data[$rel.'_name'] = $this->resource->{$rel}?->name;
                if ($rel === 'role') $data['role_slug'] = $this->resource->role?->slug;
                unset($data[$rel]);
            }
        }
        if (isset($data['inventory_sum_quantity'])) { $data['stock'] = (float) $data['inventory_sum_quantity']; unset($data['inventory_sum_quantity']); }
        if ($this->resource instanceof \App\Models\Product) { $data['stock'] = (float) ($data['stock'] ?? $this->resource->stock); $data['stock_status'] = $this->resource->stock_status; }
        if ($this->resource->relationLoaded('items')) $data['items_count'] = (float) $this->resource->items->sum('quantity');
        if ($this->resource->relationLoaded('permissions')) { $data['permissions'] = $this->resource->permissions->pluck('name')->values(); $data['permission_ids'] = $this->resource->permissions->pluck('id')->values(); }
        if (isset($data['users_count'])) $data['users_count'] = (int) $data['users_count'];
        return $data;
    }
}
