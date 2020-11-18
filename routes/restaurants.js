var express = require('express');
var router = express.Router();

var restaurantModel = require('../model/restaurants');
var talentModel = require('../model/talents');
var formationModel = require('../model/formation');
var experienceModel = require('../model/experience');

const {request} = require('express');
var uid2 = require('uid2');
var SHA256 = require("crypto-js/sha256");
var encBase64 = require("crypto-js/enc-base64");

var cloudinary = require('cloudinary').v2;
cloudinary.config({ 
  cloud_name: 'dpyqb49ha', 
  api_key: '513712396958631', 
  api_secret: 'VQta0R5Tlg-lEsbYWnLjh-AnN1I' 
});


router.post('/createAccount', async function(req,res,next){
  // Création des profils, ajout en base de donnée avec un avatar non personnalisé, sécurisation du mot de passe
  var avatar = "https://cdn.pixabay.com/photo/2016/11/29/12/54/bar-1869656_1280.jpg"
  var salt = uid2(32)
  var restauToCheck = await restaurantModel.findOne({email:req.body.restaurantEmail})
  if(restauToCheck === null){
    var newRestau = await new restaurantModel({
      name : req.body.restaurantName,
      email : req.body.restaurantEmail,
      salt : salt,
      password : SHA256(req.body.restaurantPassword + salt).toString(encBase64),
      token: uid2(32), 
      siret : req.body.restaurantSiret,
      photo : avatar ,
      website : req.body.restaurantWebsite,
      phone : req.body.phoneRestaurant,
      adress : req.body.restaurantAdress,
      clientele: [],
      pricing:4,
      typeOfRestaurant:[],
      typeOfFood:[],
      wishlistRestaurant:[],
      experience:[],
      adresselgtlat: JSON.parse(req.body.lnglat),
      chatRoom:[],
    })
    var restauSaved = await newRestau.save();
    console.log(restauSaved)
    if(restauSaved){
      res.json({token:restauSaved.token, adresse:restauSaved.adresselgtlat, profil: restauSaved})
    }else{
      res.json(false)
    }
  }
})

// Affichage de tous les talents de la BDD
router.get('/getinformation', async function(req,res,next){
  let talentlist = await talentModel.find().populate('formation').populate('experience').exec()
  res.json({talentlist:talentlist})
 })

router.post('/recherche-liste-talents',async function(req,res,next){
var données= JSON.parse(req.body.criteres)
var restaurant = await restaurantModel.findOne({token:req.body.token})
var jobminuscule=données.posterecherché

var typedecontrat=données.typedecontrat

// Permet de récupérer les talents à afficher en fonction des fitlres appliqués
// Condition avec toutes les postes
if (jobminuscule== 'tous les postes'){
    if(typedecontrat == 'Tous type de contrat'){
      var responseAenvoyer=await talentModel.find().populate('formation').populate('experience').exec()
        }else{
// Permet de récupérer les talents à afficher en fonction des fitlres appliqués
// Condition avec toute type de contrat
        var responseAenvoyer=await talentModel.find({typeofContract:{$in:typedecontrat}}).populate('formation').populate('experience').exec()
  }}else if(typedecontrat == 'Tous type de contrat'){
    if(jobminuscule== 'tous les postes'){
      var responseAenvoyer=await talentModel.find().populate('formation').populate('experience').exec()
    }else{
    var responseAenvoyer=await talentModel.find({lookingJob:{$in:jobminuscule }}).populate('formation').populate('experience').exec()
  }}
    else{  
      console.log('je suis censé passé par la ')
           var responseAenvoyer = await talentModel.find({
            lookingJob:{$in:jobminuscule},
            typeofContract:{$in:typedecontrat},
            // polygone: {
            //   $geoIntersects: {
            //     $geometry: {
            //         type: "Point" ,
            //         coordinates: restaurant.adresselgtlat.coordinates,
            //     }
            //   }
            // }
          }).populate('formation').populate('experience').exec()
          console.log('response', responseAenvoyer)
        }
        let restaurantwishlistexpand = await restaurantModel.findOne({token:req.body.token}).populate('wishlistRestaurant').exec()
        let restaurantwishlistid = await restaurantModel.findOne({token:req.body.token})
        
       

  res.json({liste:responseAenvoyer,restaurantwishlist:restaurantwishlistexpand,restaurantwishlistid:restaurantwishlistid.wishlistRestaurant})
 })

 




 router.post('/addToWishList', async function (req,res,next){
  var user = await restaurantModel.findOne({token: req.body.token})
    var talent = await talentModel.findOne({_id: req.body.id})

      if(user.wishlistRestaurant.includes(talent.id)){ 
           await restaurantModel.updateOne({token: req.body.token}, { $pull: {wishlistRestaurant:{ $in:`${req.body.id}` }} })
      console.log('retrait whishlist')  
      await talentModel.findByIdAndUpdate(talent.id,{$inc:{countFave:-1,"metrics.orders": 1}})
    } else {
       await restaurantModel.updateOne({token: req.body.token}, {$addToSet:{ wishlistRestaurant:req.body.id}})
       await talentModel.findByIdAndUpdate(talent.id,{$inc:{countFave:+1,"metrics.orders": 1}})
      console.log('ajout whishlist')}

var responseAenvoyer=await talentModel.find().populate('formation').populate('experience').exec()
var wishlist= await restaurantModel.findOne({token:req.body.token})

 res.json({restaurantwishlistid:wishlist.wishlistRestaurant,liste:responseAenvoyer})
 })


router.put('/informations', async function(req,res,next){
  var clientele = JSON.parse(req.body.clientele)
  var type = JSON.parse(req.body.restaurantOption)
  var cuisine = JSON.parse(req.body.foodOption)
  var prix = JSON.parse(req.body.pricing)
  await restaurantModel.updateOne({token:req.body.token},{clientele: clientele, typeOfRestaurant : type, typeOfFood: cuisine, pricing : prix, siret:req.body.avatar})
})

router.get('/profil/:token', async function( req, res, next){  
   var user = await (await restaurantModel.findOne({token: req.params.token})) 
    res.json(user) })

module.exports = router;
