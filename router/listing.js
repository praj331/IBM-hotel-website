const express = require("express");
const router = express.Router();

const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");

const { listingSchema, reviewSchema } = require("../schema.js");

const {isLoggedIn}= require("../middleware.js");

// ===============================
// VALIDATE LISTING
// ===============================

const validateListing = (req, res, next) => {

    let { error } = listingSchema.validate(req.body);

    if (error) {

        let errMsg = error.details
            .map((el) => el.message)
            .join(",");

        throw new ExpressError(400, errMsg);

    } else {

        next();

    }
};


// ===============================
// INDEX ROUTE
// GET /listings
// ===============================

router.get(
    "/",
    wrapAsync(async (req, res) => {

        const allListings = await Listing.find({});

        res.render("listings/index.ejs", {
            allListings
        });

    })
);


// ===============================
// NEW ROUTE
// GET /listings/new
// ===============================

router.get("/new", isLoggedIn,(req, res) => {

    res.render("listings/new.ejs");

});


// ===============================
// CREATE ROUTE
// POST /listings
// ===============================

router.post(
    "/",
    validateListing,
    wrapAsync(async (req, res) => {

        if (!req.body.listing) {

            throw new ExpressError(
                400,
                "Send valid data!!"
            );

        }

        const newListing = new Listing(req.body.listing);

        await newListing.save();
        req.flash("success","New listing created!");
        res.redirect("/listings");

    })
);


// ===============================
// SHOW ROUTE
// GET /listings/:id
// ===============================

router.get(
    "/:id",
    wrapAsync(async (req, res) => {

        const listing = await Listing
            .findById(req.params.id)
            .populate("reviews");
         
        if(!listing) {
             req.flash("error","listing that you requested not exist!");
        }    
        res.render("listings/show.ejs", {
            listing
        });
    })
);


// ===============================
// EDIT ROUTE
// GET /listings/:id/edit
// ===============================

router.get(
    "/:id/edit",isLoggedIn,
    wrapAsync(async (req, res) => {

        const { id } = req.params;

        const listing = await Listing.findById(id);

         
        if(!listing) {
             req.flash("error","listing that you requested not exist!");
        } 
        res.render("listings/edit.ejs", {
            listing
        });

    })
);


// ===============================
// UPDATE ROUTE
// PUT /listings/:id
// ===============================

router.put(
    "/:id",
    validateListing,isLoggedIn,
    wrapAsync(async (req, res) => {

        const { id } = req.params;

        await Listing.findByIdAndUpdate(
            id,
            req.body.listing
        );
        req.flash("success","Updated successfully!");
        res.redirect(`/listings/${id}`);

    })
);


// ===============================
// DELETE LISTING
// DELETE /listings/:id
// ===============================

router.delete(
    "/:id",isLoggedIn,
    wrapAsync(async (req, res) => {

        let { id } = req.params;
        let deletedListing = await Listing.findByIdAndDelete(id);
        console.log(deletedListing);
        req.flash("error","new listing deleted!");
        res.redirect("/listings");

    })
);





module.exports = router;