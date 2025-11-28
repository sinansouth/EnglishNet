import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: REPLACE THIS WITH YOUR OWN FIREBASE CONFIG FROM THE FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyBKCkZ6BRSl9XAreBmo6YgNaMXi0gw-uOM",
  authDomain: "englishnet-6ddb9.firebaseapp.com",
  projectId: "englishnet-6ddb9",
  storageBucket: "englishnet-6ddb9.firebasestorage.app",
  messagingSenderId: "805953214428",
  appId: "1:805953214428:web:ebac91df6303f1d3c06119"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);