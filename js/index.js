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
    // Disable the button initially
    incrementButton.disabled = true;

    // Enable the button after 5 seconds
    setTimeout(() => {
        incrementButton.disabled = false;
    }, 5000);

    incrementButton.addEventListener("click", incrementCounter);
} else {
    console.error("Element with ID 'increment-button' not found.");
}

// Generate user ID with realistic username
function generateUserId() {
    // Define a string of vowels
    let vowels = "aeiou";
    // Define a string of consonants
    let consonants = "bcdfghjklmnpqrstvwxyz";
    // Initialize an empty string for the userId
    let userId = "";
    // Generate a random length between 4 and 12 for the userId
    let length = Math.floor(Math.random() * 9 + 4);
    // Loop through the length of the userId
    for (let i = 0; i < length; i++) {
        // Concatenate a consonant or vowel to userId based on the current index
        userId +=
            i % 2 === 0
                ? consonants[Math.floor(Math.random() * consonants.length)] // If index is even, add a consonant
                : vowels[Math.floor(Math.random() * vowels.length)]; // If index is odd, add a vowel
    }
    // Return the generated userId
    return userId;
}

function generateUsername(userId) {
    // Placeholder function, implement according to requirements
    return `User_${userId}`;
}

// Functions related to simulating user interactions
// Defines a function to simulate user interactions, optional simulationCount to track iterations
function simulateUserInteraction(simulationCount = 0) {
    let userName = generateUserId();
    document.getElementById("leaderboard-name").value = userName;
    document.getElementById("set-name").click();

    const targetClicks = Math.floor(Math.random() * 3500 + 300);
    const fluctuation = Math.floor(targetClicks * (Math.random() * 0.15 + 0.15));
    const minClicks = targetClicks - fluctuation;
    const maxClicks = targetClicks + fluctuation;
    let totalClicks = 0;

    function simulateClickBurst() {
        const burstDuration = Math.floor(Math.random() * 8000 + 1000);
        let clicksPerBurst = Math.floor(Math.random() * 40 + 1);
        // Divide the original interval by 4 to increase speed by 300%
        let clickInterval = burstDuration / clicksPerBurst / 3;

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
                simulateUserInteraction(simulationCount + 1);
            }
        }, 2000);

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
                    <td>${entry.clicks ? formatNumberWithCommas(entry.clicks) : 0}</td>
                  </tr>
                `,
        )
        .join("");
}

function updateTotalClicks(total) {
    const totalClicksElement = document.getElementById("totalClicks");
    if (totalClicksElement) {
        totalClicksElement.textContent = total ? formatNumberWithCommas(total) : 0;
    } else {
        console.error("Element with ID 'totalClicks' not found.");
    }
}
function updateLeaderboard(userClicks) {
    leaderboardRef.once("value", (snapshot) => {
        console.log("Raw leaderboard data:", snapshot.val());

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
        leaderboard = leaderboard.slice(0, 50);
        leaderboardRef.set(leaderboard);
    });

    if (leaderboardTable) {
        leaderboardTable.innerHTML = createLeaderboardHtml(leaderboard);
    } else {
        console.error("Leaderboard table element not found.");
    }
}

function formatNumberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        simulateUserInteraction();
    }, 5000);

    leaderboardRef.on("value", (snapshot) => {
        let leaderboard = snapshot.val() || [];
        leaderboard.sort((a, b) => b.clicks - a.clicks);
        leaderboard = leaderboard.slice(0, 50);
        if (leaderboardTable) {
            leaderboardTable.innerHTML = createLeaderboardHtml(leaderboard);
        } else {
            console.error("Leaderboard table element not found.");
        }
    });
});
