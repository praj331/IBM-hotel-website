const express = require("express");
const app = express();
const mongoUrl = "mongodb://127.0.0.1:27017/WanderLust";
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const User = require("./models/user.js");
const ExpressError = require("./utils/ExpressError.js");

const listingRouter = require("./router/listing.js");
const reviewRouter = require("./router/review.js");
const userRouter = require("./router/user.js");

// ===============================
// VIEW ENGINE
// ===============================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// ===============================
// MIDDLEWARE
// ===============================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(cookieParser("mysupersecretcode"));
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// EXPRESS SESSION & FLASH
// ===============================
const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

// ===============================
// PASSPORT CONFIGURATION
// ===============================
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    res.locals.currentPath = req.path;
    next();
});

// ===============================
// DATABASE
// ===============================
async function main() {
    await mongoose.connect(mongoUrl);
}

main()
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log("MongoDB connection error:", err);
    });

// ===============================
// HOME ROUTE (Redirect to listings)
// ===============================
app.get("/", (req, res) => {
    res.redirect("/listings");
});

// ===============================
// ROUTERS
// ===============================
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// ===============================
// ERROR - 404
// ===============================
app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

// ===============================
// ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { err: { statusCode, message } });
});

// ===============================
// SERVER
// ===============================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
