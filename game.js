// Import Firebase modules from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBgRh-t6pJOEZfQanb-T6KYNj_XbL_YP8",
  authDomain: "runfactor-cf724.firebaseapp.com",
  projectId: "runfactor-cf724",
  storageBucket: "runfactor-cf724.firebasestorage.app",
  messagingSenderId: "882591954418",
  appId: "1:882591954418:web:39964ebfa664061fb4a76b",
  measurementId: "G-KWWWHF4NQE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Screen elements
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const endScreen = document.getElementById("end-screen");

// DOM elements for game and submission
const startGameButton = document.getElementById("start-game-button");
const countdownEl = document.getElementById("countdown");
const finalScoreEl = document.getElementById("final-score");
const correctAnswersEl = document.getElementById("correct-answers");
const wrongAnswersEl = document.getElementById("wrong-answers");
const usernameInput = document.getElementById("username-input");
const submitScoreButton = document.getElementById("submit-score");

// Game state variables
let finalScore = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let submissionDone = false;

// Helper function to show a given screen
function showScreen(screen) {
  startScreen.style.display = "none";
  gameScreen.style.display = "none";
  endScreen.style.display = "none";
  screen.style.display = "block";
}

// Start game button listener: begin countdown then start game logic
startGameButton.addEventListener("click", () => {
  showScreen(gameScreen);
  startCountdown();
});

// Countdown function: displays a 3-second countdown before the game starts
function startCountdown() {
  let count = 3;
  countdownEl.textContent = count;
  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
    } else {
      clearInterval(interval);
      startGame();
    }
  }, 1000);
}

// Start game logic (replace this with your actual game code)
function startGame() {
  // Here, you can add your game logic.
  // For demonstration, we'll simulate a game that lasts 10 seconds.
  // Set example game results:
  finalScore = 100; // Example score
  correctAnswers = 7; // Example correct answers
  wrongAnswers = 3; // Example wrong answers

  // End the game after 10 seconds and move to the end screen
  setTimeout(() => {
    endGame();
  }, 10000); // 10,000 ms = 10 seconds
}

// End game: update the end-screen with game results and show it
function endGame() {
  finalScoreEl.textContent = finalScore;
  correctAnswersEl.textContent = correctAnswers;
  wrongAnswersEl.textContent = wrongAnswers;
  showScreen(endScreen);
}

// Submit score listener: sends the score to Firestore when clicked
submitScoreButton.addEventListener("click", async () => {
  if (submissionDone) return; // Prevent duplicate submissions
  const username = usernameInput.value.trim();
  if (!username) {
    alert("Please enter your username.");
    return;
  }
  try {
    // Use the username as the document ID to ensure one submission per user
    await setDoc(doc(db, "leaderboard", username), {
      username: username,
      score: finalScore,
      correctAnswers: correctAnswers,
      wrongAnswers: wrongAnswers,
      submittedAt: serverTimestamp()
    });
    submissionDone = true;
    submitScoreButton.disabled = true;
    alert("Score submitted successfully!");
  } catch (error) {
    console.error("Error submitting score:", error);
    alert("Error submitting score. Please try again.");
  }
});
