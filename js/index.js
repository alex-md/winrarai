let firebaseConfig = {
    apiKey: "AIzaSyBT8c6GHonTIIBfZXz01xHC1RFOyjnqZj8",
    authDomain: "randmisc.firebaseapp.com",
    databaseURL: "https://randmisc-default-rtdb.firebaseio.com",
    projectId: "randmisc",
    storageBucket: "randmisc.appspot.com",
    messagingSenderId: "664693850545",
    appId: "1:664693850545:web:daa5db09edcf16144dbd90",
};
firebase.initializeApp(firebaseConfig);
let database = firebase.database(),
    totalClicksRef = database.ref("clicks/total"),
    leaderboardRef = database.ref("clicks/leaderboard"),
    leaderboardTable = document.querySelector(".table tbody"),
    userName,
    userId = generateUserId();

const incrementButton = document.getElementById("increment-button");
if (incrementButton) {
    incrementButton.addEventListener("click", incrementCounter);
} else {
    console.error("Element with ID 'increment-button' not found.");
}

// Generate user ID with realistic username
function generateUserId() {
    let vowels = 'aeiou';
    let consonants = 'bcdfghjklmnpqrstvwxyz';
    let userId = '';
    let length = Math.floor(Math.random() * 9 + 4);
    for (let i = 0; i < length; i++) {
        userId += i % 2 === 0 ? consonants[Math.floor(Math.random() * consonants.length)] : vowels[Math.floor(Math.random() * vowels.length)];
    }
    return userId;
} // 

// Functions related to simulating user interactions
function simulateUserInteraction(simulationCount = 0) { // Add simulationCount as a parameter
    if (simulationCount > 10) {
        console.log("Simulation limit reached");
        return; // Stop further simulations if the count exceeds 10
    }

    // Reset user data for a new session
    let userName = generateUserId();
    document.getElementById("leaderboard-name").value = userName;
    document.getElementById("set-name").click();

    const targetClicks = Math.floor(Math.random() * 1000 + 500);
    const fluctuation = Math.floor(targetClicks * (Math.random() * 0.4 + 0.1) + 1);
    const minClicks = targetClicks - fluctuation;
    const maxClicks = targetClicks + fluctuation;
    let totalClicks = 0;

    function simulateClickBurst() {
        const burstDuration = Math.floor(3000 * Math.random() + 1000);
        let clicksPerBurst = Math.floor(Math.random() * 10 + 1);
        let clickInterval = burstDuration / clicksPerBurst;

        let burstTimer = setInterval(() => {
            if (totalClicks < maxClicks) {
                document.getElementById("increment-button").click();
                totalClicks += 1;
            } else {
                clearInterval(burstTimer);
            }
        }, clickInterval);

        setTimeout(() => {
            clearInterval(burstTimer);
            if (totalClicks < maxClicks) {
                simulateClickBurst();
            }
        }, burstDuration);
    }

    function simulateSession() {
        let sessionTimer = setInterval(() => {
            if (totalClicks >= minClicks && totalClicks <= maxClicks) {
                console.log(`Target reached or exceeded within range: ${totalClicks} clicks`);
                clearInterval(sessionTimer);
            }
        }, 2000);

        setTimeout(() => {
            clearInterval(sessionTimer);
            if (totalClicks < minClicks || totalClicks > maxClicks) {
                console.log("Session ended: out of target click range.");
            }
            // Increment the simulation count and start a new session if conditions are met
            simulateUserInteraction(simulationCount + 1);
        }, 60000);

        simulateClickBurst();
    }

    simulateSession();
}

// Functions related to incrementing the counter and updating the leaderboard
function incrementCounter() {
    const userClicksRef = database.ref(`clicks/users/${userId}`);
    userClicksRef.transaction(
        (currentValue) => (currentValue || 0) + 1,
        (error, committed, snapshot) => {
            if (error) {
                console.error("Error incrementing user counter:", error);
            } else if (!committed) {
                console.error("User counter transaction was aborted.");
            } else {
                updateLeaderboard(snapshot.val());
            }
        },
    );

    const totalClicksRef = database.ref("clicks/total");
    totalClicksRef.transaction(
        (currentValue) => (currentValue || 0) + 1,
        (error, committed, snapshot) => {
            if (error) {
                console.error("Error incrementing total clicks:", error);
            } else if (!committed) {
                console.error("Total clicks transaction was aborted.");
            } else {
                updateTotalClicks(snapshot.val());
            }
        },
    );
}

totalClicksRef.on("value", (snapshot) => {
    updateTotalClicks(snapshot.val() || 0);
}),
    document.getElementById("set-name").addEventListener("click", function () {
        if (
            !(userName = document.getElementById("leaderboard-name").value.trim())
        ) {
            alert("Please enter a valid name.");
            return;
        }
        userId = generateUserId();
        updateLeaderboard(
            database
                .ref(`clicks/users/${userId}`)
                .once("value")
                .then((snapshot) => snapshot.val()) || 0,
        );
    });

function createLeaderboardHtml(leaderboard) {
    return leaderboard
        .map(
            (entry, index) =>
                `
            <tr>
              <td>${index + 1}</td>
              <td>${entry.username}</td>
              <td>${formatNumberWithCommas(entry.clicks)}</td>
            </tr>
          `,
        )
        .join("");
}

function updateTotalClicks(total) {
    const totalClicksElement = document.getElementById("totalClicks");
    if (totalClicksElement) {
        totalClicksElement.textContent = formatNumberWithCommas(total);
    } else {
        console.error("Element with ID 'totalClicks' not found.");
    }
}

function updateLeaderboard(userClicks) {
    leaderboardRef.once("value", (snapshot) => {
        let leaderboard = snapshot.val() || [];
        let userEntry = leaderboard.find(
            (entry) => entry.id === userId && entry.username === userName,
        );
        if (userEntry) {
            userEntry.clicks = userClicks;
        } else {
            userEntry = {
                id: userId,
                username: userName || generateUsername(userId),
                clicks: userClicks,
            };
            leaderboard.push(userEntry);
        }
        leaderboard.sort((a, b) => b.clicks - a.clicks);
        leaderboard = leaderboard.slice(0, 10);
        leaderboardRef.set(leaderboard);

        if (leaderboardTable) {
            leaderboardTable.innerHTML = createLeaderboardHtml(leaderboard);
        } else {
            console.error("Leaderboard table element not found.");
        }
    });
}

function formatNumberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        simulateUserInteraction();
    }, 1000);
}
);
