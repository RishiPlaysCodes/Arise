// ============================================================================
// OFFLINE FOOD DATABASE
// Common foods with macros per 100g (or per unit where noted).
// Enables fast, accurate diet logging with ZERO network. Search is on-device.
// Values are rounded typical figures suitable for tracking (not lab-exact).
// ============================================================================

// unit: 'g' means values are per 100 g; 'unit' means per single item (with grams).
export const FOODS = [
  // Proteins
  { name: 'Chicken Breast (cooked)', unit: 'g', cal: 165, p: 31, c: 0, f: 3.6 },
  { name: 'Chicken Thigh (cooked)', unit: 'g', cal: 209, p: 26, c: 0, f: 11 },
  { name: 'Egg (whole, large)', unit: 'unit', grams: 50, cal: 72, p: 6.3, c: 0.4, f: 4.8 },
  { name: 'Egg White (large)', unit: 'unit', grams: 33, cal: 17, p: 3.6, c: 0.2, f: 0 },
  { name: 'Salmon (cooked)', unit: 'g', cal: 208, p: 20, c: 0, f: 13 },
  { name: 'Tuna (canned in water)', unit: 'g', cal: 116, p: 26, c: 0, f: 1 },
  { name: 'Lean Beef Mince (cooked)', unit: 'g', cal: 215, p: 26, c: 0, f: 12 },
  { name: 'Prawns / Shrimp (cooked)', unit: 'g', cal: 99, p: 24, c: 0, f: 0.3 },
  { name: 'Paneer', unit: 'g', cal: 296, p: 20, c: 4, f: 22 },
  { name: 'Tofu (firm)', unit: 'g', cal: 144, p: 17, c: 3, f: 9 },
  { name: 'Greek Yogurt (0% fat)', unit: 'g', cal: 59, p: 10, c: 3.6, f: 0.4 },
  { name: 'Cottage Cheese (low fat)', unit: 'g', cal: 98, p: 11, c: 3.4, f: 4.3 },
  { name: 'Whey Protein (scoop)', unit: 'unit', grams: 30, cal: 120, p: 24, c: 3, f: 1.5 },
  { name: 'Pork Chop (cooked)', unit: 'g', cal: 231, p: 26, c: 0, f: 14 },
  { name: 'Turkey Breast (cooked)', unit: 'g', cal: 135, p: 30, c: 0, f: 1 },
  { name: 'Soya Chunks (dry)', unit: 'g', cal: 345, p: 52, c: 33, f: 0.5 },
  { name: 'Lentils / Dal (cooked)', unit: 'g', cal: 116, p: 9, c: 20, f: 0.4 },
  { name: 'Chickpeas (cooked)', unit: 'g', cal: 164, p: 9, c: 27, f: 2.6 },
  { name: 'Kidney Beans (cooked)', unit: 'g', cal: 127, p: 9, c: 23, f: 0.5 },
  { name: 'Black Beans (cooked)', unit: 'g', cal: 132, p: 9, c: 24, f: 0.5 },

  // Carbs / grains
  { name: 'White Rice (cooked)', unit: 'g', cal: 130, p: 2.7, c: 28, f: 0.3 },
  { name: 'Brown Rice (cooked)', unit: 'g', cal: 123, p: 2.7, c: 26, f: 1 },
  { name: 'Roti / Chapati', unit: 'unit', grams: 40, cal: 104, p: 3, c: 20, f: 2.5 },
  { name: 'Whole Wheat Bread (slice)', unit: 'unit', grams: 40, cal: 100, p: 4, c: 18, f: 1.5 },
  { name: 'Oats (dry)', unit: 'g', cal: 389, p: 17, c: 66, f: 7 },
  { name: 'Pasta (cooked)', unit: 'g', cal: 158, p: 6, c: 31, f: 0.9 },
  { name: 'Quinoa (cooked)', unit: 'g', cal: 120, p: 4.4, c: 21, f: 1.9 },
  { name: 'Sweet Potato (cooked)', unit: 'g', cal: 90, p: 2, c: 21, f: 0.2 },
  { name: 'Potato (boiled)', unit: 'g', cal: 87, p: 1.9, c: 20, f: 0.1 },
  { name: 'Poha (cooked)', unit: 'g', cal: 130, p: 2.5, c: 27, f: 1.5 },
  { name: 'Idli', unit: 'unit', grams: 40, cal: 58, p: 2, c: 12, f: 0.4 },
  { name: 'Dosa (plain)', unit: 'unit', grams: 80, cal: 133, p: 2.7, c: 24, f: 3 },
  { name: 'Cornflakes', unit: 'g', cal: 357, p: 7, c: 84, f: 0.4 },
  { name: 'Banana', unit: 'unit', grams: 118, cal: 105, p: 1.3, c: 27, f: 0.4 },
  { name: 'Apple', unit: 'unit', grams: 182, cal: 95, p: 0.5, c: 25, f: 0.3 },
  { name: 'Orange', unit: 'unit', grams: 131, cal: 62, p: 1.2, c: 15, f: 0.2 },
  { name: 'Mango', unit: 'g', cal: 60, p: 0.8, c: 15, f: 0.4 },
  { name: 'Grapes', unit: 'g', cal: 69, p: 0.7, c: 18, f: 0.2 },
  { name: 'Blueberries', unit: 'g', cal: 57, p: 0.7, c: 14, f: 0.3 },

  // Fats / nuts / oils
  { name: 'Almonds', unit: 'g', cal: 579, p: 21, c: 22, f: 50 },
  { name: 'Peanut Butter', unit: 'g', cal: 588, p: 25, c: 20, f: 50 },
  { name: 'Walnuts', unit: 'g', cal: 654, p: 15, c: 14, f: 65 },
  { name: 'Cashews', unit: 'g', cal: 553, p: 18, c: 30, f: 44 },
  { name: 'Olive Oil', unit: 'g', cal: 884, p: 0, c: 0, f: 100 },
  { name: 'Ghee', unit: 'g', cal: 900, p: 0, c: 0, f: 100 },
  { name: 'Butter', unit: 'g', cal: 717, p: 0.9, c: 0.1, f: 81 },
  { name: 'Avocado', unit: 'g', cal: 160, p: 2, c: 9, f: 15 },
  { name: 'Cheese (cheddar)', unit: 'g', cal: 403, p: 25, c: 1.3, f: 33 },

  // Dairy / drinks
  { name: 'Whole Milk', unit: 'g', cal: 61, p: 3.2, c: 4.8, f: 3.3 },
  { name: 'Skim Milk', unit: 'g', cal: 34, p: 3.4, c: 5, f: 0.1 },
  { name: 'Curd / Yogurt (plain)', unit: 'g', cal: 61, p: 3.5, c: 4.7, f: 3.3 },

  // Veg
  { name: 'Broccoli (cooked)', unit: 'g', cal: 35, p: 2.4, c: 7, f: 0.4 },
  { name: 'Spinach (cooked)', unit: 'g', cal: 23, p: 3, c: 3.8, f: 0.3 },
  { name: 'Mixed Vegetables', unit: 'g', cal: 65, p: 2.6, c: 13, f: 0.5 },
  { name: 'Cucumber', unit: 'g', cal: 15, p: 0.7, c: 3.6, f: 0.1 },
  { name: 'Tomato', unit: 'g', cal: 18, p: 0.9, c: 3.9, f: 0.2 },

  // Common meals / misc
  { name: 'Protein Bar', unit: 'unit', grams: 60, cal: 220, p: 20, c: 22, f: 7 },
  { name: 'Peanuts (roasted)', unit: 'g', cal: 567, p: 26, c: 16, f: 49 },
  { name: 'Dark Chocolate (85%)', unit: 'g', cal: 598, p: 8, c: 46, f: 43 },
  { name: 'Honey', unit: 'g', cal: 304, p: 0.3, c: 82, f: 0 },
  { name: 'Chana / Roasted Gram', unit: 'g', cal: 364, p: 20, c: 61, f: 6 },
  { name: 'Rajma Curry', unit: 'g', cal: 140, p: 7, c: 20, f: 3 },
  { name: 'Chicken Curry', unit: 'g', cal: 180, p: 15, c: 5, f: 11 },
  { name: 'Dal Tadka', unit: 'g', cal: 130, p: 6, c: 16, f: 4.5 },
];

// Simple fuzzy-ish search over the food list.
export function searchFoods(query, limit = 25) {
  if (!query || !query.trim()) return FOODS.slice(0, limit);
  const q = query.trim().toLowerCase();
  const tokens = q.split(/\s+/);
  return FOODS
    .map((f) => {
      const name = f.name.toLowerCase();
      let score = 0;
      if (name.startsWith(q)) score += 100;
      if (name.includes(q)) score += 50;
      for (const t of tokens) if (name.includes(t)) score += 10;
      return { f, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.f);
}

// Scale a food entry to a given gram amount -> macro totals.
export function scaleFood(food, grams) {
  const per100 = food.unit === 'g';
  const factor = per100 ? grams / 100 : grams / (food.grams || 100);
  return {
    calories: Math.round(food.cal * factor),
    protein: Math.round(food.p * factor * 10) / 10,
    carbs: Math.round(food.c * factor * 10) / 10,
    fats: Math.round(food.f * factor * 10) / 10,
  };
}

// Default serving grams for quick "1 serving" add.
export function defaultServing(food) {
  return food.unit === 'unit' ? (food.grams || 100) : 100;
}

export default { FOODS, searchFoods, scaleFood, defaultServing };
