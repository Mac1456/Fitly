/**
 * Firebase Tools for LangGraph Workflows
 * Provides structured interfaces for workflows to interact with Firebase
 */
class FirebaseTools {
    constructor(db, auth, storage) {
        this.db = db;
        this.auth = auth;
        this.storage = storage;
    }

    /**
     * User Profile Operations
     */
    async saveUserProfile(userId, profileData) {
        try {
            const docRef = this.db.collection('users').doc(userId);
            await docRef.set({
                ...profileData,
                updatedAt: new Date(),
                createdAt: new Date()
            }, { merge: true });
            
            console.log('✅ User profile saved to Firebase');
            return { success: true };
        } catch (error) {
            console.error('❌ Error saving user profile:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProfile(userId) {
        try {
            const docRef = this.db.collection('users').doc(userId);
            const doc = await docRef.get();
            
            if (doc.exists) {
                return { success: true, data: doc.data() };
            } else {
                return { success: false, error: 'Profile not found' };
            }
        } catch (error) {
            console.error('❌ Error getting user profile:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Meal Logging Operations
     */
    async logMeal(userId, mealData) {
        try {
            const mealRef = this.db.collection('users').doc(userId).collection('meals');
            const docRef = await mealRef.add({
                ...mealData,
                timestamp: new Date(),
                source: 'langgraph_workflow'
            });
            
            console.log('✅ Meal logged to Firebase:', docRef.id);
            return { success: true, mealId: docRef.id };
        } catch (error) {
            console.error('❌ Error logging meal:', error);
            return { success: false, error: error.message };
        }
    }

    async getTodaysMeals(userId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const mealsRef = this.db.collection('users').doc(userId).collection('meals');
            const snapshot = await mealsRef
                .where('timestamp', '>=', today)
                .orderBy('timestamp', 'desc')
                .get();
            
            const meals = [];
            snapshot.forEach(doc => {
                meals.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, meals };
        } catch (error) {
            console.error('❌ Error getting today\'s meals:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Activity Logging Operations
     */
    async logActivity(userId, activityData) {
        try {
            const activityRef = this.db.collection('users').doc(userId).collection('activities');
            const docRef = await activityRef.add({
                ...activityData,
                timestamp: new Date(),
                source: 'langgraph_workflow'
            });
            
            console.log('✅ Activity logged to Firebase:', docRef.id);
            return { success: true, activityId: docRef.id };
        } catch (error) {
            console.error('❌ Error logging activity:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Weight Tracking Operations
     */
    async logWeight(userId, weightData) {
        try {
            const weightRef = this.db.collection('users').doc(userId).collection('weights');
            const docRef = await weightRef.add({
                ...weightData,
                timestamp: new Date(),
                source: 'langgraph_workflow'
            });
            
            console.log('✅ Weight logged to Firebase:', docRef.id);
            return { success: true, weightId: docRef.id };
        } catch (error) {
            console.error('❌ Error logging weight:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Conversation Logging for AI Interactions
     */
    async saveConversation(userId, sessionId, conversationData) {
        try {
            const convRef = this.db
                .collection('users')
                .doc(userId)
                .collection('ai_conversations')
                .doc(sessionId);
            
            await convRef.set({
                ...conversationData,
                lastUpdated: new Date()
            }, { merge: true });
            
            console.log('✅ Conversation saved to Firebase');
            return { success: true };
        } catch (error) {
            console.error('❌ Error saving conversation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Analytics and Insights
     */
    async getUserStats(userId, days = 7) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            // Get recent meals
            const mealsSnapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('meals')
                .where('timestamp', '>=', cutoffDate)
                .get();
            
            // Get recent activities
            const activitiesSnapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('activities')
                .where('timestamp', '>=', cutoffDate)
                .get();
            
            // Get recent weights
            const weightsSnapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('weights')
                .where('timestamp', '>=', cutoffDate)
                .orderBy('timestamp', 'desc')
                .limit(5)
                .get();
            
            const stats = {
                totalMeals: mealsSnapshot.size,
                totalActivities: activitiesSnapshot.size,
                totalWeightEntries: weightsSnapshot.size,
                averageCalories: 0,
                averageProtein: 0,
                recentWeights: []
            };
            
            // Calculate nutrition averages
            let totalCalories = 0;
            let totalProtein = 0;
            let mealCount = 0;
            
            mealsSnapshot.forEach(doc => {
                const meal = doc.data();
                if (meal.nutrition) {
                    totalCalories += meal.nutrition.calories || 0;
                    totalProtein += meal.nutrition.protein || 0;
                    mealCount++;
                }
            });
            
            if (mealCount > 0) {
                stats.averageCalories = Math.round(totalCalories / mealCount);
                stats.averageProtein = Math.round(totalProtein / mealCount);
            }
            
            // Get recent weights
            weightsSnapshot.forEach(doc => {
                const weightData = doc.data();
                stats.recentWeights.push({
                    weight: weightData.weight,
                    unit: weightData.unit,
                    date: weightData.timestamp
                });
            });
            
            return { success: true, stats };
        } catch (error) {
            console.error('❌ Error getting user stats:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Image Storage for Meal Photos
     */
    async uploadMealImage(userId, imageBlob, mealId) {
        try {
            const imagePath = `meal-images/${userId}/${mealId}_${Date.now()}.jpg`;
            const imageRef = this.storage.ref(imagePath);
            
            const uploadTask = await imageRef.put(imageBlob);
            const downloadURL = await uploadTask.ref.getDownloadURL();
            
            console.log('✅ Meal image uploaded to Firebase Storage');
            return { success: true, imageUrl: downloadURL, imagePath };
        } catch (error) {
            console.error('❌ Error uploading meal image:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Workflow State Management
     */
    async saveWorkflowState(userId, workflowId, state) {
        try {
            const stateRef = this.db
                .collection('workflow_states')
                .doc(userId)
                .collection('workflows')
                .doc(workflowId);
            
            await stateRef.set({
                state,
                lastUpdated: new Date()
            }, { merge: true });
            
            return { success: true };
        } catch (error) {
            console.error('❌ Error saving workflow state:', error);
            return { success: false, error: error.message };
        }
    }

    async getWorkflowState(userId, workflowId) {
        try {
            const stateRef = this.db
                .collection('workflow_states')
                .doc(userId)
                .collection('workflows')
                .doc(workflowId);
            
            const doc = await stateRef.get();
            
            if (doc.exists) {
                return { success: true, state: doc.data().state };
            } else {
                return { success: true, state: null };
            }
        } catch (error) {
            console.error('❌ Error getting workflow state:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = { FirebaseTools }; 