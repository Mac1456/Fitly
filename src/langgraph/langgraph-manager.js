const { ChatOpenAI } = require('@langchain/openai');
const { StateGraph, END } = require('@langchain/langgraph');
const { v4: uuidv4 } = require('uuid');

/**
 * LangGraph Manager for Fitly
 * Integrates with existing OpenAI setup and provides workflow orchestration
 */
class LangGraphManager {
    constructor() {
        this.llm = null;
        this.workflows = new Map();
        this.activeConversations = new Map();
        this.initialized = false;
        this.firebaseTools = null;
    }

    /**
     * Initialize LangGraph with OpenAI and Firebase integration
     */
    async initialize(apiKey, firebaseTools = null) {
        if (!apiKey) {
            throw new Error('OpenAI API key required for LangGraph initialization');
        }
        
        try {
            // Initialize ChatOpenAI with existing configuration
            this.llm = new ChatOpenAI({
                openAIApiKey: apiKey,
                modelName: 'gpt-3.5-turbo',
                temperature: 0.7,
                maxTokens: 300
            });

            // Store Firebase tools for workflows
            this.firebaseTools = firebaseTools;

            // Setup workflows
            await this.setupWorkflows();
            
            this.initialized = true;
            console.log('🤖 LangGraph Manager initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ LangGraph initialization failed:', error);
            throw error;
        }
    }

    /**
     * Setup all LangGraph workflows
     */
    async setupWorkflows() {
        console.log('📋 Setting up LangGraph workflows...');
        
        try {
            // Import and setup workflows
            const OnboardingWorkflow = require('./workflows/onboarding-workflow');
            const MealAnalysisWorkflow = require('./workflows/meal-analysis-workflow');
            const SpeechWorkflow = require('./workflows/speech-workflow');
            const CoachingWorkflow = require('./workflows/coaching-workflow');

            // Initialize workflows
            this.workflows.set('onboarding', new OnboardingWorkflow(this.llm, this.firebaseTools));
            this.workflows.set('meal-analysis', new MealAnalysisWorkflow(this.llm, this.firebaseTools));
            this.workflows.set('speech-processing', new SpeechWorkflow(this.llm, this.firebaseTools));
            this.workflows.set('coaching', new CoachingWorkflow(this.llm, this.firebaseTools));

            console.log('✅ All workflows initialized');
        } catch (error) {
            console.error('❌ Error setting up workflows:', error);
            console.log('⚠️ Continuing with partial workflow setup...');
        }
    }

    /**
     * Session management for conversations
     */
    createSession(type = 'general', userId = null) {
        const sessionId = uuidv4();
        const session = {
            id: sessionId,
            type,
            userId,
            history: [],
            state: {},
            metadata: {},
            createdAt: new Date(),
            lastActivity: new Date()
        };

        this.activeConversations.set(sessionId, session);
        console.log(`🗣️ Created new ${type} session: ${sessionId}`);
        
        return sessionId;
    }

    /**
     * Get existing session
     */
    getSession(sessionId) {
        return this.activeConversations.get(sessionId);
    }

    /**
     * Update session activity
     */
    updateSessionActivity(sessionId) {
        const session = this.getSession(sessionId);
        if (session) {
            session.lastActivity = new Date();
        }
    }

    /**
     * Execute a specific workflow
     */
    async executeWorkflow(workflowName, input, sessionId = null, additionalContext = {}) {
        if (!this.initialized) {
            throw new Error('LangGraph Manager not initialized');
        }

        const workflow = this.workflows.get(workflowName);
        if (!workflow) {
            throw new Error(`Workflow '${workflowName}' not found`);
        }

        const session = sessionId ? this.getSession(sessionId) : null;
        
        try {
            // Update session activity
            if (sessionId) {
                this.updateSessionActivity(sessionId);
            }

            // Prepare workflow context
            const context = {
                sessionId,
                session,
                llm: this.llm,
                firebaseTools: this.firebaseTools,
                ...additionalContext
            };

            console.log(`🔄 Executing workflow: ${workflowName}`);
            const result = await workflow.execute(input, context);
            
            // Update session history if applicable
            if (session) {
                session.history.push({
                    timestamp: new Date(),
                    workflow: workflowName,
                    input,
                    output: result,
                    success: true
                });
            }

            console.log(`✅ Workflow ${workflowName} completed successfully`);
            return result;
            
        } catch (error) {
            console.error(`❌ Workflow '${workflowName}' failed:`, error);
            
            // Log error in session if available
            if (session) {
                session.history.push({
                    timestamp: new Date(),
                    workflow: workflowName,
                    input,
                    error: error.message,
                    success: false
                });
            }
            
            throw error;
        }
    }

    /**
     * Get workflow-specific enhanced LLM for complex tasks
     */
    getEnhancedLLM(workflowType) {
        const configs = {
            'onboarding': { temperature: 0.8, maxTokens: 250 },
            'meal-analysis': { temperature: 0.3, maxTokens: 200 },
            'speech-processing': { temperature: 0.4, maxTokens: 150 },
            'coaching': { temperature: 0.7, maxTokens: 300 }
        };

        const config = configs[workflowType] || configs['coaching'];
        
        return new ChatOpenAI({
            openAIApiKey: this.llm.openAIApiKey,
            modelName: 'gpt-3.5-turbo',
            ...config
        });
    }

    /**
     * Clean up old sessions (memory management)
     */
    cleanupSessions(maxAgeHours = 24) {
        const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
        let cleaned = 0;

        for (const [sessionId, session] of this.activeConversations.entries()) {
            if (session.lastActivity < cutoffTime) {
                this.activeConversations.delete(sessionId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} old sessions`);
        }
    }

    /**
     * Get session statistics
     */
    getSessionStats() {
        const sessions = Array.from(this.activeConversations.values());
        const stats = {
            total: sessions.length,
            byType: {},
            averageHistoryLength: 0
        };

        sessions.forEach(session => {
            stats.byType[session.type] = (stats.byType[session.type] || 0) + 1;
            stats.averageHistoryLength += session.history.length;
        });

        if (sessions.length > 0) {
            stats.averageHistoryLength = Math.round(stats.averageHistoryLength / sessions.length);
        }

        return stats;
    }

    /**
     * Shutdown and cleanup
     */
    shutdown() {
        console.log('🔽 Shutting down LangGraph Manager...');
        this.activeConversations.clear();
        this.workflows.clear();
        this.initialized = false;
        console.log('✅ LangGraph Manager shutdown complete');
    }
}

module.exports = { LangGraphManager }; 