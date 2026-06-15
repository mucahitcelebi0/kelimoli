// Firebase SDK bundle entry point.
// esbuild bunu firebase-bundle.js olarak paketler ve window.FirebaseBundle'a yazar.
// firebase-sync.js artık gstatic.com CDN'den dinamik import yerine bu bundle'ı kullanır.

import { initializeApp } from 'firebase/app';
import {
  getAuth,
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
