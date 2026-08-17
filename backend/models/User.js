const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({

    type: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        default: "Pending"
    },

    network: {
        type: String,
        default: ""
    },

    wallet: {
        type: String,
        default: ""
    },

    withdrawalType: {
        type: String,
        default: ""
    },

    txHash: {
        type: String,
        default: ""
    },

    approved: {
        type: Boolean,
        default: false
    },

    date: {
        type: Date,
        default: Date.now
    }

});
const userSchema = new mongoose.Schema({

    referredBy: {
    type: String,
    default: null
},

referralPaid: {
    type: Boolean,
    default: false
},
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    passwordHash: {
        type: String,
        required: true
    },

    emailVerified: {
    type: Boolean,
    default: false
},

otp: {
    type: String,
    default: null
},

otpExpires: {
    type: Date,
    default: null
},

verificationAttempts: {
    type: Number,
    default: 0
},

    balance: {
        type: Number,
        default: 0
    },

    bonus: {
        type: Number,
        default: 100
    },

    investments: [{
    amount: {
        type: Number,
        required: true
    },

    dailyEarnings: {
        type: Number,
        default: 0
    },

    startDate: {
        type: Date,
        default: Date.now
    },

    endDate: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        default: "Active"
    },

    lastEarningDate: {
        type: Date,
        default: null
    },

    totalEarned: {
        type: Number,
        default: 0
    },

    availableProfit: {
        type: Number,
        default: 0
    }
}],

    activeInvestment: {
        type: Number,
        default: 0
    },

    activePlan: {
        type: String,
        default: null
    },

    dailyEarnings: {
        type: Number,
        default: 0

    },

    lastEarningDate: {
         type: Date,
         default: null

    },
    
    investmentStartDate: {
    type: Date,
    default: null
},

investmentEndDate: {
    type: Date,
    default: null
},

investmentStatus: {
    type: String,
    default: "Inactive"
},

    totalEarned: {
        type: Number,
        default: 0
    },

    availableProfit: {
    type: Number,
    default: 0
},

    referralCode: {
        type: String,
        unique: true
    },

    referralBalance: {
        type: Number,
        default: 0
    },

    referrals: [{
        type: String
    }],

    pendingWithdrawal: {
        type: Number,
        default: 0
    },

   transactions: [transactionSchema],

resetPasswordToken: {
    type: String,
    default: null
},

resetPasswordExpires: {
    type: Date,
    default: null
}

}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);