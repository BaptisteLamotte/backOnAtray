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

router.post('/createAccount', async function(req,res,next){
const zoneFrance= [
  [ -5.3173828125, 48.458124202908934 ],
  [ 2.1313476562500004, 51.26170001449684 ],
  [ 8.811035156250002, 48.90783374365477 ],
  [ 7.998046875000001, 43.70709714273101 ],
  [ 3.2080078125000004, 42.228008913641865 ],
  [ 1.4941406250000002, 42.293056273848215 ],
  [ -2.0214843750000004, 43.06838615478111 ],
  [ -5.3173828125, 48.458124202908934 ]
]
var polygoneFrance = {
  type: "Polygon" ,
  coordinates: [
    zoneFrance
  ]
}
  var salt = uid2(32)
  var talentToCheck = await talentModel.findOne({email:req.body.talentEmail})
  var avatar = 'https://res.cloudinary.com/dpyqb49ha/image/upload/v1604324805/mucu7fy5dbhrxmhtf1dc.jpg'
  if(talentToCheck === null){
    var newTalent = await new talentModel({
      firstName : req.body.firstName,
      lastName : req.body.lastName,
      email : req.body.email,
      password : SHA256(req.body.password + salt).toString(encBase64),
      token: uid2(32), 
      salt : salt,
      phone : req.body.phone,
      avatar:avatar,
      lookingForJob:false,
      working:false,
      speakLangage:[],
      adress:'',
      adresselgtlat: {
        type: "Point" ,
        coordinates: [2.33,48.33]},
      polygone: polygoneFrance,
      perimetre :zoneFrance,
      lookingJob:[],
      typeofContract: [],
      wishlistTalent:[],
      experience:[],
      formation:[],
      chatRoom:[],
      countFave:0,
    })
    var talentSaved = await newTalent.save();
    if(talentSaved){
      res.json({token : talentSaved.token, profil: talentSaved})
    }else{
      res.json(false)
    }
  }
})

router.post('/informations', async function(req,res,next){

  dateFormat = function (date) {
 
    let day = ("0" + date.getDate()).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let dateFormat = day+"/"+month+"/"+year;
    return dateFormat 
  }
  
  var job = JSON.parse(req.body.job)
  var langage = JSON.parse(req.body.langage)
  var typeofContract=JSON.parse(req.body.contrat)

  await talentModel.updateOne({token:req.body.token},{speakLangage:langage, working:req.body.poste, lookingForJob: req.body.recherche, lookingJob:job, typeofContract:req.body.contrat})
  
  var formation = JSON.parse(req.body.formation)
  console.log('formation',formation)
  var experience = JSON.parse(req.body.experience)

  for (let i=0;i<formation.length;i++){
  var newFormation = await new formationModel({
  school : formation[i].school,
  diploma : formation[i].diploma,
  endingDate : dateFormat(new Date(formation[i].year)),
  city : formation[i].city
  })
  await newFormation.save();
  await talentModel.updateOne({token:req.body.token},{$addToSet:{formation:newFormation.id}})
  }
  
  for(let i=0; i<experience.length;i++){
    var newExperience = await new experienceModel({
    firm : experience[i].firm,
    city : experience[i].city,
    startingDate : dateFormat(new Date(experience[i].rangeDate[0])),
    endingDate : dateFormat(new Date(experience[i].rangeDate[1])),
    job: experience[i].job,
    })
  await newExperience.save();
  await talentModel.updateOne({token:req.body.token},{$addToSet:{experience:newExperience.id}})
  }
})


router.post('/envoi-secteur', async function(req, res, next){
 
  var listePoints = await JSON.parse(req.body.liste);
  listePoints.push(listePoints[0]);
  await talentModel.updateOne({ token: req.body.token }, {perimetre: listePoints,adress:req.body.adresse, polygone: {
    type: "Polygon" ,
    coordinates: [
      listePoints
    ]
 }})
})

router.post('/envoi-adresse', async function(req, res, next){
  var lnglat = JSON.parse(req.body.lnglat)
  await talentModel.updateOne({token: req.body.token}, {adress:req.body.adresse, adresselgtlat:lnglat})
})

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
              // crs: {
              //    type: "name",
              //    properties: { name: "urn:x-mongodb:crs:strictwinding:EPSG:4326" }
              // }
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

router.get('/detail-restaurant/:id', async function(req, res, next){
  var restaurant = await restaurantModel.findOne({_id:req.params.id})
  res.json(restaurant)
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

router.get('/affiche-whishlist/:token', async function( req, res, next){
  var user = await talentModel.findOne({token: req.params.token}).populate('wishlistTalent').exec()
  res.json(user.wishlistTalent)
})

router.get('/profil/:token', async function( req, res, next){
  var user = await (await talentModel.findOne({token: req.params.token}).populate('experience').populate('formation').exec())
  res.json(user)
})

router.post('/getMyAdress', async function(req,res,next){
  var talentToCheck = await talentModel.findOne({token:req.body.token})

  var adress ={long : talentToCheck.adresselgtlat.coordinates[0], lat : talentToCheck.adresselgtlat.coordinates[1] }
  res.json(adress)

})


module.exports = router;
