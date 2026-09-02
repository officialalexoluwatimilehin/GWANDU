const https = require("https");

const telegramAgent = new https.Agent({
    family: 4,
    keepAlive: true
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;

async function sendTelegram(message) {
    if (!BOT_TOKEN || !ADMIN_ID) {
        console.error("Telegram notification skipped: missing bot credentials.");
        return;
    }

    try {
        const url =
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        const body = JSON.stringify({
            chat_id: ADMIN_ID,
            text: message,
            parse_mode: "HTML"
        });

        await new Promise((resolve, reject) => {
            const request = require("https").request(
                url,
                {
                    method: "POST",
                    agent: telegramAgent,
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(body)
                    }
                },
                response => {
                    let data = "";

                    response.on("data", chunk => {
                        data += chunk;
                    });

                    response.on("end", () => {
                        if (response.statusCode >= 200 && response.statusCode < 300) {
                            resolve();
                        } else {
                            reject(
                                new Error(
                                    `Telegram HTTP ${response.statusCode}: ${data}`
                                )
                            );
                        }
                    });
                }
            );

            request.on("error", reject);
            request.write(body);
            request.end();
        });

    } catch (err) {
        console.error(
            "Telegram notification failed:",
            err.message
        );
    }
}

function money(value) {
    return Number(value || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

async function notifyNewUser(user) {
    await sendTelegram(
        `🆕 <b>NEW USER REGISTRATION</b>\n\n` +
        `👤 Name: <b>${user.name}</b>\n` +
        `📧 Email: <b>${user.email}</b>\n` +
        `🆔 User ID: <code>${user._id}</code>\n` +
        `🔐 Email Verified: <b>${user.emailVerified ? "Yes" : "No"}</b>\n` +
        `📅 ${new Date().toLocaleString()}`
    );
}

async function notifyDepositVerified(user, tx) {
    await sendTelegram(
        `💰 <b>BLOCKCHAIN DEPOSIT VERIFIED</b>\n\n` +
        `👤 User: <b>${user.name}</b>\n` +
        `📧 Email: ${user.email}\n` +
        `💵 Requested USD: <b>$${money(tx.requestedUsd || tx.amount)}</b>\n` +
        `🌐 Network: <b>${tx.network}</b>\n` +
        `🪙 Received: <b>${tx.receivedCryptoAmount || 0}</b>\n` +
        `💲 Verified USD Value: <b>$${money(tx.receivedUsdValue)}</b>\n` +
        `🔢 Confirmations: <b>${tx.confirmations || 0}</b>\n` +
        `🔗 TX: <code>${tx.txHash}</code>\n` +
        `📌 Status: <b>Pending Admin Approval</b>\n` +
        `📅 ${new Date().toLocaleString()}`
    );
}

async function notifyDepositApproved(user, tx) {
    await sendTelegram(
        `✅ <b>DEPOSIT APPROVED</b>\n\n` +
        `👤 User: <b>${user.name}</b>\n` +
        `📧 Email: ${user.email}\n` +
        `💵 Amount Credited: <b>$${money(tx.amount)}</b>\n` +
        `🌐 Network: <b>${tx.network}</b>\n` +
        `🔗 TX: <code>${tx.txHash || "N/A"}</code>\n` +
        `💰 New Balance: <b>$${money(user.balance)}</b>\n` +
        `📅 ${new Date().toLocaleString()}`
    );
}

async function notifyDepositRejected(user, tx) {
    await sendTelegram(
        `❌ <b>DEPOSIT REJECTED</b>\n\n` +
        `👤 User: <b>${user.name}</b>\n` +
        `📧 Email: ${user.email}\n` +
        `💵 Amount: <b>$${money(tx.amount)}</b>\n` +
        `🌐 Network: <b>${tx.network}</b>\n` +
        `🔗 TX: <code>${tx.txHash || "N/A"}</code>\n` +
        `📌 Status: <b>Rejected</b>\n` +
        `📅 ${new Date().toLocaleString()}`
    );
}

async function notifyWithdrawalRequested(user, tx) {
    await sendTelegram(
        `💸 <b>NEW WITHDRAWAL REQUEST</b>\n\n` +
        `👤 User: <b>${user.name}</b>\n` +
        `📧 Email: ${user.email}\n` +
        `💵 Amount: <b>$${money(tx.amount)}</b>\n` +
        `📂 Source: <b>${tx.withdrawalType || "N/A"}</b>\n` +
        `🌐 Network: <b>${tx.network}</b>\n` +
        `👛 Wallet: <code>${tx.wallet}</code>\n` +
        `📌 Status: <b>Pending</b>\n` +
        `📅 ${new Date().toLocaleString()}`
    );
}

async function notifyWithdrawalApproved(user, tx) {
    await sendTelegram(
        `✅ <b>WITHDRAWAL APPROVED</b>\n\n` +
        `👤 User: <b>${user.name}</b>\n` +
        `📧 Email: ${user.email}\n` +
        `💵 Amount: <b>$${money(tx.amount)}</b>\n` +
        `📂 Source: <b>${tx.withdrawalType || "N/A"}</b>\n` +
        `🌐 Network: <b>${tx.network}</b>\n` +
        `👛 Wallet: <code>${tx.wallet}</code>\n` +
        `📌 Status: <b>Approved</b>\n` +
        `📅 ${new Date().toLocaleString()}`
    );
}

async function notifyWithdrawalRejected(user, tx) {
    await sendTelegram(
        `❌ <b>WITHDRAWAL REJECTED</b>\n\n` +
        `👤 User: <b>${user.name}</b>\n` +
        `📧 Email: ${user.email}\n` +
        `💵 Amount Refunded: <b>$${money(tx.amount)}</b>\n` +
        `📂 Source: <b>${tx.withdrawalType || "N/A"}</b>\n` +
        `🌐 Network: <b>${tx.network}</b>\n` +
        `👛 Wallet: <code>${tx.wallet}</code>\n` +
        `📌 Status: <b>Rejected / Refunded</b>\n` +
        `📅 ${new Date().toLocaleString()}`
    );
}

module.exports = {
    notifyNewUser,
    notifyDepositVerified,
    notifyDepositApproved,
    notifyDepositRejected,
    notifyWithdrawalRequested,
    notifyWithdrawalApproved,
    notifyWithdrawalRejected
};
