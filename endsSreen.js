// endScreen.js

// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDBgRh-t6pJOEZfQanb-T6KYNj_XbL_YP8",
    authDomain: "runfactor-cf724.firebaseapp.com",
    projectId: "runfactor-cf724",
    storageBucket: "runfactor-cf724.firebasestorage.app",
    messagingSenderId: "882591954418",
    appId: "1:882591954418:web:39964ebfa664061fb4a76b",
    measurementId: "G-KWWWHF4NQE"
};

// Initialize Firebase and Firestore (if not already initialized in a shared file)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Flag to ensure the submission is done only once
let submissionDone = false;

// Wait for the DOM to be fully loaded (end-screen elements should exist)
document.addEventListener("DOMContentLoaded", () => {
    const submitButton = document.getElementById("submit-score");
    const usernameInput = document.getElementById("username-input");

    submitButton.addEventListener("click", async () => {
        if (submissionDone) return; // Prevent duplicate submissions

        const username = usernameInput.value.trim();
        if (!username) {
            alert("Please enter your username before submitting your score.");
            return;
        }

    // These values should be set by your game logic on the end-screen.
    const finalScore = window.finalScore || 0;
    const correctAnswers = window.correctAnswers || 0;
    const wrongAnswers = window.wrongAnswers || 0;

    try {
      // Use the username as the document ID to ensure one submission per user.
        await setDoc(doc(db, "leaderboard", username), {
            username: username,
            score: finalScore,
            correctAnswers: correctAnswers,
            wrongAnswers: wrongAnswers,
            submittedAt: serverTimestamp()
        });
        submissionDone = true;
        submitButton.disabled = true;  // Disable the button after submission
        alert("Score submitted successfully!");
        } catch (error) {
        console.error("Error submitting score:", error);
        alert("There was an error submitting your score. Please try again.");
        }
    });
});
