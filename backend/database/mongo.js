const mongoose = require("mongoose");

async function connectDB() {

    try {

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000
        });

        console.log("✅ MongoDB Connected");

    } catch (err) {

        console.error("❌ MongoDB Connection Failed");
        console.error(err);

        process.exit(1);

    }

}

module.exports = connectDB;