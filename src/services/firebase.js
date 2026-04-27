import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: 'AIzaSyCUxWf2FWD_M-74kja16hDB9QXyct2BTw0',
    authDomain: 'handball-tracker-322a1.firebaseapp.com',
    projectId: 'handball-tracker-322a1',
    storageBucket: 'handball-tracker-322a1.firebasestorage.app',
    messagingSenderId: '543345608323',
    appId: '1:543345608323:web:f126e979414ec5305b7db6',
    measurementId: 'G-S35J20GMHM'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
