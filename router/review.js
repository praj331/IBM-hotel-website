const express = require("express");
const router = express.Router({mergeParams:true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const { listingSchema, reviewSchema } = require("../schema.js");


// ===============================
// VALIDATE REVIEW
// ===============================

const validateReview = (req, res, next) => {

    let { error } = reviewSchema.validate(req.body);

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
// CREATE REVIEW
// POST /listings/:id/reviews
// ===============================

router.post(
    "/",
    validateReview,
    wrapAsync(async (req, res) => {

        const listing = await Listing.findById(req.params.id);

        const newReview = new Review(req.body.review);

        listing.reviews.push(newReview);

        await newReview.save();
        await listing.save();
       req.flash("success","Review submited!");
        res.redirect(`/listings/${listing._id}`);
    })
);

// ===============================
// DELETE REVIEW
// DELETE /listings/:id/reviews/:reviewId
// ===============================

router.delete(
    "/:reviewId",
    wrapAsync(async (req, res) => {

        const { id, reviewId } = req.params;

        // Remove review reference from Listing
        await Listing.findByIdAndUpdate(
            id,
            {
                $pull: {
                    reviews: reviewId
                }
            }
        );

        // Delete review from Review collection
        await Review.findByIdAndDelete(reviewId);
       req.flash("success","Review Deleted!");
        // Go back to the same listing page
        res.redirect(`/listings/${id}`);

    })
);

module.exports=router;
