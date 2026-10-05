<?php

namespace Database\Seeders;

use App\Models\{Brand, Business, Category, Customer, Expense, Inventory, InventoryMovement, Notification, Payment, Product, Purchase, PurchaseItem, Sale, SaleItem, Supplier, User};
use Illuminate\Database\Seeder;

/** Deterministic demo catalogue + 60 days of sales so dashboards/reports/AI have data. Skips if products exist. */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $business = Business::first();
        if (!$business || Product::withoutGlobalScopes()->where('business_id', $business->id)->exists()) return;
        $bid = $business->id;
        $branch = $business->branches()->first();
        $cashiers = User::where('business_id', $bid)->whereIn('email', ['dara@sbs.com', 'vanna@sbs.com', 'piseth@sbs.com', 'rithy@sbs.com'])->get();
        mt_srand(20240517);

        $cats = collect(['Beverages', 'Snacks', 'Dairy', 'Bakery', 'Electronics', 'Household', 'Personal Care', 'Stationery'])->mapWithKeys(fn ($n) => [$n => Category::create(['business_id' => $bid, 'name' => $n, 'description' => "$n products"])]);
        $sups = collect([['Cambodia Beverage Co.', 'Sok Dara'], ['Phnom Penh Fresh Foods', 'Chan Sophea'], ['Mekong Electronics Ltd.', 'Kim Vanna'], ['Angkor Household Supplies', 'Heng Piseth'], ['Khmer Care Distribution', 'Ly Sreyneang'], ['Office Pro Cambodia', 'Meas Chantha']])->map(fn ($s, $i) => Supplier::create(['business_id' => $bid, 'name' => $s[0], 'contact_name' => $s[1], 'email' => 'sales@supplier'.($i + 1).'.com', 'phone' => '855 12 000 '.str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT)]));
        $seed = [
            ['Coca-Cola 330ml', 'Beverages', 'Coca-Cola', 0, 0.35, 0.6, 240, 48, 'can', 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop', 'Classic Coca-Cola cola-flavored carbonated soft drink. Refreshing taste perfect for meals, parties, and everyday enjoyment.'],
            ['Angkor Beer 330ml', 'Beverages', 'Angkor', 0, 0.55, 0.9, 180, 48, 'can', 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop', 'Premium Cambodian lager beer with a smooth, crisp flavor. Cambodia\'s most popular beer, ideal for social gatherings.'],
            ['Vital Water 1.5L', 'Beverages', 'Vital', 0, 0.25, 0.45, 36, 40, 'bottle', 'https://images.unsplash.com/photo-1523362628745-0c100fc988a6?w=400&h=400&fit=crop', 'Pure purified drinking water in a convenient 1.5-liter bottle. Safe, clean, and essential for daily hydration.'],
            ["Lay's Classic 70g", 'Snacks', "Lay's", 1, 0.65, 1.0, 95, 30, 'pack', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop', 'Crispy golden potato chips with a classic salted flavor. Light, crunchy, and perfect for snacking anytime.'],
            ['Oreo Original 133g', 'Snacks', 'Oreo', 1, 0.7, 1.1, 64, 24, 'pack', 'https://images.unsplash.com/photo-1621202325924-58d6f0b0a440?w=400&h=400&fit=crop', 'Iconic chocolate sandwich cookies with a sweet cream filling. Twist, lick, and dunk for the classic Oreo experience.'],
            ['Pringles Original 107g', 'Snacks', 'Pringles', 1, 1.2, 1.9, 0, 12, 'can', 'https://images.unsplash.com/photo-1613919113640-25732ef5c6f9?w=400&h=400&fit=crop', 'Stackable crispy potato crisps with a unique saddle shape. Consistent crunch and delicious original flavor in every chip.'],
            ['Anchor Full Cream Milk 1L', 'Dairy', 'Anchor', 1, 1.6, 2.3, 42, 24, 'carton', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop', 'Rich and creamy full cream milk from New Zealand pastures. Packed with calcium and vitamin D for strong bones.'],
            ['Dutch Lady Yogurt 4pk', 'Dairy', 'Dutch Lady', 1, 1.4, 2.1, 18, 20, 'pack', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop', 'Smooth and creamy yogurt in a convenient 4-pack. Great source of probiotics for healthy digestion and gut health.'],
            ['French Baguette', 'Bakery', 'House Bakery', 1, 0.3, 0.6, 40, 20, 'pcs', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop', 'Freshly baked French-style baguette with a crispy golden crust and soft, airy interior. Perfect for sandwiches or with butter.'],
            ['Samsung Galaxy A15 128GB', 'Electronics', 'Samsung', 2, 145, 189, 9, 3, 'pcs', 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop', 'Feature-packed smartphone with vibrant 6.5" AMOLED display, triple camera system, and long-lasting 5000mAh battery.'],
            ['Anker 20W USB-C Charger', 'Electronics', 'Anker', 2, 9.5, 15.9, 34, 10, 'pcs', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop', 'Compact and fast USB-C wall charger with PowerIQ technology. Charges iPhone, Samsung, and other devices up to 3x faster.'],
            ['JBL Go 3 Speaker', 'Electronics', 'JBL', 2, 28, 39.9, 4, 5, 'pcs', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop', 'Ultra-portable Bluetooth speaker with bold JBL Pro Sound. Waterproof, dustproof, and offers up to 5 hours of playtime.'],
            ['Sunlight Dish Soap 750ml', 'Household', 'Unilever', 3, 1.1, 1.8, 58, 20, 'bottle', 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop', 'Powerful grease-cutting dishwashing liquid with a refreshing lemon fragrance. Removes tough grease and food residue easily.'],
            ['Scott Paper Towels 2pk', 'Household', 'Scott', 3, 1.6, 2.5, 12, 15, 'pack', 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=400&h=400&fit=crop', 'Absorbent and durable paper towels for quick cleanup of spills and messes. Strong enough for tough jobs, gentle on surfaces.'],
            ['Colgate Toothpaste 150g', 'Personal Care', 'Colgate', 4, 1.2, 1.95, 76, 24, 'pcs', 'https://images.unsplash.com/photo-1559304787-e4e4a2a972e0?w=400&h=400&fit=crop', 'Advanced cavity protection toothpaste with fluoride formula. Fights plaque, strengthens enamel, and freshens breath.'],
            ['Head & Shoulders 330ml', 'Personal Care', 'P&G', 4, 3.4, 5.2, 8, 10, 'bottle', 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc6?w=400&h=400&fit=crop', 'Anti-dandruff shampoo with citrus fresh scent. Provides up to 100% dandruff protection while leaving hair clean and soft.'],
            ['Pilot G2 Gel Pen Black', 'Stationery', 'Pilot', 5, 0.9, 1.5, 150, 40, 'pcs', 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=400&fit=crop', 'Smooth-writing premium gel pen with ergonomic rubber grip. Delivers consistent, skip-free ink for a comfortable writing experience.'],
            ['Double A Copy Paper A4', 'Stationery', 'Double A', 5, 3.6, 5.2, 45, 20, 'ream', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=400&fit=crop', 'High-quality A4 copy paper with 80gsm weight. Bright white, jam-free performance ideal for laser and inkjet printing.'],
        ];
        $brandWebsites = [
            'Coca-Cola' => 'https://www.coca-colacompany.com',
            'Angkor' => 'https://www.angkorbeer.com',
            'Vital' => 'https://www.vitalwater.com',
            "Lay's" => 'https://www.lays.com',
            'Oreo' => 'https://www.oreo.com',
            'Pringles' => 'https://www.pringles.com',
            'Anchor' => 'https://www.anchor.co.nz',
            'Dutch Lady' => 'https://www.dutchlady.com',
            'House Bakery' => 'https://www.housebakery.com',
            'Samsung' => 'https://www.samsung.com',
            'Anker' => 'https://www.anker.com',
            'JBL' => 'https://www.jbl.com',
            'Unilever' => 'https://www.unilever.com',
            'Scott' => 'https://www.scottbrand.com',
            'Colgate' => 'https://www.colgate.com',
            'P&G' => 'https://www.pg.com',
            'Pilot' => 'https://www.pilotpen.com',
            'Double A' => 'https://www.doubleapaper.com',
        ];
        $brandLogos = [
            'Coca-Cola' => 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
            'Angkor' => 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop',
            'Vital' => 'https://images.unsplash.com/photo-1523362628745-0c100fc988a6?w=400&h=400&fit=crop',
            "Lay's" => 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop',
            'Oreo' => 'https://images.unsplash.com/photo-1621202325924-58d6f0b0a440?w=400&h=400&fit=crop',
            'Pringles' => 'https://images.unsplash.com/photo-1613919113640-25732ef5c6f9?w=400&h=400&fit=crop',
            'Anchor' => 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
            'Dutch Lady' => 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
            'House Bakery' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
            'Samsung' => 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop',
            'Anker' => 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop',
            'JBL' => 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
            'Unilever' => 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop',
            'Scott' => 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=400&h=400&fit=crop',
            'Colgate' => 'https://images.unsplash.com/photo-1559304787-e4e4a2a972e0?w=400&h=400&fit=crop',
            'P&G' => 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc6?w=400&h=400&fit=crop',
            'Pilot' => 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=400&fit=crop',
            'Double A' => 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=400&fit=crop',
        ];
        $brands = [];
        $products = [];
        foreach ($seed as $i => [$name, $cat, $brand, $sup, $cost, $price, $stock, $reorder, $unit, $image, $description]) {
            $brands[$brand] ??= Brand::create(['business_id' => $bid, 'name' => $brand, 'logo' => $brandLogos[$brand] ?? null, 'website' => $brandWebsites[$brand] ?? null, 'description' => "$brand official products", 'status' => 'active']);
            $p = Product::create(['business_id' => $bid, 'category_id' => $cats[$cat]->id, 'brand_id' => $brands[$brand]->id, 'supplier_id' => $sups[$sup]->id, 'name' => $name, 'sku' => 'SKU-'.(1001 + $i), 'barcode' => '885'.str_pad((string) (1000000 + $i * 7919), 10, '0', STR_PAD_LEFT), 'unit' => $unit, 'cost_price' => $cost, 'selling_price' => $price, 'reorder_level' => $reorder, 'image' => $image, 'description' => $description, 'status' => $i === 5 ? 'inactive' : 'active']);
            Inventory::create(['business_id' => $bid, 'branch_id' => $branch->id, 'product_id' => $p->id, 'quantity' => $stock]);
            $products[] = $p;
        }
        $customers = collect(['Sok Dara', 'Chan Sophea', 'Kim Vanna', 'Ly Sreyneang', 'Heng Piseth', 'Meas Chantha', 'Pich Bopha', 'Ouk Rithy', 'Sam Sokha', 'Nguon Malis'])->map(fn ($n, $i) => Customer::create(['business_id' => $bid, 'name' => $n, 'email' => strtolower(str_replace(' ', '.', $n)).'@example.com', 'phone' => '855 '.mt_rand(10, 99).' '.mt_rand(100, 999).' '.mt_rand(100, 999), 'type' => $i % 4 === 1 ? 'wholesale' : 'retail', 'created_at' => now()->subDays(mt_rand(5, 120))]));

        $seq = 1;
        for ($day = 60; $day >= 0; $day--) {
            for ($k = 0, $n = mt_rand(3, 7); $k < $n; $k++) {
                $at = now()->subDays($day)->setTime([9, 10, 11, 12, 12, 13, 15, 17, 18, 19][mt_rand(0, 9)], mt_rand(0, 59));
                if ($at->isFuture()) $at = now()->subMinutes(mt_rand(5, 120));
                $chosen = collect($products)->where('status', 'active')->random(mt_rand(1, 4));
                $subtotal = 0; $lines = [];
                foreach ($chosen as $p) { $qty = $p->selling_price > 50 ? 1 : mt_rand(1, 5); $line = round($qty * (float) $p->selling_price, 2); $subtotal += $line; $lines[] = [$p, $qty, $line]; }
                $discount = mt_rand(1, 100) <= 20 ? round($subtotal * 0.05, 2) : 0;
                $tax = round(($subtotal - $discount) * 0.10, 2);
                $total = round($subtotal - $discount + $tax, 2);
                $roll = mt_rand(1, 100);
                $status = $roll <= 86 ? 'completed' : ($roll <= 94 ? 'pending' : 'cancelled');
                $user = $cashiers->random();
                $sale = Sale::create(['business_id' => $bid, 'branch_id' => $branch->id, 'customer_id' => mt_rand(1, 100) <= 75 ? $customers->random()->id : null, 'user_id' => $user->id, 'number' => 'ORD-'.(10000 + $seq++), 'subtotal' => $subtotal, 'discount' => $discount, 'discount_percent' => $discount ? 5 : 0, 'tax' => $tax, 'tax_rate' => 10, 'total' => $total, 'currency' => 'USD', 'exchange_rate' => 4047, 'total_in_currency' => $total, 'status' => $status, 'payment_status' => $status === 'completed' ? 'paid' : ($status === 'pending' ? 'unpaid' : 'refunded'), 'created_at' => $at, 'updated_at' => $at]);
                foreach ($lines as [$p, $qty, $line]) SaleItem::create(['sale_id' => $sale->id, 'product_id' => $p->id, 'name' => $p->name, 'sku' => $p->sku, 'quantity' => $qty, 'unit_price' => $p->selling_price, 'unit_cost' => $p->cost_price, 'line_total' => $line]);
                if ($status === 'completed') Payment::create(['business_id' => $bid, 'payable_type' => Sale::class, 'payable_id' => $sale->id, 'user_id' => $user->id, 'method' => ['cash', 'cash', 'cash', 'qr', 'qr', 'card', 'bank_transfer'][mt_rand(0, 6)], 'amount' => $total, 'received' => $total, 'currency' => 'USD', 'exchange_rate' => 4047, 'created_at' => $at]);
            }
        }
        foreach (['rent' => [500, 600], 'salaries' => [1000, 1400], 'utilities' => [60, 180], 'marketing' => [40, 220], 'transport' => [15, 80], 'supplies' => [10, 60]] as $cat => [$lo, $hi]) {
            for ($i = 0; $i < 3; $i++) Expense::create(['business_id' => $bid, 'branch_id' => $branch->id, 'user_id' => $cashiers->first()->id, 'reference' => 'EXP-'.str_pad((string) (3001 + Expense::withoutGlobalScopes()->count()), 5, '0', STR_PAD_LEFT), 'category' => $cat, 'amount' => mt_rand($lo * 100, $hi * 100) / 100, 'currency' => 'USD', 'exchange_rate' => 4047, 'payment_method' => 'bank_transfer', 'date' => now()->subDays($i * 20 + mt_rand(0, 9))->toDateString(), 'status' => 'approved']);
        }
        InventoryMovement::create(['business_id' => $bid, 'branch_id' => $branch->id, 'product_id' => $products[2]->id, 'user_id' => $cashiers->first()->id, 'type' => 'adjustment', 'quantity' => 12, 'quantity_after' => 48, 'reason' => 'Stock recount', 'reference' => 'ADJ-100']);

        $purchaseSeq = 1;
        $admin = User::where('business_id', $bid)->where('email', 'dara@sbs.com')->first();
        foreach ($sups as $sup) {
            $chosen = collect($products)->where('status', 'active')->random(mt_rand(2, 5));
            $lines = [];
            foreach ($chosen as $p) {
                $qty = mt_rand(5, 30);
                $lineTotal = round($qty * (float) $p->cost_price, 2);
                $lines[] = [$p, $qty, $lineTotal];
            }
            $total = collect($lines)->sum(fn ($l) => $l[2]);
            $createdAt = now()->subDays(mt_rand(1, 30));
            $statusRoll = mt_rand(1, 100);
            $status = $statusRoll <= 50 ? 'received' : ($statusRoll <= 80 ? 'ordered' : 'cancelled');
            $purchase = Purchase::create([
                'business_id' => $bid,
                'branch_id' => $branch->id,
                'supplier_id' => $sup->id,
                'user_id' => $admin->id,
                'number' => 'PO-' . (20000 + $purchaseSeq++),
                'total' => $total,
                'currency' => 'USD',
                'exchange_rate' => 4047,
                'status' => $status,
                'payment_status' => $status === 'received' ? 'paid' : ($status === 'ordered' ? 'unpaid' : 'refunded'),
                'expected_at' => $createdAt->addDays(7)->toDateString(),
                'received_at' => $status === 'received' ? $createdAt->addDays(3)->toDateTimeString() : null,
                'note' => 'Regular stock replenishment',
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            foreach ($lines as [$p, $qty, $lineTotal]) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $p->id,
                    'name' => $p->name,
                    'sku' => $p->sku,
                    'quantity' => $qty,
                    'unit_cost' => $p->cost_price,
                    'line_total' => $lineTotal,
                ]);
            }
        }

        $admins = User::where('business_id', $bid)->whereIn('email', ['sokha@sbs.com', 'dara@sbs.com'])->get();
        Notification::insert([
            ['business_id' => $bid, 'user_id' => $admins->first()->id, 'type' => 'warning', 'title' => 'Low Stock Alert', 'message' => 'Vital Water 1.5L is running low (36 units remaining)', 'link' => '/inventory?stock_status=low_stock', 'created_at' => now()->subDays(2)],
            ['business_id' => $bid, 'user_id' => $admins->first()->id, 'type' => 'danger', 'title' => 'Out of Stock', 'message' => 'Pringles Original 107g is out of stock', 'link' => '/inventory?stock_status=out_of_stock', 'created_at' => now()->subDays(1)],
            ['business_id' => $bid, 'user_id' => $admins->last()->id, 'type' => 'success', 'title' => 'Purchase Received', 'message' => 'PO-20001 from Cambodia Beverage Co. has been received', 'link' => '/purchases', 'created_at' => now()->subHours(6)],
            ['business_id' => $bid, 'user_id' => null, 'type' => 'info', 'title' => 'Weekly Report', 'message' => 'Your weekly sales report is ready for review', 'link' => '/reports', 'created_at' => now()->subDays(1)],
            ['business_id' => $bid, 'user_id' => $admins->first()->id, 'type' => 'success', 'title' => 'New Team Member', 'message' => 'Malis Nguon has been added as Manager (Siem Reap)', 'link' => '/users', 'created_at' => now()->subDays(3)],
        ]);
    }
}
