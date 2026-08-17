
const token = localStorage.getItem("token");

async function loadReferralData() {

    if (!token) return;

    try {

        const response = await fetch(API_URL + "/me", {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        const user = await response.json();

        if (!response.ok) {
            throw new Error(user.error || "Unable to load referral data");
        }

        document.getElementById("referralBalance").innerText =
            "$" + (user.referralBalance || 0);

        document.getElementById("referralCode").innerText =
            user.referralCode || "N/A";

        const referrals = user.referrals || [];

        document.getElementById("referralCount").innerText =
            referrals.length;

        const container =
            document.getElementById("referralsContainer");

        if (referrals.length === 0) {

            container.innerHTML =
                '<p class="empty">No referrals yet.</p>';

        } else {

            container.innerHTML = referrals.map(email => `
                <div class="card">
                    ${email}
                </div>
            `).join("");

        }

    } catch (error) {

        console.error("Referral error:", error);

    }
}


document
    .getElementById("copyReferral")
    .addEventListener("click", async () => {

        const code =
            document.getElementById("referralCode").innerText;

        const link =
            window.location.origin +
            "/register.html?ref=" +
            encodeURIComponent(code);

        await navigator.clipboard.writeText(link);

        document.getElementById("copyMessage").innerText =
            "Referral link copied!";

    });


loadReferralData();