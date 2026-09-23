const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
} = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

let firebaseConfig = null;
const configPath = path.join(__dirname, '..', 'firebase-applet-config.json');

try {
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.error('Error loading firebase-applet-config.json:', e);
}

let app = null;
let firestoreDb = null;

if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    app = initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId
    });

    const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
    firestoreDb = getFirestore(app, databaseId);
    console.log(`[Firebase] Initialized Firestore connected to project "${firebaseConfig.projectId}" (database: ${databaseId})`);
  } catch (err) {
    console.error('[Firebase] Initialization error:', err);
  }
}

// Helpers to sync collections with Firebase Firestore
async function syncDocToFirestore(collectionName, docId, data) {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, collectionName, String(docId));
    // Clean data for Firestore (remove undefined)
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, cleanData, { merge: true });
    console.log(`[Firebase Firestore] Synced to collection "${collectionName}" id "${docId}"`);
  } catch (err) {
    console.error(`[Firebase Firestore] Failed to sync ${collectionName}/${docId}:`, err.message);
  }
}

async function deleteDocFromFirestore(collectionName, docId) {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, collectionName, String(docId));
    await deleteDoc(docRef);
    console.log(`[Firebase Firestore] Deleted from collection "${collectionName}" id "${docId}"`);
  } catch (err) {
    console.error(`[Firebase Firestore] Failed to delete ${collectionName}/${docId}:`, err.message);
  }
}

async function loadCollectionFromFirestore(collectionName) {
  if (!firestoreDb) return null;
  try {
    const colRef = collection(firestoreDb, collectionName);
    const snapshot = await getDocs(colRef);
    const items = [];
    snapshot.forEach(docSnap => {
      items.push({ ...docSnap.data(), _firestoreId: docSnap.id });
    });
    return items;
  } catch (err) {
    console.error(`[Firebase Firestore] Error reading collection "${collectionName}":`, err.message);
    return null;
  }
}

module.exports = {
  firebaseConfig,
  firestoreDb,
  syncDocToFirestore,
  deleteDocFromFirestore,
  loadCollectionFromFirestore
};
