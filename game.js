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
        //.....
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
        this.raceDuration = 120;
        // Record the real start time
        this.startTime = Date.now();
        // Reset penalty or any adjustments here if needed
        this.totalPenalty = 0;
        
        // Update the timer using an interval (you can also use requestAnimationFrame)
        this.timerInterval = setInterval(() => this.updateTimer(), 100);
        this.username = document.getElementById("username-input").value || "Player";
        document.getElementById("username-display").innerText = `Player: ${this.username}`;
        document.getElementById("start-screen").style.display = "none";
        document.getElementById("game-screen").style.display = "block";
        
        let countdown = 3;
        document.getElementById("number-display").innerText = `Starting in ${countdown}...`;
    
        let countdownInterval = setInterval(() => {
            countdown--;
            document.getElementById("number-display").innerText = `Starting in ${countdown}...`;
    
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                console.log("Starting game...");
                this.beginGame(); // This should now trigger correctly
            }
        }, 1000);
    }
    beginGame() {
        console.log("Game has started!"); // Debugging line
        this.gameRunning = true;
        this.createButtons();
        this.newRound();
        this.timerInterval = setInterval(() => this.updateTimer(), 10);
    }
    createButtons() {
        const buttonContainer = document.getElementById("buttons");
        buttonContainer.innerHTML = "";
        
        [...this.easyPrimes, ...this.hardPrimes].forEach(prime => {
            let btn = document.createElement("button");
            btn.innerText = prime;
            btn.classList.add("prime-btn");
            btn.onclick = () => this.handleGuess(prime, btn);
            buttonContainer.appendChild(btn);
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

    updateTimer() {
      // Calculate elapsed time in seconds using the system clock
      const elapsed = (Date.now() - this.startTime) / 1000;
      // Adjust for any penalty if necessary
      const adjustedElapsed = elapsed + this.totalPenalty;
      // Calculate remaining time
      const remaining = Math.max(0, this.raceDuration - adjustedElapsed);
      
      // Update the display
      document.getElementById("timer-display").innerText = `Time Left: ${remaining.toFixed(2)}s`;
      
      // End the game if time is up
      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        this.endGame();
      }
    }

    newRound() {
        this.mistakeMade = false;
        this.currentNumber = this.setQuestion();
        this.originalNumber = this.currentNumber;
        
        console.log("New number generated:", this.currentNumber); // Debugging line
        document.getElementById("number-display").innerText = `Factorize: ${this.currentNumber}`;
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
                scoreDisplay.innerText = this.score.toFixed(2);
                step++;
            } else {
                clearInterval(interval);
                this.score = targetScore;
                scoreDisplay.innerText = this.score.toFixed(2);
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

    getFactorization(number) {
      let n = number;
      let factors = {};
      for (let prime of [...this.easyPrimes, ...this.hardPrimes]) {
          while (n % prime === 0) {
              factors[prime] = (factors[prime] || 0) + 1;
              n /= prime;
          }
      }
      return Object.entries(factors).map(([base, exp]) => exp > 1 ? `${base}^${exp}` : base).join(" × ");
    }
  }

    endGame() {
        // Ensure elements exist before modifying them
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
        gameOver();
        return;
    }  
}

// 6. Initialize Game Object
document.addEventListener("DOMContentLoaded", () => {
  const game = new PrimeFactorGame();
  window.game = game;  // Expose game globally if needed

  // Bind the start button click event
  const startGameBtn = document.getElementById("start-btn");
  if (!startGameBtn) {
    console.error("Start game button not found!");
    return;
  }
  startGameBtn.addEventListener("click", () => {
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

