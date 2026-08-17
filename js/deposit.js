console.log("deposit.js started");
alert("NEW deposit.js loaded");

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

const selectedAmount = localStorage.getItem("selectedPlanAmount");

if (selectedAmount) {
    document.getElementById("amount").value = selectedAmount;
} else {
    document.getElementById("amount").value = "3000";
}

// ====================
// Wallet addresses
// ====================

const wallets = {
    ERC20: "0x2FDAdCAfD91a2946721Ca669b3147dCF9a1B1885",
    BEP20: "0x2FDAdCAfD91a2946721Ca669b3147dCF9a1B1885",
    TRC20: "TZ6pXmJYrVEMVpCSE1pqvJ9Mfh5mkhPeH5",
    BTC: "bc1qyveg57wwecvtmprtfyw5l8rw6gy5napr75x8fl",
    SOL: "7Mdix9HSLNKgR8QuMM4es8sTs1oMztTiv6ju5JFvdmWR",
    TON: "UQA3MAWIMCtXPQtikQwych7SnX-lZqha_caJ2BBt4wc0ZyR6",
    ARBITRUM: "0x2FDAdCAfD91a2946721Ca669b3147dCF9a1B1885"
};

const networkSelect = document.getElementById("network");
const walletInput = document.getElementById("wallet");

function updateWallet() {
    walletInput.value = wallets[networkSelect.value] || "";
}

updateWallet();

networkSelect.addEventListener("change", updateWallet);

// ====================
// Copy wallet
// ====================

document.getElementById("copyWallet").addEventListener("click", () => {

    navigator.clipboard.writeText(walletInput.value)
        .then(() => {
            alert("Wallet copied successfully");
        })
        .catch(() => {
            alert("Copy failed");
        });
});

// ====================
// Verify deposit
// ====================

document.getElementById("verifyBtn").addEventListener("click", async () => {

    const amount = document.getElementById("amount").value;
    const network = networkSelect.value;
    const txHash = document.getElementById("txHash").value.trim();

    if (!txHash) {
        alert("Please enter transaction hash");
        return;
    }

    try {

        const res = await fetch(API_URL + "/verify-deposit", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },

            body: JSON.stringify({
                amount,
                network,
                txHash
            })

        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error);
            return;
        }

        alert(data.message);

        localStorage.removeItem("selectedPlanAmount");

        window.location.href = "waiting.html";

    } catch (err) {

        console.error(err);
        alert("Server error");

    }

});