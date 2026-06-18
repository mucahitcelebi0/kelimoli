// Firebase SDK bundle entry point.
// esbuild bunu firebase-bundle.js olarak paketler ve window.FirebaseBundle'a yazar.
// firebase-sync.js artık gstatic.com CDN'den dinamik import yerine bu bundle'ı kullanır.

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  inMemoryPersistence,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  onAuthStateChanged,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  EmailAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  memoryLocalCache,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from 'firebase/firestore';
import { getAnalytics, logEvent } from 'firebase/analytics';

window.FirebaseBundle = {
  initializeApp,
  authMod: {
    getAuth,
    initializeAuth,
    inMemoryPersistence,
    setPersistence,
    browserLocalPersistence,
    indexedDBLocalPersistence,
    onAuthStateChanged,
    signInAnonymously,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    EmailAuthProvider,
    linkWithCredential,
  },
  firestoreMod: {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentSingleTabManager,
    memoryLocalCache,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    where,
  },
  analyticsMod: {
    getAnalytics,
    logEvent,
  },
};
