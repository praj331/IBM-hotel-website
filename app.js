const express = require("express");
const app = express();
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const ejsMate = require("ejs-mate");    //new package
const mongoUrl = "mongodb://127.0.0.1:27017/WanderLust";
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError =require("./utils/ExpressError.js");

//data validation by joi
const {listingSchema} =require("./schema.js");
const validateListing = (req,res,next) => {
    let {error} = listingSchema.validate(req.body);
    //console.log(error);
   if(error) {
    let errMsg = error.details.map((el) => el.message.join(","));
     throw new ExpressError(400,"errMsg");
    }
    else{
        next();
    }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.engine("ejs",ejsMate);   //learn it

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname,"/public")));
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

app.get("/", (req, res) => {
    res.send("Hello Everyone");
});


// INDEX ROUTE
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));


// NEW ROUTE
app.get("/listings/new", (req, res) => {
    res.render("listings/new");
});


// CREATE ROUTE
app.post("/listings", validateListing ,wrapAsync(async(req, res,next) => {
    if(!req.body.listing) {
        throw new ExpressError(400,"Send valid data!!");    //when client send  different request
    }
    const newListing = new Listing(req.body.listing);
    //  here is way to data validation if(!Listing.title) {
    //     throw new ExpressError(400,"Title is missing.")
    // }
    
    await newListing.save();

    res.redirect("/listings");
}));

// SHOW ROUTE
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id);

    res.render("listings/show.ejs", { listing });
}));



// EDIT ROUTE
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id);

    res.render("listings/edit.ejs", { listing });
}));


// UPDATE ROUTE

app.put("/listings/:id", validateListing,wrapAsync(async (req, res) => {
    const { id } = req.params;

    await Listing.findByIdAndUpdate(id, req.body.listing);

    res.redirect(`/listings/${id}`);
}));

// DELETE ROUTE

app.delete("/listings/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    //previous line of my code const deletedListing = await Listing.findByIdAndDelete(id);
    // console.log(deletedListing);
    await Listing.findByIdAndDelete(id);

    res.redirect("/listings");
}));

//ERROR HANDELING

app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    //res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs",{err});
});
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});