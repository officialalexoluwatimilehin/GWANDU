const { v4: uuidv4 } = require("uuid");

class Database {
    constructor() {
        this.users = [];
        this.deposits = [];
        this.withdrawals = [];
        this.usedTxHashes = new Set();
    }

    createUser(user) {
        const newUser = {
            id: uuidv4(),
            ...user,
            balance: 0,
            bonus: 100,
            activeInvestment: 0,
            activePlan: null,
            dailyEarnings: 0,
            totalEarned: 0,
            referralBalance: 0,
            pendingWithdrawal: 0,
            transactions: [],
            createdAt: new Date().toISOString(),
            referralCode: Math.random().toString(36).substring(2,8).toUpperCase(),

referredBy: null,

referrals: [],
        };

        this.users.push(newUser);
        return newUser;
    }

    findUserByEmail(email) {
        return this.users.find(u => u.email === email);
    }

    findUserById(id) {
        return this.users.find(u => u.id === id);
    }
}

module.exports = new Database();