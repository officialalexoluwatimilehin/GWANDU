const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({

    companyName: {
        type: String,
        default: "GWANDU"
    },

    heroTitle: {
        type: String,
        default: "Secure Your Financial Future"
    },

    heroSubtitle: {
        type: String,
        default: "Invest confidently with GWANDU."
    },

    supportEmail: {
        type: String,
        default: ""
    },

    supportPhone: {
        type: String,
        default: ""
    },

    whatsapp: {
        type: String,
        default: ""
    },

    telegram: {
        type: String,
        default: ""
    },

    facebook: {
        type: String,
        default: ""
    },

    instagram: {
        type: String,
        default: ""
    },

    twitter: {
        type: String,
        default: ""
    },

    btcWallet: {
        type: String,
        default: ""
    },

    usdtTrc20: {
        type: String,
        default: ""
    },

    usdtBep20: {
        type: String,
        default: ""
    },

    usdtErc20: {
        type: String,
        default: ""
    },

    solWallet: {
        type: String,
        default: ""
    },

    tonWallet: {
        type: String,
        default: ""
    },

    bankName: {
        type: String,
        default: ""
    },

    bankAccountName: {
        type: String,
        default: ""
    },

    bankAccountNumber: {
        type: String,
        default: ""
    }

});

module.exports = mongoose.model("Settings", settingsSchema);