// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD7Sx3BbImWPgO2MJsTZz6GPPBv4xlQk0Y",
  authDomain: "rfp-template.firebaseapp.com",
  databaseURL: "https://rfp-template-default-rtdb.firebaseio.com",
  projectId: "rfp-template",
  storageBucket: "rfp-template.appspot.com",
  messagingSenderId: "837104030158",
  appId: "1:837104030158:web:30ce458711637e1551db9f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
