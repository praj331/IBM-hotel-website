const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        required: true,
    },

    image: {
        filename: {
            type: String,
            default: "listingimage",
        },
        url: {
            type: String,
            default:
                "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
            set: (v) =>
                v === ""
                    ? "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800"
                    : v,
        },
    },

    price: {
        type: Number,
        required: true,
        min: 0,
    },

    location: {
        type: String,
        required: true,
    },

    country: {
        type: String,
        required: true,
    },
    reviews: [{
         type: Schema.Types.ObjectId,
         ref:"Review",
    }],
    owner : {        /// it reffers User
       type: Schema.Types.ObjectId,
       ref:"User",
    }
});

listingSchema.post("findOneAndDelete",async (listing)=> {
    if(listing) {
       await Review.deleteMany({id : {$in: listing.reviews}});
    }
        
});

module.exports = mongoose.model("Listing", listingSchema);

//Express Router- Express routers are a way to oraganize your express application suc tat primary app.js file does not become bloated.

