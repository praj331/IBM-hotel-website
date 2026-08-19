const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
    review: [{
         type: Schema.Types.ObjectId,
         ref:"Review",
    }]
});

module.exports = mongoose.model("Listing", listingSchema);