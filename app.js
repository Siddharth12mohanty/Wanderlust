if(process.env.NODE_ENV != "production"){
require("dotenv").config();
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodoverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema, reviewSchema} = require("./schema.js");
const Review = require("./models/review.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const plm = require("passport-local-mongoose");


const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// const dbUrl = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;


// main()
// .then(()=>{
//     console.log("connected to DB");
// })
// .catch((err)=>{
//     console.log("err");
// });

main()
.then(() => {
    console.log("Connected to DB");
})
.catch((err) => {
    console.log(err);
});

async function main(){
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(methodoverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

// const store = MongoStore.create({
//     mongoUrl: dbUrl,
//     crypto: {
//         secret: process.env.SECRET,
//     },
//     touchAfter: 24*3600,
// });

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 3600,
});

store.on("error", (err)=>{
    console.log("ERROR in MONGO SESSION STORE",err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

// app.get("/",(req,res)=>{
//     res.send("Hi, i am root");
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.use(async (req, res, next) => {

//     res.locals.success = req.flash("success");
//     res.locals.error = req.flash("error");
//     res.locals.currUser = req.user;

//     res.locals.countries = await Listing.distinct("country");

//     next();
// });

app.use(async (req, res, next) => {
    try {

        res.locals.success = req.flash("success");
        res.locals.error = req.flash("error");
        res.locals.currUser = req.user;

        const countries = await Listing.distinct("country");
        

        res.locals.countries = countries;

        next();
    } catch (err) {
        console.log("Middleware Error:", err);
        next(err);
    }
});

// app.get("/demouser",async (req,res)=>{
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "delta-student",
//     });
//     let registeredUser = await User.register(fakeUser, "helloworld");
//     res.send(registeredUser);
// });

app.get("/test", (req, res) => {
    res.send("Server is working");
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/", userRouter);


// app.get("/testListing",async (req,res)=>{
//     let sampleListing = new Listing({
//         title:"My new Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calanguate, Goa",
//         country: "India",
//     });

//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// });

app.use((req, res, next) => {
    console.log("404 URL:", req.originalUrl);
    next(new ExpressError(404, "Page not found!"));
});

// app.use((err,req,res,next)=>{
// let {statusCode = 500, message= "something went wrong!"} = err;
// res.status(statusCode).render("error.ejs", {message});
// //   res.status(statusCode).send(message);  
// });

// app.use((err, req, res, next) => {
//     console.error(err);   // <-- Add this line
//     let { statusCode = 500, message = "something went wrong!" } = err;
//     res.status(statusCode).render("error.ejs", { message });
// });

app.use((err, req, res, next) => {
    console.log("========== REAL ERROR ==========");
    console.error(err.stack || err);
    console.log("Status:", err.statusCode);
    console.log("Message:", err.message);
    console.log("===============================");

    const statusCode = err.statusCode || 500;

    res.status(statusCode).send(err.stack || err.message);
});

// app.listen(8080,()=>{
//     console.log("serever is listening to port 8080");
// });

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});