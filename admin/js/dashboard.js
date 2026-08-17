const token = localStorage.getItem("adminToken");

if (!token) {
    window.location.href = "login.html";
}

async function loadDashboard() {

    try {

        console.log(API_URL + "/admin/dashboard");

const res = await fetch(API_URL + "/admin/dashboard", {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Unable to load dashboard");
            return;
        }

        document.getElementById("totalUsers").innerText = data.totalUsers;
        document.getElementById("totalDeposits").innerText = data.totalDeposits;
        document.getElementById("totalInvestments").innerText = data.totalInvestments;
        document.getElementById("totalBalance").innerText = data.totalBalance;

        const depositTable = document.getElementById("pendingDeposits");
        const withdrawTable = document.getElementById("pendingWithdrawals");

        depositTable.innerHTML = "";
        withdrawTable.innerHTML = "";

        let pendingDeposit = false;
        let pendingWithdrawal = false;

        data.users.forEach(user => {

            user.transactions.forEach(tx => {

                // Pending Deposits
                if (tx.type === "Deposit" && tx.status === "Pending") {

                    pendingDeposit = true;

                    depositTable.innerHTML += `
                        <tr>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td>$${tx.amount}</td>
                            <td>${tx.network}</td>
                            <td>${tx.status}</td>
                            <td>

<button onclick="approveDeposit('${user._id}','${tx._id}')">

Approve

</button>

<button onclick="rejectDeposit('${user._id}','${tx._id}')">

Reject

</button>

</td>
                        </tr>
                    `;
                }

                // Pending Withdrawals
                if (tx.type === "Withdrawal" && tx.status === "Pending") {

                    pendingWithdrawal = true;

                    withdrawTable.innerHTML += `
                        <tr>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td>$${tx.amount}</td>
                            <td>${tx.wallet || "-"}</td>
                            <td>${tx.status}</td>
                            <td>
                                <button onclick="approveWithdrawal('${user._id}','${tx._id}')">
                                    Approve
                                </button>
                            </td>
                        </tr>
                    `;
                }

            });

        });

        if (!pendingDeposit) {

            depositTable.innerHTML = `
                <tr>
                    <td colspan="6">No pending deposits.</td>
                </tr>
            `;
        }

        if (!pendingWithdrawal) {

            withdrawTable.innerHTML = `
                <tr>
                    <td colspan="6">No pending withdrawals.</td>
                </tr>
            `;
        }

    }

    catch (err) {

        console.error(err);

        alert("Server error");

    }

}

async function approveDeposit(userId, transactionId) {

    const res = await fetch(

        API_URL + "/admin/approve/" + userId + "/" + transactionId,

        {

            method: "POST",

            headers: {

                Authorization: "Bearer " + token

            }

        }

    );

    const data = await res.json();

    alert(data.message || data.error);

    loadDashboard();

}

async function approveWithdrawal(userId, transactionId) {

    const res = await fetch(

        API_URL + "/admin/approve-withdrawal/" + userId + "/" + transactionId,

        {

            method: "POST",

            headers: {

                Authorization: "Bearer " + token

            }

        }

    );

    const data = await res.json();

    alert(data.message || data.error);

    loadDashboard();

}

document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("adminToken");

    window.location.href = "login.html";

});

loadDashboard();

async function rejectDeposit(userId, transactionId) {

    const res = await fetch(

        API_URL + "/admin/reject/" + userId + "/" + transactionId,

        {

            method: "POST",

            headers: {

                Authorization: "Bearer " + token

            }

        }

    );

    const data = await res.json();

    alert(data.message || data.error);

    loadDashboard();

}