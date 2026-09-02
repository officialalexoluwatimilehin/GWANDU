const cron = require("node-cron");
const User = require("./models/User");

require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const { startAdminBot } = require("./telegram/adminBot");

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/database");

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.static(require("path").join(__dirname, "..")));

app.use("/api", authRoutes);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
// ================================
// DAILY EARNINGS ENGINE
// ================================

cron.schedule("0 0 * * *", async () => {

    try {

        console.log("Running Daily Earnings Engine...");

        const users = await User.find({
            "investments.status": "Active"
        });

        const today = new Date();

        for (const user of users) {

            let userChanged = false;

            for (const investment of user.investments) {

                if (investment.status !== "Active") {
                    continue;
                }

                // =========================
                // CHECK MATURITY
                // =========================

                if (today >= investment.endDate) {

    // Return original investment capital
    user.balance += investment.amount;

    // Keep accumulated profit available
    // for Profit withdrawal.

    // Mark investment as completed
                    // Record completion
                    user.transactions.push({

                        type: "Investment Completed",

                        amount: investment.amount,

                        status: "Completed",

                        date: today

                    });

                    investment.status = "Completed";

                    userChanged = true;

                    continue;
                }

                // =========================
                // PREVENT DOUBLE PAYMENT
                // =========================

                if (
                    investment.lastEarningDate &&
                    investment.lastEarningDate.toDateString() ===
                    today.toDateString()
                ) {

                    continue;

                }

                // =========================
                // PAY DAILY PROFIT
                // =========================

                const profit = Number(
    investment.dailyEarnings || 0
);

// Keep investment profit separate
user.totalEarned += profit;
user.availableProfit += profit;

investment.totalEarned += profit;
investment.availableProfit += profit;


                investment.lastEarningDate = today;

                user.transactions.push({

                    type: "Daily Profit",

                    amount: profit,

                    status: "Completed",

                    date: today

                });

                userChanged = true;

            }

            // =========================
            // UPDATE OLD DASHBOARD FIELDS
            // =========================

            const activeInvestments =
                user.investments.filter(
                    investment =>
                        investment.status === "Active"
                );

            user.activeInvestment =
                activeInvestments.reduce(
                    (total, investment) =>
                        total + Number(investment.amount || 0),
                    0
                );

            user.dailyEarnings =
                activeInvestments.reduce(
                    (total, investment) =>
                        total + Number(investment.dailyEarnings || 0),
                    0
                );

            if (activeInvestments.length > 0) {

                user.investmentStatus = "Active";

                user.activePlan = "Active";

            } else {

                user.investmentStatus = "Completed";

                user.activePlan = "Completed";

                user.dailyEarnings = 0;

                user.activeInvestment = 0;

            }

            if (userChanged) {
                await user.save();
            }

        }

        console.log("Daily Earnings Completed.");

    } catch (err) {

        console.error(
            "Daily Earnings Engine Error:",
            err
        );

    }

});    

    app.listen(PORT, () => {

        console.log(`🚀 Server running on port ${PORT}`);

        startAdminBot().catch(err => {

            console.error(
                "❌ Admin Telegram bot failed to start:",
                err
            );

        });

    });

});