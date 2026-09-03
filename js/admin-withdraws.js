const token = localStorage.getItem("adminToken");

if (!token) {

    window.location.href = "login.html";

}

async function loadWithdrawals() {

    const res = await fetch(

        API_URL + "/admin/pending-withdrawals",

        {

            headers: {

                Authorization: "Bearer " + token

            }

        }

    );

    const withdrawals = await res.json();

    const table = document.getElementById("withdrawalsTable");

    table.innerHTML = "";

    withdrawals.forEach(tx => {

        table.innerHTML += `

<tr>

<td>${tx.name}</td>

<td>${tx.email}</td>

<td>${tx.withdrawalType}</td>

<td>$${tx.amount}</td>

<td>${tx.network}</td>

<td>${tx.wallet}</td>

<td>${new Date(tx.date).toLocaleString()}</td>

<td>

<button onclick="approve('${tx.userId}','${tx.transactionId}')">

Approve

</button>

<button onclick="reject('${tx.userId}','${tx.transactionId}')">

Reject

</button>

</td>

</tr>

`;

    });

}

loadWithdrawals();

async function approve(userId, transactionId) {

    const res = await fetch(

        API_URL +

        `/admin/approve-withdrawal/${userId}/${transactionId}`,

        {

            method: "POST",

            headers: {

                Authorization: "Bearer " + token

            }

        }

    );

    const data = await res.json();

    alert(data.message);

    loadWithdrawals();

}

async function reject(userId, transactionId) {

    const res = await fetch(

        API_URL +

        `/admin/reject-withdrawal/${userId}/${transactionId}`,

        {

            method: "POST",

            headers: {

                Authorization: "Bearer " + token

            }

        }

    );

    const data = await res.json();

    alert(data.message);

    loadWithdrawals();

}