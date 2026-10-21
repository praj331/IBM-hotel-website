const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const { isLoggedIn, isReviewAuthor, validateReview } = require("../middleware.js");

// ===============================
// CREATE REVIEW
// POST /listings/:id/reviews
// ===============================
router.post(
    "/",
    isLoggedIn,
    validateReview,
    wrapAsync(async (req, res) => {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        const newReview = new Review(req.body.review);
        newReview.author = req.user._id;

        listing.reviews.push(newReview);

        await newReview.save();
        await listing.save();

        req.flash("success", "Review submitted!");
        res.redirect(`/listings/${listing._id}`);
    })
);

// ===============================
// DELETE REVIEW
// DELETE /listings/:id/reviews/:reviewId
// ===============================
router.delete(
    "/:reviewId",
    isLoggedIn,
    isReviewAuthor,
    wrapAsync(async (req, res) => {
        const { id, reviewId } = req.params;

        // Remove review reference from Listing
        await Listing.findByIdAndUpdate(id, {
            $pull: { reviews: reviewId },
        });

        // Delete review from Review collection
        await Review.findByIdAndDelete(reviewId);

        req.flash("success", "Review deleted!");
        res.redirect(`/listings/${id}`);
    })
);

module.exports = router;
