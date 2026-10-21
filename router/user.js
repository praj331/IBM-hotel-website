const express = require("express");
const passport = require("passport");
const router = express.Router();
const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");

// ===============================
// SIGNUP
// ===============================
router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

router.post(
    "/signup",
    wrapAsync(async (req, res, next) => {
        try {
            const { username, email, password } = req.body;
            const newUser = new User({ email, username });
            const registeredUser = await User.register(newUser, password);

            req.login(registeredUser, (err) => {
                if (err) {
                    return next(err);
                }
                req.flash("success", "Welcome to WanderLust!");
                res.redirect("/listings");
            });
        } catch (err) {
            req.flash("error", err.message);
            res.redirect("/signup");
        }
    })
);

// ===============================
// LOGIN
// ===============================
router.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

router.post(
    "/login",
    saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
    async (req, res) => {
        // Handle Remember Me
        if (req.body.rememberMe) {
            // Keep session cookie alive for 30 days
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        } else {
            // Browser session cookie (expires when browser is closed)
            req.session.cookie.expires = false;
        }

        req.flash("success", "Welcome back to WanderLust!");
        const redirectUrl = res.locals.redirectUrl || "/listings";
        delete req.session.redirectUrl;
        res.redirect(redirectUrl);
    }
);

// ===============================
// WISHLIST VIEW
// ===============================
router.get(
    "/wishlist",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const user = await User.findById(req.user._id).populate("wishlist");
        const wishlistedListings = user.wishlist || [];
        res.render("listings/wishlist.ejs", {
            allListings: wishlistedListings,
        });
    })
);

// ===============================
// LOGOUT
// ===============================
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
});

module.exports = router;
