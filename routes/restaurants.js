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
            typeofContract:{$in:typedecontrat}
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

module.exports = router;
