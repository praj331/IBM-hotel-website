const express= require("express");
const passport = require("passport");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl } = require("../middleware.js");

//for signup
router.get("/signup",(req,res)=> {
    res.render("users/signup.ejs");
});

router.post("/signup",wrapAsync(async(req,res)=> {
    try {
        let {username,email,password} = req,body;
        const newUser = new User({email,username});
        const registerUser = await User.register(newUser,password);
       console.log(registerUser);
       req.login(registerUser,(err) => {         //login function is used to make automatic login once user sign up
        if(err) {
            return next(err);
        }
        req.flash("success","Welcome to WanderLust");
       res.redirect("/listings");
       });
       
    }
    catch(err) {
        req.flash("error","err.message");
        res.redirect("/signup");
    }
 
}));

//for login
router.get("/login",(req,res)=> {
    res.render("users/login.ejs");
});

router.post("/login", saveRedirectUrl,passport.Authenticator("local",{failureRedirect:'/login',failureFlash:true}), async(req,res)=> {
   req.flash("success","Welcome to wanderLust!");
   let redirectUrl = res.locals.redirectUrl || "/listings";
   res.redirect(redirectUrl);
});

// to check user is logged in or not
router.get("/new",(req,res) => {
    console.log(req.user);
   res.render("listings/new.ejs");
});

//to log out
router.get("/logout",(req,res) => {
    req.logOut((err) => {
        if(err) {
           return next(err);
        }
        req.flash("success","you are logged out!");
        res.redirect("/listings");   
    });
});
module.exports = router;