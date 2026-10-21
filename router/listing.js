const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");

// Configure Multer for local uploads
const uploadDir = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Helper to determine coordinates for map
function getCoordinates(location, country) {
    const loc = ((location || "") + " " + (country || "")).toLowerCase();
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
        mayami: [-80.1918, 25.7617],
        amsterdam: [4.9041, 52.3676],
        cotswolds: [-1.8433, 51.833],
        costwalds: [-1.8433, 51.833],
    };
    for (const key of Object.keys(cityMap)) {
        if (loc.includes(key)) {
            return cityMap[key];
        }
    }
    // Default deterministic fallback based on string hash
    let hash = 0;
    for (let i = 0; i < loc.length; i++) {
        hash = (hash << 5) - hash + loc.charCodeAt(i);
    }
    const lng = ((Math.abs(hash) % 36000) / 100) - 180;
    const lat = ((Math.abs(hash >> 3) % 12000) / 100) - 60;
    return [parseFloat(lng.toFixed(4)), parseFloat(lat.toFixed(4))];
}

// ===============================
// INDEX ROUTE
// GET /listings
// ===============================
router.get(
    "/",
    wrapAsync(async (req, res) => {
        let { q, category } = req.query;
        let queryFilter = {};

        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), "i");
            queryFilter = {
                $or: [
                    { title: regex },
                    { location: regex },
                    { country: regex },
                    { description: regex },
                ],
            };
        } else if (category && category.trim()) {
            queryFilter = { category: category.trim() };
        }

        const allListings = await Listing.find(queryFilter);

        res.render("listings/index.ejs", {
            allListings,
            category: category || "",
            q: q || "",
        });
    })
);

// ===============================
// NEW ROUTE
// GET /listings/new
// ===============================
router.get("/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs");
});

// ===============================
// CREATE ROUTE
// POST /listings
// ===============================
router.post(
    "/",
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(async (req, res) => {
        if (!req.body.listing) {
            throw new ExpressError(400, "Send valid data!!");
        }

        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;

        // Image Handling
        if (req.file) {
            newListing.image = {
                url: "/uploads/" + req.file.filename,
                filename: req.file.filename,
            };
        } else if (req.body.listing.imageUrl && req.body.listing.imageUrl.trim()) {
            newListing.image = {
                url: req.body.listing.imageUrl.trim(),
                filename: "customimage",
            };
        } else if (
            typeof req.body.listing.image === "string" &&
            req.body.listing.image.trim()
        ) {
            newListing.image = {
                url: req.body.listing.image.trim(),
                filename: "customimage",
            };
        }

        // Coordinates for Map
        const coords = getCoordinates(newListing.location, newListing.country);
        newListing.geometry = {
            type: "Point",
            coordinates: coords,
        };

        await newListing.save();
        req.flash("success", "New listing created!");
        res.redirect(`/listings/${newListing._id}`);
    })
);

// ===============================
// SHOW ROUTE
// GET /listings/:id
// ===============================
router.get(
    "/:id",
    wrapAsync(async (req, res) => {
        const listing = await Listing.findById(req.params.id)
            .populate({
                path: "reviews",
                populate: {
                    path: "author",
                },
            })
            .populate("owner");

        if (!listing) {
            req.flash("error", "The listing you requested does not exist!");
            return res.redirect("/listings");
        }

        res.render("listings/show.ejs", {
            listing,
        });
    })
);

// ===============================
// EDIT ROUTE
// GET /listings/:id/edit
// ===============================
router.get(
    "/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "The listing you requested does not exist!");
            return res.redirect("/listings");
        }

        // Generate lower quality preview url if from unsplash
        let originalImageUrl = listing.image.url;
        if (originalImageUrl.includes("unsplash.com")) {
            originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
        }

        res.render("listings/edit.ejs", {
            listing,
            originalImageUrl,
        });
    })
);

// ===============================
// UPDATE ROUTE
// PUT /listings/:id
// ===============================
router.put(
    "/:id",
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(async (req, res) => {
        const { id } = req.params;

        const listing = await Listing.findByIdAndUpdate(id, {
            ...req.body.listing,
        });

        if (req.file) {
            listing.image = {
                url: "/uploads/" + req.file.filename,
                filename: req.file.filename,
            };
        } else if (req.body.listing.imageUrl && req.body.listing.imageUrl.trim()) {
            listing.image = {
                url: req.body.listing.imageUrl.trim(),
                filename: "customimage",
            };
        }

        // Update coordinates if location changed
        if (req.body.listing.location || req.body.listing.country) {
            const loc = req.body.listing.location || listing.location;
            const country = req.body.listing.country || listing.country;
            listing.geometry = {
                type: "Point",
                coordinates: getCoordinates(loc, country),
            };
        }

        await listing.save();
        req.flash("success", "Listing updated successfully!");
        res.redirect(`/listings/${id}`);
    })
);

// ===============================
// DELETE LISTING
// DELETE /listings/:id
// ===============================
router.delete(
    "/:id",
    isLoggedIn,
    isOwner,
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        await Listing.findByIdAndDelete(id);
        req.flash("success", "Listing deleted!");
        res.redirect("/listings");
    })
);

// ===============================
// WISHLIST TOGGLE
// POST /listings/:id/wishlist
// ===============================
router.post(
    "/:id/wishlist",
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        if (!req.isAuthenticated()) {
            return res.json({
                success: false,
                requiresLogin: true,
                message: "Please log in to save to your wishlist.",
            });
        }

        const user = await User.findById(req.user._id);
        const index = user.wishlist.indexOf(id);
        let inWishlist = false;

        if (index === -1) {
            user.wishlist.push(id);
            inWishlist = true;
        } else {
            user.wishlist.splice(index, 1);
            inWishlist = false;
        }

        await user.save();
        res.json({
            success: true,
            inWishlist,
            count: user.wishlist.length,
        });
    })
);

module.exports = router;
