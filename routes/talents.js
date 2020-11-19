var express = require('express');
var router = express.Router();
var talentModel = require('../model/talents')
var formationModel = require('../model/formation')
var experienceModel = require('../model/experience')
const {request} = require('express');
var uid2 = require('uid2');
var SHA256 = require("crypto-js/sha256");
var encBase64 = require("crypto-js/enc-base64");


var restaurantModel = require('../model/restaurants')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post(`/recherche-liste-restaurants`, async function(req, res, next){
  var donnees = JSON.parse(req.body.restaurant)
  console.log('donnees', donnees)
  var responseAenvoyer = await restaurantModel.find(
     { 
      adresselgtlat: {
        $geoIntersects: {
           $geometry: {
              type: "Polygon" ,
              coordinates: [donnees.zone],
           }
        }
      },
      typeOfFood : {$in: donnees.cuisine},
      typeOfRestaurant: { $in: donnees.ambiance},
      clientele: { $in: donnees.type},
      pricing :{ $in: donnees.prix} 
    }
  )
  var user = await talentModel.findOne({token:req.body.token})
  if (user.wishlistTalent){
    var whishlist = user.wishlistTalent
  } else{
   var whishlist = []
  } 
  res.json({liste : responseAenvoyer, whishlist: whishlist})
})

router.post('/whishlist', async function( req, res, next){
  var user = await talentModel.findOne({token: req.body.token})
  var restaurant = await restaurantModel.findOne({_id: req.body.restaurant})
  if(user.wishlistTalent.includes(restaurant._id)){
    await talentModel.updateOne({token: req.body.token}, { $pull: { wishlistTalent: { $in:  `${req.body.restaurant}` }} })
  } else {
    await talentModel.updateOne({token: req.body.token}, {$addToSet:{ wishlistTalent: req.body.restaurant}})
  }
  
  var response = await restaurantModel.find()
  var userAjour = await talentModel.findOne({token: req.body.token})
  res.json({liste :response, whishlist: userAjour.wishlistTalent})
})


router.post('/getMyAdress', async function(req,res,next){
  var talentToCheck = await talentModel.findOne({token:req.body.token})

  var adress ={long : talentToCheck.adresselgtlat.coordinates[0], lat : talentToCheck.adresselgtlat.coordinates[1] }
  res.json(adress)

})


module.exports = router;
