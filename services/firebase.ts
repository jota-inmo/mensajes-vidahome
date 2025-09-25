// Firebase is loaded globally via script tags in index.html
// This file is responsible for initializing the app and exporting the db instance.
declare var firebase: any;

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCo77e5POVcQ_lKrLJEliJYuYddJ1pX3yw",
  authDomain: "dossiertrack-u2y5k.firebaseapp.com",
  projectId: "dossiertrack-u2y5k",
  storageBucket: "dossiertrack-u2y5k.firebasestorage.app",
  messagingSenderId: "1010143896007",
  appId: "1:1010143896007:web:00c29bf096e23437ed39e2"
};

// Initialize Firebase, but only if it hasn't been initialized already.
// This prevents errors during development with hot-reloading.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export the firestore database instance for use in other parts of the app.
export const db = firebase.firestore();
export const auth = firebase.auth();
