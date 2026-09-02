const express = require("express");

const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Settings = require("../models/Settings");

const { sendMail } = require("../utils/mailer");

const auth = require("../middleware/auth");

const crypto = require("crypto");

const {
    notifyNewUser,
    notifyDepositVerified,
    notifyDepositApproved,
    notifyDepositRejected,
    notifyWithdrawalRequested,
    notifyWithdrawalApproved,
    notifyWithdrawalRejected
} = require("../telegram/telegramNotify");
// =========================
// REGISTER
// =========================

router.post("/signup", async (req, res) => {

    try {

        const {
    username,
    email,
    password,
    referralCode: referredByCode
} = req.body;

        console.log("Signup request:", {
    username,
    email,
    referralCode: referredByCode
});

        if (!username || !email || !password) {

            return res.status(400).json({

                error: "All fields are required."

            });

        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {

            return res.status(400).json({

                error: "Email already exists."

            });

        }

        const passwordHash = await bcrypt.hash(password, 10);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

        const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const user = new User({
    name: username,
    email,
    passwordHash,
    emailVerified: false,
    otp,
    otpExpires,

    // User B's own referral code
    referralCode,

    // User A's referral code
    referredBy: referredByCode || null
});
        await user.save();

        await notifyNewUser(user);

        await sendMail({

            from: process.env.EMAIL_FROM,

            to: email,

            subject: "GWANDU Email Verification",

            html: `
                <h2>Verify Your Email</h2>

                <p>Your verification code is:</p>

                <h1>${otp}</h1>

                <p>This code expires in 5 minutes.</p>
            `

        });

        res.json({

    message: "Account created successfully.",

    requiresVerification: true,

    email

});
    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            error: "Server error"

        });

    }

});
// =========================
// LOGIN
// =========================

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

console.log("Login Email:", email);
console.log("User Found:", user);

if (!user) {
    return res.status(400).json({
        error: "Invalid email or password"
    });
}

if (user.isBlocked) {
    return res.status(403).json({
        error: "Your account has been blocked."
    });
}
        if (!user.emailVerified) {
            // Generate a new OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString();

user.otp = otp;
user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

await user.save();

// Send OTP email
await sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Verify your GWANDU account",
    html: `
    <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:40px;">
      <div style="max-width:600px;margin:auto;background:#111827;color:white;padding:40px;border-radius:12px;">

        <h1 style="color:#fbbf24;">GWANDU</h1>

        <h2>Verify your account</h2>

        <p>Welcome to GWANDU.</p>

        <p>Your verification code is:</p>

        <h1 style="
            font-size:46px;
            letter-spacing:8px;
            color:#60a5fa;
        ">${otp}</h1>

        <p>This code expires in <b>5 minutes</b>.</p>

        <hr>

        <p style="color:#cbd5e1;">
        If you didn't create this account,
        simply ignore this email.
        </p>

      </div>
    </div>
    `
});
return res.status(403).json({
    error: "Please verify your email first.",
    requiresVerification: true,
    email: user.email
});
        }

        const valid = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!valid) {
            return res.status(400).json({
                error: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

});
// =========================
// FORGOT PASSWORD
// =========================

router.post("/forgot-password", async (req, res) => {

    try {

        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(404).json({
                error: "Email not found."
            });

        }

        const token = crypto.randomBytes(32).toString("hex");

        user.resetPasswordToken = token;

        user.resetPasswordExpires =
            Date.now() + 5 * 60 * 1000; // 5 minutes

        await user.save();

        const resetLink =
`${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

        await sendMail({

            from: process.env.EMAIL_FROM,

            to: user.email,

            subject: "Reset your GWANDU password",

            html: `
                <h2>Password Reset</h2>

                <p>Click the link below to reset your password.</p>

                <a href="${resetLink}">
                    Reset Password
                </a>

                <p>This link expires in 5 minutes.</p>
            `

        });

        res.json({
            message: "Password reset email sent."
        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

});
// =========================
// RESET PASSWORD
// =========================
router.post("/reset-password", async (req, res) => {

    try {

        const { token, password } = req.body;

        const user = await User.findOne({

            resetPasswordToken: token,

            resetPasswordExpires: { $gt: Date.now() }

        });

        if (!user) {

            return res.status(400).json({

                error: "Reset link has expired."

            });

        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        user.passwordHash = hashedPassword;

        user.resetPasswordToken = null;

        user.resetPasswordExpires = null;

        await user.save();

        res.json({

            message: "Password reset successful."

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            error: "Server error"

        });

    }

});
// =========================
// VERIFY OTP
// =========================

router.post("/verify-otp", async (req, res) => {

    try {

        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(404).json({
                error: "User not found"
            });

        }

        if (user.otp !== otp) {

            return res.status(400).json({
                error: "Invalid OTP"
            });

        }

        if (user.otpExpires < Date.now()) {

            return res.status(400).json({
                error: "OTP has expired"
            });

        }

        user.emailVerified = true;

        user.otp = null;
        user.otpExpires = null;

        await user.save();

        const token = jwt.sign(

            { id: user._id },

            process.env.JWT_SECRET,

            {
                expiresIn: "7d"
            }

        );

        res.json({

            message: "Email verified successfully",

            token,

            user

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

});
// =========================
// RESEND OTP
// =========================
router.post("/resend-otp", async (req, res) => {

    try {

        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.otp = otp;
        user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

        await user.save();

        await sendMail({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: "Verify your GWANDU Account",
            html: `
                <div style="font-family:Arial,sans-serif;background:#0d1321;padding:40px;color:#fff">
                    <h1 style="color:#fbbf24;">Welcome to GWANDU</h1>

                    <p>Your verification code is:</p>

                    <h2 style="font-size:42px;color:#60a5fa;letter-spacing:8px;">
                        ${otp}
                    </h2>

                    <p><b>This code expires in 5 minutes.</b></p>

                    <hr>

                    <p>If you didn't request this code, ignore this email.</p>
                </div>
            `
        });

        res.json({
            message: "A new OTP has been sent."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

});
// =========================
// GET CURRENT USER
// =========================

router.get("/me", async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: "No token"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

 // =========================
// CALCULATE INVESTMENT DATA
// =========================

const investments = Array.isArray(user.investments)
    ? user.investments
    : [];

const activeInvestments = investments.filter(
    investment =>
        investment.status === "Active"
);

let totalInvestment = 0;
let totalDailyEarnings = 0;

activeInvestments.forEach(investment => {

    totalInvestment += Number(
        investment.amount || 0
    );

    totalDailyEarnings += Number(
        investment.dailyEarnings || 0
    );

});

// =========================
// OVERALL INVESTMENT PROGRESS
// BASED ON WHOLE CALENDAR DAYS
// =========================

let progress = 0;

if (activeInvestments.length > 0) {

    let progressTotal = 0;

    activeInvestments.forEach(investment => {

        const start = new Date(investment.startDate);
        const end = new Date(investment.endDate);
        const today = new Date();

        // Remove hours, minutes and seconds.
        // Progress is based only on calendar dates.
        const startDate = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate()
        );

        const endDate = new Date(
            end.getFullYear(),
            end.getMonth(),
            end.getDate()
        );

        const currentDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

        // Total number of calendar days in the plan
        const totalDays = Math.max(
            1,
            Math.round(
                (endDate - startDate) / (1000 * 60 * 60 * 24)
            )
        );

        // Number of whole calendar days that have passed
        let daysElapsed = Math.floor(
            (currentDate - startDate) /
            (1000 * 60 * 60 * 24)
        );

        // Keep the value within the plan duration
        daysElapsed = Math.max(
            0,
            Math.min(daysElapsed, totalDays)
        );

        // Calculate progress from DAYS, not money/profit
        let investmentProgress =
            (daysElapsed / totalDays) * 100;

        investmentProgress = Math.max(
            0,
            Math.min(investmentProgress, 100)
        );

        progressTotal += investmentProgress;
    });

    // Average progress of all active investments
    progress = Math.floor(
        progressTotal / activeInvestments.length
    );
}

// =========================
// RETURN DATA TO DASHBOARD
// =========================

const userData = user.toObject();

userData.progress = progress;

userData.activeInvestments =
    activeInvestments;

userData.activeInvestmentCount =
    activeInvestments.length;

userData.totalActiveInvestment =
    totalInvestment;

userData.totalDailyEarnings =
    totalDailyEarnings;
    
res.json(userData);

    } catch (err) {

        console.error(err);

        res.status(401).json({
            error: "Invalid token"
        });

    }

});

// =========================
// ADMIN LOGIN
// =========================

router.post("/admin/login", (req, res) => {

    const { email, password } = req.body;

    if (
        email === process.env.ADMIN_EMAIL &&
        password === process.env.ADMIN_PASSWORD
    ) {

        const token = jwt.sign(
            {
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.json({
            message: "Admin login successful",
            token
        });

    }

    res.status(401).json({
        error: "Invalid admin credentials"
    });

});

// =========================
// ADMIN AUTH MIDDLEWARE
// =========================

function adminAuth(req, res, next) {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: "No token"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "admin") {
            return res.status(403).json({
                error: "Unauthorized"
            });
        }

        req.admin = decoded;

        next();

    } catch (err) {

        return res.status(401).json({
            error: "Invalid token"
        });

    }

}

// =========================
// ADMIN DASHBOARD STATS
// =========================

router.get("/admin/stats", async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                error: "No token"
            });

        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "admin") {

            return res.status(403).json({
                error: "Unauthorized"
            });

        }

        const users = await User.find();

        console.log("USERS FOUND:", users.length);

users.forEach(user => {
    console.log(user.email);
});

        const totalUsers = users.length;

        const totalBalance = users.reduce(
            (sum, user) => sum + (user.balance || 0),
            0
        );

        const activeInvestments = users.filter(
            user => user.investmentStatus === "Active"
        ).length;

        const pendingWithdrawals = users.reduce(
            (sum, user) =>
                sum + (user.pendingWithdrawal || 0),
            0
        );

        res.json({

            totalUsers,

            totalBalance,

            activeInvestments,

            pendingWithdrawals

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            error: "Server error"

        });

    }

});

// =========================
// ADMIN DASHBOARD
// =========================

router.get("/admin/dashboard", async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                error: "No token"
            });

        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "admin") {

            return res.status(403).json({
                error: "Unauthorized"
            });

        }

        const users = await User.find();

        const totalUsers = users.length;

        let totalDeposits = 0;
        let totalInvestments = 0;
        let totalBalance = 0;

        users.forEach(user => {

            totalBalance += user.balance || 0;

            totalInvestments += Array.isArray(user.investments)
    ? user.investments.reduce(
        (sum, investment) =>
            sum + (
                investment.status === "Active"
                    ? Number(investment.amount) || 0
                    : 0
            ),
        0
      )
    : 0;

            if (Array.isArray(user.transactions)) {

                user.transactions.forEach(tx => {

                    if (tx.type === "Deposit") {

                        totalDeposits += tx.amount || 0;

                    }

                });

            }

        });

        res.json({

            totalUsers,

            totalDeposits,

            totalInvestments,

            totalBalance,

            users

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            error: "Server error"

        });

    }

});

// =========================
// ADMIN USERS
// =========================

router.get("/admin/users", adminAuth, async (req, res) => {

    try {

        const users = await User.find().select("-passwordHash");

        res.json(users);

    } catch (err) {

        console.error(err);

        res.status(500).json({

            error: "Server error"

        });

    }

});

// =========================
// CREDIT USER
// =========================

router.post("/admin/credit/:id", adminAuth, async (req, res) => {

    try {

        const { amount } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {

            return res.status(404).json({
                error: "User not found"
            });

        }

        user.balance = (user.balance || 0) + Number(amount);

        await user.save();

        res.json({
            success: true,
            balance: user.balance
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

});

router.post("/admin/deduct/:id", adminAuth, async (req, res) => {

    try {

        const { amount } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {

            return res.status(404).json({
                error: "User not found"
            });

        }

        // Referral withdrawal
if (type === "Referral") {

    if (user.referralBalance < amount) {

        return res.status(400).json({
            error: "Insufficient referral balance"
        });

    }

    user.referralBalance -= Number(amount);

}

// Investment withdrawal
else if (type === "Investment") {

    if (user.investmentStatus !== "Completed") {

        return res.status(400).json({
            error: "Investment has not matured yet."
        });

    }

    // =========================
// MAIN BALANCE
// =========================
if (type === "Balance") {

    if (user.balance < amount)
        return res.status(400).json({
            error: "Insufficient balance"
        });

    user.balance -= Number(amount);

}

// =========================
// REFERRAL BALANCE
// =========================
else if (type === "Referral") {

    if (user.referralBalance < amount)
        return res.status(400).json({
            error: "Insufficient referral balance"
        });

    user.referralBalance -= Number(amount);

}

// =========================
// INVESTMENT PROFIT
// =========================
else if (type === "Profit") {

    const completedInvestments = user.investments.filter(
        investment => investment.status === "Completed"
    );

    if (completedInvestments.length === 0) {
        return res.status(400).json({
            error: "No matured investment profit available."
        });
    }

    const availableProfit = completedInvestments.reduce(
        (total, investment) =>
            total + Number(investment.availableProfit || 0),
        0
    );

    if (availableProfit < Number(amount)) {
        return res.status(400).json({
            error: "Insufficient available investment profit."
        });
    }

    let remaining = Number(amount);

    // Deduct from completed investments
    for (const investment of completedInvestments) {

        if (remaining <= 0) break;

        const profit = Number(investment.availableProfit || 0);

        const deduction = Math.min(profit, remaining);

        investment.availableProfit -= deduction;

        remaining -= deduction;
    }

    // Keep old field synchronized
    user.availableProfit = Math.max(
        0,
        availableProfit - Number(amount)
    );
}

else {

    return res.status(400).json({
        error: "Invalid withdrawal type."
    });

}
}

else {

    return res.status(400).json({
        error: "Invalid withdrawal type"
    });

}
        await user.save();

        res.json({
            message: "Balance deducted successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

});

router.post("/admin/block/:id", adminAuth, async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        if (!user) {

            return res.status(404).json({
                error: "User not found"
            });

        }

        user.isBlocked = !user.isBlocked;

        await user.save();

        res.json({
            message: user.isBlocked ? "User blocked" : "User unblocked"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

});

router.delete("/admin/delete/:id", adminAuth, async (req, res) => {

    try {

        await User.findByIdAndDelete(req.params.id);

        res.json({
            message: "User deleted"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

});

// =========================
// GET ALL PENDING DEPOSITS
// =========================

router.get("/admin/pending-deposits", adminAuth, async (req, res) => {

    try {

        const users = await User.find();

        let deposits = [];

        users.forEach(user => {

            if (!Array.isArray(user.transactions)) return;

            user.transactions.forEach(tx => {

                if (
                    tx.type === "Deposit" &&
                    tx.status === "Pending"
                ) {

                    deposits.push({

                        userId: user._id,

                        transactionId: tx._id,

                        name: user.name,

                        email: user.email,

                        amount: tx.amount,

                        network: tx.network,

                        txHash: tx.txHash || "-"

                    });

                }

            });

        });

        res.json(deposits);

    }

    catch(err){

        console.error(err);

        res.status(500).json({

            error:"Server error"

        });

    }

});

// =========================
// APPROVE DEPOSIT
// =========================

router.post("/admin/approve/:userId/:transactionId", adminAuth, async (req, res) => {

    try {

        const user = await User.findById(req.params.userId);

        if (!user) {

            return res.status(404).json({
                error: "User not found"
            });

        }

        const tx = user.transactions.id(req.params.transactionId);

        if (!tx) {

            return res.status(404).json({
                error: "Transaction not found"
            });

        }

        if (tx.status === "Completed" || tx.status === "Approved") {

            return res.json({
                message: "Already approved"
            });

        }

        /*
         * Blockchain verification is required before approval
         * for every supported cryptocurrency network.
         */
        const blockchainNetworks = [
            "BTC",
            "ERC20",
            "BEP20",
            "TRC20",
            "SOL",
            "TON",
            "ARBITRUM"
        ];

        if (
            blockchainNetworks.includes(tx.network) &&
            tx.verificationStatus !== "Verified"
        ) {

            return res.status(400).json({
                error:
                    "This deposit has not passed blockchain verification"
            });

        }

        tx.status = "Approved";
        tx.approved = true;

        user.balance += Number(tx.amount);

        await user.save();

        await notifyDepositApproved(
            user,
            tx
        );

        res.json({

            message: "Deposit approved successfully"

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            error: "Server error"

        });

    }

});

// =========================
// REJECT DEPOSIT
// =========================

router.post("/admin/reject/:userId/:transactionId", adminAuth, async (req, res) => {

    try {

        const user = await User.findById(req.params.userId);

        if (!user) {

            return res.status(404).json({
                error: "User not found"
            });

        }

        const tx = user.transactions.id(req.params.transactionId);

        if (!tx) {

            return res.status(404).json({
                error: "Transaction not found"
            });

        }

        tx.status = "Rejected";

        await user.save();

        await notifyDepositRejected(
            user,
            tx
        );

        res.json({

            message: "Deposit rejected"

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            error: "Server error"

        });

    }

});

// =========================
// GET USER TRANSACTIONS
// =========================

router.get("/transactions", async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: "No token"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        res.json(user.transactions || []);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

});

// =========================
// VERIFY DEPOSIT
// =========================

router.post("/verify-deposit", async (req, res) => {

    try {

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: "No token"
            });
        }

        const token =
            authHeader.split(" ")[1];

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        const user =
            await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        const {
            amount,
            network,
            txHash
        } = req.body;

        const requestedUsd =
            Number(amount);

        const cleanTxHash =
            String(txHash || "").trim();

        if (
            !requestedUsd ||
            requestedUsd <= 0
        ) {
            return res.status(400).json({
                error: "Invalid investment amount"
            });
        }

        if (
            !network ||
            !cleanTxHash
        ) {
            return res.status(400).json({
                error:
                    "Network and transaction hash are required"
            });
        }

        const supportedNetworks = [
            "BTC",
            "ERC20",
            "BEP20",
            "TRC20",
            "SOL",
            "TON",
            "ARBITRUM"
        ];

        if (
            !supportedNetworks.includes(network)
        ) {
            return res.status(400).json({
                error: "Unsupported deposit network"
            });
        }

        /*
         * Prevent TX reuse across the entire database.
         */
        const duplicateTx =
            await User.findOne({
                "transactions.txHash":
                    cleanTxHash
            });

        if (duplicateTx) {
            return res.status(400).json({
                error:
                    "This transaction has already been submitted"
            });
        }

        /*
         * Backend-controlled destination wallets.
         * Frontend wallet display remains hardcoded/read-only,
         * but verification NEVER trusts the frontend wallet.
         */
        const wallets = {

            ERC20:
                process.env.USDT_ERC20,

            BEP20:
                process.env.USDT_BEP20,

            TRC20:
                process.env.USDT_TRC20,

            BTC:
                process.env.BTC_WALLET,

            SOL:
                process.env.SOL_WALLET,

            TON:
                process.env.TON_WALLET,

            ARBITRUM:
                process.env.ARBITRUM_WALLET

        };

        const destinationWallet =
            wallets[network];

        if (!destinationWallet) {
            return res.status(500).json({
                error:
                    "Deposit wallet is not configured on the server"
            });
        }

        const {
            verifyDeposit
        } =
            require("../utils/depositVerifier");

        /*
         * REAL BLOCKCHAIN VERIFICATION
         */
        const verification =
            await verifyDeposit({

                network,

                txHash:
                    cleanTxHash,

                destinationWallet,

                requestedUsd

            });

        if (!verification.verified) {

            return res.status(400).json({
                error:
                    "Blockchain verification failed"
            });
        }

        /*
         * Blockchain passed.
         *
         * Keep status Pending because the existing
         * 5-minute waiting page and admin approval flow
         * remain in place.
         */
        user.transactions.push({

            type:
                "Deposit",

            amount:
                requestedUsd,

            network,

            wallet:
                destinationWallet,

            txHash:
                cleanTxHash,

            status:
                "Pending",

            approved:
                false,

            verificationStatus:
                "Verified",

            requestedUsd,

            btcUsdRate:
                network === "BTC"
                    ? verification.priceUsd
                    : 0,

            requiredCryptoAmount:
                verification.requiredCryptoAmount,

            receivedCryptoAmount:
                verification.cryptoAmount,

            receivedUsdValue:
                verification.usdValue,

            destinationWallet,

            confirmations:
                verification.confirmations,

            verifiedAt:
                new Date(),

            date:
                new Date()

        });

        const verifiedTransaction =
            user.transactions[user.transactions.length - 1];

        await user.save();

        await notifyDepositVerified(
            user,
            verifiedTransaction
        );

        return res.json({

            message:
                "Payment verified successfully. Your deposit is now pending admin approval.",

            verificationStatus:
                "Verified",

            network,

            asset:
                verification.asset,

            receivedCryptoAmount:
                verification.cryptoAmount,

            requiredCryptoAmount:
                verification.requiredCryptoAmount,

            receivedUsdValue:
                verification.usdValue,

            confirmations:
                verification.confirmations

        });

    }
    catch (err) {

        console.error(
            "DEPOSIT VERIFICATION ERROR:",
            err
        );

        return res.status(400).json({
            error:
                err.message ||
                "Blockchain verification failed"
        });

    }

});
// =========================
// USER WITHDRAW
// =========================
router.post("/withdraw", auth, async (req, res) => {

    try {

        const user = await User.findById(req.userId);

        if (!user)
            return res.status(404).json({
                error: "User not found"
            });

        const {
            type,
            network,
            wallet,
            amount
        } = req.body;

        const withdrawalAmount = Number(amount);

        if (!wallet || !network)
            return res.status(400).json({
                error: "Wallet and network are required."
            });

        if (!Number.isFinite(withdrawalAmount) || withdrawalAmount <= 0)
            return res.status(400).json({
                error: "Invalid withdrawal amount."
            });

        // =========================
        // MAIN BALANCE
        // =========================
        if (type === "Balance") {

            if (Number(user.balance || 0) < withdrawalAmount)
                return res.status(400).json({
                    error: "Insufficient main balance."
                });

            user.balance -= withdrawalAmount;

        }

        // =========================
        // REFERRAL BALANCE
        // =========================
        else if (type === "Referral") {

            if (Number(user.referralBalance || 0) < withdrawalAmount)
                return res.status(400).json({
                    error: "Insufficient referral balance."
                });

            user.referralBalance -= withdrawalAmount;

        }

        // =========================
        // INVESTMENT PROFIT
        // =========================
        else if (type === "Profit") {

            if (Number(user.availableProfit || 0) < withdrawalAmount)
                return res.status(400).json({
                    error: "Insufficient available profit."
                });

            user.availableProfit -= withdrawalAmount;

            // Keep completed investment profit records synchronized.
            let remaining = withdrawalAmount;

            for (const investment of user.investments) {

                if (remaining <= 0)
                    break;

                if (investment.status !== "Completed")
                    continue;

                const available =
                    Number(investment.availableProfit || 0);

                const deduction =
                    Math.min(available, remaining);

                investment.availableProfit -= deduction;

                remaining -= deduction;
            }

        }

        else {

            return res.status(400).json({
                error: "Invalid withdrawal type."
            });

        }

        // =========================
        // CREATE PENDING WITHDRAWAL
        // =========================
        user.transactions.push({

            type: "Withdrawal",

            withdrawalType: type,

            amount: withdrawalAmount,

            network,

            wallet,

            status: "Pending",

            date: new Date()

        });

        user.pendingWithdrawal =
            Number(user.pendingWithdrawal || 0) +
            withdrawalAmount;

        const withdrawalTransaction =
            user.transactions[user.transactions.length - 1];

        await user.save();

        await notifyWithdrawalRequested(
            user,
            withdrawalTransaction
        );

        res.json({
            message: "Withdrawal request submitted."
        });

    } catch (err) {

        console.error("Withdrawal error:", err);

        res.status(500).json({
            error: "Server error"
        });

    }

});

// // =========================
// ACTIVATE PLAN
// =========================
router.post("/activate-plan", auth, async (req, res) => {

    try {
const user = await User.findById(req.userId);

        if (!user)
            return res.status(404).json({
                error: "User not found"
            });

        const { amount } = req.body;

        if (user.balance < amount)
            return res.status(400).json({
                error: "Insufficient balance"
            });
// Deduct investment
user.balance -= Number(amount);

const startDate = new Date();

const endDate = new Date(
    Date.now() + (30 * 24 * 60 * 60 * 1000)
);

const dailyEarnings = Number(amount) * 0.20;

// Add a new investment instead of replacing the previous one
user.investments.push({

    amount: Number(amount),

    dailyEarnings: dailyEarnings,

    startDate: startDate,

    endDate: endDate,

    status: "Active",

    lastEarningDate: startDate,

    totalEarned: 0,

    availableProfit: 0

});

        user.transactions.push({
            type: "Investment",
            amount,
            status: "Active",
            date: new Date()
        });

        // Referral bonus
        if (user.referredBy && !user.referralPaid) {

            const referrer = await User.findOne({
                referralCode: user.referredBy
            });

            if (referrer) {

                let commission = 0;

                switch (Number(amount)) {

                    case 3000: commission = 600; break;
                    case 5000: commission = 1200; break;
                    case 10000: commission = 1800; break;
                    case 25000: commission = 2400; break;
                    case 50000: commission = 3000; break;
                    case 100000: commission = 3600; break;
                    case 500000: commission = 4200; break;
                    case 2000000: commission = 4800; break;

                }

                referrer.referralBalance += commission;

                referrer.transactions.push({
                    type: "Referral Bonus",
                    amount: commission,
                    status: "Completed",
                    date: new Date()
                });

                referrer.referrals.push(user.email);

                await referrer.save();

                user.referralPaid = true;
            }
        }

        await user.save();

        res.json({
            message: "Investment activated successfully."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

});

// =========================
// ADMIN PENDING WITHDRAWALS
// =========================
router.get("/admin/pending-withdrawals", adminAuth, async (req, res) => {

    try {

        const users = await User.find();

        let withdrawals = [];

        users.forEach(user => {

            if (!Array.isArray(user.transactions)) return;

            user.transactions.forEach(tx => {

                if (
                    tx.type === "Withdrawal" &&
                    tx.status === "Pending"
                ) {

                    withdrawals.push({

                        userId: user._id,

                        transactionId: tx._id,

                        name: user.name,

                        email: user.email,

                        amount: tx.amount,

                        withdrawalType: tx.withdrawalType,

                        network: tx.network,

                        wallet: tx.wallet,

                        date: tx.date

                    });

                }

            });

        });

        // Sort newest withdrawals first
        withdrawals.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        // Newest withdrawals first
        withdrawals.sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        console.log("Pending Withdrawals:", withdrawals);

        res.json(withdrawals);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

});

// =========================
// ADMIN APPROVE WITHDRAWAL
// =========================
router.post("/admin/approve-withdrawal/:userId/:transactionId", adminAuth, async (req, res) => {

    try {

        const user = await User.findById(req.params.userId);

        if (!user)
            return res.status(404).json({
                error: "User not found"
            });

        const tx = user.transactions.id(req.params.transactionId);

        if (!tx)
            return res.status(404).json({
                error: "Transaction not found"
            });

        if (tx.type !== "Withdrawal")
            return res.status(400).json({
                error: "This transaction is not a withdrawal."
            });

        if (tx.status !== "Pending")
            return res.status(400).json({
                error: `Withdrawal is already ${tx.status}.`
            });

        tx.status = "Approved";
        tx.approved = true;

        user.pendingWithdrawal = Math.max(
            0,
            Number(user.pendingWithdrawal || 0) -
            Number(tx.amount || 0)
        );

        await user.save();

        await notifyWithdrawalApproved(
            user,
            tx
        );

        res.json({
            message: "Withdrawal approved."
        });

    } catch (err) {

        console.error("Approve withdrawal error:", err);

        res.status(500).json({
            error: "Server error"
        });

    }

});


// =========================
// ADMIN REJECT WITHDRAWAL
// =========================
router.post("/admin/reject-withdrawal/:userId/:transactionId", adminAuth, async (req, res) => {

    try {

        const user = await User.findById(req.params.userId);

        if (!user)
            return res.status(404).json({
                error: "User not found"
            });

        const tx = user.transactions.id(req.params.transactionId);

        if (!tx)
            return res.status(404).json({
                error: "Transaction not found"
            });

        if (tx.type !== "Withdrawal")
            return res.status(400).json({
                error: "This transaction is not a withdrawal."
            });

        if (tx.status !== "Pending")
            return res.status(400).json({
                error: `Withdrawal is already ${tx.status}.`
            });

        const amount = Number(tx.amount || 0);

        // =========================
        // REFUND ORIGINAL SOURCE
        // =========================
        if (tx.withdrawalType === "Balance") {

            user.balance =
                Number(user.balance || 0) + amount;

        }

        else if (tx.withdrawalType === "Referral") {

            user.referralBalance =
                Number(user.referralBalance || 0) + amount;

        }

        else if (tx.withdrawalType === "Profit") {

            user.availableProfit =
                Number(user.availableProfit || 0) + amount;

            // Restore the profit to completed investment records.
            let remaining = amount;

            for (const investment of user.investments) {

                if (remaining <= 0)
                    break;

                if (investment.status !== "Completed")
                    continue;

                investment.availableProfit =
                    Number(investment.availableProfit || 0);

                investment.availableProfit += remaining;

                remaining = 0;
            }

        }

        else {

            return res.status(400).json({
                error: "Unknown withdrawal source."
            });

        }

        tx.status = "Rejected";
        tx.approved = false;

        user.pendingWithdrawal = Math.max(
            0,
            Number(user.pendingWithdrawal || 0) - amount
        );

        await user.save();

        await notifyWithdrawalRejected(
            user,
            tx
        );

        res.json({
            message: "Withdrawal rejected and funds refunded."
        });

    } catch (err) {

        console.error("Reject withdrawal error:", err);

        res.status(500).json({
            error: "Server error"
        });

    }

});


// // =========================
// WITHDRAWAL HISTORY
// =========================
router.get("/withdraw-history", async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader)
            return res.status(401).json({
                error: "No token"
            });

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id);

        if (!user)
            return res.status(404).json({
                error: "User not found"
            });

        const withdrawals = user.transactions.filter(
            tx => tx.type === "Withdrawal"
        );

        res.json(withdrawals);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

});

// =========================
// DEPOSIT HISTORY
// =========================
router.get("/deposit-history", async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader)
            return res.status(401).json({
                error: "No token"
            });

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id);

        if (!user)
            return res.status(404).json({
                error: "User not found"
            });

        console.log("Logged-in User:", user.email);

console.log("All Transactions:");

console.log(user.transactions);

const deposits = user.transactions.filter(
    tx => tx.type === "Deposit"
);

console.log("Deposits Found:");

console.log(deposits);

res.json(deposits);
    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });

    }

});


// =========================
// ADMIN SETTINGS
// =========================

router.get("/admin/settings", adminAuth, async (req, res) => {

    try {

        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({});
        }

        res.json(settings);

    } catch (err) {

        console.error("GET SETTINGS ERROR:", err);

        res.status(500).json({
            error: "Server error"
        });

    }

});


// =========================
// UPDATE ADMIN SETTINGS
// =========================

router.post("/admin/settings", adminAuth, async (req, res) => {

    try {

        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({});
        }

        const allowedFields = [
            "companyName",
            "heroTitle",
            "heroSubtitle",
            "supportEmail",
            "supportPhone",
            "whatsapp",
            "btcWallet",
            "usdtTrc20",
            "usdtBep20",
            "usdtErc20",
            "solWallet",
            "tonWallet",
            "bankName",
            "bankAccountName",
            "bankAccountNumber"
        ];

        for (const field of allowedFields) {

            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                settings[field] = req.body[field];
            }

        }

        await settings.save();

        console.log("✅ Admin settings updated");

        res.json({
            message: "Settings updated successfully."
        });

    } catch (err) {

        console.error("UPDATE SETTINGS ERROR:", err);

        res.status(500).json({
            error: "Server error"
        });

    }

});


module.exports = router;

