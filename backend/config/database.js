const mongoose = require("mongoose");

async function connectDB() {

    try {

        await mongoose.connect(process.env.MONGO_URI, {

            serverSelectionTimeoutMS: 5000,

            socketTimeoutMS: 45000

        });

        console.log("✅ MongoDB Connected");

    } catch (err) {

        console.error("❌ MongoDB Connection Failed");

        console.error(err);

        process.exit(1);

    }

}

mongoose.connection.on("disconnected", () => {

    console.log("⚠ MongoDB disconnected... reconnecting");

    connectDB();

});

mongoose.connection.on("error", err => {

    console.log("MongoDB Error:", err.message);

});

module.exports = connectDB;