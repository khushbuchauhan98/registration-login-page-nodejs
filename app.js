import  express  from "express";
import ejs, { name } from "ejs";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import session from 'express-session';
import ConnectMongoDBSession from "connect-mongodb-session";
const connectmongodbsession= ConnectMongoDBSession(session)
const app= express();
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended:true}))
mongoose.connect("mongodb+srv://khushbu:khushbu@mernpractice.dbxmkpp.mongodb.net/?retryWrites=true&w=majority").then(()=>{
    console.log("mongodb connected")
})
 const store= new connectmongodbsession({
    uri:"mongodb+srv://khushbu:khushbu@mernpractice.dbxmkpp.mongodb.net/?retryWrites=true&w=majority",
    collection:'sessions'
 })
 app.use(session({
secret:'top secret',
resave:false,
saveUninitialized:false,
store:store
 }))
const mongoschema= new mongoose.Schema({
    name:{type:String, require:true},
    email:{type:String,require:true,unique:true},
    password:{type:String, require:true},
    addedby:{type:String}
})
const User= mongoose.model('user',mongoschema)
const isAuth=(req,res,next)=>{
    if(req.session.isAuth == true){
        next();
    }
    else{
        res.redirect('/login')
    }
}
app.get('/',(req,res)=>{
    //  res.send("<h1>home page</h1>");
    res.render('index',{req:req})
})
app.get('/add',isAuth,(req,res)=>{
    res.render('add',{addedby:req.session.user.email,req:req});
})
app.post('/save-user',(req,res)=>{
    // res.send("<h1>home page</h1>");
    let{name,email,addedby}=req.body;
    let data= new User({
        name:name,
        email:email,
        addedby:addedby
    })
    data.save();
    res.redirect('/users')
})
app.get('/users',isAuth, async(req,res)=>{
    req.session.test="practice"
    let data= await User.find({addedby:req.session.user.email})
    res.render('users',{users:data,req:req})
})
app.post('/delete',async(req,res)=>{
    let {email}=req.body;
    let data= await User.deleteOne({email:email})
    res.redirect('/users')
})
app.post('/edit',async(req,res)=>{
    let {email}=req.body;
    let data= await User.findOne({email:email})
    res.render('edit',{update:data,req:req})
})
app.post('/update',async(req,res)=>{
    let{email,name,oldemail}=req.body;
    let data= await User.updateOne(
        {email:oldemail},
        {
            $set:{
                name:name,
                email:email
            }
        }
    )
    res.redirect('/users')

})


app.get('/register',(req,res)=>{
    res.render('register',{req:req})
})
app.post('/register',async(req,res)=>{
    let {name,email,password}=req.body;
    let data= new User({
        name:name,
        email:email,
        password:await bcrypt.hash(password,10)
    })
    data.save();
    res.redirect('/login')
})
app.get('/login',(req,res)=>{
    res.render('login',{req:req})
})
app.post('/auth',async(req,res)=>{
    let {email,password}=req.body;
    let user= await User.findOne({email:email})
    if(!user){
        res.json('email does not exist pls try again')
    }
    else if(user){
        const checkpw= await bcrypt.compare(password,user.password)
        if(checkpw){
            req.session.isAuth = true;
            req.session.user = user;
            // res.json('login successfull');
            res.redirect('/users')
        }
        else{
            res.json('wrong password')
        }
    }
    else{
        res.json("somthing went wrong")
    }
})
app.get("/logout",(req,res)=>{
    req.session.destroy();
    res.redirect('/')
})
app.listen('3000',()=>{
    console.log("server is conncected")
})