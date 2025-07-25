import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

export const firebaseConfig = {

    apiKey: "AIzaSyDnGlIVp_ERtEdhHQTI0tfHAYgyzo5tpLU",
  
    authDomain: "gradient-2aa5e.firebaseapp.com",
  
    projectId: "gradient-2aa5e",
  
    storageBucket: "gradient-2aa5e.firebasestorage.app",
  
    messagingSenderId: "243507183225",
  
    appId: "1:243507183225:web:c3af25298b095ed9ac5ea8",
  
    measurementId: "G-7TZWFM75SV"
  
  };
  
// Initialize Firebase app using modular syntax
const app = initializeApp(firebaseConfig);

// Get a Realtime Database instance
const db = getDatabase(app);

export { db, ref, set, onValue, update };
