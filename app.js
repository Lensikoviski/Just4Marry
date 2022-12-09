
var express = require('express');
var path = require('path')
var {engine} = require('express-handlebars')
var exphbs = require('express-handlebars')
const hbs = require('hbs')
var ObjectId = require('mongodb').ObjectID;

const mongoclient = require("mongodb").MongoClient
const uri = "mongodb+srv://jayaramskumar:just4marry@cluster0.gguofay.mongodb.net/matrimony?retryWrites=true&w=majority"
const PORT = 3000  || process.env.PORT
const client = new mongoclient(uri, { useUnifiedTopology: true}, { useNewUrlParser: true }, { connectTimeoutMS: 30000 }, { keepAlive: 1});
var fileupload = require("express-fileupload")

//const db = require('./Database')


//var indexRouter = require('./routes/index')

var app = express();

client.connect(err => {
    if(err){ console.error(err); return false;}
    // connection to mongo is successful, listen for requests
    app.listen(PORT, () => {
        console.log("listening for requests");
    })
});

app.use(fileupload()) 

var cookieParser = require("cookie-parser")     
var session = require('cookie-session');
const { connected } = require('process'); 

app.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
}); 

// view engine setup
app.engine('hbs',engine({extname:'hbs',defaultLayout:'default', layoutsDir: path.join(__dirname, '/views/layouts'),partialsDir:path.join(__dirname, 'views/partials'),helpers:{
    check:function(array,id,options){
      //  console.log("array is",array)
      //  console.log("id is ",id)
        let found = false
        for(i=0;i<array.length;i++){
            
            if(id.toString()==array[i].userid.toString()){
                if(array[i].accepted==true){
                    
                    found = true
                    console.log("view profile")
                    return options.fn({viewprofile:true})
                    break
                }else{
                   
                    found = true
                    console.log("intrest send")
                    return options.fn({intrestsend:true})
                    break
                }
            }

        }  
        if(!found){ 
            console.log("i am intrested")
            return options.fn({iamintrested:true})
        }
     
    },
    ifiacceptedornot:function(array,requested_user_id,options){
        for(i=0;i<array.length;i++){
            if(array[i].userid.toString()==requested_user_id.toString()){
                if(array[i].accepted==true){ 
                    return options.fn({
                        accepted:true
                    })
                }else{
                    return options.fn({
                        accept:true
                    })
                }
            }
        }
    },
    ifheacceptedornot:function(intersted_array,curr_user_id,options){
      console.log(intersted_array)
      console.log(curr_user_id)
        for(i=0;i<intersted_array.length;i++){
            if(intersted_array[i].userid.toString()==curr_user_id.toString()){
                if(intersted_array[i].accepted==true){
                    return options.fn({
                        accepted:true
                    })
                }
                else if(intersted_array[i].declined==true){
                    console.log("entered")
                    return options.fn({
                        declined:true  
                    })
                }
                else{
                    return options.fn({
                        accept:true 
                    })
                }
            }
        }
    }
}}))
app.set('views', path.join(__dirname, 'views'));    
app.set('view engine','hbs')      

 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));



app.use(cookieParser())
const oneday=24*60*60*1000
app.use(session({secret:'key',cookie:{maxAge:oneday},resave:false,saveUninitialized:true}))



const verifylogin = (req,res,next)=>{
    if(req.session.loggedin){
      next()
    }else{
      res.render('layouts/signin')
    }
  }
  
  /* GET home page. */
  app.get('/', async function(req,res){
    res.render('layouts/signin')
  });          
  
  
  
  app.get('/signin',verifylogin,(req,res)=>{
    res.render('layouts/signin')
  })
  
  
  app.get('/signup',(req,res)=>{
    //Dont put /layouts here
    if(req.session.loggedin){
      res.redirect('/')
    }else{
      res.render("layouts/signup")
    }
  })
    
  app.post('/signup',(req,res)=>{
    client.db().collection('logininfo').insertOne(req.body)
    res.redirect('/signin')
    
  })   
  
  app.post('/signin',async(req,res)=>{
    var pass = req.body.password
    let user = await client.db().collection('logininfo').findOne({name:req.body.name})  
    if(user){
      if(user.password==pass){
        console.log("user loged in")
        req.session.username=user.name
        req.session.loggedin=true
        req.session.loginid=user._id
       
        res.redirect('/home')
  
      }else{
        console.log("incorrect password")
        res.render('layouts/signin',{passErr:"incorrect password"})
      }
    }else{
      console.log("incorrect username")
      res.render('layouts/signin',{nameErr:"incorrect username"})
    }
  
  })
  
  
  app.get('/home',verifylogin,async(req,res)=>{
    let ifprofile = await client.db().collection('userinfo').findOne({
      loginid:req.session.loginid.toString()
    })
    if(ifprofile){
         let allusers =await client.db().collection("userinfo").find({
          loginid:{
             $nin:[req.session.loginid]
          }
          }).toArray()
  
          let currdata = await client.db().collection('userinfo').findOne({
              loginid:req.session.loginid
          })
          
        
   
          let curr_user_id=''
          if(currdata){
            curr_user_id = currdata._id 
          }
  
          req.session.curr_user_id=curr_user_id
  
         
  
      res.render('layouts/home',{
        loginid:req.session.loginid,
        loggedin:req.session.loggedin,
        username:req.session.username,
        allusers:allusers,
        curr_user_id:curr_user_id,
        })
    }else{
      res.redirect('/myaccount')
    }
  })
  
  
  
  
  // app.get('/logout',(req,res)=>{
  //   req.session=null
  //   res.redirect('/')
  // })
    
  // app.get('/myaccount',async(req,res)=>{
  
  //       let data =await client.db().collection('userinfo').findOne({loginid:req.session.loginid})   
  //       if(data){
  //         res.render("layouts/myprofile",{loggedin:req.session.loggedin,username:req.session.username,userdata:data,imagename:data._id.toString()})  
  //       }else{
  //       res.render('layouts/create_user',{loginid:req.session.loginid,loggedin:req.session.loggedin,username:req.session.username})
  //       }
    
  // })  
  
  
  // app.post('/createuser',(req,res)=>{
    
  //   console.log("createing user")
  //   if(req.body.name=='' || req.body.age=='' || req.body.fathersname=='' ||
  //   req.body.mothersname=='' || req.body.Education=='' || req.body.familytype==''
  //   || req.body.familystatus=='' || req.body.livingin=='' || 
  //   req.body.height=='' || req.body.bodytype=='' || req.body.complexion==''||
  //   req.body.about=='' || req.body.sex=='' || req.body.martialstatus=='' ||
  //   req.body.religion=='' || req.body.occupation=='' || req.body.income=='' ||
  //   req.body.height=='' || req.body.weight=='' || req.body.phone=='' ||
  //   req.body.address==''){
    
  //   res.render('layouts/create_user',{loginid:req.session.loginid,loggedin:req.session.loggedin,username:req.session.username,Error:'Please fill all the fields',partial_data:req.body})
  
  //   }else{
  //     client.db().collection('userinfo').insertOne(req.body).then((data)=>{
  //       let imagename = data.insertedId
  //       if(req.files){
  //         let image = req.files.Image
  //         image.mv("./public/userimages/"+imagename+".jpg",(err,done)=>{
  //         if(!err){
  //           console.log("image inserted")
  //         }else{
  //           throw err   
  //         }
  //       }) 
  //       }
  //     })
  //     client.db().collection('userinfo').updateOne(
  //       {loginid:req.body.loginid},
  //       {
  //         $set:{
  //           intrested:[],
  //           myintrests:[]
  //         }
  //       }
  //     )
  //     req.session.acc_created=true
  //     res.redirect('/myaccount') 
  //     console.log(req.session) 
  //   }
   
  // })
  
  // app.get("/edit/:id",async (req,res)=>{
  //     let data =await client.db().collection('userinfo').findOne({_id:ObjectId(req.params.id)})   
  //     res.render('layouts/edit_user',
  //     {currdata:data,
  //       imagename:data._id.toString(),
  //       loggedin:req.session.loggedin,
  //       username:req.session.username,
  //       loginid:req.session.loginid})
    
  // })
  
  // app.post('/edit/:id',async (req,res)=>{
  //   if(req.body.name=='' || req.body.age=='' || req.body.fathersname=='' ||
  //   req.body.mothersname=='' || req.body.Education=='' || req.body.familytype==''
  //   || req.body.familystatus=='' || req.body.livingin=='' || 
  //   req.body.height=='' || req.body.bodytype=='' || req.body.complexion==''||
  //   req.body.about=='' || req.body.sex=='' || req.body.martialstatus=='' ||
  //   req.body.religion=='' || req.body.occupation=='' || req.body.income=='' ||
  //   req.body.height=='' || req.body.weight=='' || req.body.phone=='' ||
  //   req.body.address==''){
  //     let imagename =await client.db().collection('userinfo').findOne({
  //       loginid:req.body.loginid
  //     })
  //     let data = req.body
  //     console.log(data)
  //     console.log(imagename._id.toString())   
  //     res.render('layouts/edit_user',
  //     {currdata:data, 
  //       imagename:imagename._id.toString(),
  //       loggedin:req.session.loggedin,   
  //       username:req.session.username,
  //       loginid:req.session.loginid,
  //       Error:"please fill all the fields"
  //     })
  //   }else{
  //     await client.db().collection("userinfo").updateOne({_id:ObjectId(req.params.id)},{
  //       $set:{
  //         name:req.body.name,
  //         age:req.body.age,
  //         sex:req.body.sex,
  //         martialstatus:req.body.martialstatus,
  //         religion:req.body.religion,
  //         fathersname:req.body.fathersname,
  //         mothersname:req.body.mothersname,
  //         income:req.body.income,
  //         height:req.body.height,
  //         weight:req.body.weight,
  //         phone:req.body.phone,
  //         address:req.body.address,
  //         Education:req.body.Education,
  //         familytype:req.body.familytype,
  //         familystatus:req.body.familystatus,
  //         livingin:req.body.livingin,
  //         height:req.body.height,
  //         bodytype:req.body.bodytype,
  //         complexion:req.body.complexion,
  //         about:req.body.about,
  //         loginid:req.body.loginid
  //       }
  //     }).then((data)=>{
  //       let imagename = req.params.id
  //       if(req.files){
  //         let image = req.files.Image
  //         image.mv("./public/userimages/"+imagename+".jpg",(err,done)=>{
  //         if(!err){
  //           console.log("image updated")
  //         }else{
  //           throw err
  //         }
  //       }) 
  //       }
  //     })
  //     res.redirect('/myaccount')
  //   }
   
   
  // })
  
  // app.get('/filter',verifylogin,async(req,res)=>{
  //   let data =await client.db().collection('userinfo').findOne({
  //     loginid:req.session.loginid.toString()
  //   })
  //   console.log(data)
  //   if(data){
  //     res.render("layouts/filter",{loggedin:req.session.loggedin,username:req.session.username})
  //   }else{
  //     res.redirect('/myaccount')
  //   } 
  // })
  
  // app.post('/filter',async (req,res)=>{
  
  //   const edu_data=req.body.Education=="choose" ? ["10th","+2","UG","PG","PHD","Diploma","ITI"]  : [req.body.Education]
  //   const sex_data=req.body.sex=="choose" ? ["Male","Female"] : [req.body.sex]
  //   const martial_data = req.body.martialstatus=="choose" ? ["Unmarried","Divorced"] : [req.body.martialstatus]
  //   const religion_data = req.body.religion=="choose" ? ["Hindu","Christian","Islam","Sikh"] : [req.body.religion]
  //    const complexion_data = req.body.complexion=="please select" ?  ["very-fair","fair","Wheatish"] : [req.body.complexion] 
  //   const lower = req.body.lowerage ? req.body.lowerage : 0
  //   const higer = req.body.higherage ? req.body.higherage : 200
  
    
  //  let array=[]
  //  for(i=lower;i<higer;i++){
  //    array[i]=i.toString()
  //  }
  
  //  console.log(array)
  
  //   const filereddata = await client.db().collection("userinfo").find({
  //     loginid:{$ne:req.session.loginid},
  //     age:{$in:array},
  //     Education:{$in:edu_data},
  //     religion:{$in:religion_data},
  //     martialstatus:{$in:martial_data},
  //     sex:{$in:sex_data},
  //     complexion:{$in:complexion_data}
  //    }).toArray()
  
     
  //    let currdata = await client.db().collection('userinfo').findOne({
  //     loginid:req.session.loginid
  //     })     
  
  //   let curr_user_id=''
  //   if(currdata){
  //     curr_user_id = currdata._id 
  //   }
    
  //   console.log("lower",lower,"higer",higer)
  //   console.log(edu_data)
  //   console.log(complexion_data)
  //   console.log(sex_data)
  //   console.log(religion_data)
  //   console.log(martial_data)
  
  //   console.log(filereddata)
  
  //   res.render('layouts/home',{
  //     loggedin:req.session.loggedin,
  //     username:req.session.username,
  //     curr_user_id:curr_user_id,
  //     loginid:req.session.loginid,
  //     filter:true,
  //     data:filereddata})
    
  // }) 
  
  
  // app.get('/requests',verifylogin, async(req,res)=>{
  //   let current_user =await client.db().collection('userinfo').findOne({loginid:req.session.loginid})
  //   if(current_user){
  //     let requests_id_array = current_user.intrested
  //     let array=[]
  //     for(i=0;i<requests_id_array.length;i++){
  //       array[i]=requests_id_array[i].userid
  //     }
     
    
  //     let requested_users =await client.db().collection('userinfo').find(
  //       {
  //         _id:{
  //           $in:array
  //         }
  //       }
  //     ).toArray()  
    
  //     let myintrestsid_id_array = current_user.myintrests
     
  //     let array1=[]
  //     for(i=0;i<myintrestsid_id_array.length;i++){
  //       array1[i]=myintrestsid_id_array[i].userid
  //     }
    
  //     let intrested_users = await client.db().collection('userinfo').find(
  //       {
  //         _id:{
  //           $in:array1
  //         }
  //       }
  //     ).toArray()  
    
      
  //     let currdata = await client.db().collection('userinfo').findOne(
  //       {
  //         loginid:req.session.loginid
  //       } 
  //     )
    
  //     let curr_user_id=''
  //     if(currdata){
  //       curr_user_id = currdata._id
  //     }
    
  //     res.render('layouts/requests',{
  //       loggedin:req.session.loggedin,
  //       username:req.session.username,
  //       loginid:req.session.loginid,
  //       requested_users:requested_users,
  //       intrested_users:intrested_users,
  //       curr_user_id:curr_user_id,
  //       requests_id_array:requests_id_array,
  //       myintrestsid_id_array:myintrestsid_id_array})
    
  //   }else{
  //     res.redirect('/myaccount')
  //   }
  
  //   //console.log(myintrestsid_id_array)
    
     
  // }) 
  
  
  
  // app.post('/sendintrest',async(req,res)=>{ 
  
    
  //   let ifpresent = await client.db().collection('userinfo').findOne(
  //     {
  //       loginid:req.session.loginid,
  //     "myintrests.userid":ObjectId(req.body.request_to)
  //   }
  //   )
  
  //   if(ifpresent){
  //     await client.db().collection('userinfo').updateOne(
  //       {
  //         loginid:req.session.loginid,
  //       "myintrests.userid":ObjectId(req.body.request_to)
  //     },{
  //       $set:{
  //         "myintrests.$.declined":false
  //       }
  //     }
  //     )
  //   }else{
  //     await client.db().collection('userinfo').updateOne(  
  //       {loginid:req.body.loginid},   
  //       {
  //         $push:{
  //           myintrests:{
  //             userid:ObjectId(req.body.request_to),
  //             accepted:false,
  //             declined:false  
  //           }
  //         }
  //       }
  //     ) 
  //   }
  
   
  //   let data = await  client.db().collection('userinfo').findOne( 
  //     {loginid:req.body.loginid.toString()} 
  //   )
  
  //   console.log(req.body)
  
  //   const userid = data._id
  //   client.db().collection('userinfo').updateOne(
  //     {_id:ObjectId(req.body.request_to)}, 
  //     {
  //       $push:{
  //         intrested:{
  //           userid:userid,
  //           accepted:false
  //         }
  //       } 
  //     }
  //   )
    
  // })
  
     
  // app.post('/acceptrequest',async(req,res)=>{
  //  // console.log(req.body)
  //   let data = await client.db().collection('userinfo').updateOne(
  //     {loginid:req.session.loginid,"intrested.userid":ObjectId(req.body.requested_id)},
     
  //     {
  //       $set:{
  //         "intrested.$.accepted":true
  //       }
  //     }
  //   )
  
  
  //   let currdata = await client.db().collection('userinfo').findOne(
  //     {
  //       loginid:req.session.loginid
  //     } 
  //   )
  
  //   let curr_user_id=''
  //   if(currdata){
  //     curr_user_id = currdata._id
  //   }
  
    
    
  //   await client.db().collection('userinfo').updateOne(
  //     {_id:ObjectId(req.body.requested_id),"myintrests.userid":curr_user_id},
  
  //     {
  //       $set:{
  //         "myintrests.$.accepted":true
  //       }
  //     }
  //   )
  //   res.redirect('/requests') 
  // }) 
  
  
  // app.post('/declinerequest',async(req,res)=>{
  //   await client.db().collection('userinfo').updateOne(
  //     {loginid:req.session.loginid},
  //     {
  //       $pull:{
  //         intrested:{userid:ObjectId(req.body.requested_id)}
  //       }
  //     }
  //   )
  
  
  
  //   let currdata = await client.db().collection('userinfo').findOne(
  //     {
  //       loginid:req.session.loginid
  //     } 
  //   )
  
  //   let curr_user_id=''
  //   if(currdata){
  //     curr_user_id = currdata._id
  //   }
  
  //   await client.db().collection('userinfo').updateOne(
  //     {_id:ObjectId(req.body.requested_id),"myintrests.userid":curr_user_id},
  //     {$set:{
  //       "myintrests.$.declined":true
  //     }}
  //   )
  
  //   console.log(req.session.loginid)
  //   console.log(req.body.requested_id)
  //   console.log("deleted")
  
   
   
  // })
  
  
  // app.get('/viewprofile/:id',async(req,res)=>{
  //   console.log(req.params.id)
  //   let data =await client.db().collection('userinfo').findOne(
  //     {
  //       _id:ObjectId(req.params.id)
  //     }
  //   )
  //   res.render('layouts/viewprofile',{data:data,loggedin:req.session.loggedin,username:req.session.username})
  // })  
  
  // app.post('/search',async(req,res)=>{
  //   let data = await client.db().collection('userinfo').findOne(
  //     {
  //       name:req.body.search_name 
  //     }
  //   )
  
  //   let notfind = false
  //   let sameuser = false
  //   let currdata=''
  
  //   if(!data){
  //     notfind=true
  //   }else{
  //     console.log("Entered")
  //     let currdata = await client.db().collection('userinfo').findOne(
  //       {
  //         loginid:req.session.loginid
  //       }
  //     )
  
  //     //console.log(currdata)
    
  //     if(currdata.name==req.body.search_name){
  //       sameuser = true
  //     }
  //   }
  
  
  //   let curr_user_id=''
  //   if(currdata){    
  //     curr_user_id = currdata._id 
  //   }
  
  
  //  console.log(sameuser)
  
  //   res.render('layouts/home',{
  //     loggedin:req.session.loggedin,
  //     username:req.session.username,
  //     loginid:req.session.loginid,
  //     curr_user_id:req.session.curr_user_id,
  //     searched_data:data,
  //     intrested:notfind ? [] : data.intrested, 
  //     sameuser:sameuser,
  //     notfind:notfind
  //   })
  
  
  
  // })


 



module.exports = app;
