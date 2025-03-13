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
      this.easyPrimes = [2, 3, 5, 7, 11];
      this.hardPrimes = [13, 17, 19, 23];
      this.usedNumbers = new Set();
      this.score = 0;
      this.combo = 0;
      this.perfectStreak = 0;
      this.correctList = [];
      this.wrongList = [];
      this.mistakeMade = false;
      this.mistakeCount = 0;
      this.questionNumber = 0;
      this.timeLeft = 120.00;
      this.gameRunning = false;
      this.username = "";
      this.difficultyThresholds = [35000, 90000, 200000];
      // Additional properties:
      this.totalPenalty = 0;
      this.timerDuration = 120; // 2 minutes in seconds
      // Bind any non-DOM events if needed here.
  }
  
  bindEvents() {
    const buttonsEl = document.getElementById("buttons");
    if (!buttonsEl) {
        console.error("Element with ID 'buttons' not found!");
        return;
    }
    buttonsEl.addEventListener("click", (e) => {
        if (e.target && e.target.classList.contains("prime-btn")) {
            const guessedFactor = parseInt(e.target.textContent, 10);
            this.handleGuess(guessedFactor, e.target);
        }
    });
  }
  
  startGame() {
      // Set race duration and reset penalty
      this.raceDuration = 120;
      this.totalPenalty = 0;
      // Get username from input field (default to "Player" if empty)
      this.username = document.getElementById("username-input").value || "Player";
      document.getElementById("username-display").innerText = `Player: ${this.username}`;
      // Hide start screen, show game screen
      document.getElementById("start-screen").style.display = "none";
      document.getElementById("game-screen").style.display = "block";
      
      // Start a 3-second countdown on the number-display element
      let countdown = 3;
      document.getElementById("number-display").innerText = `Starting in ${countdown}...`;
  
      let countdownInterval = setInterval(() => {
          countdown--;
          document.getElementById("number-display").innerText = `Starting in ${countdown}...`;
  
          if (countdown <= 0) {
              clearInterval(countdownInterval);
              console.log("Starting game...");
              // Now start the actual game
              this.beginGame();
          }
      }, 1000);
  }
  
  startTimer() {
      // Record the actual start time using system clock
      this.startTime = Date.now();
      // Update the timer display every 100ms
      this.timerInterval = setInterval(() => this.updateTimer(), 100);
  }
  
  updateTimer() {
      // Calculate elapsed time in seconds using the system clock
      const elapsed = (Date.now() - this.startTime) / 1000;
      // Adjust elapsed time by adding any penalties
      const remaining = Math.max(0, this.timerDuration - elapsed - this.totalPenalty);
      const timerDisplay = document.getElementById("timer-display");
      if (timerDisplay) {
          timerDisplay.innerText = `Time Left: ${remaining.toFixed(2)}s`;
      }
      // If time is up, clear the interval and end the game
      if (remaining <= 0) {
          clearInterval(this.timerInterval);
          this.endGame();
      }
  }
  
  beginGame() {
      console.log("Game has started!");
      this.gameRunning = true;
      // Set the start time now so the timer starts after the countdown
      this.startTime = Date.now();
      // Start the 2-minute timer
      this.startTimer();
      // Create the buttons and start the first round
      this.createButtons();
      this.newRound();
  }
  
  createButtons() {
      const buttonsContainer = document.getElementById("buttons");
      buttonsContainer.innerHTML = "";
      [...this.easyPrimes, ...this.hardPrimes].forEach(prime => {
          const button = document.createElement("button");
          button.classList.add("prime-btn");
          button.textContent = prime;
          // Use an arrow function so that 'this' refers to the game instance
          button.addEventListener("click", () => {
              this.handleGuess(prime, button);
          });
          buttonsContainer.appendChild(button);
      });
  }
  
  setQuestion() {
      let number;
      do {
          number = this.generateCompositeNumber();
      } while (this.usedNumbers.has(number));
  
      this.usedNumbers.add(number);
      return number;
  }
  
  generateCompositeNumber() {
      let score = this.score;
      let numEasy, numHard;
      if (score >= 200000) {
          numEasy = Math.floor(Math.random() * 6) + 2;
          numHard = Math.floor(Math.random() * 4) + 3;
      } else if (score >= 90000) {
          numEasy = Math.floor(Math.random() * 5) + 2;
          numHard = Math.floor(Math.random() * 3) + 2;
      } else if (score >= 35000) {
          numEasy = Math.floor(Math.random() * 4) + 2;
          numHard = 1;
      } else {
          numEasy = Math.floor(Math.random() * 3) + 2;
          numHard = 0;
      }
      let factors = [];
      for (let i = 0; i < numEasy; i++) {
          factors.push(this.easyPrimes[Math.floor(Math.random() * this.easyPrimes.length)]);
      }
      for (let i = 0; i < numHard; i++) {
          factors.push(this.hardPrimes[Math.floor(Math.random() * this.hardPrimes.length)]);
      }
      return factors.reduce((a, b) => a * b, 1);
  }
  
  handleGuess(prime, button) {
      if (!this.gameRunning) return;
    
      if (this.currentNumber % prime !== 0) {
          // Wrong guess: highlight red.
          button.classList.add("wrong");
          setTimeout(() => button.classList.remove("wrong"), 300);
          this.mistakeMade = true;
          this.combo = 0; // Reset combo.
          this.perfectStreak = 0;
          this.applyPenalty();
          return;
      }
    
      // Correct guess: highlight green.
      button.classList.add("correct");
      setTimeout(() => button.classList.remove("correct"), 300);
    
      // Increase score for this guess.
      this.updateScore(prime);
      this.currentNumber /= prime;
      document.getElementById("number-display").innerText = `Factorize: ${this.currentNumber}`;
    
      if (this.currentNumber === 1) {
          this.completeFactorization();
      }
  }
  
  newRound() {
      this.mistakeMade = false;
      this.currentNumber = this.setQuestion();
      this.originalNumber = this.currentNumber;
      console.log("New number generated:", this.currentNumber);
      document.getElementById("number-display").innerText = `Factorize: ${this.currentNumber}`;
  }
  
  updateScore(prime) {
      // Declare baseScore before using it
      const baseScore = this.getBaseScore(prime);
      // Increase combo counter.
      this.combo++;
      let comboBonus = 50 * this.combo;
      let pointsEarned = baseScore + comboBonus;
    
      let currentScore = this.score;
      let targetScore = this.score + pointsEarned;
      let steps = 20;
      let stepValue = (targetScore - currentScore) / steps;
      const actionText = document.getElementById("action-text");
      const scoreDisplay = document.getElementById("score-display");
    
      actionText.innerText = `+${pointsEarned.toFixed(2)}`;
      actionText.style.display = "block";
      actionText.classList.remove("action-popup");
      void actionText.offsetWidth;
      actionText.classList.add("action-popup");
    
      let step = 0;
      let interval = setInterval(() => {
          if (step < steps) {
              currentScore += stepValue;
              this.score = currentScore;
              if (scoreDisplay) scoreDisplay.innerText = this.score.toFixed(2);
              step++;
          } else {
              clearInterval(interval);
              this.score = targetScore;
              if (scoreDisplay) scoreDisplay.innerText = this.score.toFixed(2);
          }
      }, 50);
      // Also add the base score immediately
      this.score += baseScore;
      if (scoreDisplay) scoreDisplay.innerText = this.score.toFixed(2);
  }
  
  getBaseScore(prime) {
      if ([2, 3, 5, 7].includes(prime)) return 100;
      if ([11, 13, 17].includes(prime)) return 300;
      return 500;
  }
  
  // Applies a time penalty for a wrong guess.
  applyPenalty() {
      this.mistakeCount++;
      const penalty = this.fibonacci(this.mistakeCount) * 0.1;
      this.totalPenalty += penalty;
      console.log("Penalty applied. Total penalty: ", this.totalPenalty);
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
  
  // Called when the current question is fully factorized.
  completeFactorization() {
      let m = this.questionNumber;
      let clearBonus = 0;
      if (this.mistakeMade) {
          clearBonus = 1000 * m;
          this.perfectStreak = 0;
      } else {
          clearBonus = 3500 * Math.pow(1.05, m);
          if (this.perfectStreak > 0) {
              clearBonus += 3500 * Math.pow(1.618, this.perfectStreak / 6);
          }
          this.perfectStreak++;
      }
    
      // Animate clear bonus addition.
      this.animateClearBonus(clearBonus);
    
      // Record the initial number for end-of-game reporting.
      if (this.mistakeMade) {
          this.wrongList.push({ number: this.originalNumber, factors: this.getFactorization(this.originalNumber) });
      } else {
          this.correctList.push({ number: this.originalNumber, factors: this.getFactorization(this.originalNumber) });
      }
    
      // Start the next round.
      this.newRound();
  }
  
  // Animates the addition of a bonus (clear bonus) to the score.
  animateClearBonus(bonus) {
      let currentScore = this.score;
      let targetScore = this.score + bonus;
      let steps = 20;
      let stepValue = bonus / steps;
      const scoreDisplay = document.getElementById("score-display");
      const actionText = document.getElementById("action-text");
    
      actionText.innerText = `+${bonus.toFixed(2)}`;
      actionText.style.display = "block";
      actionText.classList.remove("action-popup");
      void actionText.offsetWidth;
      actionText.classList.add("action-popup");
    
      let step = 0;
      let interval = setInterval(() => {
          if (step < steps) {
              currentScore += stepValue;
              this.score = currentScore;
              if (scoreDisplay) scoreDisplay.innerText = this.score.toFixed(2);
              step++;
          } else {
              clearInterval(interval);
              this.score = targetScore;
              if (scoreDisplay) scoreDisplay.innerText = this.score.toFixed(2);
          }
      }, 50);
  }
  
  updateTimer() {
      // Calculate elapsed time in seconds using the system clock
      const elapsed = (Date.now() - this.startTime) / 1000;
      // Adjust for any penalty if necessary
      const adjustedElapsed = elapsed + this.totalPenalty;
      // Calculate remaining time
      const remaining = Math.max(0, this.raceDuration - adjustedElapsed);
    
      // Update the display
      document.getElementById("timer-display").innerText = `Time Left: ${remaining.toFixed(2)}s`;
    
      if (remaining <= 0) {
          clearInterval(this.timerInterval);
          this.endGame();
      }
  }
  
  getFactorization(number) {
      let n = number;
      let factors = {};
      for (let prime of [...this.easyPrimes, ...this.hardPrimes]) {
          while (n % prime === 0) {
              factors[prime] = (factors[prime] || 0) + 1;
              n /= prime;
          }
      }
      return Object.entries(factors)
          .map(([base, exp]) => exp > 1 ? `${base}^${exp}` : base)
          .join(" × ");
  }
  
  endGame() {
    // Submit the score to Firebase Firestore before finishing the game.
    this.submitScore();

    // Hide the game screen and show the end screen.
    const endScreen = document.getElementById("end-screen");
    const finalScoreElement = document.getElementById("final-score");
    const correctListElement = document.getElementById("correct-list");
    const wrongListElement = document.getElementById("wrong-list");

    if (!endScreen || !finalScoreElement || !correctListElement || !wrongListElement) {
        console.error("End screen elements not found!");
        return;
    }

    document.getElementById("game-screen").style.display = "none";
    endScreen.style.display = "block";

    finalScoreElement.innerText = `Final Score: ${this.score.toFixed(1)}`;

    correctListElement.innerHTML = this.correctList.length > 0 
        ? this.correctList.map(q => `<li title="${q.factors}">${q.number}</li>`).join('') 
        : '<li>None</li>';

    wrongListElement.innerHTML = this.wrongList.length > 0 
        ? this.wrongList.map(q => `<li title="${q.factors}">${q.number}</li>`).join('') 
        : '<li>None</li>';
}

// New method to submit the score.
async submitScore() {
    try {
        // Use the username as the document ID so that each player is registered only once.
        await setDoc(doc(this.db, "leaderboard", this.username), {
            username: this.username,
            score: this.score,
            submittedAt: serverTimestamp()
        });
        console.log("Score submitted successfully to Firebase.");
    } catch (error) {
        console.error("Error submitting score: ", error);
    }
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
      game.startGame();
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