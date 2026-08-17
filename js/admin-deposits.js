const token = localStorage.getItem("adminToken");

async function loadDeposits() {

    const res = await fetch(`${API_URL}/admin/pending-deposits`, {

        headers: {
            Authorization: `Bearer ${token}`
        }

    });

    const deposits = await res.json();

    const table = document.getElementById("depositTable");

    table.innerHTML = "";

    deposits.forEach(dep => {

        table.innerHTML += `

<tr>

<td>${dep.name}</td>

<td>${dep.email}</td>

<td>$${dep.amount}</td>

<td>${dep.network}</td>

<td>${dep.txHash}</td>

<td>

<button onclick="approve('${dep.userId}','${dep.transactionId}')">

Approve

</button>

<button onclick="rejectDeposit('${dep.userId}','${dep.transactionId}')">

Reject

</button>

</td>

</tr>

`;

    });

}

async function approve(userId, transactionId) {

    await fetch(`${API_URL}/admin/approve/${userId}/${transactionId}`, {

        method: "POST",

        headers: {

            Authorization: `Bearer ${token}`

        }

    });

    loadDeposits();

}

async function rejectDeposit(userId, transactionId) {

    await fetch(`${API_URL}/admin/reject/${userId}/${transactionId}`, {

        method: "POST",

        headers: {

            Authorization: `Bearer ${token}`

        }

    });

    loadDeposits();

}

loadDeposits();