var express=require('express');
var cors = require('cors')
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');

app=express();

//cors for correct post requests
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cors());

//sessions
app.use(cookieParser());
app.use(session({secret: "undefined", auth: "None"}));

//static files
app.use(express.static('public'));  
app.use('/images', express.static('images'));

//CONNECT PG CONTROLLER
var apiController=require('./pg/apiController'); 
apiController(app); 



app.get("/dashboard",function (req,res){
    console.log(req.session.auth);
    if (!req.session.auth || req.session.auth == "None"){
        res.render('login.ejs');
    }else{
        res.render('dashboard.ejs')
    }
});

app.get("/settings",function (req,res){
    res.render('settings.ejs');
});

app.get("/",function (req,res){
    if (req.session.auth && req.session.auth != "None"){
        res.render('dashboard.ejs');
    }else{
        res.render('login.ejs');
    }
});

app.get("/admin",function (req,res){
    if (req.session.auth && req.session.auth != "None"){
        if (req.session.issuper){
            res.render('admin.ejs');
        }else{ res.send('404. Page not found'); }
    }else{
        res.render('login.ejs');
    }
});



app.listen(88, '0.0.0.0');

    
    

