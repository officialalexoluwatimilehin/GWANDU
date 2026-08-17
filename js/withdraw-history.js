const token = localStorage.getItem("token");

if (!token) {

    window.location.href = "login.html";

}

async function loadHistory() {

    try {

        const res = await fetch(

            API_URL + "/withdraw-history",

            {

                headers: {

                    Authorization: "Bearer " + token

                }

            }

        );

        const withdrawals = await res.json();

        const table = document.getElementById("historyTable");

        table.innerHTML = "";

        if (withdrawals.length === 0) {

            table.innerHTML = `

            <tr>

                <td colspan="5">

                    No withdrawal history found.

                </td>

            </tr>

            `;

            return;

        }

        withdrawals.forEach(tx => {

            table.innerHTML += `

            <tr>

                <td>$${tx.amount}</td>

                <td>${tx.network}</td>

                <td>${tx.wallet}</td>

                <td>${tx.status}</td>

                <td>${new Date(tx.date).toLocaleString()}</td>

            </tr>

            `;

        });

    }

    catch (err) {

        console.error(err);

    }

}

loadHistory();