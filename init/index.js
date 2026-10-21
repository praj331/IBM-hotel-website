const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const mongoUrl = "mongodb://127.0.0.1:27017/WanderLust";

// City coordinates mapping for accurate map markers
const cityMap = {
    malibu: [-118.7798, 34.0259],
    "new york": [-73.9851, 40.7488],
    aspen: [-106.8175, 39.1911],
    florence: [11.2558, 43.7696],
    tuscany: [11.2558, 43.7696],
    portland: [-122.6784, 45.5152],
    cancun: [-86.8515, 21.1619],
    boston: [-71.0589, 42.3601],
    costa: [-84.0739, 9.7489],
    london: [-0.1276, 51.5074],
    paris: [2.3522, 48.8566],
    tokyo: [139.6917, 35.6895],
    mumbai: [72.8777, 19.076],
    delhi: [77.209, 28.6139],
    jaipur: [75.7873, 26.9124],
    goa: [74.124, 15.2993],
    dubai: [55.2708, 25.2048],
    maldives: [73.5093, 4.1755],
    bali: [115.1889, -8.4095],
    switzerland: [8.2275, 46.8182],
    greece: [23.7275, 37.9838],
    scotland: [-4.2026, 56.4907],
    thailand: [100.5018, 13.7563],
    phuket: [98.3923, 7.8804],
    charleston: [-79.9311, 32.7765],
    banff: [-115.5708, 51.1784],
    montana: [-110.3626, 46.8797],
    miami: [-80.1918, 25.7617],
    amsterdam: [4.9041, 52.3676],
    cotswolds: [-1.8433, 51.833],
};

function assignCategory(title, desc) {
    const text = (title + " " + desc).toLowerCase();
    if (text.includes("mountain") || text.includes("ski") || text.includes("aspen") || text.includes("banff")) {
        return "Mountains";
    }
    if (text.includes("castle")) return "Castles";
    if (text.includes("beach") || text.includes("pool") || text.includes("island") || text.includes("maldives")) {
        return "Amazing Pools";
    }
    if (text.includes("treehouse") || text.includes("camp") || text.includes("tent") || text.includes("cabin")) {
        return "Camping";
    }
    if (text.includes("farm") || text.includes("vineyard") || text.includes("ranch")) {
        return "Farms";
    }
    if (text.includes("loft") || text.includes("apartment") || text.includes("brownstone") || text.includes("downtown")) {
        return "Iconic Cities";
    }
    if (text.includes("arctic") || text.includes("snow") || text.includes("igloo")) {
        return "Arctic";
    }
    if (text.includes("boat") || text.includes("canal") || text.includes("yacht")) {
        return "Boats";
    }
    if (text.includes("dome")) return "Domes";
    if (text.includes("room") || text.includes("bed")) return "Rooms";
    return "Trending";
}

function getCoords(location, country) {
    const loc = ((location || "") + " " + (country || "")).toLowerCase();
    for (const key of Object.keys(cityMap)) {
        if (loc.includes(key)) {
            return cityMap[key];
        }
    }
    return [77.209, 28.6139];
}

async function main() {
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB");

    // Ensure a default user exists
    let user = await User.findOne({ username: "prajakta" });
    if (!user) {
        user = await User.findOne();
    }
    if (!user) {
        const newUser = new User({ email: "admin@wanderlust.com", username: "wanderlust_admin" });
        user = await User.register(newUser, "admin123");
        console.log("Created admin user:", user.username);
    } else {
        console.log("Using existing user as default owner:", user.username);
    }

    await Listing.deleteMany({});
    const preparedData = initData.data.map((obj) => {
        const category = assignCategory(obj.title, obj.description);
        const coordinates = getCoords(obj.location, obj.country);
        return {
            ...obj,
            owner: user._id,
            category,
            geometry: {
                type: "Point",
                coordinates,
            },
        };
    });

    await Listing.insertMany(preparedData);
    console.log(`Initialized ${preparedData.length} listings successfully!`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error("Init DB Error:", err);
});
