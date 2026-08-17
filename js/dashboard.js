function animateValue(id, endValue) {

    const element = document.getElementById(id);

    const current =
        Number(
            element.innerText
                .replace("$", "")
                .replace(/,/g, "")
        ) || 0;

    const duration = 500;

    const stepTime = 20;

    const steps = duration / stepTime;

    const increment = (endValue - current) / steps;

    let value = current;

    const timer = setInterval(() => {

        value += increment;

        if (
            (increment >= 0 && value >= endValue) ||
            (increment < 0 && value <= endValue)
        ) {

            value = endValue;

            clearInterval(timer);

        }

        element.innerText =
            "$" + Math.round(value).toLocaleString();

    }, stepTime);

}
const userToken = localStorage.getItem("token");

if (!userToken) {
    window.location.href = "login.html";
}

async function loadDashboard() {

    try {

        const res = await fetch(API_URL + "/me", {
    headers: {
        Authorization: "Bearer " + userToken
    }
});

console.log("Status:", res.status);

const user = await res.json();

console.log(user);

if (!res.ok) {
    throw new Error(user.error);
}
        document.getElementById("userName").innerText = user.name;
        animateValue("balance", user.balance);
        document.getElementById("bonus").innerText = "$" + user.bonus;
       document.getElementById("investment").innerText =
    "$" + (user.totalActiveInvestment || 0);

document.getElementById("earnings").innerText =
    "$" + (user.totalDailyEarnings || 0);
        document.getElementById("totalEarned").innerText =
"$" + user.totalEarned;

document.getElementById("referralBalance").innerText =
"$" + user.referralBalance;
document.getElementById("referralCode").innerText =
user.referralCode;

let progress = 0;

const activeInvestments = Array.isArray(user.activeInvestments)
    ? user.activeInvestments
    : [];

if (activeInvestments.length > 0) {

    let progressTotal = 0;

    activeInvestments.forEach(investment => {

        const start = new Date(investment.startDate);
        const end = new Date(investment.endDate);
        const today = new Date();

        const startDate = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate()
        );

        const endDate = new Date(
            end.getFullYear(),
            end.getMonth(),
            end.getDate()
        );

        const currentDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

        const totalDays = Math.max(
            1,
            Math.round(
                (endDate - startDate) /
                (1000 * 60 * 60 * 24)
            )
        );

        let daysElapsed = Math.floor(
            (currentDate - startDate) /
            (1000 * 60 * 60 * 24)
        );

        daysElapsed = Math.max(
            0,
            Math.min(daysElapsed, totalDays)
        );

        const investmentProgress =
            (daysElapsed / totalDays) * 100;

        progressTotal += investmentProgress;

    });

    progress = Math.floor(
        progressTotal / activeInvestments.length
    );

    document.getElementById("progressText").innerText =
        progress + "% Completed";

    const progressFill =
        document.getElementById("progressFill");

    if (progressFill) {
        progressFill.style.width = progress + "%";
    }

    const remaining =
        document.getElementById("daysRemaining");

    if (remaining) {

        // Show the shortest remaining duration
        // when multiple investments are active.
        const today = new Date();

        const daysRemainingList =
            activeInvestments.map(investment => {

                const end = new Date(investment.endDate);

                return Math.max(
                    0,
                    Math.ceil(
                        (end - today) /
                        (1000 * 60 * 60 * 24)
                    )
                );

            });

        const minimumDaysRemaining =
            Math.min(...daysRemainingList);

        remaining.innerText =
            minimumDaysRemaining + " days remaining";
    }

} else {

    document.getElementById("progressText").innerText =
        "0% Completed";

    const progressFill =
        document.getElementById("progressFill");

    if (progressFill) {
        progressFill.style.width = "0%";
    }

    const remaining =
        document.getElementById("daysRemaining");

    if (remaining) {
        remaining.innerText =
            "No active investment";
    }
}

  

const fill = document.getElementById("progressFill");
const text = document.getElementById("progressText");

if (fill) {
    fill.style.width = progress + "%";
}

if (text) {
    text.innerText = progress + "% Completed";
}
if (fill) {
    fill.style.width = progress + "%";
}

if (text) {
    text.innerText = progress + "% Completed";
}
if (user.investmentEndDate) {

    const end = new Date(user.investmentEndDate);

    const today = new Date();

    const daysLeft = Math.ceil(
        (end - today) / (1000 * 60 * 60 * 24)
    );

    const remaining = document.getElementById("daysRemaining");

    if (remaining) {

        if (user.investmentStatus === "Completed") {

    remaining.innerText =
        "Investment Completed 🎉";

}
else if (daysLeft > 0) {

    remaining.innerText =
        daysLeft + " days remaining";

}
else {

    remaining.innerText =
        "Finishing...";

}
    }

}

     } catch (err) {

      console.error("Dashboard error:", err);

   }

}
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("token");

    window.location.href = "login.html";

});

loadDashboard();
const depositBtn = document.getElementById("depositBtn");

if (depositBtn) {
    depositBtn.addEventListener("click", () => {
        window.location.href = "deposit.html";
    });
}
const activateBtn = document.getElementById("activateBtn");

if (activateBtn) {

    activateBtn.addEventListener("click", () => {

        window.location.href = "activate.html";

    });

}
const withdrawBtn = document.getElementById("withdrawBtn");

if (withdrawBtn) {
    withdrawBtn.addEventListener("click", () => {
        window.location.href = "withdraw.html";
    });
}

const plansBtn = document.getElementById("plansBtn");

if (plansBtn) {
    plansBtn.addEventListener("click", () => {
        window.location.href = "plans.html";
    });
}

const referralBtn = document.getElementById("referralBtn");

if (referralBtn) {
    referralBtn.addEventListener("click", () => {
        window.location.href = "referral.html";
    });
}   
async function loadTransactions() {


    if (!userToken) return;

    try {

        const res = await fetch(API_URL + "/transactions", {

            headers: {
                Authorization: "Bearer " + userToken
            }

        });

        const data = await res.json();

        const table = document.getElementById("transactionTable");

        table.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {

            table.innerHTML = `
            <tr>
                <td colspan="4">No transactions yet.</td>
            </tr>
            `;

            return;
        }

        data.reverse().forEach(tx => {

            table.innerHTML += `
            <tr>
                <td>${tx.type}</td>
                <td>$${tx.amount}</td>
                <td>${tx.status}</td>
                <td>${new Date(tx.date).toLocaleString()}</td>
            </tr>
            `;

        });

    } catch (err) {

        console.error(err);

    }

}

loadTransactions();
// =========================
// LIVE REFRESH
// =========================

setInterval(() => {

    loadDashboard();

    loadTransactions();

}, 5000);

// =========================
// COPY REFERRAL LINK
// =========================

const copyReferral = document.getElementById("copyReferral");

if (copyReferral) {
    copyReferral.addEventListener("click", () => {

        const code = document.getElementById("referralCode").innerText;

        const link = "http://localhost:5500/register.html?ref=" + code;

        navigator.clipboard.writeText(link);

        alert("Referral link copied successfully!");

    });
}

const confirmActivate = document.getElementById("confirmActivate");

if (confirmActivate) {

    confirmActivate.addEventListener("click", () => {

        const amount = document.getElementById("planAmount").value;

        localStorage.setItem("selectedPlanAmount", amount);

        window.location.href = "deposit.html";

    });

}
const historyBtn = document.getElementById("historyBtn");

if (historyBtn) {

    historyBtn.addEventListener("click", () => {

        window.location.href = "withdraw-history.html";

    });

}
const depositHistoryBtn = document.getElementById("depositHistoryBtn");

if (depositHistoryBtn) {

    depositHistoryBtn.addEventListener("click", () => {

        window.location.href = "deposit-history.html";

    });

}