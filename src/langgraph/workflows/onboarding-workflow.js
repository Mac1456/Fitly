const { StateGraph, END } = require('@langchain/langgraph');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

/**
 * Enhanced Onboarding Workflow using LangGraph
 * Provides structured conversational onboarding with memory and context
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
        
        // Extract information from the current message and merge with existing
        if (userMessage) {
            const extractedData = {};
            this.extractAllInfo(userMessage.toLowerCase(), extractedData);
            
            // Merge extracted data with preserved data (but protect important fields like name)
            Object.keys(extractedData).forEach(key => {
                if (extractedData[key] !== undefined && extractedData[key] !== null) {
                    // Special handling for name - don't overwrite a good name with bad extraction
                    if (key === 'name') {
                        const existingName = userData.name;
                        const newName = extractedData[key];
                        const invalidNames = ['lose', 'mostly', 'are', 'want', 'have', 'inactive', 'sedentary', 'currently', 'weight'];
                        
                        if (!existingName || invalidNames.includes(existingName.toLowerCase())) {
                            if (!invalidNames.includes(newName.toLowerCase())) {
                                userData[key] = newName;
                                console.log(`🔄 Updated ${key}:`, newName);
                            } else {
                                console.log(`⚠️ Rejected invalid name extraction: "${newName}", keeping: "${existingName}"`);
                            }
                        } else {
                            console.log(`🔒 Preserving existing name: "${existingName}", ignoring: "${newName}"`);
                        }
                    } else {
                        userData[key] = extractedData[key];
                        console.log(`🔄 Updated ${key}:`, extractedData[key]);
                    }
                }
            });
        }
        
        console.log('🔍 After extraction, userData:', userData);
        console.log('🔍 Current step:', currentStep);
        
        // Generate appropriate response based on step and collected data
        let response;
        let isComplete = false;
        let nextStep = currentStep;
        
        try {
            // Check completion status
            const requiredFields = ['name', 'age', 'currentWeight', 'height', 'gender', 'primaryGoal', 'activityLevel'];
            const collectedFields = requiredFields.filter(field => {
                if (field === 'currentWeight') {
                    // Check both currentWeight and weight fields
                    return (userData.currentWeight !== undefined && userData.currentWeight !== null) || 
                           (userData.weight !== undefined && userData.weight !== null);
                }
                return userData[field] !== undefined && userData[field] !== null;
            });
            
            console.log('🔍 Required fields:', requiredFields);
            console.log('🔍 Collected fields:', collectedFields);
            console.log('🔍 Weight check - currentWeight:', userData.currentWeight, 'weight:', userData.weight);
            
            if (collectedFields.length >= requiredFields.length) {
                isComplete = true;
                response = await this.generateCompletionMessage(userData);
                
                // Ensure currentWeight is properly set for the final profile
                if (userData.weight && !userData.currentWeight) {
                    userData.currentWeight = userData.weight;
                    console.log('🔧 Fixed currentWeight for completion:', userData.currentWeight);
                }
            } else {
                // Generate next question based on missing info
                response = await this.generateNextQuestion(userData, userMessage, currentStep);
                nextStep = currentStep + 1;
            }
            
            console.log('🔍 Onboarding response generated:', {
                message: response,
                isComplete,
                nextStep,
                collectedFields: collectedFields.length
            });
            
            return {
                message: response,
                userData: userData,
                isComplete: isComplete,
                complete: isComplete, // For compatibility
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

    async greetingNode(state) {
        const systemPrompt = `You are Fitly's friendly wellness coach helping with onboarding. 
        Be warm, encouraging, and brief. Your goal is to make the user feel comfortable.
        
        If this is the start of onboarding, introduce yourself and explain what you'll do together.
        If continuing, acknowledge what you already know and move to the next step.`;

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
        const userData = state.userData;
        const missingInfo = [];
        
        // Check what basic info we still need
        if (!userData.name) missingInfo.push('name');
        if (!userData.age) missingInfo.push('age');
        if (!userData.gender) missingInfo.push('gender');
        if (!userData.currentWeight) missingInfo.push('current weight');
        if (!userData.height) missingInfo.push('height');

        if (missingInfo.length === 0) {
            return {
                ...state,
                currentStep: 'collect_goals'
            };
        }

        const systemPrompt = `You are collecting basic profile information. You still need: ${missingInfo.join(', ')}.
        
        Ask for 1-2 pieces of information at a time in a conversational way. Be encouraging about their fitness journey.
        
        Parse any provided information and respond conversationally while acknowledging what you received.
        
        Current user data: ${JSON.stringify(userData)}`;

        const messages = [
            new SystemMessage(systemPrompt),
            ...state.messages
        ];

        const response = await this.llm.invoke(messages);
        
        // Extract information from the user's message
        const lastUserMessage = state.messages[state.messages.length - 1].content.toLowerCase();
        const updatedUserData = { ...userData };

        // Simple extraction patterns (can be enhanced with more sophisticated NLP)
        this.extractBasicInfo(lastUserMessage, updatedUserData);

        return {
            ...state,
            messages: [...state.messages, response],
            userData: updatedUserData,
            currentStep: Object.keys(updatedUserData).length >= 5 ? 'collect_goals' : 'collect_basic_info'
        };
    }

    async collectGoalsNode(state) {
        const userData = state.userData;
        
        if (!userData.primaryGoal || !userData.goalWeight) {
            const systemPrompt = `Now let's talk about goals! You're collecting: primary goal and goal weight (if applicable).
            
            Ask about their main fitness goal (lose fat, build muscle, maintain, general health, just tracking).
            Also ask about goal weight if relevant to their primary goal.
            
            Be supportive and mention that Fitly is designed for flexible, non-judgmental tracking.
            
            Current user data: ${JSON.stringify(userData)}`;

            const messages = [
                new SystemMessage(systemPrompt),
                ...state.messages
            ];

            const response = await this.llm.invoke(messages);
            
            // Extract goal information
            const lastUserMessage = state.messages[state.messages.length - 1].content.toLowerCase();
            const updatedUserData = { ...userData };
            this.extractGoalInfo(lastUserMessage, updatedUserData);

            return {
                ...state,
                messages: [...state.messages, response],
                userData: updatedUserData,
                currentStep: updatedUserData.primaryGoal ? 'collect_activity' : 'collect_goals'
            };
        }

        return {
            ...state,
            currentStep: 'collect_activity'
        };
    }

    async collectActivityNode(state) {
        const userData = state.userData;
        
        if (!userData.activityLevel || !userData.workoutFrequency) {
            const systemPrompt = `Let's understand their activity level and workout habits.
            
            Ask about:
            - General activity level (sedentary, lightly active, moderately active, very active, inconsistent)
            - How often they currently work out
            
            Be especially supportive if they mention being inconsistent - that's exactly who Fitly is designed for!
            
            Current user data: ${JSON.stringify(userData)}`;

            const messages = [
                new SystemMessage(systemPrompt),
                ...state.messages
            ];

            const response = await this.llm.invoke(messages);
            
            const lastUserMessage = state.messages[state.messages.length - 1].content.toLowerCase();
            const updatedUserData = { ...userData };
            this.extractActivityInfo(lastUserMessage, updatedUserData);

            return {
                ...state,
                messages: [...state.messages, response],
                userData: updatedUserData,
                currentStep: updatedUserData.activityLevel ? 'collect_preferences' : 'collect_activity'
            };
        }

        return {
            ...state,
            currentStep: 'collect_preferences'
        };
    }

    async collectPreferencesNode(state) {
        const userData = state.userData;
        
        if (!userData.dietaryPreferences) {
            const systemPrompt = `Finally, let's understand any dietary preferences or restrictions.
            
            Ask about dietary preferences, allergies, or restrictions they want to track.
            Keep it optional and flexible.
            
            Current user data: ${JSON.stringify(userData)}`;

            const messages = [
                new SystemMessage(systemPrompt),
                ...state.messages
            ];

            const response = await this.llm.invoke(messages);
            
            const lastUserMessage = state.messages[state.messages.length - 1].content.toLowerCase();
            const updatedUserData = { ...userData };
            this.extractPreferences(lastUserMessage, updatedUserData);

            return {
                ...state,
                messages: [...state.messages, response],
                userData: updatedUserData,
                currentStep: 'review_and_confirm'
            };
        }

        return {
            ...state,
            currentStep: 'review_and_confirm'
        };
    }

    async reviewConfirmNode(state) {
        const userData = state.userData;
        
        const systemPrompt = `Review the collected information with the user and ask for confirmation.
        
        Summarize their profile in a friendly way:
        - Name, age, current stats
        - Their goal and target
        - Activity level and workout frequency
        - Any dietary preferences
        
        Ask if this looks good or if they want to change anything.
        End with excitement about starting their Fitly journey!
        
        User data: ${JSON.stringify(userData)}`;

        const messages = [
            new SystemMessage(systemPrompt),
            ...state.messages
        ];

        const response = await this.llm.invoke(messages);
        
        // Check if user confirmed
        const lastUserMessage = state.messages[state.messages.length - 1].content.toLowerCase();
        const isConfirmed = lastUserMessage.includes('yes') || 
                           lastUserMessage.includes('correct') || 
                           lastUserMessage.includes('good') ||
                           lastUserMessage.includes('looks good');

        return {
            ...state,
            messages: [...state.messages, response],
            isComplete: isConfirmed,
            currentStep: isConfirmed ? 'save_profile' : 'review_and_confirm'
        };
    }

    async saveProfileNode(state) {
        const userData = state.userData;
        const userId = state.userId;

        if (this.firebaseTools && userId) {
            try {
                await this.firebaseTools.saveUserProfile(userId, {
                    ...userData,
                    onboardingCompleted: true,
                    onboardingDate: new Date(),
                    onboardingMethod: 'langgraph_conversation'
                });
                
                console.log('✅ User profile saved via LangGraph workflow');
            } catch (error) {
                console.error('❌ Error saving profile in workflow:', error);
            }
        }

        const completionMessage = `Perfect! Your profile is all set up. Welcome to Fitly! 🎉
        
I'm excited to be your wellness companion. Remember, Fitly is designed to be flexible and non-judgmental - perfect for your ${userData.activityLevel || 'active'} lifestyle.

Let's start tracking your wellness journey together!`;

        return {
            ...state,
            messages: [...state.messages, { content: completionMessage }],
            isComplete: true
        };
    }

    // New helper methods for step-based conversation
    extractAllInfo(message, userData) {
        // Extract all types of information from the message
        this.extractBasicInfo(message, userData);
        this.extractGoalInfo(message, userData);
        this.extractActivityInfo(message, userData);
        this.extractPreferences(message, userData);
    }

    async generateNextQuestion(userData, userMessage, currentStep) {
        // Determine what information we still need
        const missing = [];
        if (!userData.name) missing.push('name');
        if (!userData.age) missing.push('age');
        if (!userData.currentWeight && !userData.weight) missing.push('current weight');
        if (!userData.height) missing.push('height');
        if (!userData.gender) missing.push('gender');
        if (!userData.primaryGoal) missing.push('fitness goal');
        if (!userData.activityLevel) missing.push('activity level');

        console.log('🔍 Missing information:', missing);
        console.log('🔍 Current userData:', userData);

        const systemPrompt = `You are Fitly's friendly wellness coach. You're having a natural conversation to help set up their profile.

${userMessage ? `The user just said: "${userMessage}"` : 'Starting the conversation.'}

Current collected info: ${JSON.stringify(userData)}
Still needed: ${missing.join(', ')}

Guidelines:
- Be warm, encouraging, and conversational
- Ask for 1-2 pieces of missing information at a time
- If they've provided info, acknowledge it warmly before asking the next question
- If their response is unclear or ambiguous, ask for clarification in a friendly way
- For goals, help them choose from: lose fat, build muscle, maintain weight, general health, just tracking
- For activity levels, help them choose from: sedentary, lightly active, moderately active, very active, inconsistent
- Be especially supportive about inconsistent fitness habits
- Use emojis occasionally but not excessively
- Keep responses concise (2-3 sentences max)
- If they give incomplete answers, ask follow-up questions to get clarity

Special handling:
- If they say "lose weight" clarify if they mean "lose fat" 
- If they're vague about activity, ask specific questions about their daily routine
- If they give contradictory info, politely ask for clarification

${missing.length === 0 ? 'All information collected! Provide a completion message.' : `Focus on asking for: ${missing[0]}${missing[1] ? ` and ${missing[1]}` : ''}`}`;

        try {
            const messages = [
                new SystemMessage(systemPrompt),
                new HumanMessage(userMessage || "Hi")
            ];

            const response = await this.llm.invoke(messages);
            return response.content;
        } catch (error) {
            console.error('❌ Error generating question:', error);
            // Fallback questions based on what's missing
            if (!userData.name) {
                return "Hi there! I'm excited to help you get started with Fitly. What's your name? 😊";
            } else if (!userData.age) {
                return `Nice to meet you, ${userData.name}! How old are you?`;
            } else if (!userData.currentWeight && !userData.weight) {
                return "What's your current weight? You can use pounds or kilograms, whatever you prefer!";
            } else if (!userData.height) {
                return "And how tall are you?";
            } else if (!userData.gender) {
                return "Are you male or female? This helps me provide better recommendations.";
            } else if (!userData.primaryGoal) {
                return "What's your main fitness goal? Are you looking to lose fat, build muscle, maintain your current weight, or just track your wellness journey?";
            } else if (!userData.activityLevel) {
                return "How would you describe your activity level? Sedentary, lightly active, moderately active, very active, or maybe inconsistent? (No judgment - Fitly is perfect for all activity levels!)";
            }
            return "Let's continue setting up your profile! What would you like to tell me about your wellness goals?";
        }
    }

    async generateCompletionMessage(userData) {
        const systemPrompt = `Generate an enthusiastic completion message for the user's completed Fitly profile.

User profile: ${JSON.stringify(userData)}

Create a warm, encouraging message that:
- Celebrates completing the setup
- Briefly summarizes their key info (name, goal, activity level)
- Expresses excitement about their wellness journey
- Mentions Fitly's flexible, non-judgmental approach
- Ends with encouragement to start tracking

Keep it conversational and enthusiastic (2-3 sentences). Use appropriate emojis.`;

        try {
            const messages = [
                new SystemMessage(systemPrompt),
                new HumanMessage("Profile complete!")
            ];

            const response = await this.llm.invoke(messages);
            return response.content;
        } catch (error) {
            console.error('❌ Error generating completion message:', error);
            return `Perfect, ${userData.name || 'there'}! Your profile is all set up. I'm excited to be your wellness companion on your ${userData.primaryGoal || 'fitness'} journey! 🎉\n\nRemember, Fitly is designed to be flexible and supportive - perfect for your ${userData.activityLevel || 'active'} lifestyle. Let's start tracking your progress together!`;
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
        
        return {
            userName: userData.name,
            age: userData.age,
            currentWeight: currentWeight,
            weightUnit: userData.weightUnit || 'lbs',
            height: userData.height,
            heightUnit: userData.heightUnit || 'ft',
            gender: userData.gender,
            primaryGoal: userData.primaryGoal,
            goalWeight: userData.goalWeight,
            activityLevel: userData.activityLevel,
            workoutFrequency: userData.workoutFrequency,
            dietaryPreferences: userData.dietaryPreferences || [],
            onboardingCompleted: true,
            onboardingDate: new Date().toISOString(),
            onboardingMethod: 'langgraph_enhanced'
        };
    }

    // Helper methods for information extraction
    extractBasicInfo(message, userData) {
        // Name extraction - only extract if we don't already have a valid name
        if (!userData.name || ['lose', 'mostly', 'are', 'currently', 'weight'].includes(userData.name.toLowerCase())) {
            const nameMatch = message.match(/(?:name is|i'm|i am|call me)\s+([a-zA-Z]+)/i) ||
                             message.match(/^(?:hi,?\s*)?(?:my name is|i'm|i am)\s+([a-zA-Z]+)/i);
            
            if (nameMatch) {
                const name = nameMatch[1];
                // Avoid extracting common words as names
                const invalidNames = ['currently', 'weight', 'pounds', 'years', 'old', 'male', 'female', 'very', 'not', 'lose', 'mostly', 'are', 'want', 'have', 'inactive', 'sedentary'];
                if (!invalidNames.includes(name.toLowerCase())) {
                    userData.name = name;
                }
            }
        }

        // Age extraction
        const ageMatch = message.match(/(?:age is|i'm|i am)\s+(\d+)/i) || 
                        message.match(/(\d+)\s+years?\s+old/i) ||
                        message.match(/age\s*:?\s*(\d+)/i);
        if (ageMatch) userData.age = parseInt(ageMatch[1]);

        // Weight extraction - improved to handle "currently X pounds"
        const weightMatch = message.match(/(?:currently|weigh|weight is|i am)\s*(\d+)\s*(lbs?|pounds?|kg|kilograms?)/i) ||
                           message.match(/(\d+)\s*(lbs?|pounds?|kg|kilograms?)/i);
        if (weightMatch) {
            userData.currentWeight = parseInt(weightMatch[1]);
            userData.weightUnit = weightMatch[2].toLowerCase().includes('kg') ? 'kg' : 'lbs';
            // Also set the legacy weight field for compatibility
            userData.weight = parseInt(weightMatch[1]);
        }

        // Height extraction - improved patterns
        const heightMatch = message.match(/(\d+)'(\d+)"|(\d+)\s*feet?\s*(\d+)\s*inch/i) || 
                           message.match(/(\d+)\s*ft\s*(\d+)\s*in/i) ||
                           message.match(/(\d+)\s*(cm|centimeters?|inches?)/i) ||
                           message.match(/height is\s*(\d+)'(\d+)"/i);
        if (heightMatch) {
            if (heightMatch[1] && heightMatch[2]) {
                const feet = parseInt(heightMatch[1]);
                const inches = parseInt(heightMatch[2]);
                userData.height = feet + (inches / 12); // Convert to decimal feet
                userData.heightUnit = 'ft';
            } else if (heightMatch[1] && heightMatch[3]) {
                userData.height = parseInt(heightMatch[1]);
                userData.heightUnit = heightMatch[3].toLowerCase().includes('cm') ? 'cm' : 'in';
            }
        }

        // Gender extraction - improved patterns
        if (message.match(/\bi am\s+(?:a\s+)?male/i) || message.match(/\bmale\b/i)) userData.gender = 'male';
        if (message.match(/\bi am\s+(?:a\s+)?female/i) || message.match(/\bfemale\b/i)) userData.gender = 'female';
        if (message.match(/\bi am\s+(?:a\s+)?(?:man|guy|boy)/i)) userData.gender = 'male';
        if (message.match(/\bi am\s+(?:a\s+)?(?:woman|girl|lady)/i)) userData.gender = 'female';
    }

    extractGoalInfo(message, userData) {
        // Enhanced goal extraction with better pattern matching
        if (message.includes('lose') && (message.includes('fat') || message.includes('weight'))) {
            userData.primaryGoal = 'lose fat';
        } else if (message.includes('cut') || message.includes('slim down') || message.includes('get lean')) {
            userData.primaryGoal = 'lose fat';
        } else if (message.includes('muscle') || message.includes('gain') || message.includes('build') || message.includes('bulk')) {
            userData.primaryGoal = 'build muscle';
        } else if (message.includes('tone') || message.includes('strengthen')) {
            userData.primaryGoal = 'build muscle';
        } else if (message.includes('maintain') || message.includes('stay')) {
            userData.primaryGoal = 'maintain';
        } else if (message.includes('health') || message.includes('general') || message.includes('wellness')) {
            userData.primaryGoal = 'general health';
        } else if (message.includes('track') || message.includes('monitor') || message.includes('log')) {
            userData.primaryGoal = 'just tracking';
        }

        const goalWeightMatch = message.match(/(?:goal|target)\s*(?:weight|is)\s*(\d+)\s*(lbs?|kg)/i) ||
                               message.match(/(\d+)\s*(lbs?|kg)\s*(?:goal|target)/i);
        if (goalWeightMatch) {
            userData.goalWeight = parseInt(goalWeightMatch[1]);
        }
    }

    extractActivityInfo(message, userData) {
        // Be more careful about negative statements
        if (message.includes('not very active') || message.includes('not active') || message.includes('inactive')) {
            userData.activityLevel = 'sedentary';
        } else if (message.includes('sedentary') || message.includes('desk job')) {
            userData.activityLevel = 'sedentary';
        } else if (message.includes('lightly active') || message.includes('light')) {
            userData.activityLevel = 'lightly active';
        } else if (message.includes('moderately active') || message.includes('moderate')) {
            userData.activityLevel = 'moderately active';
        } else if (message.includes('very active')) {
            userData.activityLevel = 'very active';
        } else if (message.includes('inconsistent') || message.includes('sporadic')) {
            userData.activityLevel = 'inconsistent';
        }

        const frequencyMatch = message.match(/(\d+)\s*times?\s*(?:per|a)\s*week/i);
        if (frequencyMatch) {
            userData.workoutFrequency = `${frequencyMatch[1]} times per week`;
        }
    }

    extractPreferences(message, userData) {
        const preferences = [];
        if (message.includes('vegetarian')) preferences.push('vegetarian');
        if (message.includes('vegan')) preferences.push('vegan');
        if (message.includes('keto')) preferences.push('keto');
        if (message.includes('paleo')) preferences.push('paleo');
        if (message.includes('gluten free')) preferences.push('gluten-free');
        if (message.includes('dairy free')) preferences.push('dairy-free');
        
        if (preferences.length > 0) {
            userData.dietaryPreferences = preferences;
        } else if (message.includes('none') || message.includes('no restrictions')) {
            userData.dietaryPreferences = ['none'];
        }
    }
}

module.exports = OnboardingWorkflow; 