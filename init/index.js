const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const mongoUrl = "mongodb://127.0.0.1:27017/WanderLust";

main()
.then(async () => {
    console.log("Connected to DB");
    await initDB();    
})
.catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(mongoUrl);
}

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data.map((obj) => ({...obj,owner:"njopk"}));
    await Listing.insertMany(initData.data);
    console.log("Data was initialized!!");
};
initDB();