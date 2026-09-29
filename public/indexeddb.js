/**
 * Client-Side IndexedDB Layer for Offline-First Field Capture
 * Database: EarlyWarningOfflineDB
 */

const DB_NAME = 'EarlyWarningOfflineDB';
const DB_VERSION = 1;
const QUEUE_STORE = 'offlineQueue';
const CACHE_STORE = 'cachedStudents';

let dbInstance = null;

function openDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) return resolve(dbInstance);

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(QUEUE_STORE)) {
                db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(CACHE_STORE)) {
                db.createObjectStore(CACHE_STORE, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            console.error('IndexedDB open error:', event.target.error);
            reject(event.target.error);
        };
    });
}

// 1. Enqueue an offline record
async function enqueueOfflineRecord(record) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([QUEUE_STORE], 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const item = {
            ...record,
            captured_offline: true,
            queued_at: new Date().toISOString()
        };
        const req = store.add(item);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// 2. Get all queued records
async function getOfflineQueue() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([QUEUE_STORE], 'readonly');
        const store = tx.objectStore(QUEUE_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

// 3. Clear queue after successful sync
async function clearOfflineQueue() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([QUEUE_STORE], 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}

// 4. Cache students roster locally for offline selection
async function cacheStudentsLocally(students) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([CACHE_STORE], 'readwrite');
        const store = tx.objectStore(CACHE_STORE);
        students.forEach(s => store.put(s));
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
}

// 5. Get cached students for offline field selection
async function getCachedStudentsLocally() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([CACHE_STORE], 'readonly');
        const store = tx.objectStore(CACHE_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

// Export for browser
window.OfflineDB = {
    openDB,
    enqueueOfflineRecord,
    getOfflineQueue,
    clearOfflineQueue,
    cacheStudentsLocally,
    getCachedStudentsLocally
};
