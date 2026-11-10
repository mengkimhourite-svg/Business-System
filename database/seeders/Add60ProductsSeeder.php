<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class Add60ProductsSeeder extends Seeder
{
    public function run(): void
    {
        $businessId = 2;
        $branchId = 3;

        $categories = Category::where('business_id', $businessId)->pluck('id', 'name');
        $suppliers = Supplier::where('business_id', $businessId)->pluck('id', 'name');

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
            'Nestle' => 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop',
            'KitKat' => 'https://images.unsplash.com/photo-1582176604856-e824b4736522?w=400&h=400&fit=crop',
            'Milo' => 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop',
            'Pepsi' => 'https://images.unsplash.com/photo-1610873167013-2dd675d30ef4?w=400&h=400&fit=crop',
            'Sprite' => 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=400&fit=crop',
            'Doritos' => 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=400&h=400&fit=crop',
            'Xiaomi' => 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop',
            'HP' => 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=400&fit=crop',
            'Sharpie' => 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop',
            'Bic' => 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=400&fit=crop',
            'Dove' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
            'Dettol' => 'https://images.unsplash.com/photo-1559304787-e4e4a2a972e0?w=400&h=400&fit=crop',
            'Gardenia' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
            'President' => 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop',
            'Kiwi' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
            'Nescafe' => 'https://images.unsplash.com/photo-1611564494260-6f21b80af7ea?w=400&h=400&fit=crop',
            'Indomie' => 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop',
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
            'Nestle' => 'https://www.nestle.com',
            'KitKat' => 'https://www.kitkat.com',
            'Milo' => 'https://www.milo.com',
            'Pepsi' => 'https://www.pepsi.com',
            'Sprite' => 'https://www.sprite.com',
            'Doritos' => 'https://www.doritos.com',
            'Xiaomi' => 'https://www.mi.com',
            'HP' => 'https://www.hp.com',
            'Sharpie' => 'https://www.sharpie.com',
            'Bic' => 'https://www.bic.com',
            'Dove' => 'https://www.dove.com',
            'Dettol' => 'https://www.dettol.com',
            'Gardenia' => 'https://www.gardenia.com',
            'President' => 'https://www.presidentcheese.com',
            'Kiwi' => 'https://www.kiwicorp.com',
            'Nescafe' => 'https://www.nescafe.com',
            'Indomie' => 'https://www.indofood.com',
        ];
        $brandNames = ['Coca-Cola', 'Angkor', 'Vital', "Lay's", 'Oreo', 'Pringles', 'Anchor', 'Dutch Lady', 'House Bakery', 'Samsung', 'Anker', 'JBL', 'Unilever', 'Scott', 'Colgate', 'P&G', 'Pilot', 'Double A', 'Nestle', 'KitKat', 'Milo', 'Pepsi', 'Sprite', 'Doritos', 'Xiaomi', 'HP', 'Sharpie', 'Bic', 'Dove', 'Dettol', 'Gardenia', 'President', 'Kiwi', 'Nescafe', 'Indomie'];
        $brands = Brand::where('business_id', $businessId)->pluck('id', 'name');
        foreach ($brandNames as $bn) {
            if (!isset($brands[$bn])) {
                $b = Brand::create(['business_id' => $businessId, 'name' => $bn, 'description' => "$bn products", 'logo' => $brandLogos[$bn] ?? null, 'website' => $brandWebsites[$bn] ?? null, 'status' => 'active']);
                $brands[$bn] = $b->id;
            }
        }

        $maxSku = Product::where('business_id', $businessId)->withoutGlobalScopes()->max('sku');
        $startNum = max(1079, (int) str_replace('SKU-', '', $maxSku) + 1);

        // [name, category, brand, supplier, cost, price, stock, reorder, unit, description]
        $products = [
            // Beverages (8)
            ['Pepsi 330ml', 'Beverages', 'Pepsi', 'Cambodia Beverage Co.', 0.35, 0.60, 200, 48, 'can', 'Pepsi 330ml is a crisp and refreshing cola-flavored carbonated soft drink. Perfectly chilled, it pairs well with meals, snacks, and social gatherings.'],
            ['Sprite 330ml', 'Beverages', 'Sprite', 'Cambodia Beverage Co.', 0.35, 0.60, 180, 48, 'can', 'Sprite 330ml is a lemon-lime flavored soda with a clean, crisp taste. Ideal for quenching your thirst on hot days or as a mixer at parties.'],
            ['Milo 200ml', 'Beverages', 'Milo', 'Cambodia Beverage Co.', 0.40, 0.70, 80, 30, 'pack', 'Milo 200ml is a chocolate malt beverage packed with energy and nutrients. A favorite among kids and adults for a quick, nutritious boost.'],
            ['Nescafe Classic 200g', 'Beverages', 'Nescafe', 'Cambodia Beverage Co.', 4.50, 7.00, 50, 15, 'pack', 'Nescafe Classic 200g is an instant coffee made from high-quality roasted beans. Delivers a rich, full-bodied aroma and smooth taste every morning.'],
            ['Evian Water 500ml', 'Beverages', 'Nestle', 'Cambodia Beverage Co.', 0.80, 1.20, 120, 30, 'bottle', 'Evian Water 500ml is a premium natural spring water sourced from the French Alps. Naturally filtered and rich in minerals for pure hydration.'],
            ['Red Bull 250ml', 'Beverages', 'Nestle', 'Cambodia Beverage Co.', 0.75, 1.10, 96, 24, 'can', 'Red Bull 250ml is an energy drink formulated to boost energy, concentration, and reaction speed. Popular among students and professionals.'],
            ['Mountain Dew 330ml', 'Beverages', 'Pepsi', 'Cambodia Beverage Co.', 0.35, 0.60, 140, 36, 'can', 'Mountain Dew 330ml is a citrus-flavored carbonated soft drink with a bold, electrifying taste. Great for an energy boost during active moments.'],
            ['7Up 330ml', 'Beverages', 'Pepsi', 'Cambodia Beverage Co.', 0.35, 0.60, 130, 36, 'can', '7Up 330ml is a lemon-lime flavored soda known for its crisp and refreshing taste. A classic choice for a light, bubbly refreshment.'],

            // Snacks (8)
            ['KitKat 4 Finger 40g', 'Snacks', 'KitKat', 'Phnom Penh Fresh Foods', 0.80, 1.30, 50, 20, 'pack', 'KitKat 4 Finger 40g is a crispy wafer bar coated in smooth milk chocolate. The perfect break-time treat to share or enjoy on your own.'],
            ['Doritos Nacho 150g', 'Snacks', "Lay's", 'Phnom Penh Fresh Foods', 1.10, 1.70, 45, 20, 'pack', 'Doritos Nacho 150g are bold, triangular corn chips seasoned with a tangy nacho cheese flavor. Ideal for snacking, dipping, or party sharing.'],
            ['Indomie Goreng 5pk', 'Snacks', 'Indomie', 'Phnom Penh Fresh Foods', 1.80, 2.80, 120, 40, 'pack', 'Indomie Goreng 5pk is a pack of instant fried noodles with a savory Indonesian seasoning. Quick and easy to prepare, a staple for busy days.'],
            ['M&Ms Peanut 40g', 'Snacks', 'Nestle', 'Phnom Penh Fresh Foods', 0.90, 1.40, 70, 20, 'pack', 'M&Ms Peanut 40g are colorful candy-coated chocolates filled with crunchy peanuts. A fun and delicious snack for all ages.'],
            ['Cheetos Crunchy 70g', 'Snacks', "Lay's", 'Phnom Penh Fresh Foods', 0.70, 1.10, 65, 20, 'pack', 'Cheetos Crunchy 70g are cheesy corn snacks with an intensely flavored, crunchy texture. A bold snack choice for cheese lovers.'],
            ['Wagon Wheels 6pk', 'Snacks', 'Nestle', 'Phnom Penh Fresh Foods', 1.50, 2.40, 40, 15, 'pack', 'Wagon Wheels 6pk are soft biscuit sandwiches filled with marshmallow and coated in chocolate. A nostalgic treat loved by kids and adults alike.'],
            ['Popcorn Butter 100g', 'Snacks', 'Nestle', 'Phnom Penh Fresh Foods', 0.60, 1.00, 55, 18, 'pack', 'Popcorn Butter 100g is lightly salted and butter-flavored popped corn. A classic movie-night snack ready to enjoy anytime.'],
            ['Tortilla Chips 120g', 'Snacks', "Lay's", 'Phnom Penh Fresh Foods', 0.90, 1.50, 38, 15, 'pack', 'Tortilla Chips 120g are crispy corn chips perfect for dipping in salsa, guacamole, or enjoying straight from the bag.'],

            // Dairy (7)
            ['Anchor Butter 200g', 'Dairy', 'Anchor', 'Phnom Penh Fresh Foods', 2.30, 3.20, 26, 10, 'pcs', 'Anchor Butter 200g is a premium creamery butter made from fresh New Zealand milk. Ideal for spreading, baking, and cooking.'],
            ['Mozzarella Cheese 200g', 'Dairy', 'President', 'Phnom Penh Fresh Foods', 2.80, 4.00, 15, 10, 'pack', 'Mozzarella Cheese 200g is a soft, mild Italian-style cheese perfect for pizza, pasta, salads, and sandwiches.'],
            ['Dutch Lady Fresh Milk 1L', 'Dairy', 'Dutch Lady', 'Phnom Penh Fresh Foods', 1.50, 2.20, 48, 20, 'carton', 'Dutch Lady Fresh Milk 1L is a full-cream milk rich in calcium and vitamin D. Perfect for drinking, cereals, and cooking.'],
            ['Meadow Gold Cream 250ml', 'Dairy', 'Anchor', 'Phnom Penh Fresh Foods', 1.20, 1.80, 30, 12, 'carton', 'Meadow Gold Cream 250ml is a smooth dairy cream ideal for whipping, pouring over desserts, and enriching your recipes.'],
            ['Cheese Spread 200g', 'Dairy', 'President', 'Phnom Penh Fresh Foods', 2.00, 3.00, 22, 10, 'pack', 'Cheese Spread 200g is a creamy, spreadable cheese perfect for sandwiches, crackers, and toast. Convenient and delicious.'],
            ['Greek Yogurt 150g', 'Dairy', 'Dutch Lady', 'Phnom Penh Fresh Foods', 1.10, 1.70, 36, 12, 'pack', 'Greek Yogurt 150g is a thick, creamy yogurt strained for extra richness. High in protein and perfect for breakfast or snacking.'],
            ['Condensed Milk 380g', 'Dairy', 'Nestle', 'Phnom Penh Fresh Foods', 1.80, 2.60, 44, 15, 'can', 'Condensed Milk 380g is a sweet, thick milk product ideal for desserts, coffee, tea, and baking recipes.'],

            // Bakery (7)
            ['Chocolate Muffin', 'Bakery', 'House Bakery', 'Phnom Penh Fresh Foods', 0.60, 1.20, 18, 12, 'pcs', 'Chocolate Muffin is a soft, moist muffin loaded with chocolate chips. A delightful treat for breakfast or an afternoon snack.'],
            ['Croissant Plain', 'Bakery', 'House Bakery', 'Phnom Penh Fresh Foods', 0.45, 0.95, 22, 15, 'pcs', 'Croissant Plain is a flaky, buttery French-style pastry with golden layers. Perfect for breakfast with jam, butter, or ham and cheese.'],
            ['Whole Wheat Bread 400g', 'Bakery', 'Gardenia', 'Phnom Penh Fresh Foods', 0.85, 1.40, 28, 12, 'loaf', 'Whole Wheat Bread 400g is a nutritious bread made from whole grain wheat flour. Rich in fiber, ideal for healthy sandwiches and toast.'],
            ['Cinnamon Roll', 'Bakery', 'House Bakery', 'Phnom Penh Fresh Foods', 0.55, 1.10, 20, 10, 'pcs', 'Cinnamon Roll is a soft, sweet spiral pastry filled with cinnamon sugar and topped with cream cheese icing. A warm, indulgent treat.'],
            ['Donut Glazed', 'Bakery', 'House Bakery', 'Phnom Penh Fresh Foods', 0.40, 0.85, 24, 12, 'pcs', 'Donut Glazed is a classic ring-shaped pastry coated in a sweet sugar glaze. Light, fluffy, and perfect with coffee or milk.'],
            ['Hot Dog Bun 6pk', 'Bakery', 'Gardenia', 'Phnom Penh Fresh Foods', 0.70, 1.20, 16, 8, 'pack', 'Hot Dog Bun 6pk is a pack of soft, fluffy bread rolls designed to hold sausages, hot dogs, and frankfurters. A barbecue essential.'],
            ['Raisin Bread 400g', 'Bakery', 'Gardenia', 'Phnom Penh Fresh Foods', 0.90, 1.50, 20, 10, 'loaf', 'Raisin Bread 400g is a lightly sweetened bread studded with plump raisins. Perfect for toast, French toast, or enjoying fresh.'],

            // Electronics (8)
            ['Samsung Galaxy A15 128GB', 'Electronics', 'Samsung', 'Mekong Electronics Ltd.', 145.00, 189.00, 9, 3, 'pcs', 'Samsung Galaxy A15 128GB is a feature-packed smartphone with a vibrant AMOLED display, triple camera, and long-lasting battery.'],
            ['Xiaomi Redmi Note 13 128GB', 'Electronics', 'Xiaomi', 'Mekong Electronics Ltd.', 120.00, 165.00, 12, 4, 'pcs', 'Xiaomi Redmi Note 13 128GB offers a high-refresh-rate display, powerful processor, and versatile camera system at an affordable price.'],
            ['Anker PowerCore 10000mAh', 'Electronics', 'Anker', 'Mekong Electronics Ltd.', 12.00, 19.90, 28, 8, 'pcs', 'Anker PowerCore 10000mAh is a compact, lightweight portable charger capable of fully charging your smartphone on the go.'],
            ['JBL Tune 510BT Headphones', 'Electronics', 'JBL', 'Mekong Electronics Ltd.', 18.00, 29.90, 15, 5, 'pcs', 'JBL Tune 510BT Headphones deliver rich JBL Pure Bass sound with up to 40 hours of wireless listening and a foldable design.'],
            ['Logitech K120 Keyboard', 'Electronics', 'HP', 'Mekong Electronics Ltd.', 8.00, 13.90, 22, 8, 'pcs', 'Logitech K120 Keyboard is a durable, spill-resistant wired keyboard with comfortable keys and a plug-and-play USB connection.'],
            ['Samsung 256GB USB Flash Drive', 'Electronics', 'Samsung', 'Mekong Electronics Ltd.', 6.50, 10.90, 40, 12, 'pcs', 'Samsung 256GB USB Flash Drive offers fast data transfer speeds and generous storage for documents, photos, and videos.'],
            ['Anker 65W USB-C Charger', 'Electronics', 'Anker', 'Mekong Electronics Ltd.', 15.00, 24.90, 18, 6, 'pcs', 'Anker 65W USB-C Charger is a compact, fast-charging adapter compatible with laptops, tablets, and smartphones.'],
            ['Xiaomi Buds 4 Lite', 'Electronics', 'Xiaomi', 'Mekong Electronics Ltd.', 14.00, 22.90, 20, 6, 'pcs', 'Xiaomi Buds 4 Lite are wireless earbuds with active noise cancellation, comfortable fit, and up to 30 hours of total battery life.'],

            // Household (7)
            ['Comfort Fabric Softener 1L', 'Household', 'Unilever', 'Angkor Household Supplies', 2.10, 3.20, 27, 15, 'bottle', 'Comfort Fabric Softener 1L keeps clothes soft, fresh, and static-free with a long-lasting pleasant fragrance.'],
            ['Tide Liquid Detergent 1L', 'Household', 'Unilever', 'Angkor Household Supplies', 2.50, 3.80, 35, 12, 'bottle', 'Tide Liquid Detergent 1L delivers powerful stain removal in both hot and cold water, leaving clothes clean and bright.'],
            ['Kiwi Shoe Polish Black', 'Household', 'Kiwi', 'Angkor Household Supplies', 1.50, 2.50, 30, 10, 'pcs', 'Kiwi Shoe Polish Black restores color and shine to black leather shoes and boots. Provides water-resistant protection.'],
            ['Clorox Bleach 1L', 'Household', 'Unilever', 'Angkor Household Supplies', 1.30, 2.00, 42, 15, 'bottle', 'Clorox Bleach 1L is a multi-purpose disinfectant and whitener safe for laundry, surfaces, and household cleaning.'],
            ['Baygon Spray 600ml', 'Household', 'Unilever', 'Angkor Household Supplies', 2.80, 4.20, 20, 8, 'can', 'Baygon Spray 600ml is an effective insecticide spray that kills mosquitoes, cockroaches, and flying insects on contact.'],
            ['Glad Trash Bags 30pk', 'Household', 'Scott', 'Angkor Household Supplies', 1.90, 3.00, 25, 10, 'pack', 'Glad Trash Bags 30pk are strong, leak-proof garbage bags suitable for kitchen and household waste. Reliable and easy to tie.'],
            ['Sponges 3pk', 'Household', 'Scott', 'Angkor Household Supplies', 0.80, 1.30, 50, 15, 'pack', 'Sponges 3pk are multi-purpose cleaning sponges effective on dishes, countertops, and bathroom surfaces. Durable and absorbent.'],

            // Personal Care (8)
            ['Dove Body Wash 500ml', 'Personal Care', 'Unilever', 'Khmer Care Distribution', 3.10, 4.90, 33, 12, 'bottle', 'Dove Body Wash 500ml gently cleanses and nourishes skin with NutriumMoisture technology. Leaves skin soft and smooth.'],
            ['Pantene Shampoo 400ml', 'Personal Care', 'P&G', 'Khmer Care Distribution', 3.20, 5.00, 28, 10, 'bottle', 'Pantene Shampoo 400ml is fortified with Pro-Vitamin B5 to strengthen hair from root to tip, reducing breakage and frizz.'],
            ['Nivea Body Lotion 400ml', 'Personal Care', 'Dove', 'Khmer Care Distribution', 3.50, 5.50, 22, 8, 'bottle', 'Nivea Body Lotion 400ml provides 48-hour deep moisture with its lightweight, fast-absorbing formula for silky-smooth skin.'],
            ['Vaseline Petroleum Jelly 100g', 'Personal Care', 'Unilever', 'Khmer Care Distribution', 1.80, 2.80, 45, 15, 'pcs', 'Vaseline Petroleum Jelly 100g is a versatile skin protectant that locks in moisture to heal dry, chapped skin and lips.'],
            ['Lifebuoy Soap 4pk', 'Personal Care', 'Unilever', 'Khmer Care Distribution', 2.00, 3.20, 36, 12, 'pack', 'Lifebuoy Soap 4pk is an antibacterial bar soap that kills 99.9% of germs, keeping your family clean and healthy.'],
            ['Gillette Razor 3pk', 'Personal Care', 'P&G', 'Khmer Care Distribution', 4.50, 7.00, 18, 6, 'pack', 'Gillette Razor 3pk features precision blades for a close, comfortable shave with less irritation on sensitive skin.'],
            ['Dettol Mouthwash 500ml', 'Personal Care', 'Dettol', 'Khmer Care Distribution', 2.50, 3.80, 24, 8, 'bottle', 'Dettol Mouthwash 500ml provides 12-hour protection against germs, plaque, and bad breath for a confident, fresh smile.'],
            ['Sunsilk Shampoo 340ml', 'Personal Care', 'Unilever', 'Khmer Care Distribution', 2.80, 4.30, 30, 10, 'bottle', 'Sunsilk Shampoo 340ml is formulated with natural ingredients to deliver smooth, manageable, and beautifully shiny hair.'],

            // Stationery (7)
            ['Bic Ballpoint Pen 10pk', 'Stationery', 'Bic', 'Office Pro Cambodia', 1.80, 3.00, 100, 30, 'pack', 'Bic Ballpoint Pen 10pk contains reliable, smooth-writing ballpoint pens suitable for everyday writing, school, and office use.'],
            ['Sharpie Marker Black', 'Stationery', 'Sharpie', 'Office Pro Cambodia', 1.50, 2.50, 60, 15, 'pcs', 'Sharpie Marker Black is a permanent marker with a fine tip that writes on virtually any surface with bold, fade-resistant ink.'],
            ['HP Printer Paper A4', 'Stationery', 'HP', 'Office Pro Cambodia', 4.00, 6.00, 35, 15, 'ream', 'HP Printer Paper A4 is a high-quality, bright white paper designed for crisp text and vibrant color printing.'],
            ['Sticky Notes 3pk', 'Stationery', 'Double A', 'Office Pro Cambodia', 1.20, 2.00, 48, 15, 'pack', 'Sticky Notes 3pk are colorful, repositionable notes perfect for reminders, brainstorming, and organizing your workspace.'],
            ['Scissors 8 inch', 'Stationery', 'Bic', 'Office Pro Cambodia', 1.00, 1.80, 30, 10, 'pcs', 'Scissors 8 inch are sharp, durable household scissors ideal for cutting paper, fabric, cardboard, and other materials.'],
            ['File Folders 10pk', 'Stationery', 'Double A', 'Office Pro Cambodia', 2.50, 4.00, 25, 8, 'pack', 'File Folders 10pk are sturdy document organizers ideal for keeping important papers sorted at home or in the office.'],
            ['Highlighter 6pk', 'Stationery', 'Sharpie', 'Office Pro Cambodia', 2.00, 3.20, 40, 12, 'pack', 'Highlighter 6pk contains vibrant, no-dry-out markers perfect for studying, note-taking, and highlighting important text.'],
        ];

        // Product image URLs (Unsplash)
        $imageMap = [
            'Pepsi 330ml' => 'https://images.unsplash.com/photo-1610873167013-2dd675d30ef4?w=400&h=400&fit=crop',
            'Sprite 330ml' => 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=400&fit=crop',
            'Milo 200ml' => 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop',
            'Nescafe Classic 200g' => 'https://images.unsplash.com/photo-1611564494260-6f21b80af7ea?w=400&h=400&fit=crop',
            'Evian Water 500ml' => 'https://images.unsplash.com/photo-1560023907-5f38466f0feb?w=400&h=400&fit=crop',
            'Red Bull 250ml' => 'https://images.unsplash.com/photo-1622485831930-7627e8a9aaee?w=400&h=400&fit=crop',
            'Mountain Dew 330ml' => 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&h=400&fit=crop',
            '7Up 330ml' => 'https://images.unsplash.com/photo-1534050712778-25387322f8bd?w=400&h=400&fit=crop',
            'KitKat 4 Finger 40g' => 'https://images.unsplash.com/photo-1582176604856-e824b4736522?w=400&h=400&fit=crop',
            'Doritos Nacho 150g' => 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=400&h=400&fit=crop',
            'Indomie Goreng 5pk' => 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop',
            'M&Ms Peanut 40g' => 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400&h=400&fit=crop',
            'Cheetos Crunchy 70g' => 'https://images.unsplash.com/photo-1575425186775-b2de9a656176?w=400&h=400&fit=crop',
            'Wagon Wheels 6pk' => 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop',
            'Popcorn Butter 100g' => 'https://images.unsplash.com/photo-1585735026703-e3a868bece31?w=400&h=400&fit=crop',
            'Tortilla Chips 120g' => 'https://images.unsplash.com/photo-1513135065346-a098a63a71ee?w=400&h=400&fit=crop',
            'Anchor Butter 200g' => 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop',
            'Mozzarella Cheese 200g' => 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop',
            'Dutch Lady Fresh Milk 1L' => 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop',
            'Meadow Gold Cream 250ml' => 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
            'Cheese Spread 200g' => 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&h=400&fit=crop',
            'Greek Yogurt 150g' => 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
            'Condensed Milk 380g' => 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
            'Chocolate Muffin' => 'https://images.unsplash.com/photo-1607920591413-4ec007e70059?w=400&h=400&fit=crop',
            'Croissant Plain' => 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=400&h=400&fit=crop',
            'Whole Wheat Bread 400g' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
            'Cinnamon Roll' => 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400&h=400&fit=crop',
            'Donut Glazed' => 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=400&fit=crop',
            'Hot Dog Bun 6pk' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
            'Raisin Bread 400g' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
            'Samsung Galaxy A15 128GB' => 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
            'Xiaomi Redmi Note 13 128GB' => 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop',
            'Anker PowerCore 10000mAh' => 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop',
            'JBL Tune 510BT Headphones' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
            'Logitech K120 Keyboard' => 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop',
            'Samsung 256GB USB Flash Drive' => 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop',
            'Anker 65W USB-C Charger' => 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop',
            'Xiaomi Buds 4 Lite' => 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop',
            'Comfort Fabric Softener 1L' => 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=400&fit=crop',
            'Tide Liquid Detergent 1L' => 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=400&fit=crop',
            'Kiwi Shoe Polish Black' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
            'Clorox Bleach 1L' => 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop',
            'Baygon Spray 600ml' => 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop',
            'Glad Trash Bags 30pk' => 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=400&h=400&fit=crop',
            'Sponges 3pk' => 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop',
            'Dove Body Wash 500ml' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
            'Pantene Shampoo 400ml' => 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc6?w=400&h=400&fit=crop',
            'Nivea Body Lotion 400ml' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
            'Vaseline Petroleum Jelly 100g' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
            'Lifebuoy Soap 4pk' => 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&h=400&fit=crop',
            'Gillette Razor 3pk' => 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400&h=400&fit=crop',
            'Dettol Mouthwash 500ml' => 'https://images.unsplash.com/photo-1559304787-e4e4a2a972e0?w=400&h=400&fit=crop',
            'Sunsilk Shampoo 340ml' => 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc6?w=400&h=400&fit=crop',
            'Bic Ballpoint Pen 10pk' => 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=400&fit=crop',
            'Sharpie Marker Black' => 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop',
            'HP Printer Paper A4' => 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=400&fit=crop',
            'Sticky Notes 3pk' => 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=400&fit=crop',
            'Scissors 8 inch' => 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=400&fit=crop',
            'File Folders 10pk' => 'https://images.unsplash.com/photo-1568205612837-017257d2310a?w=400&h=400&fit=crop',
            'Highlighter 6pk' => 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop',
        ];

        $created = 0;
        foreach ($products as $i => $p) {
            [$name, $catName, $brandName, $supplierName, $cost, $price, $stock, $reorder, $unit, $description] = $p;
            $sku = 'SKU-' . str_pad((string) ($startNum + $i), 4, '0', STR_PAD_LEFT);
            $barcode = '885' . str_pad((string) (2000000 + $i * 3571), 10, '0', STR_PAD_LEFT);

            $product = Product::create([
                'business_id' => $businessId,
                'category_id' => $categories[$catName] ?? null,
                'brand_id' => $brands[$brandName] ?? null,
                'supplier_id' => $suppliers[$supplierName] ?? null,
                'name' => $name,
                'sku' => $sku,
                'barcode' => $barcode,
                'unit' => $unit,
                'cost_price' => $cost,
                'selling_price' => $price,
                'wholesale_price' => round($cost * 1.3, 2),
                'reorder_level' => $reorder,
                'description' => $description,
                'image' => $imageMap[$name] ?? "https://placehold.co/400x400/1a1a2e/ffffff?text=" . urlencode($name),
                'status' => 'active',
            ]);

            Inventory::create([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'product_id' => $product->id,
                'quantity' => $stock,
            ]);

            $created++;
        }

        $this->command?->info("Created {$created} new products ({$startNum}–" . ($startNum + $created - 1) . ") with inventory and descriptions.");
    }
}
