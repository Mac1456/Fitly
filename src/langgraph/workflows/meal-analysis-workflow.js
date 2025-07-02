const { StateGraph, END } = require('@langchain/langgraph');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

/**
 * Enhanced Meal Analysis Workflow using LangGraph
 * Provides sophisticated meal analysis with context awareness and confidence scoring
 */
class MealAnalysisWorkflow {
    constructor(llm, firebaseTools) {
        this.llm = llm;
        this.firebaseTools = firebaseTools;
        this.graph = null;
        this.setupGraph();
    }

    setupGraph() {
        const workflow = new StateGraph({
            channels: {
                mealDescription: {
                    value: (x, y) => y,
                    default: () => ''
                },
                userContext: {
                    value: (x, y) => ({ ...x, ...y }),
                    default: () => ({})
                },
                nutritionData: {
                    value: (x, y) => ({ ...x, ...y }),
                    default: () => ({})
                },
                confidence: {
                    value: (x, y) => y,
                    default: () => 'low'
                },
                needsClarification: {
                    value: (x, y) => y,
                    default: () => false
                },
                clarificationQuestions: {
                    value: (x, y) => y,
                    default: () => []
                },
                isComplete: {
                    value: (x, y) => y,
                    default: () => false
                }
            }
        });

        // Add nodes
        workflow.addNode('parse_meal', this.parseMealNode.bind(this));
        workflow.addNode('analyze_nutrition', this.analyzeNutritionNode.bind(this));
        workflow.addNode('assess_confidence', this.assessConfidenceNode.bind(this));
        workflow.addNode('generate_clarification', this.generateClarificationNode.bind(this));
        workflow.addNode('finalize_analysis', this.finalizeAnalysisNode.bind(this));

        // Define conditional edges
        workflow.addEdge('parse_meal', 'analyze_nutrition');
        workflow.addEdge('analyze_nutrition', 'assess_confidence');
        
        // Conditional edge based on confidence
        workflow.addConditionalEdges(
            'assess_confidence',
            this.shouldAskClarification.bind(this),
            {
                'clarify': 'generate_clarification',
                'finalize': 'finalize_analysis'
            }
        );
        
        workflow.addEdge('generate_clarification', END);
        workflow.addEdge('finalize_analysis', END);

        workflow.setEntryPoint('parse_meal');
        this.graph = workflow.compile();
    }

    async execute(input, context) {
        const initialState = {
            mealDescription: input.description || '',
            userContext: {
                userId: context.session?.userId,
                userProfile: input.userProfile || {},
                recentMeals: input.recentMeals || [],
                goals: input.goals || {}
            },
            mealTime: input.mealTime || 'unknown',
            imageData: input.imageData || null
        };

        try {
            const result = await this.graph.invoke(initialState);
            
            // If analysis is complete, save to Firebase
            if (result.isComplete && this.firebaseTools && result.userContext.userId) {
                await this.saveMealToFirebase(result);
            }

            return {
                nutrition: result.nutritionData,
                confidence: result.confidence,
                needsClarification: result.needsClarification,
                clarificationQuestions: result.clarificationQuestions,
                isComplete: result.isComplete,
                suggestions: result.suggestions || []
            };
        } catch (error) {
            console.error('❌ Meal analysis workflow error:', error);
            return {
                nutrition: null,
                confidence: 'low',
                error: 'Analysis failed'
            };
        }
    }

    async parseMealNode(state) {
        const systemPrompt = `You are analyzing a meal description. Extract and identify:
        1. Individual food items and their estimated quantities
        2. Cooking methods mentioned
        3. Portion size indicators
        4. Meal context (breakfast, lunch, dinner, snack)
        
        Meal description: "${state.mealDescription}"
        
        Return a structured breakdown of the meal components.`;

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(state.mealDescription)
        ];

        const response = await this.llm.invoke(messages);
        
        // Parse the response to extract meal components
        const mealComponents = this.extractMealComponents(response.content);

        return {
            ...state,
            mealComponents,
            parsedDescription: response.content
        };
    }

    async analyzeNutritionNode(state) {
        const userProfile = state.userContext.userProfile;
        const goals = state.userContext.goals;
        
        const systemPrompt = `You are a nutrition expert analyzing a meal. Provide detailed nutritional information in JSON format.

Consider:
- User's goal: ${goals.primaryGoal || 'general health'}
- Activity level: ${userProfile.activityLevel || 'moderate'}
- Recent meals context for daily totals

Meal: "${state.mealDescription}"
Parsed components: ${JSON.stringify(state.mealComponents || {})}

Provide nutrition data as JSON with these exact keys:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "sugar": number,
  "sodium": number,
  "portions": {
    "vegetables": number,
    "fruits": number,
    "grains": number,
    "protein": number,
    "dairy": number
  },
  "micronutrients": {
    "iron": number,
    "calcium": number,
    "vitaminC": number
  },
  "estimationNotes": "string explaining estimation method"
}

Be conservative and realistic in estimates. Consider typical serving sizes.`;

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(`Analyze: ${state.mealDescription}`)
        ];

        const response = await this.llm.invoke(messages);
        
        // Extract JSON from response
        const nutritionData = this.extractNutritionJSON(response.content);

        return {
            ...state,
            nutritionData,
            analysisResponse: response.content
        };
    }

    async assessConfidenceNode(state) {
        const mealDescription = state.mealDescription.toLowerCase();
        const nutritionData = state.nutritionData;
        
        let confidence = 'high';
        const confidenceFactors = [];

        // Assess confidence based on various factors
        if (mealDescription.length < 10) {
            confidence = 'low';
            confidenceFactors.push('Very brief description');
        }

        if (mealDescription.includes('some') || mealDescription.includes('a bit') || 
            mealDescription.includes('around') || mealDescription.includes('maybe')) {
            confidence = confidence === 'high' ? 'medium' : 'low';
            confidenceFactors.push('Vague quantity descriptors');
        }

        if (!mealDescription.match(/\d+/) && !mealDescription.includes('cup') && 
            !mealDescription.includes('slice') && !mealDescription.includes('piece')) {
            confidence = confidence === 'high' ? 'medium' : 'low';
            confidenceFactors.push('No specific quantities mentioned');
        }

        if (mealDescription.includes('homemade') || mealDescription.includes('restaurant') ||
            mealDescription.includes('takeout')) {
            confidence = confidence === 'high' ? 'medium' : 'low';
            confidenceFactors.push('Variable preparation method');
        }

        // Check if nutrition values seem reasonable
        if (nutritionData.calories && (nutritionData.calories < 50 || nutritionData.calories > 2000)) {
            confidence = 'low';
            confidenceFactors.push('Unusual calorie estimate');
        }

        return {
            ...state,
            confidence,
            confidenceFactors
        };
    }

    shouldAskClarification(state) {
        const confidence = state.confidence;
        const mealDescription = state.mealDescription;
        
        // Ask for clarification if confidence is low or description is vague
        if (confidence === 'low' || mealDescription.length < 15) {
            return 'clarify';
        }
        
        return 'finalize';
    }

    async generateClarificationNode(state) {
        const systemPrompt = `The meal analysis needs clarification. Generate 2-3 specific questions to improve accuracy.

Current meal: "${state.mealDescription}"
Confidence factors: ${JSON.stringify(state.confidenceFactors)}

Generate helpful questions about:
- Specific quantities/portions
- Cooking methods
- Ingredients that might be missing
- Context that would help estimation

Keep questions conversational and helpful.`;

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage('Generate clarification questions')
        ];

        const response = await this.llm.invoke(messages);
        
        const clarificationQuestions = this.extractQuestions(response.content);

        return {
            ...state,
            needsClarification: true,
            clarificationQuestions,
            isComplete: false
        };
    }

    async finalizeAnalysisNode(state) {
        const userProfile = state.userContext.userProfile;
        const goals = state.userContext.goals;
        
        // Generate personalized suggestions based on the meal and user goals
        const suggestions = this.generateSuggestions(state.nutritionData, userProfile, goals);
        
        return {
            ...state,
            suggestions,
            isComplete: true,
            needsClarification: false
        };
    }

    // Helper methods
    extractMealComponents(analysisText) {
        const components = {
            mainItems: [],
            sides: [],
            beverages: [],
            seasonings: [],
            cookingMethod: 'unknown'
        };

        // Simple extraction logic (can be enhanced)
        const lines = analysisText.split('\n');
        lines.forEach(line => {
            if (line.includes('main') || line.includes('protein')) {
                components.mainItems.push(line.trim());
            } else if (line.includes('side') || line.includes('vegetable')) {
                components.sides.push(line.trim());
            } else if (line.includes('drink') || line.includes('beverage')) {
                components.beverages.push(line.trim());
            }
        });

        return components;
    }

    extractNutritionJSON(responseText) {
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('❌ Error parsing nutrition JSON:', error);
        }

        // Fallback default nutrition data
        return {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            portions: {},
            micronutrients: {},
            estimationNotes: "Unable to parse detailed nutrition data"
        };
    }

    extractQuestions(responseText) {
        const questions = [];
        const lines = responseText.split('\n');
        
        lines.forEach(line => {
            if (line.includes('?') && line.length > 10) {
                questions.push(line.trim());
            }
        });

        return questions.slice(0, 3); // Limit to 3 questions
    }

    generateSuggestions(nutritionData, userProfile, goals) {
        const suggestions = [];
        
        if (goals.primaryGoal === 'build muscle' && nutritionData.protein < 20) {
            suggestions.push('💪 Consider adding more protein to support your muscle-building goals!');
        }
        
        if (goals.primaryGoal === 'lose fat' && nutritionData.calories > 600) {
            suggestions.push('🥗 This is a calorie-dense meal. Balance it with lighter meals today!');
        }
        
        if (nutritionData.fiber < 3) {
            suggestions.push('🌾 Try adding some vegetables or whole grains for more fiber!');
        }
        
        if (nutritionData.sodium > 800) {
            suggestions.push('🧂 This meal is high in sodium. Stay hydrated and balance with low-sodium options!');
        }

        return suggestions;
    }

    async saveMealToFirebase(result) {
        try {
            const mealData = {
                description: result.mealDescription,
                nutrition: result.nutritionData,
                confidence: result.confidence,
                mealTime: result.mealTime,
                analysisMethod: 'langgraph_workflow',
                suggestions: result.suggestions
            };

            await this.firebaseTools.logMeal(result.userContext.userId, mealData);
            console.log('✅ Meal saved to Firebase via LangGraph workflow');
        } catch (error) {
            console.error('❌ Error saving meal in workflow:', error);
        }
    }
}

module.exports = MealAnalysisWorkflow; 