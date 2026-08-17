const { Telegraf, Markup } = require("telegraf");
require("dotenv").config();

const connectDB = require("../config/database");
const User = require("../models/User");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const ADMIN_ID = String(process.env.TELEGRAM_ADMIN_ID);

function isAdmin(ctx) {
    return String(ctx.from?.id) === ADMIN_ID;
}

// =========================
// START
// =========================

bot.start(async (ctx) => {

    if (!isAdmin(ctx)) {
        return ctx.reply("⛔ Unauthorized.");
    }

    await ctx.reply(
        "🟢 GWANDU ADMIN BOT\n\n" +
        "Welcome, Admin.\n\n" +
        "Choose an option:",
        Markup.inlineKeyboard([
            [
                Markup.button.callback("📊 Dashboard", "dashboard")
            ],
            [
                Markup.button.callback("👥 Users", "users")
            ]
        ])
    );
});

// =========================
// DASHBOARD
// =========================

bot.action("dashboard", async (ctx) => {

    if (!isAdmin(ctx)) {
        return ctx.answerCbQuery("Unauthorized");
    }

    try {

        await ctx.answerCbQuery();

        const users = await User.find({});

        let totalUsers = users.length;
        let activeInvestments = 0;
        let totalInvested = 0;
        let pendingWithdrawals = 0;
        let pendingDeposits = 0;

        users.forEach(user => {

            // Investments
            if (Array.isArray(user.investments)) {

                user.investments.forEach(investment => {

                    if (investment.status === "Active") {

                        activeInvestments++;

                        totalInvested += Number(
                            investment.amount || 0
                        );

                    }

                });

            }

            // Transactions
            if (Array.isArray(user.transactions)) {

                user.transactions.forEach(transaction => {

                    if (
                        transaction.type === "Withdrawal" &&
                        transaction.status === "Pending"
                    ) {
                        pendingWithdrawals++;
                    }

                    if (
                        transaction.type === "Deposit" &&
                        transaction.status === "Pending"
                    ) {
                        pendingDeposits++;
                    }

                });

            }

        });

        await ctx.editMessageText(
            "📊 GWANDU ADMIN DASHBOARD\n\n" +

            `👥 Total Users: ${totalUsers}\n\n` +

            `📈 Active Investments: ${activeInvestments}\n` +

            `💰 Total Invested: $${totalInvested.toLocaleString()}\n\n` +

            `📥 Pending Deposits: ${pendingDeposits}\n` +

            `💸 Pending Withdrawals: ${pendingWithdrawals}`,
            
            Markup.inlineKeyboard([
                [
                    Markup.button.callback(
                        "🔄 Refresh",
                        "dashboard"
                    )
                ],
                [
                    Markup.button.callback(
                        "⬅️ Back",
                        "back"
                    )
                ]
            ])
        );

    } catch (err) {

    console.error("Dashboard error:", err);

    // Telegram throws this when Refresh produces
    // exactly the same message as before.
    if (
        err?.response?.error_code === 400 &&
        err?.response?.description?.includes("message is not modified")
    ) {
        return;
    }

    await ctx.reply("❌ Could not load users.");

}

});

// =========================
// USERS
// =========================

bot.action("users", async (ctx) => {

    if (!isAdmin(ctx)) {
        return ctx.answerCbQuery("Unauthorized");
    }

    try {

        await ctx.answerCbQuery();

        const users = await User.find({})
            .select("name email balance");

        let message =
            "👥 GWANDU USERS\n\n";

        if (users.length === 0) {

            message += "No users found.";

        } else {

            users.slice(0, 20).forEach((user, index) => {

                message +=
                    `${index + 1}. ${user.name}\n` +
                    `📧 ${user.email}\n` +
                    `💰 Balance: $${Number(
                        user.balance || 0
                    ).toLocaleString()}\n\n`;

            });

            if (users.length > 20) {

                message +=
                    `Showing first 20 of ${users.length} users.`;

            }

        }

        await ctx.editMessageText(
            message,
            Markup.inlineKeyboard([
                [
                    Markup.button.callback(
                        "🔄 Refresh",
                        "users"
                    )
                ],
                [
                    Markup.button.callback(
                        "⬅️ Back",
                        "back"
                    )
                ]
            ])
        );

    } catch (err) {

    console.error("Users error:", err);

    // Telegram throws this when Refresh produces
    // exactly the same message as before.
    if (
        err?.response?.error_code === 400 &&
        err?.response?.description?.includes("message is not modified")
    ) {
        return;
    }

    await ctx.reply("❌ Could not load users.");

}
});

// =========================
// BACK
// =========================

bot.action("back", async (ctx) => {

    if (!isAdmin(ctx)) {
        return ctx.answerCbQuery("Unauthorized");
    }

    await ctx.answerCbQuery();

    await ctx.editMessageText(
        "🟢 GWANDU ADMIN BOT\n\n" +
        "Choose an option:",
        Markup.inlineKeyboard([
            [
                Markup.button.callback(
                    "📊 Dashboard",
                    "dashboard"
                )
            ],
            [
                Markup.button.callback(
                    "👥 Users",
                    "users"
                )
            ]
        ])
    );

});

// =========================
// ERROR HANDLER
// =========================

bot.catch((err) => {

    console.error(
        "Telegram bot error:",
        err
    );

});

// =========================
// START BOT
// =========================

async function startBot() {

    try {

        await connectDB();

        console.log(
            "✅ Admin bot connected to MongoDB"
        );

        await bot.launch();

        console.log(
            "🤖 GWANDU Admin Bot is running"
        );

    } catch (err) {

        console.error(
            "❌ Admin bot failed:",
            err
        );

    }

}

startBot();

// =========================
// SHUTDOWN
// =========================

process.once(
    "SIGINT",
    () => bot.stop("SIGINT")
);

process.once(
    "SIGTERM",
    () => bot.stop("SIGTERM")
);