const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const fs = require('fs')
const flash = require('connect-flash');
const cookieParser = require('cookie-parser')
//------------------------------start app use
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "secret",
    saveUninitialized: true,
    resave: true,
    cookie:{
        maxAge: 60000
    }
}))
app.use(cookieParser('secret'));
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
app.set('views','./views')
app.set('view engine','ejs')
mongoose.connect('mongodb://localhost:27017/soncute',(err)=>{
    if (err) console.log(err)
})
//----- start model
let userSchema = new Schema({
    username: String,
    password: String
})
let userModel = mongoose.model('user', userSchema)
//------ end model
passport.serializeUser(function(user, done) {
    done(null, user.username);
})
passport.deserializeUser(function(user, done) {
    userModel.findById(user,(err,res)=>{
        done(null,user)
    })
})
passport.use(new LocalStrategy((username, password, done)=>{
    /*fs.readFile('./DB.json',(err,data)=>{
        if (err) {
            console.log("Cannot read DB")
            return done(err)
        }
        const db = JSON.parse(data)
        const userRecord = db.find(element => element.username == username)
        if (userRecord&&(userRecord.password == password)){
            return done(null,userRecord)
        } else {
            return done(null,false)            
        }
    })*/
    userModel.findOne({
        username: username
    },(err,data)=>{
        if (err||!data) {
            return done(err,false,{message: 'This username doesn\'t exist'})
        }
        if (data.password == password) {          
            return done(null,data,{message: 'Login successfully'})
        } else {
            return done(null,false, {message: 'Wrong password'})
        }
    })
}))

//------------------------------ end app use
app.get('/login',(req,res)=>{
    res.render('login',{
        message: req.flash('mess')
    })
})
app.post('/login',(req,res,next)=>{
        passport.authenticate('local',(err,user,mess)=>{
            if (err){
                console.log(err)
                return next()
            }
            if (user){
                req.logIn(user,(err)=>{
                    if (err) return next(err)
                    return res.redirect('dashboard')
                })
            }
            if (!user){
                req.flash('mess','Username or password is wrong! Try again')
                return res.redirect('login');
            }
        })(req,res,next)
    }
)
app.get('/dashboard',(req,res)=>{
    res.render('dashboard/index')
})
app.route('/loginOK')
.get((req,res)=>{
    res.render('loginOK',{
        title: 'Login success',
        message: req.flash('tn')
    })
})
app.route('/register')
.get((req,res)=>{
    res.render('register',{
        title: 'Register'
    });
})
.post((req,res)=>{
    if (req.body.username && req.body.password && req.body.password2){
        if (req.body.password == req.body.password2){
            let data = userModel.findOne({
                username: req.body.username
            })
            if (data){
                console.log('username exist')
                res.redirect('/register');
                return
            }
            let user = new userModel({
                username: req.body.username,
                password: req.body.password,
            })
            user.save()
            res.redirect('login')           
        }
    }
})
app.get('/logout',(req,res)=>{
    req.logout()
    console.log(req.user)
    res.redirect('login');
})
app.listen(3000,(err,res)=>{
    if (err) console.log(err)
    console.log('Running on port 3000')
})