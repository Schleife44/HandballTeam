import { onSnapshot } from 'firebase/firestore';

export class SyncBase {
  constructor() {
    this.subscriptions = new Map();
    this.isApplyingRemoteChange = false;
    this.isMigrating = false;
    
    // Rate Limiting
    this.writeHistory = [];
    this.lastWriteTime = 0;
    this.writesInLastSecond = 0;
  }

  _checkRateLimit(methodName) {
    const now = Date.now();
    if (now - this.lastWriteTime < 1000) {
      this.writesInLastSecond++;
    } else {
      this.writesInLastSecond = 1;
      this.lastWriteTime = now;
    }

    if (this.writesInLastSecond > 8) {
      console.error(`[Sync] ⚠️ RATE LIMIT HIT! Blocking write from ${methodName}. Check for infinite loops!`);
      return false;
    }

    console.group(`[Sync] 📤 WRITE: ${methodName}`);
    console.log('Timestamp:', new Date().toLocaleTimeString());
    this.writeHistory.push({ method: methodName, time: now });
    if (this.writeHistory.length > 50) this.writeHistory.shift();
    
    return true;
  }

  _subscribe(key, docRefOrQuery, callback, store) {
    if (this.subscriptions.has(key)) return this.subscriptions.get(key);

    console.log(`[Sync] 🛰️ Subscribing to: ${key}`);
    const unsub = onSnapshot(docRefOrQuery, (snapshot) => {
      this.isApplyingRemoteChange = true;
      try {
        callback(snapshot);
      } finally {
        this.isApplyingRemoteChange = false;
      }
    }, (err) => {
      console.error(`[Sync] Subscription error for ${key}:`, err);
      if (err.code === 'quota-exceeded' || err.message?.includes('quota')) {
        store?.setSyncStatus?.('quota_exceeded');
      } else {
        store?.setSyncStatus?.('offline');
      }
    });

    this.subscriptions.set(key, unsub);
    return unsub;
  }

  unsubscribe(key) {
    if (this.subscriptions.has(key)) {
      console.log(`[Sync] 🛑 Unsubscribing from: ${key}`);
      this.subscriptions.get(key)();
      this.subscriptions.delete(key);
    }
  }

  stop() {
    this.subscriptions.forEach((unsub, key) => {
      console.log(`[Sync] 🛑 Stopping: ${key}`);
      unsub();
    });
    this.subscriptions.clear();
  }

  stripFunctions(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj;
    if (typeof obj.isEqual === 'function') return obj;
    if (typeof obj.toMillis === 'function') return obj;
    
    if (Array.isArray(obj)) return obj.map(item => this.stripFunctions(item)).filter(item => item !== undefined && typeof item !== 'function');
    const cleaned = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value !== undefined && typeof value !== 'function') cleaned[key] = this.stripFunctions(value);
      }
    }
    return cleaned;
  }
}
