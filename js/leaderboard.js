// Firebase configuration
let firebaseConfig = {
    apiKey: "AIzaSyBT8c6GHonTIIBfZXz01xHC1RFOyjnqZj8",
    authDomain: "randmisc.firebaseapp.com",
    databaseURL: "https://randmisc-default-rtdb.firebaseio.com",
    projectId: "randmisc",
    storageBucket: "randmisc.appspot.com",
    messagingSenderId: "664693850545",
    appId: "1:664693850545:web:daa5db09edcf16144dbd90",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Database references
let database = firebase.database();
let totalClicksRef = database.ref("clicks/total");
let leaderboardRef = database.ref("clicks/leaderboard");

// Variables
let userName;
let userId = generateUserId();
let pageSize = 50;
let currentPage = 0;
let leaderboard = [];

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', function () {
    // DOM elements
    let leaderboardTable = document.querySelector(".table tbody");
    let incrementButton = document.getElementById("increment-button");
    let setNameButton = document.getElementById("set-name");
    let leaderboardNameInput = document.getElementById("leaderboard-name");
    let totalClicksElement = document.getElementById("totalClicks");
    let nextPageButton = document.getElementById("nextPage");
    let previousPageButton = document.getElementById("previousPage");

    // Event listeners
    if (incrementButton) {
        incrementButton.addEventListener("click", incrementCounter);
    } else {
        console.error("Element with ID 'increment-button' not found.");
    }

    if (setNameButton) {
        setNameButton.addEventListener("click", setUserName);
    } else {
        console.error("Element with ID 'set-name' not found.");
    }

    if (nextPageButton) {
        nextPageButton.addEventListener("click", () => changePage(1));
    } else {
        console.error("Element with ID 'nextPage' not found.");
    }

    if (previousPageButton) {
        previousPageButton.addEventListener("click", () => changePage(-1));
    } else {
        console.error("Element with ID 'previousPage' not found.");
    }

    // Initialize leaderboard
    leaderboardRef.on("value", (snapshot) => {
        console.log("Raw leaderboard data:", snapshot.val());
        leaderboard = snapshot.val() || [];
        renderLeaderboard();
    });

    // Initialize total clicks
    totalClicksRef.on("value", (snapshot) => {
        updateTotalClicks(snapshot.val() || 0);
    });

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
            }
        );

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
            }
        );
    }

    function setUserName() {
        userName = leaderboardNameInput.value.trim();
        if (!userName) {
            alert("Please enter a valid name.");
            return;
        }
        userId = generateUserId();
        database.ref(`clicks/users/${userId}`).once("value").then((snapshot) => {
            updateLeaderboard(snapshot.val() || 0);
        });
    }

    function updateTotalClicks(total) {
        if (totalClicksElement) {
            totalClicksElement.textContent = formatNumberWithCommas(total);
        } else {
            console.error("Element with ID 'totalClicks' not found.");
        }
    }

    function updateLeaderboard(userClicks) {
        console.log("Updating leaderboard. User clicks:", userClicks);
        let userEntry = leaderboard.find(entry => entry.id === userId && entry.username === userName);
        if (userEntry) {
            userEntry.clicks = userClicks;
        } else {
            userEntry = { id: userId, username: userName, clicks: userClicks };
            leaderboard.push(userEntry);
        }
        console.log("Leaderboard before sorting:", leaderboard);
        leaderboard.sort((a, b) => b.clicks - a.clicks);
        console.log("Leaderboard after sorting:", leaderboard);
        leaderboardRef.set(leaderboard);
        renderLeaderboard();
    }

    function renderLeaderboard() {
        console.log("Rendering leaderboard. Current leaderboard data:", leaderboard);
        if (leaderboardTable) {
            let start = currentPage * pageSize;
            let end = start + pageSize;
            let html = leaderboard.slice(start, end).map((entry, index) => {
                console.log("Rendering entry:", entry);
                return `
                    <tr>
                        <td>${start + index + 1}</td>
                        <td>${entry.username}</td>
                        <td>${formatNumberWithCommas(entry.clicks)}</td>
                    </tr>
                `;
            }).join("");
            console.log("Generated HTML:", html);
            leaderboardTable.innerHTML = html;
            updateButtonVisibility();
        } else {
            console.error("Leaderboard table element not found.");
        }
    }

    function changePage(direction) {
        console.log("Changing page. Current page:", currentPage, "Direction:", direction);
        let newPage = currentPage + direction;
        if (newPage >= 0 && newPage * pageSize < leaderboard.length) {
            currentPage = newPage;
            console.log("New page:", currentPage);
            renderLeaderboard();
        } else {
            console.log("Cannot change page. New page would be out of bounds.");
        }
    }

    function updateButtonVisibility() {
        if (nextPageButton) {
            nextPageButton.style.display = ((currentPage + 1) * pageSize < leaderboard.length) ? 'block' : 'none';
        }
        if (previousPageButton) {
            previousPageButton.style.display = (currentPage > 0) ? 'block' : 'none';
        }
    }

    function formatNumberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
});
