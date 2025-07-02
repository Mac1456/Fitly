/**
 * LangGraph Utilities for Fitly
 * Helper functions for LangGraph operations and data processing
 */

/**
 * Data validation utilities
 */
const DataValidation = {
    /**
     * Validate meal data structure
     */
    validateMealData(mealData) {
        const required = ['description'];
        const optional = ['mealTime', 'nutrition', 'confidence', 'timestamp'];
        
        const errors = [];
        
        // Check required fields
        required.forEach(field => {
            if (!mealData[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        });
        
        // Validate nutrition data if present
        if (mealData.nutrition) {
            const nutritionErrors = this.validateNutritionData(mealData.nutrition);
            errors.push(...nutritionErrors);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validate nutrition data
     */
    validateNutritionData(nutrition) {
        const errors = [];
        const numericFields = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'];
        
        numericFields.forEach(field => {
            if (nutrition[field] !== undefined) {
                if (typeof nutrition[field] !== 'number' || nutrition[field] < 0) {
                    errors.push(`Invalid ${field}: must be a positive number`);
                }
            }
        });
        
        return errors;
    },

    /**
     * Validate activity data
     */
    validateActivityData(activityData) {
        const required = ['description'];
        const errors = [];
        
        if (!activityData.description) {
            errors.push('Missing required field: description');
        }
        
        if (activityData.duration !== undefined) {
            if (typeof activityData.duration !== 'number' || activityData.duration <= 0) {
                errors.push('Duration must be a positive number');
            }
        }
        
        const validTypes = ['cardio', 'strength', 'yoga', 'walking', 'other'];
        if (activityData.activityType && !validTypes.includes(activityData.activityType)) {
            errors.push(`Invalid activity type. Must be one of: ${validTypes.join(', ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validate weight data
     */
    validateWeightData(weightData) {
        const errors = [];
        
        if (!weightData.weight) {
            errors.push('Missing required field: weight');
        } else if (typeof weightData.weight !== 'number' || weightData.weight <= 0) {
            errors.push('Weight must be a positive number');
        }
        
        if (!weightData.unit) {
            errors.push('Missing required field: unit');
        } else if (!['lbs', 'kg'].includes(weightData.unit)) {
            errors.push('Unit must be either "lbs" or "kg"');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

/**
 * Data transformation utilities
 */
const DataTransformation = {
    /**
     * Normalize meal data for storage
     */
    normalizeMealData(rawData, userId) {
        const normalized = {
            userId,
            description: rawData.description || '',
            mealTime: rawData.mealTime || 'unknown',
            timestamp: rawData.timestamp || new Date(),
            source: rawData.source || 'manual',
            confidence: rawData.confidence || 'medium'
        };

        // Add nutrition data if available
        if (rawData.nutrition) {
            normalized.nutrition = this.normalizeNutritionData(rawData.nutrition);
        }

        return normalized;
    },

    /**
     * Normalize nutrition data
     */
    normalizeNutritionData(nutrition) {
        const normalized = {};
        const numericFields = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'];
        
        numericFields.forEach(field => {
            if (nutrition[field] !== undefined) {
                normalized[field] = Math.round(Number(nutrition[field]) * 10) / 10; // Round to 1 decimal
            }
        });

        // Add portions and micronutrients if available
        if (nutrition.portions) {
            normalized.portions = { ...nutrition.portions };
        }
        if (nutrition.micronutrients) {
            normalized.micronutrients = { ...nutrition.micronutrients };
        }

        return normalized;
    },

    /**
     * Normalize activity data
     */
    normalizeActivityData(rawData, userId) {
        return {
            userId,
            description: rawData.description || '',
            activityType: rawData.activityType || 'other',
            duration: rawData.duration ? Math.round(Number(rawData.duration)) : null,
            intensity: rawData.intensity || 'unknown',
            timestamp: rawData.timestamp || new Date(),
            source: rawData.source || 'manual'
        };
    },

    /**
     * Normalize weight data
     */
    normalizeWeightData(rawData, userId) {
        return {
            userId,
            weight: Math.round(Number(rawData.weight) * 10) / 10, // Round to 1 decimal
            unit: rawData.unit || 'lbs',
            context: rawData.context || '',
            timestamp: rawData.timestamp || new Date(),
            source: rawData.source || 'manual'
        };
    }
};

/**
 * Session management utilities
 */
const SessionUtils = {
    /**
     * Generate session ID for conversations
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Create session context
     */
    createSessionContext(userId, sessionType = 'general', additionalData = {}) {
        return {
            sessionId: this.generateSessionId(),
            userId,
            sessionType,
            startTime: new Date(),
            ...additionalData
        };
    },

    /**
     * Merge conversation history
     */
    mergeConversationHistory(existing = [], newEntries = []) {
        const merged = [...existing, ...newEntries];
        
        // Limit conversation history to last 20 messages for performance
        if (merged.length > 20) {
            return merged.slice(-20);
        }
        
        return merged;
    }
};

/**
 * Error handling utilities
 */
const ErrorHandling = {
    /**
     * Create standardized error response
     */
    createErrorResponse(error, context = {}) {
        return {
            success: false,
            error: {
                message: error.message || 'Unknown error occurred',
                code: error.code || 'UNKNOWN_ERROR',
                timestamp: new Date(),
                context
            }
        };
    },

    /**
     * Create success response
     */
    createSuccessResponse(data, metadata = {}) {
        return {
            success: true,
            data,
            metadata: {
                timestamp: new Date(),
                ...metadata
            }
        };
    },

    /**
     * Handle workflow errors gracefully
     */
    handleWorkflowError(error, workflowName, fallbackMessage) {
        console.error(`❌ ${workflowName} workflow error:`, error);
        
        return {
            success: false,
            message: fallbackMessage,
            error: error.message,
            fallback: true
        };
    }
};

/**
 * Confidence scoring utilities
 */
const ConfidenceScoring = {
    /**
     * Calculate overall confidence score for meal analysis
     */
    calculateMealConfidence(factors) {
        let score = 100;
        
        // Deduct points for various factors
        if (factors.briefDescription) score -= 30;
        if (factors.vagueQuantities) score -= 25;
        if (factors.noQuantities) score -= 35;
        if (factors.variablePreparation) score -= 20;
        if (factors.unusualCalories) score -= 40;
        
        // Bonus points for good factors
        if (factors.specificIngredients) score += 10;
        if (factors.preciseQuantities) score += 15;
        if (factors.recognizedFoods) score += 10;
        
        // Normalize to 0-100 range
        score = Math.max(0, Math.min(100, score));
        
        // Convert to text confidence
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    },

    /**
     * Calculate speech recognition confidence
     */
    calculateSpeechConfidence(transcript, browserConfidence) {
        let adjustedConfidence = browserConfidence || 0.5;
        
        // Adjust based on transcript characteristics
        if (transcript.length < 5) adjustedConfidence *= 0.7;
        if (transcript.includes('um') || transcript.includes('uh')) adjustedConfidence *= 0.9;
        if (transcript.split(' ').length < 3) adjustedConfidence *= 0.8;
        
        // Convert to text confidence
        if (adjustedConfidence >= 0.8) return 'high';
        if (adjustedConfidence >= 0.6) return 'medium';
        return 'low';
    }
};

/**
 * Text processing utilities
 */
const TextProcessing = {
    /**
     * Clean and normalize text input
     */
    cleanText(text) {
        if (!text) return '';
        
        return text
            .trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
            .toLowerCase();
    },

    /**
     * Extract quantities from text
     */
    extractQuantities(text) {
        const quantities = [];
        const patterns = [
            /(\d+(?:\.\d+)?)\s*(cups?|tablespoons?|teaspoons?|tbsp|tsp|oz|ounces?|lbs?|pounds?|grams?|g|kg|kilograms?)/gi,
            /(\d+(?:\.\d+)?)\s*(slices?|pieces?|servings?|portions?|items?)/gi,
            /(a|an|one|two|three|four|five|six|seven|eight|nine|ten)\s*(cups?|slices?|pieces?)/gi
        ];

        patterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                quantities.push(...matches);
            }
        });

        return quantities;
    },

    /**
     * Extract food items from text
     */
    extractFoodItems(text) {
        // This is a simplified extraction - could be enhanced with food database
        const commonFoods = [
            'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna',
            'rice', 'pasta', 'bread', 'potato', 'sweet potato',
            'broccoli', 'spinach', 'carrot', 'tomato', 'onion',
            'apple', 'banana', 'orange', 'berry', 'strawberry',
            'milk', 'cheese', 'yogurt', 'egg', 'eggs',
            'oil', 'butter', 'avocado', 'nuts', 'almond'
        ];

        const words = text.toLowerCase().split(/\s+/);
        const foundFoods = [];

        commonFoods.forEach(food => {
            if (words.some(word => word.includes(food) || food.includes(word))) {
                foundFoods.push(food);
            }
        });

        return foundFoods;
    }
};

// Export all utilities
module.exports = {
    DataValidation,
    DataTransformation,
    SessionUtils,
    ErrorHandling,
    ConfidenceScoring,
    TextProcessing
}; 