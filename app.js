const express = require("express");
const app = express();
const mongoUrl = "mongodb://127.0.0.1:27017/WanderLust";
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");

const ExpressError = require("./utils/ExpressError.js");

const listingRouter = require("./router/listing.js");
const reviewRouter= require("./router/review.js");
const userRouter= require("./router/user.js");
const cookieParser= require("cookie-parser");

const session= require("express-session");   //express sessions
const flash = require("connect-flash");  //used connect-flash

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

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

app.use(methodOverride("_method"));

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

//================================
//express session intialze
//================================
const sessionOptions = {
    secret:"mysupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie: {
        expires: Date.now() + 30*24*60*1000,
        maxAge: 30*24*60*1000,
        httpOnly: true,    //prevent from cross 
    },
};
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());               //using passport for autentication
app.use(passport.session());    
passport.use(new LocalStrategy(User.authenticate())) ;

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
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

        console.log(err);

    });



// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {

    res.send("Hello Everyone !!");
    

});


// ===============================
// LISTING ROUTER
// ===============================

app.use(
    "/listings",
    listingRouter
);
// ===============================
// REVIEW ROUTER
// ===============================

app.use("/listings/:id/reviews",reviewRouter);

// ===============================
// ERROR - 404
// ===============================

app.use((req, res, next) => {

    next(
        new ExpressError(
            404,
            "Page not found!"
        )
    );

});


// ===============================
// ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {

    let {
        statusCode = 500,
        message = "Something went wrong!"
    } = err;

    res
        .status(statusCode)
        .render("error.ejs", { err });

});


// ===============================
// SERVER
// ===============================

app.listen(3000, () => {

    console.log(
        "Server is running on port 3000"
    );

});


//note passport,authentication from lecture