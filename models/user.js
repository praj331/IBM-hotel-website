const mongoose = require("mongoose");
let passportLocalMongoose = require("passport-local-mongoose");
if (passportLocalMongoose && typeof passportLocalMongoose !== "function" && passportLocalMongoose.default) {
    passportLocalMongoose = passportLocalMongoose.default;
}

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    wishlist: [
        {
            type: Schema.Types.ObjectId,
            ref: "Listing",
        },
    ],
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
