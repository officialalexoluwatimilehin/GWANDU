const token = localStorage.getItem("token");

if (!token) {

    window.location.href = "login.html";

}

async function loadDeposits() {

    try {

        const res = await fetch(

            API_URL + "/deposit-history",

            {

                headers: {

                    Authorization: "Bearer " + token

                }

            }

        );

        const deposits = await res.json();

        const table = document.getElementById("depositTable");

        table.innerHTML = "";

        if (deposits.length === 0) {

            table.innerHTML = `

            <tr>

                <td colspan="5">

                    No deposit history found.

                </td>

            </tr>

            `;

            return;

        }

        deposits.forEach(tx => {

            table.innerHTML += `

            <tr>

                <td>$${tx.amount}</td>

                <td>${tx.network}</td>

                <td>${tx.txHash}</td>

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

loadDeposits();