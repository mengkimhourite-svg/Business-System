<?php

namespace Database\Seeders;

use App\Models\Currency;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (config('sbs.permission_groups') as $group => $abilities) {
            foreach ($abilities as $ability) {
                Permission::firstOrCreate(['name' => "$group.$ability"], ['group' => $group, 'ability' => $ability]);
            }
        }
        Currency::updateOrCreate(['code' => 'USD'], ['name' => 'US Dollar', 'symbol' => '$', 'decimals' => 2]);
        Currency::updateOrCreate(['code' => 'KHR'], ['name' => 'Cambodian Riel', 'symbol' => '៛', 'decimals' => 0]);
    }
}
