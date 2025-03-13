// 1. Import Firebase Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";


// 2a. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBgRh-t6pJOEZfQanb-T6KYNj_XbL_YP8",
  authDomain: "runfactor-cf724.firebaseapp.com",
  projectId: "runfactor-cf724",
  storageBucket: "runfactor-cf724.firebasestorage.app",
  messagingSenderId: "882591954418",
  appId: "1:882591954418:web:39964ebfa664061fb4a76b",
  measurementId: "G-KWWWHF4NQE"
};

// 2b. Initialize Firebase
const app = initializeApp(firebaseConfig);
// Disabling Analytics for now.
// const analytics = getAnalytics(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});
const auth = getAuth(app);

// 3.Sign in user anonymously
signInAnonymously(auth)
    .then(() => {
        console.log("Signed in anonymously");
    })
    .catch((error) => {
        console.error("Authentication error:", error);
    });


// 4. Define PrimeFactorGame Class
class PrimeFactorGame {
  constructor() {
    // Initialize state
    this.score = 0;
    this.mistakeCount = 0;
    this.totalPenalty = 0;
    this.timerDuration = 120; // 2 minutes in seconds
    this.startTime = null;
    this.timerInterval = null;
    this.gameRunning = false;
    this.currentNumber = 0;
    this.username = "";
    // Example prime arrays – adjust as needed
    this.easyPrimes = [2, 3, 5, 7, 11];
    this.hardPrimes = [13, 17, 19, 23];
  }

  startGame(username) {
    this.username = username;
    console.log(`Starting game for ${username}`);
    // Reset game state
    this.score = 0;
    this.mistakeCount = 0;
    this.totalPenalty = 0;
    this.gameRunning = true;
    // Hide the start screen and show the game screen
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    // Begin with a countdown
    this.startCountdown();
  }

  startCountdown() {
    let count = 3;
    const countdownEl = document.getElementById("countdown");
    countdownEl.innerText = count;
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownEl.innerText = count;
      } else {
        clearInterval(countdownInterval);
        countdownEl.innerText = ""; // clear countdown display
        // Now start the timer and game buttons
        this.startTimer();
        this.createButtons();
        // For demonstration, set a starting composite number
        this.currentNumber = 100; // Replace with your actual logic
        document.getElementById("number-display").innerText = `Factorize: ${this.currentNumber}`;
      }
    }, 1000);
  }

  startTimer() {
    // Record the real start time (so we can compute elapsed time regardless of throttling)
    this.startTime = Date.now();
    // Update timer every 100ms
    this.timerInterval = setInterval(() => this.updateTimer(), 100);
  }

  updateTimer() {
    const elapsed = (Date.now() - this.startTime) / 1000; // in seconds
    const remaining = Math.max(0, this.timerDuration - elapsed - this.totalPenalty);
    document.getElementById("timer-display").innerText = `Time Left: ${remaining.toFixed(2)}s`;
    if (remaining <= 0) {
      clearInterval(this.timerInterval);
      this.endGame();
    }
  }

  updateScore(prime) {
    // Calculate a score increment based on the guessed prime
    const baseScore = this.getBaseScore(prime);
    this.score += baseScore;
    // Update the score display
    const scoreDisplay = document.getElementById("score-display");
    if (scoreDisplay) {
      scoreDisplay.innerText = this.score.toFixed(2);
    }
  }

  getBaseScore(prime) {
    // Example scoring logic – adjust as needed
    return (prime <= 10) ? 100 : 200;
  }

  handleGuess(prime, button) {
    if (!this.gameRunning) return;
    // If the prime is not a factor
    if (this.currentNumber % prime !== 0) {
      button.classList.add("wrong");
      setTimeout(() => button.classList.remove("wrong"), 300);
      this.applyPenalty();
      return;
    }
    // Correct guess – highlight and update
    button.classList.add("correct");
    setTimeout(() => button.classList.remove("correct"), 300);
    this.updateScore(prime);
    this.currentNumber /= prime;
    document.getElementById("number-display").innerText = `Factorize: ${this.currentNumber}`;
    if (this.currentNumber === 1) {
      // When fully factorized, start a new round (or end round)
      this.newRound();
    }
  }

  createButtons() {
    const buttonsContainer = document.getElementById("buttons");
    buttonsContainer.innerHTML = "";
    // Create buttons for all available primes using arrow functions to preserve "this"
    [...this.easyPrimes, ...this.hardPrimes].forEach(prime => {
      const button = document.createElement("button");
      button.classList.add("prime-btn");
      button.textContent = prime;
      button.addEventListener("click", () => this.handleGuess(prime, button));
      buttonsContainer.appendChild(button);
    });
  }

  applyPenalty() {
    this.mistakeCount++;
    const penalty = this.fibonacci(this.mistakeCount) * 0.1;
    this.totalPenalty += penalty;
    console.log("Penalty applied. Total penalty:", this.totalPenalty);
    // Update the timer display immediately after applying the penalty
    this.updateTimer();
  }

  fibonacci(n) {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      let temp = a + b;
      a = b;
      b = temp;
    }
    return b;
  }

  newRound() {
    // Placeholder logic for a new round – update currentNumber accordingly
    this.currentNumber = 100; // Replace with your own logic
    document.getElementById("number-display").innerText = `Factorize: ${this.currentNumber}`;
  }

  endGame() {
    this.gameRunning = false;
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("end-screen").style.display = "block";
    document.getElementById("final-score").innerText = `Final Score: ${this.score.toFixed(2)}`;
  }
}

// When the DOM is ready, create the game instance and bind the start button
document.addEventListener("DOMContentLoaded", () => {
  const game = new PrimeFactorGame();
  window.game = game; // Expose globally if needed

  const startBtn = document.getElementById("start-btn");
  if (!startBtn) {
    console.error("Start game button not found!");
    return;
  }
  startBtn.addEventListener("click", () => {
    const usernameInput = document.getElementById("username-input");
    if (!usernameInput) {
      console.error("Username input element not found!");
      return;
    }
    const username = usernameInput.value.trim();
    if (!username) {
      alert("Please enter your name.");
      return;
    }
    game.startGame(username);
  });
});


const game = new PrimeFactorGame();
export function startGame() {
    game.startGame();
}

// 5. Define Helper Functions (Leaderboard, Score Submission)
function gameOver() {
    let username = document.getElementById("username").value;
    let scoreText = document.getElementById("score-display").innerText.trim();

    // Remove any non-numeric characters and convert to a number
    let finalScore = parseFloat(scoreText.replace(/[^\d.]/g, ""));

    console.log("Game over! Submitting score:", { username, finalScore });

    if (username && !isNaN(finalScore)) {
        submitScore(username, finalScore);
    } else {
        console.error("Invalid username or score, not submitting.");
    }
}
async function loadLeaderboard() {
    try {
        const q = query(scoresCollection, orderBy("score", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        let leaderboardTable = document.getElementById("leaderboard").getElementsByTagName("tbody")[0];
        leaderboardTable.innerHTML = ""; // Clear old data

        let rank = 1;
        querySnapshot.forEach((doc) => {
            let row = leaderboardTable.insertRow();
            row.insertCell(0).innerText = rank;
            row.insertCell(1).innerText = doc.data().username;
            row.insertCell(2).innerText = doc.data().score;
            rank++;
        });
    } catch (error) {
        console.error("Error loading leaderboard:", error);
    }
}
async function submitScore(username, score) {
    try {
        const scoresRef = collection(db, "scores"); // Correct Firestore reference

        await addDoc(scoresRef, {
            username: username,
            score: score,
            timestamp: serverTimestamp() // Use Firestore server timestamp
        });

        console.log("Score submitted successfully!");
    } catch (error) {
        console.error("Error submitting score:", error);
    }
}

