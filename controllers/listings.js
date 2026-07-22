const Listing = require("../models/listing");


module.exports.index = async (req, res) => {

    const allListings = await Listing.find({});

    const countries = await Listing.distinct("country");

    res.render("listings/index.ejs", {
        allListings,
        countries
    });
};

module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
};

module.exports.showListing = async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({path: "reviews",
        populate:{
            path: "author",
        },
    })
    .populate("owner");
    if(!listing){
    req.flash("error", "Listing you requested for does not exist!");
   return  res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", {listing});
};

module.exports.createListing = async (req, res) => {

    const query = encodeURIComponent(
        `${req.body.listing.location}, ${req.body.listing.country}`
    );

    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        {
            headers: {
                "User-Agent": "wanderlust-app"
            }
        }
    );

    const data = await response.json();

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    if (data.length > 0) {
        newListing.geometry = {
            type: "Point",
            coordinates: [
                parseFloat(data[0].lon),
                parseFloat(data[0].lat),
            ],
        };
    }

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async(req,res)=>{
       let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
    req.flash("error", "Listing you requested for does not exist!");
   return  res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs",{listing, originalImageUrl});
};

module.exports.updateListing = async (req, res) => {

    let { id } = req.params;

    let listing = await Listing.findById(id);

    Object.assign(listing, req.body.listing);

    const query = encodeURIComponent(
        `${listing.location}, ${listing.country}`
    );

    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        {
            headers: {
                "User-Agent": "wanderlust-app"
            }
        }
    );

    const data = await response.json();

    if (data.length > 0) {
        listing.geometry = {
            type: "Point",
            coordinates: [
                parseFloat(data[0].lon),
                parseFloat(data[0].lat)
            ]
        };
    }

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    await listing.save();

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};
module.exports.destroyListing = async(req,res)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
      req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};

module.exports.searchCountry = async (req, res) => {

    const { country } = req.query;

    let allListings;

    if (!country) {
        allListings = await Listing.find({});
    } else {
        allListings = await Listing.find({
            country: {
                $regex: `^${country}$`,
                $options: "i"
            }
        });
    }

    const countries = await Listing.distinct("country");

    res.render("listings/index.ejs", {
        allListings,
        countries
    });
};