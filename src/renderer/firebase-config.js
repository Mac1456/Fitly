// Firebase configuration for Fitly
// 🔐 SECURE VERSION - Configuration loaded safely via IPC from main process

const { ipcRenderer } = require('electron');
// Make ipcRenderer available globally for other scripts
window.ipcRenderer = ipcRenderer;

// Secure Firebase configuration - loaded via IPC from main process
let firebaseConfig = null;
let auth, db, storage;

// Initialize Firebase securely
async function initializeFirebase() {
    try {
        // Get Firebase config securely from main process
        firebaseConfig = await ipcRenderer.invoke('get-firebase-config');
        
        if (firebaseConfig && typeof firebase !== 'undefined') {
            // Initialize Firebase with secure config
            firebase.initializeApp(firebaseConfig);
            
            // Initialize Firebase services
            auth = firebase.auth();
            db = firebase.firestore();
            storage = firebase.storage();
            
            console.log('✅ Firebase initialized successfully');
            return true;
        } else {
            console.log('⚠️ Firebase config not available. Using mock data for development.');
            initializeMockFirebase();
            return false;
        }
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        console.log('⚠️ Falling back to mock Firebase for development.');
        initializeMockFirebase();
        return false;
    }
}

// Initialize mock Firebase services for development
function initializeMockFirebase() {
    // Mock Firebase services for development
    auth = {
        currentUser: null,
        createUserWithEmailAndPassword: (email, password) => {
            console.log('Mock: Creating user with email:', email);
            const mockUser = { uid: 'mock-user-' + Date.now(), email: email };
            return Promise.resolve({ user: mockUser });
        },
        signInWithEmailAndPassword: (email, password) => {
            console.log('Mock: Signing in with email:', email);
            const mockUser = { uid: 'mock-user-' + Date.now(), email: email };
            return Promise.resolve({ user: mockUser });
        },
        signOut: () => {
            console.log('Mock: Signing out');
            return Promise.resolve();
        },
        onAuthStateChanged: (callback) => {
            // Simulate authentication after a delay
            setTimeout(() => {
                const mockUser = { uid: 'mock-user-' + Date.now(), email: 'test@example.com' };
                callback(null); // Start with no user
            }, 100);
        }
    };
    
    db = {
        collection: (path) => ({
            doc: (docId) => ({
                set: (data) => {
                    console.log('Mock Firestore SET:', path, docId, data);
                    return Promise.resolve();
                },
                get: () => {
                    console.log('Mock Firestore GET:', path, docId);
                    return Promise.resolve({
                        exists: false,
                        data: () => null
                    });
                },
                update: (data) => {
                    console.log('Mock Firestore UPDATE:', path, docId, data);
                    return Promise.resolve();
                },
                onSnapshot: (callback) => {
                    console.log('Mock Firestore SNAPSHOT:', path, docId);
                    setTimeout(() => callback({
                        exists: false,
                        data: () => null
                    }), 100);
                },
                // Add subcollection support
                collection: (subPath) => ({
                    add: (data) => {
                        console.log('Mock Firestore SUB-ADD:', path, docId, subPath, data);
                        return Promise.resolve({ id: 'mock-sub-doc-id' });
                    },
                    doc: (subDocId) => ({
                        set: (data, options) => {
                            console.log('Mock Firestore SUB-SET:', path, docId, subPath, subDocId, data, options);
                            return Promise.resolve();
                        },
                        get: () => {
                            console.log('Mock Firestore SUB-GET:', path, docId, subPath, subDocId);
                            return Promise.resolve({
                                exists: false,
                                data: () => null
                            });
                        }
                    }),
                    where: () => ({
                        orderBy: () => ({
                            get: () => {
                                console.log('Mock Firestore SUB-QUERY:', path, docId, subPath);
                                return Promise.resolve({
                                    docs: [],
                                    forEach: (callback) => {}
                                });
                            }
                        })
                    })
                })
            }),
            add: (data) => {
                console.log('Mock Firestore ADD:', path, data);
                return Promise.resolve({ id: 'mock-doc-id' });
            },
            where: () => ({
                orderBy: () => ({
                    get: () => Promise.resolve({
                        docs: []
                    })
                })
            })
        })
    };
    
    storage = {
        ref: (path) => ({
            put: (file) => {
                console.log('Mock Storage PUT:', path, file);
                return Promise.resolve({
                    ref: {
                        getDownloadURL: () => Promise.resolve('mock-download-url')
                    }
                });
            }
        })
    };
}

// User management functions
window.firebaseAuth = {
    // Sign up with email and password
    createUserWithEmailAndPassword: async (email, password) => {
        try {
            console.log('Creating user with email:', email);
            const result = await auth.createUserWithEmailAndPassword(email, password);
            console.log('✅ User created successfully');
            return result.user;
        } catch (error) {
            console.error('❌ User creation failed:', error);
            throw error;
        }
    },
    
    // Sign in with email and password
    signInWithEmailAndPassword: async (email, password) => {
        try {
            console.log('Signing in with email:', email);
            const result = await auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Sign in successful');
            return result.user;
        } catch (error) {
            console.error('❌ Sign in failed:', error);
            throw error;
        }
    },
    
    // Sign out
    signOut: async () => {
        try {
            console.log('Signing out...');
            await auth.signOut();
            console.log('✅ Sign out successful');
        } catch (error) {
            console.error('❌ Sign out failed:', error);
            throw error;
        }
    },
    
    // Get current user
    getCurrentUser: () => {
        return auth.currentUser;
    },
    
    // Listen to auth state changes
    onAuthStateChanged: (callback) => {
        return auth.onAuthStateChanged(callback);
    }
};

// Database operations
window.firebaseDB = {
    // Save user profile
    saveUserProfile: async (userId, profileData) => {
        try {
            console.log('Saving user profile:', userId, profileData);
            await db.collection('users').doc(userId).set(profileData, { merge: true });
            console.log('✅ User profile saved');
        } catch (error) {
            console.error('❌ Error saving user profile:', error);
            throw error;
        }
    },
    
    // Get user profile
    getUserProfile: async (userId) => {
        try {
            console.log('Getting user profile:', userId);
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                const data = doc.data();
                console.log('✅ User profile retrieved:', data);
                return data;
            } else {
                console.log('⚠️ No user profile found');
                return null;
            }
        } catch (error) {
            console.error('❌ Error getting user profile:', error);
            throw error;
        }
    },
    
    // Add meal log entry
    addMealLog: async (userId, mealData) => {
        try {
            console.log('Adding meal log:', userId, mealData);
            const docRef = await db.collection('users').doc(userId).collection('meals').add({
                ...mealData,
                timestamp: firebase.firestore?.FieldValue?.serverTimestamp() || new Date()
            });
            console.log('✅ Meal log added with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error adding meal log:', error);
            throw error;
        }
    },
    
    // Get today's meal logs
    getTodaysMeals: async (userId) => {
        try {
            console.log('Getting today\'s meals for user:', userId);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const snapshot = await db.collection('users').doc(userId).collection('meals')
                .where('date', '>=', today)
                .orderBy('date', 'desc')
                .get();
            
            const meals = [];
            snapshot.forEach(doc => {
                meals.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('✅ Retrieved', meals.length, 'meals for today');
            return meals;
        } catch (error) {
            console.error('❌ Error getting today\'s meals:', error);
            throw error;
        }
    },
    
    // Add weight entry
    addWeightEntry: async (userId, weightData) => {
        try {
            console.log('Adding weight entry:', userId, weightData);
            const docRef = await db.collection('users').doc(userId).collection('weight').add({
                ...weightData,
                timestamp: firebase.firestore?.FieldValue?.serverTimestamp() || new Date()
            });
            console.log('✅ Weight entry added with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error adding weight entry:', error);
            throw error;
        }
    },
    
    // Update activity for today
    updateTodayActivity: async (userId, activityData) => {
        try {
            console.log('Updating today\'s activity:', userId, activityData);
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            
            await db.collection('users').doc(userId).collection('activities').doc(today).set({
                ...activityData,
                date: today,
                timestamp: firebase.firestore?.FieldValue?.serverTimestamp() || new Date()
            }, { merge: true });
            
            console.log('✅ Today\'s activity updated');
        } catch (error) {
            console.error('❌ Error updating today\'s activity:', error);
            throw error;
        }
    }
};

// Storage operations
window.firebaseStorage = {
    // Upload meal photo
    uploadMealPhoto: async (userId, file) => {
        try {
            console.log('Uploading meal photo for user:', userId);
            const timestamp = Date.now();
            const fileName = `meal_${timestamp}.jpg`;
            const storageRef = storage.ref(`users/${userId}/meals/${fileName}`);
            
            const uploadTask = await storageRef.put(file);
            const downloadURL = await uploadTask.ref.getDownloadURL();
            
            console.log('✅ Meal photo uploaded:', downloadURL);
            return downloadURL;
        } catch (error) {
            console.error('❌ Error uploading meal photo:', error);
            throw error;
        }
    }
};

// Initialize Firebase when the script loads
let firebaseInitialized = false;
window.firebaseReady = new Promise((resolve) => {
    initializeFirebase().then(configured => {
        console.log('🔐 Secure Firebase configuration loaded. Configured:', configured);
        firebaseInitialized = true;
        resolve(configured);
    }).catch(error => {
        console.error('❌ Firebase initialization failed:', error);
        firebaseInitialized = true; // Still resolve to allow app to continue with mock data
        resolve(false);
    });
});

// Add a synchronous check for Firebase readiness
window.isFirebaseReady = () => firebaseInitialized;

/*
FIREBASE SETUP INSTRUCTIONS:
1. Go to https://console.firebase.google.com/
2. Create a new project or select existing project
3. Go to Project Settings > General > Your apps
4. Add a new web app
5. Copy the configuration object and replace the firebaseConfig above
6. Enable Authentication > Sign-in method > Anonymous
7. Create Firestore database in production mode
8. Enable Storage
9. Update Firestore security rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{subcollection=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}

10. Update Storage security rules:

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
*/ 