const { StateGraph, END } = require('@langchain/langgraph');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

/**
 * Adaptive Coaching Workflow using LangGraph
 * Provides personalized guidance, motivation, and insights based on user data and behavior
 */
class CoachingWorkflow {
    constructor(llm, firebaseTools) {
        this.llm = llm;
        this.firebaseTools = firebaseTools;
        this.graph = null;
        this.setupGraph();
    }

    setupGraph() {
        const workflow = new StateGraph({
            channels: {
                userMessage: {
                    value: (x, y) => y,
                    default: () => ''
                },
                userContext: {
                    value: (x, y) => ({ ...x, ...y }),
                    default: () => ({})
                },
                userStats: {
                    value: (x, y) => ({ ...x, ...y }),
                    default: () => ({})
                },
                coachingType: {
                    value: (x, y) => y,
                    default: () => 'general'
                },
                insights: {
                    value: (x, y) => y,
                    default: () => []
                },
                suggestions: {
                    value: (x, y) => y,
                    default: () => []
                },
                motivationalMessage: {
                    value: (x, y) => y,
                    default: () => ''
                },
                actionItems: {
                    value: (x, y) => y,
                    default: () => []
                }
            }
        });

        // Simplified workflow - just one comprehensive node
        workflow.addNode('provide_coaching', this.provideCoachingNode.bind(this));

        workflow.addEdge('provide_coaching', END);
        workflow.setEntryPoint('provide_coaching');

        this.graph = workflow.compile();
    }

    async execute(input, context) {
        const initialState = {
            userMessage: input.message || '',
            userContext: {
                userId: context.session?.userId,
                userProfile: input.userProfile || {},
                recentActivity: input.recentActivity || {},
                goals: input.goals || {},
                preferences: input.preferences || {}
            },
            coachingType: input.type || 'general'
        };

        // Get user stats if Firebase tools available
        if (this.firebaseTools && initialState.userContext.userId) {
            try {
                const statsResult = await this.firebaseTools.getUserStats(initialState.userContext.userId, 7);
                if (statsResult.success) {
                    initialState.userStats = statsResult.stats;
                }
            } catch (error) {
                console.error('❌ Error fetching user stats for coaching:', error);
            }
        }

        try {
            const result = await this.graph.invoke(initialState);

            return {
                insights: result.insights,
                suggestions: result.suggestions,
                motivationalMessage: result.motivationalMessage,
                actionItems: result.actionItems,
                coachingType: result.coachingType
            };
        } catch (error) {
            console.error('❌ Coaching workflow error:', error);
            return {
                motivationalMessage: "I'm here to support you on your wellness journey! Keep up the great work!",
                insights: [],
                suggestions: [],
                actionItems: []
            };
        }
    }

    async provideCoachingNode(state) {
        const userProfile = state.userContext.userProfile;
        const userStats = state.userStats || {};
        const goals = state.userContext.goals;
        const userMessage = state.userMessage.toLowerCase();
        const recentActivity = state.userContext.recentActivity || {};

        // Check if user is asking about specific food macros
        const isMacroQuestion = userMessage.includes('macro') || userMessage.includes('calorie') || userMessage.includes('nutrition');
        const foodKeywords = this.extractFoodFromMessage(userMessage);

        let systemPrompt = '';
        let specificResponse = '';

        if (isMacroQuestion && foodKeywords.length > 0) {
            // Macro-specific response
            systemPrompt = `You are a helpful nutrition coach. The user is asking about the macros for "${foodKeywords.join(', ')}". 

Provide specific nutritional information if you can recognize the food, then give encouraging advice about tracking nutrition.

User's goal: ${goals.primaryGoal || 'general health'}
User's name: ${userProfile.name || 'there'}

Keep your response concise, helpful, and encouraging. Include approximate calories, protein, carbs, and fat if you can identify the food.`;

            specificResponse = await this.generateSpecificResponse(systemPrompt, userMessage);
        } else {
            // General coaching response
            systemPrompt = `You are a supportive wellness coach providing personalized guidance.

User Profile:
- Name: ${userProfile.name || 'User'}
- Goal: ${goals.primaryGoal || 'general health'}
- Activity Level: ${userProfile.activityLevel || 'moderate'}

Recent Activity:
- Today's calories: ${recentActivity.calories || 0}
- Recent meals: ${recentActivity.recentMeals || 'None logged'}

User's message: "${state.userMessage}"

Provide a warm, encouraging response that:
1. Addresses their specific question or concern
2. Is relevant to their goal (${goals.primaryGoal || 'wellness'})
3. Offers 1-2 practical, actionable suggestions
4. Stays positive and supportive

Keep it conversational and concise (2-3 sentences max).`;

            specificResponse = await this.generateSpecificResponse(systemPrompt, userMessage);
        }

        // Generate simple, focused insights
        const insights = this.generateSimpleInsights(userMessage, userStats, goals, recentActivity);
        
        // Generate practical suggestions
        const suggestions = this.generatePracticalSuggestions(goals, userStats, userMessage);
        
        // Generate actionable items
        const actionItems = this.generateActionItems(goals, userMessage);

        return {
            ...state,
            motivationalMessage: specificResponse,
            insights: insights,
            suggestions: suggestions,
            actionItems: actionItems
        };
    }

    async generateSpecificResponse(systemPrompt, userMessage) {
        try {
            const messages = [
                new SystemMessage(systemPrompt),
                new HumanMessage(userMessage)
            ];

            const response = await this.llm.invoke(messages);
            return response.content;
        } catch (error) {
            console.error('❌ Error generating coaching response:', error);
            return "I'm here to support you on your wellness journey! Keep up the great work!";
        }
    }

    generateSimpleInsights(userMessage, userStats, goals, recentActivity) {
        const insights = [];
        
        // Only add 1-2 relevant insights, no duplicates
        if (userMessage.includes('macro') || userMessage.includes('calorie')) {
            insights.push({
                type: 'positive',
                message: 'Great job being mindful about your nutrition! Tracking macros helps you make informed food choices.',
                emoji: '📊'
            });
        }
        
        if (userStats.totalMeals > 5) {
            insights.push({
                type: 'positive',
                message: `You've been consistent with logging ${userStats.totalMeals} meals this week!`,
                emoji: '✅'
            });
        }
        
        return insights;
    }

    generatePracticalSuggestions(goals, userStats, userMessage) {
        const suggestions = [];
        
        // Keep suggestions simple and non-repetitive
        if (goals.primaryGoal === 'lose fat') {
            suggestions.push('Focus on protein and vegetables to stay full while managing calories');
        } else if (goals.primaryGoal === 'build muscle') {
            suggestions.push('Aim for protein at each meal to support muscle growth');
        } else {
            suggestions.push('Keep focusing on balanced, nutritious meals');
        }
        
        return suggestions;
    }

    generateActionItems(goals, userMessage) {
        const actionItems = [];
        
        // Simple, practical actions
        if (userMessage.includes('water') || userMessage.includes('hydrat')) {
            actionItems.push('Drink a glass of water now');
        } else {
            actionItems.push('Log your next meal when you eat');
        }
        
        return actionItems;
    }

    // Helper method to extract food from user message
    extractFoodFromMessage(message) {
        const commonFoods = [
            'penne vodka', 'chicken', 'pasta', 'rice', 'burger', 'pizza', 'salad', 
            'sandwich', 'soup', 'steak', 'fish', 'eggs', 'oatmeal', 'yogurt'
        ];
        
        return commonFoods.filter(food => message.includes(food.toLowerCase()));
    }
}

module.exports = CoachingWorkflow; 