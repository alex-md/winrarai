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
    let vowels = "aeiou";
    let consonants = "bcdfghjklmnpqrstvwxyz";
    let userId = "";
    let length = Math.floor(Math.random() * 9 + 4);
    for (let i = 0; i < length; i++) {
        userId +=
            i % 2 === 0
                ? consonants[Math.floor(Math.random() * consonants.length)]
                : vowels[Math.floor(Math.random() * vowels.length)];
    }
    return userId;
} //

// Functions related to simulating user interactions
// Defines a function to simulate user interactions, optional simulationCount to track iterations
function simulateUserInteraction(simulationCount = 0) {
    // Generate a new user ID for a session and set it in the leaderboard
    let userName = generateUserId();
    document.getElementById("leaderboard-name").value = userName; // Set the generated user name in the leaderboard input field
    document.getElementById("set-name").click(); // Trigger a click to update the leaderboard with the new user name

    //  // Randomly set the target clicks between 300 and 3800
    const targetClicks = Math.floor(Math.random() * 3500 + 300);
    // Calculate fluctuation to vary the target clicks randomly between 15% and 30%
    const fluctuation = Math.floor(targetClicks * (Math.random() * 0.15 + 0.15));
    // Set the minimum number of acceptable clicks
    const minClicks = targetClicks - fluctuation;
    // Set the maximum number of acceptable clicks
    const maxClicks = targetClicks + fluctuation;
    // Initialize totalClicks to track the number of clicks made during the session
    let totalClicks = 0;

    // Defines a function to simulate bursts of clicks
    function simulateClickBurst() {
        // Randomly determine the duration of a burst between 1 to 8 seconds
        const burstDuration = Math.floor(Math.random() * 8000 + 1000);
        // Determine the number of clicks in this burst, between 1 and 40
        let clicksPerBurst = Math.floor(Math.random() * 40 + 1);
        // Calculate the interval between clicks in milliseconds
        let clickInterval = burstDuration / clicksPerBurst;

        // Set a timer to perform clicks at determined intervals
        let burstTimer = setInterval(() => {
            if (totalClicks < maxClicks) {
                // Check if the max clicks are not yet reached
                document.getElementById("increment-button").click(); // Simulate a click
                totalClicks += 1; // Increment the total clicks counter
            } else {
                clearInterval(burstTimer); // Stop the burst if max clicks reached
            }
        }, clickInterval);

        // Set a timeout to clear the burst timer and possibly initiate another burst
        setTimeout(() => {
            clearInterval(burstTimer); // Clear the current burst timer
            if (totalClicks < maxClicks) {
                // Check if another burst is needed
                simulateClickBurst(); // Initiate another burst
            }
        }, burstDuration);
    }

    // Defines a function to manage the overall session timing and conditions
    function simulateSession() {
        // Set a timer to monitor the session progress every 2 seconds
        let sessionTimer = setInterval(() => {
            if (totalClicks >= minClicks && totalClicks <= maxClicks) {
                // Check if the clicks are within the target range
                console.log(
                    `Target reached or exceeded within range: ${totalClicks} clicks`,
                );
                clearInterval(sessionTimer); // Stop the session timer when target is reached

                // Recursively call the simulateUserInteraction to start a new session, incrementing the count
                simulateUserInteraction(simulationCount + 1);
            }
        }, 2000);

        // Set a timeout to end the session after 3 minutes regardless of click count
        setTimeout(() => {
            clearInterval(sessionTimer); // Clear the session timer
            if (totalClicks < minClicks || totalClicks > maxClicks) {
                // Check if the clicks are out of target range
                console.log("Session ended: out of target click range.");
            }
        }, 180000); // End the session after 3 minutes

        // Start the first burst of clicks
        simulateClickBurst();
    }

    // Start the simulation session
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
        leaderboard = leaderboard.slice(0, 10);
        if (leaderboardTable) {
            leaderboardTable.innerHTML = createLeaderboardHtml(leaderboard);
        } else {
            console.error("Leaderboard table element not found.");
        }
    });
});
