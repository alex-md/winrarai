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
    leaderboardRef = database.ref("clicks/leaderboard"),
    leaderboardTable = document.querySelector(".table tbody");

let pageSize = 10;
let currentPage = 0;

function createLeaderboardHtml(leaderboard) {
    let start = currentPage * pageSize;
    let end = start + pageSize;
    return leaderboard
        .slice(start, end)
        .map(
            (entry, index) =>
                `
                      <tr>
                        <td>${start + index + 1}</td>
                        <td>${entry.username}</td>
                        <td>${entry.clicks ? formatNumberWithCommas(entry.clicks) : 0}</td>
                      </tr>
                    `,
        )
        .join("");
}

function formatNumberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function nextPage(leaderboard) {
    if ((currentPage + 1) * pageSize < leaderboard.length) {
        currentPage++;
        updateLeaderboard(leaderboard);
    }
}

function previousPage(leaderboard) {
    if (currentPage > 0) {
        currentPage--;
        updateLeaderboard(leaderboard);
    }
}
function updateButtonVisibility(leaderboard) {
    document.querySelector("#nextPage").style.display = ((currentPage + 1) * pageSize < leaderboard.length) ? 'block' : 'none';
    document.querySelector("#previousPage").style.display = (currentPage > 0) ? 'block' : 'none';
}

function updateLeaderboard(leaderboard) {
    if (leaderboardTable) {
        leaderboardTable.innerHTML = createLeaderboardHtml(leaderboard);
        updateButtonVisibility(leaderboard);
    } else {
        console.error("Leaderboard table element not found.");
    }
}
let leaderboard = [];

document.addEventListener("DOMContentLoaded", () => {
    leaderboardRef.on("value", (snapshot) => {
        leaderboard = snapshot.val() || [];
        leaderboard.sort((a, b) => b.clicks - a.clicks);
        updateLeaderboard(leaderboard);
    });
});

// Add event listeners to your next and previous page buttons
document.querySelector("#nextPage").addEventListener("click", () => nextPage(leaderboard));
document.querySelector("#previousPage").addEventListener("click", () => previousPage(leaderboard));
