// Static nutrition database for common foods
// All values are per 100g unless otherwise specified
const NUTRITION_DATABASE = {
    // Proteins
    'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, sugar: 0 },
    'salmon': { calories: 208, protein: 22, carbs: 0, fat: 12, sugar: 0 },
    'ground beef': { calories: 250, protein: 26, carbs: 0, fat: 17, sugar: 0 },
    'eggs': { calories: 155, protein: 13, carbs: 1.1, fat: 11, sugar: 1.1 },
    'greek yogurt': { calories: 100, protein: 10, carbs: 4, fat: 5, sugar: 4 },
    'tuna': { calories: 132, protein: 28, carbs: 0, fat: 1, sugar: 0 },
    'tofu': { calories: 70, protein: 8, carbs: 2, fat: 4, sugar: 1 },
    'cottage cheese': { calories: 98, protein: 11, carbs: 3.4, fat: 4.3, sugar: 2.7 },
    'turkey breast': { calories: 135, protein: 30, carbs: 0, fat: 1, sugar: 0 },
    'whey protein powder': { calories: 400, protein: 80, carbs: 5, fat: 5, sugar: 3 },

    // Carbohydrates
    'white rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, sugar: 0.1 },
    'brown rice': { calories: 123, protein: 2.6, carbs: 22, fat: 0.9, sugar: 0.7 },
    'oats': { calories: 389, protein: 17, carbs: 66, fat: 7, sugar: 1 },
    'sweet potato': { calories: 86, protein: 1.6, carbs: 20, fat: 0.1, sugar: 4.2 },
    'quinoa': { calories: 120, protein: 4.4, carbs: 22, fat: 1.9, sugar: 0.9 },
    'whole wheat bread': { calories: 247, protein: 13, carbs: 41, fat: 4.2, sugar: 6 },
    'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, sugar: 0.6 },
    'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, sugar: 12 },
    'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, sugar: 10 },
    'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1, sugar: 0.8 },

    // Vegetables
    'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, sugar: 1.5 },
    'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, sugar: 0.4 },
    'carrots': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, sugar: 4.7 },
    'bell peppers': { calories: 31, protein: 1, carbs: 7, fat: 0.3, sugar: 4.2 },
    'tomatoes': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, sugar: 2.6 },
    'cucumber': { calories: 16, protein: 0.7, carbs: 4, fat: 0.1, sugar: 1.7 },
    'lettuce': { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, sugar: 0.8 },
    'onions': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, sugar: 4.2 },

    // Fats/Nuts
    'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15, sugar: 0.7 },
    'almonds': { calories: 579, protein: 21, carbs: 22, fat: 50, sugar: 4.4 },
    'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100, sugar: 0 },
    'peanut butter': { calories: 588, protein: 25, carbs: 20, fat: 50, sugar: 9 },
    'walnuts': { calories: 654, protein: 15, carbs: 14, fat: 65, sugar: 2.6 },
    'coconut oil': { calories: 862, protein: 0, carbs: 0, fat: 100, sugar: 0 },

    // Dairy
    'milk': { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.2, sugar: 4.8 },
    'cheese': { calories: 113, protein: 7, carbs: 1, fat: 9, sugar: 1 },
    'butter': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, sugar: 0.1 },
    'yogurt': { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, sugar: 4.7 },

    // Common meals/combinations
    'protein shake': { calories: 150, protein: 25, carbs: 5, fat: 2, sugar: 3 },
    'caesar salad': { calories: 190, protein: 8, carbs: 12, fat: 14, sugar: 4 },
    'chicken and rice': { calories: 200, protein: 20, carbs: 25, fat: 3, sugar: 1 },
    'tuna sandwich': { calories: 280, protein: 18, carbs: 35, fat: 8, sugar: 5 },
    'oatmeal': { calories: 68, protein: 2.4, carbs: 12, fat: 1.4, sugar: 0.3 }
};

// Common serving sizes (in grams)
const SERVING_SIZES = {
    'chicken breast': 150,
    'salmon': 120,
    'ground beef': 100,
    'eggs': 50, // 1 large egg
    'greek yogurt': 170, // 1 cup
    'tuna': 85, // 1 can
    'white rice': 150, // cooked
    'brown rice': 150, // cooked
    'oats': 40, // dry
    'sweet potato': 150, // medium
    'banana': 120, // medium
    'apple': 180, // medium
    'broccoli': 100,
    'spinach': 30, // 1 cup raw
    'avocado': 150, // 1 medium
    'almonds': 30, // small handful
    'olive oil': 15, // 1 tablespoon
    'peanut butter': 32, // 2 tablespoons
    'milk': 240, // 1 cup
    'cheese': 30, // 1 slice
    'protein shake': 250, // typical shake
    'caesar salad': 200, // side salad
    'chicken and rice': 300, // typical meal
    'tuna sandwich': 200, // typical sandwich
    'oatmeal': 150 // prepared
};

// Keywords for food identification
const FOOD_KEYWORDS = {
    'chicken': ['chicken', 'poultry'],
    'salmon': ['salmon', 'fish'],
    'ground beef': ['ground beef', 'minced beef', 'hamburger meat'],
    'eggs': ['egg', 'eggs'],
    'greek yogurt': ['greek yogurt', 'greek yoghurt'],
    'tuna': ['tuna'],
    'tofu': ['tofu'],
    'cottage cheese': ['cottage cheese'],
    'turkey breast': ['turkey', 'turkey breast'],
    'whey protein powder': ['protein powder', 'whey', 'protein shake powder'],
    'white rice': ['white rice', 'jasmine rice', 'basmati rice'],
    'brown rice': ['brown rice', 'wild rice'],
    'oats': ['oats', 'oatmeal', 'porridge'],
    'sweet potato': ['sweet potato', 'yam'],
    'quinoa': ['quinoa'],
    'whole wheat bread': ['bread', 'whole wheat bread', 'whole grain bread'],
    'pasta': ['pasta', 'spaghetti', 'noodles'],
    'banana': ['banana'],
    'apple': ['apple'],
    'potato': ['potato', 'potatoes'],
    'broccoli': ['broccoli'],
    'spinach': ['spinach'],
    'carrots': ['carrot', 'carrots'],
    'bell peppers': ['bell pepper', 'peppers', 'capsicum'],
    'tomatoes': ['tomato', 'tomatoes'],
    'cucumber': ['cucumber'],
    'lettuce': ['lettuce'],
    'onions': ['onion', 'onions'],
    'avocado': ['avocado'],
    'almonds': ['almond', 'almonds'],
    'olive oil': ['olive oil'],
    'peanut butter': ['peanut butter'],
    'walnuts': ['walnut', 'walnuts'],
    'coconut oil': ['coconut oil'],
    'milk': ['milk'],
    'cheese': ['cheese'],
    'butter': ['butter'],
    'yogurt': ['yogurt', 'yoghurt'],
    'protein shake': ['protein shake'],
    'caesar salad': ['caesar salad', 'salad'],
    'chicken and rice': ['chicken and rice', 'chicken rice'],
    'tuna sandwich': ['tuna sandwich'],
    'oatmeal': ['oatmeal', 'porridge']
};

// Function to find nutrition info for a food item
function findNutritionInfo(foodDescription) {
    console.log('Looking up nutrition for:', foodDescription);
    
    const description = foodDescription.toLowerCase();
    
    // Direct match first
    if (NUTRITION_DATABASE[description]) {
        console.log('Direct match found:', description);
        return {
            food: description,
            nutrition: NUTRITION_DATABASE[description],
            servingSize: SERVING_SIZES[description] || 100,
            confidence: 'high'
        };
    }
    
    // Keyword matching
    for (const [foodKey, keywords] of Object.entries(FOOD_KEYWORDS)) {
        for (const keyword of keywords) {
            if (description.includes(keyword.toLowerCase())) {
                console.log('Keyword match found:', keyword, '->', foodKey);
                
                // Check if nutrition data exists for this food
                if (!NUTRITION_DATABASE[foodKey]) {
                    console.warn('⚠️ No nutrition data found for matched food:', foodKey);
                    continue; // Skip this match and try others
                }
                
                return {
                    food: foodKey,
                    nutrition: NUTRITION_DATABASE[foodKey],
                    servingSize: SERVING_SIZES[foodKey] || 100,
                    confidence: 'medium'
                };
            }
        }
    }
    
    console.log('No match found for:', foodDescription);
    return null;
}

// Function to calculate nutrition for a specific serving
function calculateNutrition(nutritionPer100g, servingGrams) {
    // Safety check for undefined nutrition data
    if (!nutritionPer100g) {
        console.error('❌ Nutrition data is undefined for calculation');
        return {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            sugar: 0
        };
    }
    
    const factor = servingGrams / 100;
    return {
        calories: Math.round((nutritionPer100g.calories || 0) * factor),
        protein: Math.round((nutritionPer100g.protein || 0) * factor * 10) / 10,
        carbs: Math.round((nutritionPer100g.carbs || 0) * factor * 10) / 10,
        fat: Math.round((nutritionPer100g.fat || 0) * factor * 10) / 10,
        sugar: Math.round((nutritionPer100g.sugar || 0) * factor * 10) / 10
    };
}

// Function to parse meal description and get nutrition estimate
function parseMealNutrition(mealDescription) {
    console.log('Parsing meal nutrition for:', mealDescription);
    
    const results = [];
    const words = mealDescription.toLowerCase().split(/[\s,]+/);
    const processed = new Set();
    
    // Try to find foods in the description
    for (const [foodKey, keywords] of Object.entries(FOOD_KEYWORDS)) {
        if (processed.has(foodKey)) continue;
        
        for (const keyword of keywords) {
            const keywordWords = keyword.toLowerCase().split(' ');
            let found = true;
            
            for (const keywordWord of keywordWords) {
                if (!words.some(word => word.includes(keywordWord))) {
                    found = false;
                    break;
                }
            }
            
            if (found) {
                const nutritionInfo = findNutritionInfo(foodKey);
                if (nutritionInfo) {
                    results.push(nutritionInfo);
                    processed.add(foodKey);
                    break;
                }
            }
        }
    }
    
    // If no matches found, return null for AI processing
    if (results.length === 0) {
        console.log('No nutrition matches found, will need AI processing');
        return null;
    }
    
    // Calculate total nutrition
    let totalNutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sugar: 0
    };
    
    results.forEach(result => {
        const nutrition = calculateNutrition(result.nutrition, result.servingSize);
        totalNutrition.calories += nutrition.calories;
        totalNutrition.protein += nutrition.protein;
        totalNutrition.carbs += nutrition.carbs;
        totalNutrition.fat += nutrition.fat;
        totalNutrition.sugar += nutrition.sugar;
    });
    
    console.log('Total nutrition calculated:', totalNutrition);
    return {
        foods: results,
        totalNutrition: totalNutrition,
        confidence: results.every(r => r.confidence === 'high') ? 'high' : 'medium'
    };
}

// Export functions for use in main app
window.nutritionUtils = {
    findNutritionInfo,
    calculateNutrition,
    parseMealNutrition,
    NUTRITION_DATABASE,
    SERVING_SIZES
};

console.log('Nutrition database loaded with', Object.keys(NUTRITION_DATABASE).length, 'foods'); 