const { StateGraph, END } = require('@langchain/langgraph');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

/**
 * Speech Processing Workflow using LangGraph
 * Handles voice input transcription and conversion to structured data
 */
class SpeechWorkflow {
    constructor(llm, firebaseTools) {
        this.llm = llm;
        this.firebaseTools = firebaseTools;
        this.graph = null;
        this.setupGraph();
    }

    setupGraph() {
        const workflow = new StateGraph({
            channels: {
                audioTranscript: {
                    value: (x, y) => y,
                    default: () => ''
                },
                intentType: {
                    value: (x, y) => y,
                    default: () => 'unknown'
                },
                extractedData: {
                    value: (x, y) => ({ ...x, ...y }),
                    default: () => ({})
                },
                confidence: {
                    value: (x, y) => y,
                    default: () => 'medium'
                },
                needsClarification: {
                    value: (x, y) => y,
                    default: () => false
                },
                clarificationMessage: {
                    value: (x, y) => y,
                    default: () => ''
                },
                isComplete: {
                    value: (x, y) => y,
                    default: () => false
                }
            }
        });

        // Add nodes
        workflow.addNode('detect_intent', this.detectIntentNode.bind(this));
        workflow.addNode('extract_meal_data', this.extractMealDataNode.bind(this));
        workflow.addNode('extract_activity_data', this.extractActivityDataNode.bind(this));
        workflow.addNode('extract_weight_data', this.extractWeightDataNode.bind(this));
        workflow.addNode('assess_completeness', this.assessCompletenessNode.bind(this));
        workflow.addNode('generate_clarification', this.generateClarificationNode.bind(this));
        workflow.addNode('finalize_data', this.finalizeDataNode.bind(this));

        // Define conditional edges based on intent
        workflow.addConditionalEdges(
            'detect_intent',
            this.routeByIntent.bind(this),
            {
                'meal': 'extract_meal_data',
                'activity': 'extract_activity_data',
                'weight': 'extract_weight_data',
                'unclear': 'generate_clarification'
            }
        );

        workflow.addEdge('extract_meal_data', 'assess_completeness');
        workflow.addEdge('extract_activity_data', 'assess_completeness');
        workflow.addEdge('extract_weight_data', 'assess_completeness');

        workflow.addConditionalEdges(
            'assess_completeness',
            this.shouldClarify.bind(this),
            {
                'clarify': 'generate_clarification',
                'finalize': 'finalize_data'
            }
        );

        workflow.addEdge('generate_clarification', END);
        workflow.addEdge('finalize_data', END);

        workflow.setEntryPoint('detect_intent');
        this.graph = workflow.compile();
    }

    async execute(input, context) {
        const initialState = {
            audioTranscript: input.transcript || '',
            userContext: {
                userId: context.session?.userId,
                userProfile: input.userProfile || {},
                currentTime: new Date()
            }
        };

        try {
            const result = await this.graph.invoke(initialState);

            // If data extraction is complete, save to Firebase
            if (result.isComplete && this.firebaseTools && result.userContext.userId) {
                await this.saveDataToFirebase(result);
            }

            return {
                intentType: result.intentType,
                extractedData: result.extractedData,
                confidence: result.confidence,
                needsClarification: result.needsClarification,
                clarificationMessage: result.clarificationMessage,
                isComplete: result.isComplete
            };
        } catch (error) {
            console.error('❌ Speech workflow error:', error);
            return {
                intentType: 'error',
                confidence: 'low',
                clarificationMessage: 'I had trouble understanding that. Could you try again?'
            };
        }
    }

    async detectIntentNode(state) {
        const transcript = state.audioTranscript.toLowerCase();
        
        const systemPrompt = `Analyze this speech transcript and determine the user's intent.
        
        Possible intents:
        - meal: User wants to log food/meal ("I ate...", "had lunch", "just finished...")
        - activity: User wants to log exercise/activity ("I worked out", "went for a walk", "did yoga...")
        - weight: User wants to log weight ("I weigh...", "my weight is...", "I'm now...")
        - unclear: Intent is ambiguous or unclear
        
        Transcript: "${state.audioTranscript}"
        
        Return just the intent type as a single word.`;

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(state.audioTranscript)
        ];

        const response = await this.llm.invoke(messages);
        const intentType = response.content.toLowerCase().trim();

        return {
            ...state,
            intentType: ['meal', 'activity', 'weight'].includes(intentType) ? intentType : 'unclear'
        };
    }

    routeByIntent(state) {
        return state.intentType;
    }

    async extractMealDataNode(state) {
        const systemPrompt = `Extract meal information from this speech transcript.
        
        Extract and structure:
        - Food items mentioned
        - Quantities/portions if specified
        - Meal timing (breakfast, lunch, dinner, snack, or estimate from context)
        - Any cooking methods mentioned
        
        Transcript: "${state.audioTranscript}"
        
        Return as JSON:
        {
          "description": "natural description of the meal",
          "foodItems": ["item1", "item2"],
          "mealTime": "breakfast|lunch|dinner|snack|unknown",
          "estimatedTime": "current time or specified time",
          "confidence": "high|medium|low"
        }`;

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(state.audioTranscript)
        ];

        const response = await this.llm.invoke(messages);
        const extractedData = this.parseJSON(response.content, 'meal');

        return {
            ...state,
            extractedData,
            confidence: extractedData.confidence || 'medium'
        };
    }

    async extractActivityDataNode(state) {
        const systemPrompt = `Extract activity/exercise information from this speech transcript.
        
        Extract and structure:
        - Type of activity/exercise
        - Duration if mentioned
        - Intensity level if indicated
        - Location if specified
        
        Transcript: "${state.audioTranscript}"
        
        Return as JSON:
        {
          "description": "natural description of the activity",
          "activityType": "cardio|strength|yoga|walking|other",
          "duration": "duration in minutes or null",
          "intensity": "low|medium|high|unknown",
          "confidence": "high|medium|low"
        }`;

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(state.audioTranscript)
        ];

        const response = await this.llm.invoke(messages);
        const extractedData = this.parseJSON(response.content, 'activity');

        return {
            ...state,
            extractedData,
            confidence: extractedData.confidence || 'medium'
        };
    }

    async extractWeightDataNode(state) {
        const systemPrompt = `Extract weight information from this speech transcript.
        
        Extract and structure:
        - Weight value
        - Unit (lbs, kg, pounds, kilograms)
        - Any context about the measurement
        
        Transcript: "${state.audioTranscript}"
        
        Return as JSON:
        {
          "weight": number,
          "unit": "lbs|kg",
          "context": "any additional context",
          "confidence": "high|medium|low"
        }`;

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(state.audioTranscript)
        ];

        const response = await this.llm.invoke(messages);
        const extractedData = this.parseJSON(response.content, 'weight');

        return {
            ...state,
            extractedData,
            confidence: extractedData.confidence || 'medium'
        };
    }

    async assessCompletenessNode(state) {
        const intentType = state.intentType;
        const extractedData = state.extractedData;
        const confidence = state.confidence;

        let isComplete = true;
        const missingInfo = [];

        // Check completeness based on intent type
        if (intentType === 'meal') {
            if (!extractedData.description || extractedData.description.length < 5) {
                isComplete = false;
                missingInfo.push('meal description');
            }
            if (!extractedData.mealTime || extractedData.mealTime === 'unknown') {
                isComplete = false;
                missingInfo.push('meal timing');
            }
        } else if (intentType === 'activity') {
            if (!extractedData.description) {
                isComplete = false;
                missingInfo.push('activity description');
            }
            if (!extractedData.activityType || extractedData.activityType === 'other') {
                isComplete = false;
                missingInfo.push('activity type');
            }
        } else if (intentType === 'weight') {
            if (!extractedData.weight || extractedData.weight <= 0) {
                isComplete = false;
                missingInfo.push('weight value');
            }
            if (!extractedData.unit) {
                isComplete = false;
                missingInfo.push('weight unit');
            }
        }

        // Consider confidence level
        if (confidence === 'low') {
            isComplete = false;
            missingInfo.push('clarity');
        }

        return {
            ...state,
            isComplete,
            missingInfo
        };
    }

    shouldClarify(state) {
        return state.isComplete ? 'finalize' : 'clarify';
    }

    async generateClarificationNode(state) {
        const intentType = state.intentType;
        const missingInfo = state.missingInfo || [];
        
        let clarificationMessage = '';

        if (intentType === 'unclear') {
            clarificationMessage = "I couldn't quite understand what you wanted to log. Could you tell me if you want to log a meal, activity, or weight?";
        } else if (missingInfo.length > 0) {
            if (intentType === 'meal') {
                clarificationMessage = `I got that you had a meal! Could you tell me more details like what you ate and when?`;
            } else if (intentType === 'activity') {
                clarificationMessage = `Great that you were active! Could you tell me more about what type of exercise and for how long?`;
            } else if (intentType === 'weight') {
                clarificationMessage = `I heard you want to log your weight. Could you tell me the number and whether it's in pounds or kilograms?`;
            }
        } else {
            clarificationMessage = `I want to make sure I understood correctly. Could you repeat that or add more details?`;
        }

        return {
            ...state,
            needsClarification: true,
            clarificationMessage,
            isComplete: false
        };
    }

    async finalizeDataNode(state) {
        // Add timestamp and finalize the data
        const finalData = {
            ...state.extractedData,
            timestamp: new Date(),
            source: 'speech_input',
            intentType: state.intentType
        };

        return {
            ...state,
            extractedData: finalData,
            isComplete: true,
            needsClarification: false
        };
    }

    // Helper methods
    parseJSON(responseText, type) {
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('❌ Error parsing JSON from LLM response:', error);
        }

        // Fallback defaults based on type
        const defaults = {
            meal: { description: '', foodItems: [], mealTime: 'unknown', confidence: 'low' },
            activity: { description: '', activityType: 'other', confidence: 'low' },
            weight: { weight: 0, unit: 'lbs', confidence: 'low' }
        };

        return defaults[type] || {};
    }

    async saveDataToFirebase(result) {
        const { intentType, extractedData, userContext } = result;
        const userId = userContext.userId;

        try {
            if (intentType === 'meal') {
                await this.firebaseTools.logMeal(userId, {
                    description: extractedData.description,
                    mealTime: extractedData.mealTime,
                    timestamp: extractedData.timestamp,
                    source: 'speech_workflow'
                });
            } else if (intentType === 'activity') {
                await this.firebaseTools.logActivity(userId, {
                    description: extractedData.description,
                    activityType: extractedData.activityType,
                    duration: extractedData.duration,
                    intensity: extractedData.intensity,
                    timestamp: extractedData.timestamp,
                    source: 'speech_workflow'
                });
            } else if (intentType === 'weight') {
                await this.firebaseTools.logWeight(userId, {
                    weight: extractedData.weight,
                    unit: extractedData.unit,
                    timestamp: extractedData.timestamp,
                    source: 'speech_workflow'
                });
            }

            console.log(`✅ ${intentType} data saved to Firebase via speech workflow`);
        } catch (error) {
            console.error(`❌ Error saving ${intentType} data in speech workflow:`, error);
        }
    }
}

module.exports = SpeechWorkflow; 