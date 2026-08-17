const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

let minutes = 5;
let seconds = 0;

const timer = document.getElementById("timer");

const countdown = setInterval(() => {

    if (seconds === 0) {

        if (minutes === 0) {

            clearInterval(countdown);

            window.location.href = "dashboard.html";

            return;

        }

        minutes--;
        seconds = 59;

    } else {

        seconds--;

    }

    timer.innerText =
        `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;

}, 1000);


// Check every 5 seconds if deposit has been approved

const approvalChecker = setInterval(async () => {

    try {

        const res = await fetch(API_URL + "/transactions", {

            headers: {
                Authorization: "Bearer " + token
            }

        });

        const transactions = await res.json();
        console.log(transactions);

        const latestDeposit = [...transactions]
            .reverse()
            .find(tx => tx.type === "Deposit");
            console.log("Latest Deposit:", latestDeposit);

           if (
    latestDeposit &&
    (latestDeposit.status === "Approved" ||
     latestDeposit.status === "Completed")
) {

        
clearInterval(countdown);
clearInterval(approvalChecker);

showNotification(
    "Deposit Approved",
    "Your balance has been updated successfully."
);

setTimeout(() => {
    window.location.href = "dashboard.html";
}, 2000);

}

    } catch (err) {

        console.log(err);

    }

}, 5000);