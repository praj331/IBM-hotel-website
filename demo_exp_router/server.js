const express = require("express");
const app= express();
const users = require("./router/user.js");

const session= require("express-session");   //note express sessions

const flash = require("connect-flash");  //note connect-flash
const path=require("path");         // to show flashed msg on browser
app.set("view engine", "ejs");        // to show flashed msg on browser
app.set("views", path.join(__dirname, "views")); // to show flashed msg on browser

app.use("/",users);  


//===============================
//cookie parser- used to access and parse/read cookie in another page
//download npm i package, beacause cookie-parser is middleware
//========================================
app.get("/greet",(req,res)=> {
  let {names="Anonymous"} = req.cookie;
  res.send(`nice to meet you ${names}`);
});

//===============================
// sent cookies
//=================================
app.get("/getcookies",(req,res)=> {
    res.cookie("greet","hello");
     res.cookie("gree-india","namaste");
    res.send("got the cookies!!");
    console.dir(req.cookies);
});


//app.use(cookieParser()); for normal cookies

//==============================
//signed cookies
//===============================
app.get("/getSignCookie",(req,res) => {
    res.cookie("made-in","india",{signed:true});
    res.send("signed cookies sent!!");
});

app.get("/verify",(req,res) => {
    console.log(req.signedCookies);
    res.send("verified!");
})
app.use(cookieParser("secretcode")); //for signed cookies

//===========================
//Express sessoins
//=============================
//app.use(session({secret:"mysupersecretstring"}));

app.use(
    session({
       secret:"mysupersecretstring",
       resave:false,
       saveUninitialized:true,

    })
); 
app.use(flash());   // connect-flash


app.get("/test",(req,res)=> {
    res.send("test successful!");
});

app.get("/reqcount",(req,res)=> {
    //res.send("request counted  x times by successful!");

    if(req.session.count) {
        req.session.count++;
    }
    else {
        req.session.count=1;
    }
    res.send(`request counted  ${req.session.count} times by successful!`);
});

//storing and using info

app.get("/register",(req,res)=> {
    let {name= "unknown"} = req.query;
    req.session.name = name;
    res.send(name);
     res.redirect("/hello");

});

app.get("/hello",(req,res)=> {
    let {name= "unknown"} = req.query;
    req.session.name = name;
    res.send(`hello,${req.session.name}`);
});

app.listen(8080, () => {

    console.log(
        "Server is running on port 3000 server.js"
    );

});
//note from lecture video connect-flash package
app.get("/registerUser",(req,res)=> {
    let {name= "unknown"} = req.query;
    req.session.name = name;
    req.flash("success","user registered");  //key-value pair
    res.redirect("/helloUser");
});

app.get("/helloUser",(req,res)=> {
    res.locals.messages = req.flash("success");
    console.log(req.flash("success"));
    res.render("page.ejs",{name:req.session.name,msg:req.flash("success")});
});


