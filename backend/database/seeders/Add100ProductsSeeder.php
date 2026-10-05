<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class Add100ProductsSeeder extends Seeder
{
    public function run(): void
    {
        $businessId = 1;
        $branchId = 1;

        $categories = Category::where('business_id', $businessId)->pluck('id', 'name');
        $suppliers = Supplier::where('business_id', $businessId)->pluck('id', 'name');

        $brandLogos = [
            'Coca-Cola' => 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop',
            'Fanta' => 'https://images.unsplash.com/photo-1621202325924-58d6f0b0a440?w=400&h=400&fit=crop',
            'Schweppes' => 'https://images.unsplash.com/photo-1534050712778-25387322f8bd?w=400&h=400&fit=crop',
            'Minute Maid' => 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',
            'Lipton' => 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
            'Starbucks' => 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop',
            'Monster' => 'https://images.unsplash.com/photo-1622485831930-7627e8a9aaee?w=400&h=400&fit=crop',
            'Gatorade' => 'https://images.unsplash.com/photo-1622485831930-7627e8a9aaee?w=400&h=400&fit=crop',
            'Dr Pepper' => 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&h=400&fit=crop',
            'Pepsi' => 'https://images.unsplash.com/photo-1610873167013-2dd675d30ef4?w=400&h=400&fit=crop',
            'Mars' => 'https://images.unsplash.com/photo-1582176604856-e824b4736522?w=400&h=400&fit=crop',
            'Snickers' => 'https://images.unsplash.com/photo-1582176604856-e824b4736522?w=400&h=400&fit=crop',
            'Haribo' => 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400&h=400&fit=crop',
            'Orville' => 'https://images.unsplash.com/photo-1585735026703-e3a868bece31?w=400&h=400&fit=crop',
            'Kellogg' => 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop',
            'Philadelphia' => 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop',
            'Sara Lee' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
            'Tropicana' => 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',
            'Zespri' => 'https://images.unsplash.com/photo-1582120031342-7e0e0e7e6e16?w=400&h=400&fit=crop',
            'Dole' => 'https://images.unsplash.com/photo-1568702846914-96b305d2eb1c?w=400&h=400&fit=crop',
            'Salmar' => 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=400&h=400&fit=crop',
            'Tyson' => 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=400&h=400&fit=crop',
            'Ocean Prince' => 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=400&fit=crop',
            'Fischer' => 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop',
            'Iglo' => 'https://images.unsplash.com/photo-1575425186775-b2de9a656176?w=400&h=400&fit=crop',
            'Dr. Oetker' => 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
            'Häagen-Dazs' => 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=400&fit=crop',
            'Persil' => 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=400&fit=crop',
            'Finish' => 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop',
            'Febreze' => 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop',
            'Oral-B' => 'https://images.unsplash.com/photo-1559304787-e4e4a2a972e0?w=400&h=400&fit=crop',
            'Neutrogena' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
            'Garnier' => 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc6?w=400&h=400&fit=crop',
            'Venus' => 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400&h=400&fit=crop',
            'Stabilo' => 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop',
            'Moleskine' => 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=400&fit=crop',
            'Maped' => 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=400&fit=crop',
            'Centrum' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop',
            'Panadol' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop',
            'Ensure' => 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
            'Johnson' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
            'Huggies' => 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
            'Nestogen' => 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
            'Purina' => 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=400&fit=crop',
            'Whiskas' => 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop',
        ];
        $brands = Brand::where('business_id', $businessId)->pluck('id', 'name');
        $brandWebsites = [
            'Coca-Cola' => 'https://www.coca-colacompany.com',
            'Fanta' => 'https://www.fanta.com',
            'Schweppes' => 'https://www.schweppes.com',
            'Minute Maid' => 'https://www.minutemaid.com',
            'Lipton' => 'https://www.lipton.com',
            'Starbucks' => 'https://www.starbucks.com',
            'Monster' => 'https://www.monsterenergy.com',
            'Gatorade' => 'https://www.gatorade.com',
            'Dr Pepper' => 'https://www.drpepper.com',
            'Pepsi' => 'https://www.pepsi.com',
            'Mars' => 'https://www.mars.com',
            'Snickers' => 'https://www.snickers.com',
            'Haribo' => 'https://www.haribo.com',
            'Orville' => 'https://www.orville.com',
            'Kellogg' => 'https://www.kelloggs.com',
            'Philadelphia' => 'https://www.philadelphiacheese.com',
            'Sara Lee' => 'https://www.saralee.com',
            'Tropicana' => 'https://www.tropicana.com',
            'Zespri' => 'https://www.zespri.com',
            'Dole' => 'https://www.dole.com',
            'Salmar' => 'https://www.salmar.no',
            'Tyson' => 'https://www.tysonfoods.com',
            'Ocean Prince' => 'https://www.oceanprince.com',
            'Fischer' => 'https://www.fischermeats.com',
            'Iglo' => 'https://www.iglo.com',
            'Dr. Oetker' => 'https://www.doetker.com',
            'Häagen-Dazs' => 'https://www.haagendazs.com',
            'Persil' => 'https://www.persil.com',
            'Finish' => 'https://www.finish.com',
            'Febreze' => 'https://www.febreze.com',
            'Oral-B' => 'https://www.oralb.com',
            'Neutrogena' => 'https://www.neutrogena.com',
            'Garnier' => 'https://www.garnier.com',
            'Venus' => 'https://www.venus.com',
            'Stabilo' => 'https://www.stabilo.com',
            'Moleskine' => 'https://www.moleskine.com',
            'Maped' => 'https://www.maped.com',
            'Centrum' => 'https://www.centrum.com',
            'Panadol' => 'https://www.panadol.com',
            'Ensure' => 'https://www.ensure.com',
            'Johnson' => 'https://www.johnsonsbaby.com',
            'Huggies' => 'https://www.huggies.com',
            'Nestogen' => 'https://www.nestogen.com',
            'Purina' => 'https://www.purina.com',
            'Whiskas' => 'https://www.whiskas.com',
        ];
        foreach ($brandLogos as $bn => $logo) {
            if (!isset($brands[$bn])) {
                $b = Brand::create(['business_id' => $businessId, 'name' => $bn, 'description' => "$bn products", 'logo' => $logo, 'website' => $brandWebsites[$bn] ?? null, 'status' => 'active']);
                $brands[$bn] = $b->id;
            }
        }

        $maxSku = Product::where('business_id', $businessId)->withoutGlobalScopes()->max('sku');
        $startNum = max(2001, (int) str_replace('SKU-', '', $maxSku) + 1);

        // [name, category, brand, supplier, cost, price, stock, reorder, unit, image, description]
        $products = [
            // Beverages (15)
            ['Coca-Cola Zero Sugar 330ml', 'Beverages', 'Coca-Cola', 'Cambodia Beverage Co.', 0.35, 0.60, 200, 48, 'can', 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop', 'Coca-Cola Zero Sugar delivers the great taste of Coke with zero sugar and zero calories. Perfect for those who want great flavor without the guilt.'],
            ['Fanta Orange 330ml', 'Beverages', 'Fanta', 'Cambodia Beverage Co.', 0.35, 0.60, 180, 48, 'can', 'https://images.unsplash.com/photo-1621202325924-58d6f0b0a440?w=400&h=400&fit=crop', 'Fanta Orange is a bubbly, fruity orange-flavored soda that delivers a burst of citrus refreshment in every sip.'],
            ['Schweppes Tonic Water 330ml', 'Beverages', 'Schweppes', 'Cambodia Beverage Co.', 0.40, 0.70, 120, 36, 'can', 'https://images.unsplash.com/photo-1534050712778-25387322f8bd?w=400&h=400&fit=crop', 'Schweppes Tonic Water is a classic carbonated mixer with a distinctive bitter-sweet taste. Perfect for gin and tonics or enjoyed on its own.'],
            ['Minute Maid Orange Juice 1L', 'Beverages', 'Minute Maid', 'Cambodia Beverage Co.', 1.20, 1.80, 60, 20, 'bottle', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop', 'Minute Maid Orange Juice is made from carefully selected oranges for a rich, refreshing taste. Packed with vitamin C for a healthy start.'],
            ['Lipton Ice Tea 500ml', 'Beverages', 'Lipton', 'Cambodia Beverage Co.', 0.50, 0.80, 150, 40, 'bottle', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop', 'Lipton Ice Tea is a refreshing ready-to-drink tea with a smooth, naturally sweetened taste. Perfect for hot days and casual sipping.'],
            ['Starbucks Frappuccino 200ml', 'Beverages', 'Starbucks', 'Cambodia Beverage Co.', 1.50, 2.50, 40, 15, 'bottle', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop', 'Starbucks Frappuccino is a creamy, chilled coffee beverage blended with milk and sugar. A delicious treat for coffee lovers on the go.'],
            ['Monster Energy 500ml', 'Beverages', 'Monster', 'Cambodia Beverage Co.', 0.75, 1.20, 90, 24, 'can', 'https://images.unsplash.com/photo-1622485831930-7627e8a9aaee?w=400&h=400&fit=crop', 'Monster Energy is a powerful energy drink that boosts energy, focus, and performance. Ideal for athletes, students, and busy professionals.'],
            ['Gatorade Sports Drink 500ml', 'Beverages', 'Gatorade', 'Cambodia Beverage Co.', 0.60, 1.00, 80, 24, 'bottle', 'https://images.unsplash.com/photo-1622485831930-7627e8a9aaee?w=400&h=400&fit=crop', 'Gatorade Sports Drink replenishes electrolytes and carbs lost during intense physical activity. The choice of athletes worldwide.'],
            ['Dr Pepper 330ml', 'Beverages', 'Dr Pepper', 'Cambodia Beverage Co.', 0.40, 0.70, 100, 30, 'can', 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&h=400&fit=crop', 'Dr Pepper is a unique blend of 23 flavors creating a one-of-a-kind taste experience. Bold, refreshing, and unmistakably original.'],
            ['Pepsi Max 330ml', 'Beverages', 'Pepsi', 'Cambodia Beverage Co.', 0.35, 0.60, 160, 48, 'can', 'https://images.unsplash.com/photo-1610873167013-2dd675d30ef4?w=400&h=400&fit=crop', 'Pepsi Max delivers maximum Pepsi taste with zero sugar. Bold refreshment without the calories.'],
            [' Schweppes Ginger Ale 330ml', 'Beverages', 'Schweppes', 'Cambodia Beverage Co.', 0.40, 0.70, 110, 36, 'can', 'https://images.unsplash.com/photo-1534050712778-25387322f8bd?w=400&h=400&fit=crop', 'Schweppes Ginger Ale is a crisp, sparkling ginger-flavored soda. Light and refreshing, perfect as a mixer or standalone drink.'],
            ['Coca-Cola Cherry 330ml', 'Beverages', 'Coca-Cola', 'Cambodia Beverage Co.', 0.40, 0.65, 130, 36, 'can', 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop', 'Coca-Cola Cherry combines the classic Coke taste with a sweet cherry flavor for a deliciously unique refreshment.'],
            ['Mountain Dew Voltage 330ml', 'Beverages', 'Pepsi', 'Cambodia Beverage Co.', 0.35, 0.60, 120, 36, 'can', 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&h=400&fit=crop', 'Mountain Dew Voltage is a citrus-flavored soda with a bold, electrifying blue raspberry twist. Built for the bold.'],
            ['Pepsi Black 330ml', 'Beverages', 'Pepsi', 'Cambodia Beverage Co.', 0.35, 0.60, 140, 48, 'can', 'https://images.unsplash.com/photo-1610873167013-2dd675d30ef4?w=400&h=400&fit=crop', 'Pepsi Black is a zero-sugar cola with a bold, crisp taste. All the refreshment of Pepsi without the sugar.'],
            ['Sprite Lemon 330ml', 'Beverages', 'Sprite', 'Cambodia Beverage Co.', 0.35, 0.60, 170, 48, 'can', 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=400&fit=crop', 'Sprite Lemon is a clean, crisp lemon-lime soda that refreshes and quenches your thirst with every bubbly sip.'],

            // Snacks (15)
            ['Mars Bar 51g', 'Snacks', 'Mars', 'Phnom Penh Fresh Foods', 0.80, 1.30, 80, 25, 'pack', 'https://images.unsplash.com/photo-1582176604856-e824b4736522?w=400&h=400&fit=crop', 'Mars Bar is a delicious combination of nougat, caramel, and milk chocolate. A classic energy-boosting snack for any time of day.'],
            ['Snickers 51g', 'Snacks', 'Snickers', 'Phnom Penh Fresh Foods', 0.80, 1.30, 75, 25, 'pack', 'https://images.unsplash.com/photo-1582176604856-e824b4736522?w=400&h=400&fit=crop', 'Snickers satisfies hunger with peanuts, nougat, caramel, and milk chocolate. The ultimate protein-packed chocolate bar.'],
            ['Haribo Goldbears 80g', 'Snacks', 'Haribo', 'Phnom Penh Fresh Foods', 0.90, 1.50, 60, 20, 'pack', 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400&h=400&fit=crop', 'Haribo Goldbears are soft, fruity gummy bears in assorted flavors. A fun, chewy treat loved by kids and adults alike.'],
            ['Orville Popcorn 100g', 'Snacks', 'Orville', 'Phnom Penh Fresh Foods', 0.70, 1.10, 50, 15, 'pack', 'https://images.unsplash.com/photo-1585735026703-e3a868bece31?w=400&h=400&fit=crop', 'Orville Popcorn kernels pop into light, fluffy popcorn with a rich buttery flavor. Perfect for movie nights and snacking.'],
            ['Kellogg Corn Flakes 200g', 'Snacks', 'Kellogg', 'Phnom Penh Fresh Foods', 1.20, 1.80, 40, 15, 'pack', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop', 'Kellogg Corn Flakes are crispy, toasted corn flakes that make a nutritious and crunchy breakfast. Light, healthy, and delicious.'],
            ['Pringles Sour Cream 107g', 'Snacks', 'Pringles', 'Phnom Penh Fresh Foods', 1.30, 2.00, 45, 15, 'can', 'https://images.unsplash.com/photo-1613919113640-25732ef5c6f9?w=400&h=400&fit=crop', 'Pringles Sour Cream & Onion chips deliver a creamy, tangy flavor on crispy, stackable potato crisps.'],
            ['Doritos Spicy 150g', 'Snacks', 'Doritos', 'Phnom Penh Fresh Foods', 1.20, 1.80, 55, 20, 'pack', 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=400&h=400&fit=crop', 'Doritos Spicy Nacho chips pack a bold, fiery kick with every crunchy bite. For those who love heat with their snacks.'],
            ['Lay\'s Salt & Vinegar 70g', 'Snacks', 'Lay\'s', 'Phnom Penh Fresh Foods', 0.65, 1.00, 70, 25, 'pack', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop', 'Lay\'s Salt & Vinegar chips deliver a tangy, satisfying crunch with the perfect balance of salt and vinegar flavor.'],
            ['Oreo Mint 133g', 'Snacks', 'Oreo', 'Phnom Penh Fresh Foods', 0.75, 1.20, 55, 20, 'pack', 'https://images.unsplash.com/photo-1621202325924-58d6f0b0a440?w=400&h=400&fit=crop', 'Oreo Mint cookies combine crispy chocolate wafers with a cool, refreshing mint cream filling. A minty twist on the classic.'],
            ['Cheetos Crunchy 70g', 'Snacks', 'Cheetos', 'Phnom Penh Fresh Foods', 0.60, 0.95, 65, 20, 'pack', 'https://images.unsplash.com/photo-1575425186775-b2de9a656176?w=400&h=400&fit=crop', 'Cheetos Crunchy cheese snacks deliver an intensely flavored, crunchy experience. Irresistibly cheesy and fun to eat.'],
            ['Tortilla Chips 120g', 'Snacks', 'Doritos', 'Phnom Penh Fresh Foods', 0.80, 1.30, 45, 15, 'pack', 'https://images.unsplash.com/photo-1513135065346-a098a63a71ee?w=400&h=400&fit=crop', 'Tortilla Chips are crispy, golden corn chips perfect for dipping in salsa, guacamole, or enjoying straight from the bag.'],
            ['Popcorn Butter 100g', 'Snacks', 'Orville', 'Phnom Penh Fresh Foods', 0.50, 0.80, 60, 20, 'pack', 'https://images.unsplash.com/photo-1585735026703-e3a868bece31?w=400&h=400&fit=crop', 'Butter Popcorn is lightly salted and butter-flavored popped corn. Light, fluffy, and satisfying for all ages.'],
            ['Wagon Wheels 6pk', 'Snacks', 'Kellogg', 'Phnom Penh Fresh Foods', 1.00, 1.60, 35, 12, 'pack', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop', 'Wagon Wheels are soft biscuit sandwiches filled with marshmallow and coated in chocolate. A nostalgic, sweet treat.'],
            ['M&Ms Peanut 40g', 'Snacks', 'Mars', 'Phnom Penh Fresh Foods', 0.90, 1.40, 70, 20, 'pack', 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400&h=400&fit=crop', 'M&Ms Peanut are colorful candy-coated chocolates filled with crunchy peanuts. A fun and delicious snack for all ages.'],
            ['KitKat 2 Finger 20g', 'Snacks', 'Nestle', 'Phnom Penh Fresh Foods', 0.40, 0.70, 90, 30, 'pack', 'https://images.unsplash.com/photo-1582176604856-e824b4736522?w=400&h=400&fit=crop', 'KitKat 2 Finger is a crispy wafer bar coated in smooth milk chocolate. The perfect break-time treat.'],

            // Dairy (10)
            ['Anchor Butter 200g', 'Dairy', 'Anchor', 'Phnom Penh Fresh Foods', 1.80, 2.80, 35, 12, 'pack', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop', 'Anchor Butter is premium creamery butter made from fresh New Zealand milk. Rich, creamy, and perfect for cooking and baking.'],
            ['Mozzarella Cheese 200g', 'Dairy', 'President', 'Phnom Penh Fresh Foods', 2.00, 3.20, 25, 10, 'pack', 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop', 'Mozzarella Cheese is a soft, mild Italian-style cheese perfect for pizza, pasta, salads, and sandwiches. Melts beautifully.'],
            ['Dutch Lady Fresh Milk 1L', 'Dairy', 'Dutch Lady', 'Phnom Penh Fresh Foods', 1.40, 2.10, 45, 15, 'carton', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop', 'Dutch Lady Fresh Milk is full-cream milk rich in calcium and vitamin D. Essential for growing kids and healthy adults.'],
            ['Meadow Gold Cream 250ml', 'Dairy', 'President', 'Phnom Penh Fresh Foods', 1.60, 2.50, 20, 8, 'carton', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop', 'Meadow Gold Cream is smooth dairy cream ideal for whipping, pouring over desserts, and enhancing your favorite recipes.'],
            ['Cheese Spread 200g', 'Dairy', 'President', 'Phnom Penh Fresh Foods', 1.50, 2.40, 30, 10, 'pack', 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&h=400&fit=crop', 'Cheese Spread is a creamy, spreadable cheese perfect for sandwiches, crackers, and toast. Smooth and full of flavor.'],
            ['Greek Yogurt 150g', 'Dairy', 'Dutch Lady', 'Phnom Penh Fresh Foods', 1.00, 1.60, 40, 12, 'pack', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop', 'Greek Yogurt is thick, creamy yogurt strained for extra richness. High in protein and perfect for breakfast or snacks.'],
            ['Condensed Milk 380g', 'Dairy', 'Nestle', 'Phnom Penh Fresh Foods', 1.20, 1.90, 35, 12, 'can', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop', 'Condensed Milk is sweet, thick milk product ideal for desserts, coffee, tea, and baking. A kitchen essential.'],
            ['Cheddar Cheese 200g', 'Dairy', 'President', 'Phnom Penh Fresh Foods', 2.20, 3.50, 20, 8, 'pack', 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop', 'Cheddar Cheese is a firm, aged cheese with a rich, sharp flavor. Perfect for sandwiches, burgers, and cheese platters.'],
            ['Yogurt Drink 4pk', 'Dairy', 'Dutch Lady', 'Phnom Penh Fresh Foods', 1.80, 2.80, 30, 10, 'pack', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop', 'Yogurt Drink is a smooth, probiotic-rich beverage that supports healthy digestion. Available in assorted fruity flavors.'],
            ['Whipping Cream 250ml', 'Dairy', 'Meadow Gold', 'Phnom Penh Fresh Foods', 1.50, 2.40, 18, 8, 'carton', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop', 'Whipping Cream is a thick, rich cream that whips into soft, fluffy peaks. Perfect for desserts, coffee, and cooking.'],

            // Bakery (10)
            ['Chocolate Muffin', 'Bakery', 'Gardenia', 'Phnom Penh Fresh Foods', 0.50, 0.90, 30, 10, 'pcs', 'https://images.unsplash.com/photo-1607920591413-4ec007e70059?w=400&h=400&fit=crop', 'Chocolate Muffin is a soft, moist muffin loaded with rich chocolate chips. A decadent treat for breakfast or snacking.'],
            ['Croissant Plain', 'Bakery', 'Gardenia', 'Phnom Penh Fresh Foods', 0.60, 1.00, 25, 8, 'pcs', 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=400&h=400&fit=crop', 'Croissant Plain is a flaky, buttery French-style pastry with golden, layered crust. Light, airy, and irresistibly delicious.'],
            ['Whole Wheat Bread 400g', 'Bakery', 'Gardenia', 'Phnom Penh Fresh Foods', 0.80, 1.30, 40, 12, 'pcs', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop', 'Whole Wheat Bread is nutritious bread made from whole grain wheat flour. Rich in fiber, perfect for healthy sandwiches.'],
            ['Cinnamon Roll', 'Bakery', 'Gardenia', 'Phnom Penh Fresh Foods', 0.70, 1.20, 20, 8, 'pcs', 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400&h=400&fit=crop', 'Cinnamon Roll is a soft, sweet spiral pastry filled with cinnamon sugar and topped with cream cheese icing.'],
            ['Donut Glazed', 'Bakery', 'Gardenia', 'Phnom Penh Fresh Foods', 0.40, 0.70, 35, 12, 'pcs', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=400&fit=crop', 'Donut Glazed is a classic ring-shaped pastry coated in a sweet sugar glaze. Soft, fluffy, and perfect with coffee.'],
            ['Bagel Sesame', 'Bakery', 'Gardenia', 'Phnom Penh Fresh Foods', 0.50, 0.80, 28, 10, 'pcs', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop', 'Bagel Sesame is a chewy, golden bread roll topped with sesame seeds. Perfect for breakfast with cream cheese or as a sandwich base.'],
            ['Ciabatta Bread 300g', 'Bakery', 'Gardenia', 'Phnom Penh Fresh Foods', 0.70, 1.10, 22, 8, 'pcs', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop', 'Ciabatta Bread is an Italian-style bread with a crispy crust and soft, airy interior. Ideal for paninis and bruschetta.'],
            ['Sourdough Loaf 400g', 'Bakery', 'Gardenia', 'Phnom Penh Fresh Foods', 1.00, 1.60, 15, 6, 'pcs', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop', 'Sourdough Loaf is a tangy, chewy bread made with natural fermentation. Crusty outside, soft inside, perfect for any meal.'],
            ['Hot Dog Bun 6pk', 'Bakery', 'Gardenia', 'Phnom Penh Fresh Foods', 0.60, 1.00, 25, 8, 'pack', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop', 'Hot Dog Bun 6pk are soft, fluffy bread rolls perfect for sausages and hot dogs. Light and fresh for BBQ gatherings.'],
            ['Raisin Bread 400g', 'Bakery', 'Gardenia', 'Phnom Penh Fresh Foods', 0.90, 1.40, 20, 8, 'pcs', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop', 'Raisin Bread is lightly sweetened bread studded with plump raisins. Perfect for toast with butter or as a snack.'],

            // Fresh Produce (10)
            ['Fuji Apple 1kg', 'Fresh Produce', 'Dole', 'Phnom Penh Fresh Foods', 1.50, 2.30, 50, 15, 'kg', 'https://images.unsplash.com/photo-1568702846914-96b305d2eb1c?w=400&h=400&fit=crop', 'Fuji Apples are sweet, crisp, and juicy with a bright red skin. Perfect for snacking, baking, or adding to salads.'],
            ['Banana Cavendish 1kg', 'Fresh Produce', 'Dole', 'Phnom Penh Fresh Foods', 0.60, 1.00, 80, 25, 'kg', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop', 'Banana Cavendish is a creamy, sweet fruit packed with potassium and energy. A healthy snack for all ages.'],
            ['Zespri Kiwi 1kg', 'Fresh Produce', 'Zespri', 'Phnom Penh Fresh Foods', 2.50, 3.80, 30, 10, 'kg', 'https://images.unsplash.com/photo-1582120031342-7e0e0e7e6e16?w=400&h=400&fit=crop', 'Zespri Kiwi is a fuzzy, brown fruit with bright green flesh full of vitamin C and fiber. Sweet and tangy.'],
            ['Red Grapes 1kg', 'Fresh Produce', 'Dole', 'Phnom Penh Fresh Foods', 2.00, 3.00, 35, 10, 'kg', 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&h=400&fit=crop', 'Red Grapes are plump, juicy berries with a sweet flavor. Perfect for snacking, wine-making, or adding to fruit salads.'],
            ['Broccoli 500g', 'Fresh Produce', 'Dole', 'Phnom Penh Fresh Foods', 0.80, 1.30, 25, 8, 'pcs', 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop', 'Broccoli is a nutritious green vegetable packed with vitamins, fiber, and antioxidants. Great steamed, roasted, or in stir-fries.'],
            ['Carrots 1kg', 'Fresh Produce', 'Dole', 'Phnom Penh Fresh Foods', 0.70, 1.10, 40, 12, 'kg', 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400&h=400&fit=crop', 'Carrots are crunchy, orange root vegetables rich in beta-carotene and vitamin A. Sweet, healthy, and versatile in cooking.'],
            ['Tomatoes 1kg', 'Fresh Produce', 'Dole', 'Phnom Penh Fresh Foods', 0.80, 1.30, 45, 15, 'kg', 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=400&fit=crop', 'Tomatoes are ripe, red fruits bursting with flavor. Essential for salads, sauces, and countless culinary dishes.'],
            ['Potatoes 1kg', 'Fresh Produce', 'Dole', 'Phnom Penh Fresh Foods', 0.50, 0.80, 60, 20, 'kg', 'https://images.unsplash.com/photo-1518977676601-b53f82ber5b8?w=400&h=400&fit=crop', 'Potatoes are versatile, starchy vegetables perfect for frying, baking, mashing, or boiling. A kitchen staple.'],
            ['Onions 1kg', 'Fresh Produce', 'Dole', 'Phnom Penh Fresh Foods', 0.40, 0.70, 55, 18, 'kg', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=400&fit=crop', 'Onions are aromatic, flavorful bulbs essential for cooking. Add depth and sweetness to soups, stews, and stir-fries.'],
            ['Mixed Salad 200g', 'Fresh Produce', 'Dole', 'Phnom Penh Fresh Foods', 1.20, 1.90, 20, 8, 'pack', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop', 'Mixed Salad is a fresh blend of crisp lettuce, spinach, and seasonal greens. Ready to eat, perfect for healthy meals.'],

            // Meat & Seafood (10)
            ['Salmon Fillet 300g', 'Meat & Seafood', 'Salmar', 'Mekong Electronics Ltd.', 4.50, 7.00, 15, 5, 'pcs', 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=400&h=400&fit=crop', 'Salmon Fillet is fresh, premium Atlantic salmon rich in omega-3 fatty acids. Perfect for grilling, baking, or pan-searing.'],
            ['Chicken Breast 500g', 'Meat & Seafood', 'Tyson', 'Mekong Electronics Ltd.', 2.50, 4.00, 30, 10, 'pack', 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=400&h=400&fit=crop', 'Chicken Breast is lean, tender white meat high in protein. Versatile for grilling, baking, stir-frying, or salads.'],
            ['Tiger Prawns 300g', 'Meat & Seafood', 'Ocean Prince', 'Mekong Electronics Ltd.', 5.00, 8.00, 12, 4, 'pack', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=400&fit=crop', 'Tiger Prawns are large, juicy crustaceans with a sweet, delicate flavor. Perfect for grilling, curries, or seafood pasta.'],
            ['Beef Mince 500g', 'Meat & Seafood', 'Fischer', 'Mekong Electronics Ltd.', 3.50, 5.50, 25, 8, 'pack', 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop', 'Beef Mince is finely ground, fresh beef ideal for burgers, bolognese, tacos, and meatballs. Lean and flavorful.'],
            ['Pork Chops 400g', 'Meat & Seafood', 'Fischer', 'Mekong Electronics Ltd.', 3.00, 4.80, 20, 6, 'pack', 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop', 'Pork Chops are thick-cut, juicy chops perfect for grilling, pan-frying, or baking. Tender and full of flavor.'],
            ['Sausages 300g', 'Meat & Seafood', 'Fischer', 'Mekong Electronics Ltd.', 2.00, 3.20, 35, 10, 'pack', 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop', 'Sausages are juicy, seasoned pork links perfect for grilling, frying, or boiling. A family favorite for any meal.'],
            ['Cod Fillet 300g', 'Meat & Seafood', 'Salmar', 'Mekong Electronics Ltd.', 4.00, 6.50, 12, 4, 'pack', 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=400&h=400&fit=crop', 'Cod Fillet is mild, white fish with a delicate, flaky texture. Perfect for baking, frying, or fish tacos.'],
            ['Lamb Chops 400g', 'Meat & Seafood', 'Fischer', 'Mekong Electronics Ltd.', 5.50, 8.50, 8, 3, 'pack', 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop', 'Lamb Chops are tender, flavorful cuts perfect for grilling or roasting. A premium choice for special dinners.'],
            ['Shrimp Tempura 200g', 'Meat & Seafood', 'Ocean Prince', 'Mekong Electronics Ltd.', 3.50, 5.50, 15, 5, 'pack', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=400&fit=crop', 'Shrimp Tempura are crispy, battered shrimp ready to fry. Golden, crunchy, and delicious with sweet chili sauce.'],
            ['Bacon Strips 200g', 'Meat & Seafood', 'Tyson', 'Mekong Electronics Ltd.', 2.50, 4.00, 20, 6, 'pack', 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=400&h=400&fit=crop', 'Bacon Strips are smoky, crispy cured pork perfect for breakfast, sandwiches, and salads. Rich, savory flavor.'],

            // Frozen Foods (10)
            ['Fish Fingers 300g', 'Frozen Foods', 'Iglo', 'Phnom Penh Fresh Foods', 1.50, 2.40, 25, 8, 'pack', 'https://images.unsplash.com/photo-1575425186775-b2de9a656176?w=400&h=400&fit=crop', 'Fish Fingers are crispy, golden breadcrumb-coated fish fillets. Quick to cook and perfect for kids and adults alike.'],
            ['Frozen Vegetables 500g', 'Frozen Foods', 'Iglo', 'Phnom Penh Fresh Foods', 1.20, 1.90, 30, 10, 'pack', 'https://images.unsplash.com/photo-1575425186775-b2de9a656176?w=400&h=400&fit=crop', 'Frozen Vegetables are a blend of peas, carrots, and corn frozen at peak freshness. Retains nutrients and flavor.'],
            ['Frozen Pizza Margherita', 'Frozen Foods', 'Dr. Oetker', 'Phnom Penh Fresh Foods', 2.50, 4.00, 18, 6, 'pcs', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop', 'Frozen Pizza Margherita features a crispy crust topped with tomato sauce, mozzarella, and fresh basil. Ready in minutes.'],
            ['Häagen-Dazs Vanilla 500ml', 'Frozen Foods', 'Häagen-Dazs', 'Phnom Penh Fresh Foods', 3.50, 5.50, 12, 4, 'pack', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=400&fit=crop', 'Häagen-Dazs Vanilla ice cream is made with real Madagascar vanilla beans. Creamy, rich, and indulgent.'],
            ['Frozen French Fries 500g', 'Frozen Foods', 'Iglo', 'Phnom Penh Fresh Foods', 1.00, 1.60, 35, 12, 'pack', 'https://images.unsplash.com/photo-1575425186775-b2de9a656176?w=400&h=400&fit=crop', 'Frozen French Fries are crispy, golden potato fries ready to bake or fry. Perfectly seasoned and delicious.'],
            ['Chicken Nuggets 300g', 'Frozen Foods', 'Tyson', 'Phnom Penh Fresh Foods', 1.80, 2.80, 28, 8, 'pack', 'https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=400&h=400&fit=crop', 'Chicken Nuggets are crispy, breaded chicken pieces perfect for kids and adults. Quick, easy, and always a crowd-pleaser.'],
            ['Ice Cream Chocolate 500ml', 'Frozen Foods', 'Häagen-Dazs', 'Phnom Penh Fresh Foods', 3.50, 5.50, 15, 5, 'pack', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=400&fit=crop', 'Ice Cream Chocolate is rich, creamy chocolate ice cream made with premium cocoa. A classic dessert for chocolate lovers.'],
            ['Spring Rolls 200g', 'Frozen Foods', 'Iglo', 'Phnom Penh Fresh Foods', 1.50, 2.40, 22, 8, 'pack', 'https://images.unsplash.com/photo-1575425186775-b2de9a656176?w=400&h=400&fit=crop', 'Spring Rolls are crispy, vegetable-filled rolls perfect for frying. Golden and crunchy with a savory filling.'],
            ['Frozen Mango 500g', 'Frozen Foods', 'Dole', 'Phnom Penh Fresh Foods', 2.00, 3.20, 18, 6, 'pack', 'https://images.unsplash.com/photo-1568702846914-96b305d2eb1c?w=400&h=400&fit=crop', 'Frozen Mango chunks are ripe, sweet mangoes flash-frozen at peak ripeness. Perfect for smoothies and desserts.'],
            ['Waffles 6pk', 'Frozen Foods', 'Dr. Oetker', 'Phnom Penh Fresh Foods', 1.80, 2.80, 20, 6, 'pack', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop', 'Waffles are golden, crispy Belgian-style waffles ready to toast. Top with syrup, fruit, or whipped cream.'],

            // Household (5)
            ['Persil Liquid Detergent 1L', 'Household', 'Persil', 'Angkor Household Supplies', 3.00, 4.50, 30, 10, 'bottle', 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=400&fit=crop', 'Persil Liquid Detergent delivers deep clean and long-lasting freshness. Advanced formula removes tough stains in all water temperatures.'],
            ['Finish Dishwasher Tabs 30pk', 'Household', 'Finish', 'Angkor Household Supplies', 4.00, 6.50, 20, 8, 'pack', 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop', 'Finish Dishwasher Tabs are powerful all-in-one tablets that cut through grease and leave dishes sparkling clean.'],
            ['Febreze Air Freshener 300ml', 'Household', 'Febreze', 'Angkor Household Supplies', 2.00, 3.20, 35, 12, 'can', 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop', 'Febreze Air Freshener eliminates odors and leaves a long-lasting fresh scent. Safe for fabrics and the whole family.'],
            ['Clorox Wipes 30pk', 'Household', 'Unilever', 'Angkor Household Supplies', 1.80, 2.80, 28, 10, 'pack', 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop', 'Clorox Wipes are antibacterial cleaning wipes that kill 99.9% of germs. Convenient for quick cleanups anywhere.'],
            ['Glad Cling Wrap 300m', 'Household', 'Scott', 'Angkor Household Supplies', 1.20, 1.90, 40, 12, 'roll', 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=400&h=400&fit=crop', 'Glad Cling Wrap is a strong, stretchy plastic wrap that keeps food fresh. Clings tightly to bowls and containers.'],

            // Personal Care (5)
            ['Oral-B Toothbrush 3pk', 'Personal Care', 'Oral-B', 'Khmer Care Distribution', 2.50, 4.00, 30, 10, 'pack', 'https://images.unsplash.com/photo-1559304787-e4e4a2a972e0?w=400&h=400&fit=crop', 'Oral-B Toothbrush 3pk features soft bristles and an ergonomic handle for a thorough, gentle clean. Dentist-recommended brand.'],
            ['Neutrogena Face Wash 150ml', 'Personal Care', 'Neutrogena', 'Khmer Care Distribution', 3.50, 5.50, 20, 6, 'bottle', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', 'Neutrogena Face Wash gently cleanses and removes impurities without over-drying. Oil-free formula for clear, healthy skin.'],
            ['Garnier Shampoo 400ml', 'Personal Care', 'Garnier', 'Khmer Care Distribution', 2.80, 4.30, 25, 8, 'bottle', 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc6?w=400&h=400&fit=crop', 'Garnier Shampoo nourishes and strengthens hair with natural ingredients. Leaves hair soft, shiny, and manageable.'],
            ['Venus Razor 3pk', 'Personal Care', 'Venus', 'Khmer Care Distribution', 4.00, 6.50, 18, 6, 'pack', 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400&h=400&fit=crop', 'Venus Razor delivers a close, smooth shave with less irritation. Moisture strips protect sensitive skin.'],
            ['Nivea Deodorant 50ml', 'Personal Care', 'Dove', 'Khmer Care Distribution', 1.80, 2.80, 35, 12, 'pcs', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', 'Nivea Deodorant provides 48-hour protection against sweat and odor. Gentle formula suitable for sensitive skin.'],

            // Stationery (5)
            ['Stabilo Pen 10pk', 'Stationery', 'Stabilo', 'Office Pro Cambodia', 2.50, 4.00, 50, 15, 'pack', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop', 'Stabilo Pens are smooth-writing, colorful pens perfect for school, office, and creative work. Vibrant, fade-resistant ink.'],
            ['Moleskine Notebook', 'Stationery', 'Moleskine', 'Office Pro Cambodia', 3.00, 5.00, 30, 10, 'pcs', 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=400&fit=crop', 'Moleskine Notebook is a premium hardcover journal with thick, acid-free paper. Perfect for notes, sketches, and journaling.'],
            ['Maped Ruler 30cm', 'Stationery', 'Maped', 'Office Pro Cambodia', 0.50, 0.80, 60, 20, 'pcs', 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=400&fit=crop', 'Maped Ruler is a durable, transparent 30cm ruler with clear markings. Essential for school and office.'],
            ['Tesa Tape 50m', 'Stationery', 'Maped', 'Office Pro Cambodia', 1.00, 1.60, 40, 12, 'roll', 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=400&fit=crop', 'Tesa Tape is strong, adhesive tape for wrapping, sealing, and crafts. Clean, residue-free removal.'],
            ['A4 Paper 500 sheets', 'Stationery', 'Double A', 'Office Pro Cambodia', 3.50, 5.50, 35, 12, 'ream', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=400&fit=crop', 'A4 Paper is premium 80gsm copy paper for crisp text and vibrant color printing. Jam-free performance for all printers.'],

            // Health & Wellness (5)
            ['Centrum Multivitamin 30pk', 'Health & Wellness', 'Centrum', 'Khmer Care Distribution', 5.00, 8.00, 15, 5, 'pack', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 'Centrum Multivitamin is a complete daily supplement with essential vitamins and minerals for overall health and energy.'],
            ['Panadol Extra 24pk', 'Health & Wellness', 'Panadol', 'Khmer Care Distribution', 2.50, 4.00, 25, 8, 'pack', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 'Panadol Extra provides fast, effective relief from headaches, body aches, and fever. Gentle on the stomach.'],
            ['Ensure Nutrition 400g', 'Health & Wellness', 'Ensure', 'Khmer Care Distribution', 6.00, 9.50, 12, 4, 'can', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop', 'Ensure Nutrition is a complete, balanced meal replacement shake with 24 vitamins and minerals. Supports muscle and immune health.'],
            ['Johnson Baby Lotion 500ml', 'Health & Wellness', 'Johnson', 'Khmer Care Distribution', 2.00, 3.20, 30, 10, 'bottle', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', 'Johnson Baby Lotion is a gentle, hypoallergenic moisturizer that keeps baby\'s skin soft and smooth. Clinically mild.'],
            ['Fish Oil 100 capsules', 'Health & Wellness', 'Centrum', 'Khmer Care Distribution', 4.00, 6.50, 18, 6, 'pack', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 'Fish Oil capsules are rich in omega-3 fatty acids supporting heart, brain, and joint health. Pure, high-quality formula.'],

            // Baby Products (5)
            ['Huggies Diapers M 40pk', 'Baby Products', 'Huggies', 'Khmer Care Distribution', 6.00, 9.50, 20, 6, 'pack', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop', 'Huggies Diapers provide all-day dryness and leak protection. Soft, breathable material keeps baby comfortable and happy.'],
            ['Nestogen Formula 800g', 'Baby Products', 'Nestogen', 'Khmer Care Distribution', 5.00, 8.00, 15, 5, 'pack', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop', 'Nestogen Formula provides complete nutrition for infants with essential vitamins, minerals, and DHA for brain development.'],
            ['Johnson Baby Shampoo 500ml', 'Baby Products', 'Johnson', 'Khmer Care Distribution', 2.50, 4.00, 25, 8, 'bottle', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', 'Johnson Baby Shampoo is a no-tears formula that gently cleanses baby\'s hair. Leaves hair soft, shiny, and manageable.'],
            ['Huggies Wipes 80pk', 'Baby Products', 'Huggies', 'Khmer Care Distribution', 2.00, 3.20, 30, 10, 'pack', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop', 'Huggies Wipes are soft, gentle, and fragrance-free wipes perfect for cleaning baby\'s skin. Safe from birth.'],
            ['Baby Powder 200g', 'Baby Products', 'Johnson', 'Khmer Care Distribution', 1.50, 2.40, 28, 8, 'pack', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', 'Baby Powder keeps skin dry, fresh, and comfortable. Mild, hypoallergenic formula suitable for delicate skin.'],

            // Pet Supplies (5)
            ['Purina Dog Food 3kg', 'Pet Supplies', 'Purina', 'Phnom Penh Fresh Foods', 5.00, 8.00, 15, 5, 'pack', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=400&fit=crop', 'Purina Dog Food is a complete, balanced meal for adult dogs with real meat, vitamins, and minerals for healthy growth.'],
            ['Whiskas Cat Food 1.5kg', 'Pet Supplies', 'Whiskas', 'Phnom Penh Fresh Foods', 4.00, 6.50, 18, 6, 'pack', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop', 'Whiskas Cat Food provides complete nutrition for cats with tender meat pieces in a delicious sauce. Cats love the taste.'],
            ['Dog Leash 1.5m', 'Pet Supplies', 'Purina', 'Phnom Penh Fresh Foods', 2.00, 3.20, 20, 6, 'pcs', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=400&fit=crop', 'Dog Leash is a durable, comfortable leash for daily walks. Strong clasp and padded handle for easy control.'],
            ['Cat Litter 5kg', 'Pet Supplies', 'Whiskas', 'Phnom Penh Fresh Foods', 3.00, 4.80, 15, 5, 'pack', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop', 'Cat Litter is absorbent, odor-controlling litter for a clean, fresh cat box. Low dust and easy to scoop.'],
            ['Pet Treats 200g', 'Pet Supplies', 'Purina', 'Phnom Penh Fresh Foods', 1.50, 2.40, 25, 8, 'pack', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=400&fit=crop', 'Pet Treats are delicious, crunchy snacks for dogs and cats. Made with real meat and no artificial flavors.'],
        ];

        $created = 0;
        foreach ($products as $i => $p) {
            [$name, $catName, $brandName, $supplierName, $cost, $price, $stock, $reorder, $unit, $image, $description] = $p;
            $sku = 'SKU-' . str_pad((string) ($startNum + $i), 4, '0', STR_PAD_LEFT);
            $barcode = '885' . str_pad((string) (3000000 + $i * 4523), 10, '0', STR_PAD_LEFT);

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
                'image' => $image,
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

        $this->command?->info("Created {$created} new products ({$startNum}–" . ($startNum + $created - 1) . ") with inventory, images, and descriptions.");
    }
}
