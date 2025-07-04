const { StateGraph, END } = require('@langchain/langgraph');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

/**
 * Enhanced Onboarding Workflow using LangGraph
 * Provides structured conversational onboarding with AI-powered interpretation
 */
class OnboardingWorkflow {
    constructor(llm, firebaseTools) {
        this.llm = llm;
        this.firebaseTools = firebaseTools;
        this.graph = null;
        this.setupGraph();
    }

    setupGraph() {
        // Define the workflow state
        const workflow = new StateGraph({
            channels: {
                messages: {
                    value: (x, y) => x.concat(y),
                    default: () => []
                },
                userData: {
                    value: (x, y) => ({ ...x, ...y }),
                    default: () => ({})
                },
                currentStep: {
                    value: (x, y) => y,
                    default: () => 'greeting'
                },
                isComplete: {
                    value: (x, y) => y,
                    default: () => false
                },
                needsFollowUp: {
                    value: (x, y) => y,
                    default: () => false
                }
            }
        });

        // Add nodes
        workflow.addNode('greeting', this.greetingNode.bind(this));
        workflow.addNode('collect_basic_info', this.collectBasicInfoNode.bind(this));
        workflow.addNode('collect_goals', this.collectGoalsNode.bind(this));
        workflow.addNode('collect_activity', this.collectActivityNode.bind(this));
        workflow.addNode('collect_preferences', this.collectPreferencesNode.bind(this));
        workflow.addNode('review_and_confirm', this.reviewConfirmNode.bind(this));
        workflow.addNode('save_profile', this.saveProfileNode.bind(this));

        // Define edges
        workflow.addEdge('greeting', 'collect_basic_info');
        workflow.addEdge('collect_basic_info', 'collect_goals');
        workflow.addEdge('collect_goals', 'collect_activity');
        workflow.addEdge('collect_activity', 'collect_preferences');
        workflow.addEdge('collect_preferences', 'review_and_confirm');
        workflow.addEdge('review_and_confirm', 'save_profile');
        workflow.addEdge('save_profile', END);

        // Set entry point
        workflow.setEntryPoint('greeting');

        this.graph = workflow.compile();
    }

    async execute(input, context) {
        console.log('🔍 Onboarding workflow input:', input);
        
        // Start with existing data and preserve it properly
        const userData = { ...(input.existingData || {}) };
        const currentStep = input.currentStep || input.step || 1;
        const userMessage = input.message || "";
        
        console.log('🔍 Starting with preserved userData:', userData);
        console.log('🔍 User said:', `"${userMessage}"`);
        
        // Use AI to interpret the user's message instead of regex
        if (userMessage.trim()) {
            try {
                const aiInterpretation = await this.interpretUserMessage(userMessage, userData);
                console.log('🤖 AI interpretation result:', aiInterpretation);
                
                // Merge AI-interpreted data with existing data, but preserve existing good data
                Object.keys(aiInterpretation).forEach(key => {
                    if (aiInterpretation[key] !== undefined && aiInterpretation[key] !== null) {
                        // Special handling to avoid overwriting existing good data
                        if (key === 'age' && userData.age && userData.age !== aiInterpretation[key]) {
                            console.log(`🔒 Preserving existing age: ${userData.age}, ignoring: ${aiInterpretation[key]}`);
                        } else if (key === 'name' && userData.name && userData.name !== aiInterpretation[key]) {
                            console.log(`🔒 Preserving existing name: ${userData.name}, ignoring: ${aiInterpretation[key]}`);
                        } else {
                            userData[key] = aiInterpretation[key];
                            console.log(`🔄 Updated ${key}:`, aiInterpretation[key]);
                        }
                    }
                });
            } catch (error) {
                console.error('❌ Error in AI interpretation:', error);
                // Fallback to basic extraction if AI fails, but only add new data
                const extractedData = {};
                this.extractBasicInfo(userMessage.toLowerCase(), extractedData);
                Object.keys(extractedData).forEach(key => {
                    if (!userData[key] && extractedData[key]) {
                        userData[key] = extractedData[key];
                        console.log(`🔄 Fallback extracted ${key}:`, extractedData[key]);
                    }
                });
            }
        }
        
        console.log('🔍 After AI interpretation, userData:', userData);
        console.log('🔍 Current step:', currentStep);
        
        // Generate appropriate response based on step and collected data
        let response;
        let isComplete = false;
        let nextStep = currentStep;
        
        try {
            // Check completion status - ALL fields must be present
            const requiredFields = ['name', 'age', 'currentWeight', 'gender', 'primaryGoal', 'activityLevel'];
            const missingFields = [];
            
            // Check each required field with strict validation
            requiredFields.forEach(field => {
                if (field === 'currentWeight') {
                    if (!userData.currentWeight && !userData.weight) {
                        missingFields.push(field);
                    }
                } else {
                    const value = userData[field];
                    if (value === null || value === undefined || value === '' || value === 'undefined') {
                        missingFields.push(field);
                        console.log(`🔍 Missing field detected: ${field} (value: ${value})`);
                    }
                }
            });
            
            // Check height separately (can be either imperial or metric)
            if (!userData.heightFeet && !userData.heightCm) {
                missingFields.push('height');
            }
            
            console.log('🔍 Required fields:', requiredFields);
            console.log('🔍 Missing fields:', missingFields);
            console.log('🔍 Current userData:', userData);
            
            if (missingFields.length === 0) {
                isComplete = true;
                response = await this.generateCompletionMessage(userData);
                
                // Ensure currentWeight is properly set for the final profile
                if (userData.weight && !userData.currentWeight) {
                    userData.currentWeight = userData.weight;
                    console.log('🔧 Fixed currentWeight for completion:', userData.currentWeight);
                }
            } else {
                // Generate next question for ONE missing piece of information
                response = await this.generateSingleAttributeQuestion(userData, userMessage);
                nextStep = currentStep + 1;
            }
            
            console.log('🔍 Onboarding response generated:', {
                message: response,
                isComplete,
                nextStep,
                missingFields: missingFields.length,
                collectedFields: requiredFields.length - missingFields.length
            });
            
            return {
                message: response,
                userData: userData,
                isComplete: isComplete,
                complete: isComplete,
                profileData: isComplete ? this.formatProfileData(userData) : null,
                nextStep: nextStep
            };
        } catch (error) {
            console.error('❌ Onboarding workflow error:', error);
            return {
                message: "I'm having trouble with the onboarding process. Let's try the quick form instead!",
                error: true
            };
        }
    }

    /**
     * Use AI to interpret user messages instead of regex patterns
     */
    async interpretUserMessage(message, existingData) {
        const systemPrompt = `You are a data extraction expert. Analyze the user's message and extract fitness profile information.

Current user data: ${JSON.stringify(existingData)}
User message: "${message}"

Extract any of the following information from the user's message:
- name: Their name (string)
- age: Their age (number)
- currentWeight: Current weight (number)
- weightUnit: Weight unit (string: "lbs" or "kg")
- heightFeet: Height in feet (number, for imperial)
- heightInches: Height in inches (number, for imperial)
- heightCm: Height in centimeters (number, for metric)
- heightUnit: Height unit (string: "imperial" or "metric")
- gender: Gender (string: "male" or "female")
- primaryGoal: Fitness goal (string: "lose fat", "build muscle", "maintain", "general health", "just tracking")
- activityLevel: Activity level (string: "sedentary", "lightly active", "moderately active", "very active", "inconsistent")
- goalWeight: Goal weight (number, optional)
- workoutFrequency: How often they work out (string, optional)

CRITICAL RULES:
1. DO NOT extract age from height measurements (e.g., "6 foot 1 inch" contains no age information)
2. DO NOT extract names from common words (avoid: lose, weight, pounds, years, old, male, female)
3. Only extract information that is EXPLICITLY stated in the message
4. For "6 foot 1 inch" extract: heightFeet=6, heightInches=1, heightUnit="imperial"
5. For "lose weight" or "lose fat" extract: primaryGoal="lose fat"
6. For activity levels, look for these specific terms and variations:
   - "sedentary", "sitting", "desk job", "not active" → activityLevel="sedentary"
   - "lightly active", "light", "walk sometimes" → activityLevel="lightly active"
   - "moderately active", "moderate", "exercise sometimes" → activityLevel="moderately active"
   - "very active", "active", "workout regularly" → activityLevel="very active"
   - "inconsistent", "on and off", "sometimes", "irregular" → activityLevel="inconsistent"
7. If user says "inconsistent" about exercise, extract: activityLevel="inconsistent"
8. Weight units: default to "lbs" if not specified, "kg" if explicitly mentioned

Examples:
- "I am 6 foot 1 inch, male" → {"heightFeet": 6, "heightInches": 1, "heightUnit": "imperial", "gender": "male"}
- "I want to lose fat" → {"primaryGoal": "lose fat"}
- "I am inconsistent with exercise" → {"activityLevel": "inconsistent"}
- "sedentary" → {"activityLevel": "sedentary"}
- "I work out regularly" → {"activityLevel": "very active"}
- "lightly active" → {"activityLevel": "lightly active"}
- "My name is John" → {"name": "John"}
- "I am 25 years old" → {"age": 25}

Return ONLY a valid JSON object. If no information can be extracted, return {}.`;

        try {
            const messages = [
                new SystemMessage(systemPrompt),
                new HumanMessage(message)
            ];

            const response = await this.llm.invoke(messages);
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return {};
        } catch (error) {
            console.error('❌ Error in AI interpretation:', error);
            return {};
        }
    }

    /**
     * Generate a question for ONE missing attribute at a time
     */
    async generateSingleAttributeQuestion(userData, userMessage) {
        // Determine what single piece of information we need next
        const missingInfo = this.getMissingInformation(userData);
        
        if (missingInfo.length === 0) {
            return await this.generateCompletionMessage(userData);
        }
        
        // Get the next single attribute to ask about
        const nextAttribute = missingInfo[0];
        
        const systemPrompt = `You are Fitly's friendly wellness coach. You need to ask for ONE specific piece of information.

Current user data: ${JSON.stringify(userData)}
User's previous message: "${userMessage}"
Next information needed: ${nextAttribute}

Generate a warm, encouraging question that asks for ONLY the ${nextAttribute}. 

Guidelines:
- Ask for only ONE piece of information
- If they just provided information, acknowledge it warmly first
- Be conversational and encouraging
- Keep it brief (1-2 sentences)
- Use appropriate emojis occasionally
- If asking for activity level, mention that inconsistent is perfectly fine
- If asking for goals, provide clear options

For each attribute, ask specifically:
- name: "What should I call you?"
- age: "How old are you?"
- currentWeight: "What's your current weight?"
- height: "How tall are you?"
- gender: "Are you male or female?"
- primaryGoal: "What's your main fitness goal? Are you looking to lose fat, build muscle, maintain your current weight, focus on general health, or just track your wellness?"
- activityLevel: "How would you describe your activity level? Sedentary, lightly active, moderately active, very active, or inconsistent?"`;

        try {
            const messages = [
                new SystemMessage(systemPrompt),
                new HumanMessage(userMessage || "Continue the conversation")
            ];

            const response = await this.llm.invoke(messages);
            return response.content;
        } catch (error) {
            console.error('❌ Error generating question:', error);
            return this.getFallbackQuestion(nextAttribute, userData);
        }
    }

    /**
     * Get the next missing piece of information in logical order
     */
    getMissingInformation(userData) {
        const missing = [];
        
        // Check in logical order with strict validation
        if (!userData.name || userData.name === null || userData.name === undefined) missing.push('name');
        if (!userData.age || userData.age === null || userData.age === undefined) missing.push('age');
        if ((!userData.currentWeight && !userData.weight) || (userData.currentWeight === null && userData.weight === null)) missing.push('currentWeight');
        if ((!userData.heightFeet && !userData.heightCm) || (userData.heightFeet === null && userData.heightCm === null)) missing.push('height');
        if (!userData.gender || userData.gender === null || userData.gender === undefined) missing.push('gender');
        if (!userData.primaryGoal || userData.primaryGoal === null || userData.primaryGoal === undefined) missing.push('primaryGoal');
        if (!userData.activityLevel || userData.activityLevel === null || userData.activityLevel === undefined) missing.push('activityLevel');
        
        console.log('🔍 Checking missing information:', {
            name: userData.name,
            age: userData.age,
            currentWeight: userData.currentWeight,
            weight: userData.weight,
            heightFeet: userData.heightFeet,
            heightCm: userData.heightCm,
            gender: userData.gender,
            primaryGoal: userData.primaryGoal,
            activityLevel: userData.activityLevel,
            missing: missing
        });
        
        return missing;
    }

    /**
     * Fallback questions if AI fails
     */
    getFallbackQuestion(attribute, userData) {
        const name = userData.name || 'there';
        
        switch (attribute) {
            case 'name':
                return "Hi there! I'm excited to help you get started with Fitly. What should I call you? 😊";
            case 'age':
                return `Nice to meet you, ${name}! How old are you?`;
            case 'currentWeight':
                return "What's your current weight? You can use pounds or kilograms, whatever you prefer!";
            case 'height':
                return "How tall are you? You can say something like '5 feet 8 inches' or '170 cm'.";
            case 'gender':
                return "Are you male or female? This helps me provide better recommendations.";
            case 'primaryGoal':
                return "What's your main fitness goal? Are you looking to lose fat, build muscle, maintain your current weight, focus on general health, or just track your wellness?";
            case 'activityLevel':
                return "How would you describe your activity level? Sedentary, lightly active, moderately active, very active, or inconsistent? (No judgment - Fitly is perfect for all activity levels!)";
            default:
                return "Let's continue setting up your profile! What would you like to tell me?";
        }
    }

    async generateCompletionMessage(userData) {
        const systemPrompt = `Generate an enthusiastic completion message for the user's completed Fitly profile.

User profile: ${JSON.stringify(userData)}

Create a warm, encouraging message that:
- Celebrates completing the setup
- Briefly mentions their name and main goal
- Expresses excitement about their wellness journey
- Mentions that they'll now be taken to the main app
- Keeps it concise (2-3 sentences)
- Uses appropriate emojis

Example format: "Great job, [name]! 🎉 You're all set to [goal]. Let's get started with your wellness journey!"`;

        try {
            const messages = [
                new SystemMessage(systemPrompt),
                new HumanMessage("Profile complete!")
            ];

            const response = await this.llm.invoke(messages);
            return response.content;
        } catch (error) {
            console.error('❌ Error generating completion message:', error);
            const name = userData.name || 'there';
            const goal = userData.primaryGoal || 'your wellness journey';
            return `Perfect, ${name}! 🎉 You're all set to ${goal}. Welcome to Fitly - let's start tracking your progress together!`;
        }
    }

    formatProfileData(userData) {
        // Ensure currentWeight is properly set
        const currentWeight = userData.currentWeight || userData.weight;
        console.log('🔧 Formatting profile data - weight mapping:', { 
            currentWeight: userData.currentWeight, 
            weight: userData.weight, 
            final: currentWeight 
        });
        
        // Validate all required fields are present
        const requiredFields = ['name', 'age', 'gender', 'primaryGoal', 'activityLevel'];
        const missingFields = requiredFields.filter(field => !userData[field] || userData[field] === null || userData[field] === undefined);
        
        if (missingFields.length > 0) {
            console.error('❌ Cannot format profile data - missing required fields:', missingFields);
            console.error('❌ Current userData:', userData);
            return null;
        }
        
        if (!currentWeight) {
            console.error('❌ Cannot format profile data - missing weight information');
            return null;
        }
        
        if (!userData.heightFeet && !userData.heightCm) {
            console.error('❌ Cannot format profile data - missing height information');
            return null;
        }
        
        const profileData = {
            userName: userData.name,
            age: userData.age,
            currentWeight: currentWeight,
            weightUnit: userData.weightUnit || 'lbs',
            heightUnit: userData.heightUnit || 'imperial',
            heightFeet: userData.heightFeet || null,
            heightInches: userData.heightInches || null,
            heightCm: userData.heightCm || null,
            gender: userData.gender,
            primaryGoal: userData.primaryGoal,
            activityLevel: userData.activityLevel,
            dietaryPreferences: userData.dietaryPreferences || [],
            onboardingCompleted: true,
            onboardingDate: new Date().toISOString(),
            onboardingMethod: 'langgraph_enhanced_ai'
        };
        
        // Only include optional fields if they have values
        if (userData.goalWeight !== undefined && userData.goalWeight !== null) {
            profileData.goalWeight = userData.goalWeight;
        }
        
        if (userData.workoutFrequency !== undefined && userData.workoutFrequency !== null) {
            profileData.workoutFrequency = userData.workoutFrequency;
        }
        
        console.log('🔧 Formatted profile data (no undefined values):', profileData);
        return profileData;
    }

    // Keep the existing node methods for the graph structure
    async greetingNode(state) {
        const systemPrompt = `You are Fitly's friendly wellness coach. Introduce yourself warmly and ask for their name.`;

        const messages = [
            new SystemMessage(systemPrompt),
            ...state.messages
        ];

        const response = await this.llm.invoke(messages);
        
        return {
            ...state,
            messages: [...state.messages, response],
            currentStep: 'collect_basic_info'
        };
    }

    async collectBasicInfoNode(state) {
        // This would use the new AI interpretation logic
        return state;
    }

    async collectGoalsNode(state) {
        return state;
    }

    async collectActivityNode(state) {
        return state;
    }

    async collectPreferencesNode(state) {
        return state;
    }

    async reviewConfirmNode(state) {
        return state;
    }

    async saveProfileNode(state) {
        return state;
    }

    // Keep basic extraction as fallback
    extractBasicInfo(message, userData) {
        // Simple name extraction
        const nameMatch = message.match(/(?:name is|i'm|i am|call me)\s+([a-zA-Z]+)/i);
        if (nameMatch && !userData.name) {
            const name = nameMatch[1];
            const invalidNames = ['currently', 'weight', 'pounds', 'years', 'old', 'male', 'female', 'lose', 'want'];
            if (!invalidNames.includes(name.toLowerCase())) {
                userData.name = name;
            }
        }

        // Age extraction
        const ageMatch = message.match(/(\d+)\s+years?\s+old/i) || message.match(/age\s*:?\s*(\d+)/i);
        if (ageMatch) userData.age = parseInt(ageMatch[1]);

        // Weight extraction
        const weightMatch = message.match(/(\d+)\s*(lbs?|pounds?|kg|kilograms?)/i);
        if (weightMatch) {
            userData.currentWeight = parseInt(weightMatch[1]);
            userData.weightUnit = weightMatch[2].toLowerCase().includes('kg') ? 'kg' : 'lbs';
            userData.weight = parseInt(weightMatch[1]);
        }

        // Height extraction
        const heightMatch = message.match(/(\d+)\s*(?:feet?|ft|')\s*(\d+)\s*(?:inches?|in|")/i);
        if (heightMatch) {
            userData.heightFeet = parseInt(heightMatch[1]);
            userData.heightInches = parseInt(heightMatch[2]);
            userData.heightUnit = 'imperial';
        }

        // Gender extraction
        if (message.includes('male') && !message.includes('female')) userData.gender = 'male';
        if (message.includes('female')) userData.gender = 'female';
    }
}

module.exports = OnboardingWorkflow; 