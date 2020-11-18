//Toutes les routes codées dans index.js sont  des routes communes au talents et restaurant. 
var express = require('express');
var router = express.Router();

var talentModel = require('../model/talents')
var restaurantModel = require ('../model/restaurants')
var chatRoomModel = require('../model/chatRoom');

var uid2 = require("uid2");
var SHA256 = require("crypto-js/sha256");
var encBase64 = require("crypto-js/enc-base64");
var uniqid = require('uniqid');
const fs = require('fs');

var cloudinary = require('cloudinary').v2;
cloudinary.config({ 
  cloud_name: 'dpyqb49ha', 
  api_key: '513712396958631', 
  api_secret: 'VQta0R5Tlg-lEsbYWnLjh-AnN1I' 
});

const { isValidObjectId } = require('mongoose');

//Cette route permet de se connecter, que l'on soit un restaurant ou un talent //
router.post('/sign_in', async function(req,res,next){
  
//On cherche d'abord dans la base de données talents (logiquement leur nombre sera superieur)

  var talentToSearch = await talentModel.findOne({email : req.body.email})
  if(talentToSearch){
    var hash = SHA256(req.body.password + talentToSearch.salt).toString(encBase64)
    if (talentToSearch.password == hash){
      res.json({result:true, type:'talent', token : talentToSearch.token, adresse: talentToSearch.adresselgtlat, zone: talentToSearch.perimetre, profil: talentToSearch})
    }else{
      res.json({result : 'Error'})
    }
  }
  //Sinon on cherche dans base de données restaurants
  else{
    var restauToSearch = await restaurantModel.findOne({email : req.body.email})
    if(restauToSearch){
      var hashh = SHA256(req.body.password + restauToSearch.salt).toString(encBase64)
      if (restauToSearch.password == hashh){
        res.json({result : true, type:'restaurant', token : restauToSearch.token, adresse: restauToSearch.adresselgtlat, profil: restauToSearch})
      }else{
        res.json({result : 'Error'})
      }
    }else{
      res.json({result : 'Error'})
    }
  }
})

router.post('/upload/:token', async function(req, res, next) {
  // upload de la photo de profil et enregistrement sur Cloudinary, copie du lien en BDD
  // si l'utilisateur fait partie des restaurants :
  if (await restaurantModel.findOne({token:req.params.token})){
    var uniqidPhoto = `/tmp/${uniqid()}${req.files.photo.name}`
    var resultCopy = await req.files.photo.mv(uniqidPhoto);
    var resultCloudinary = await cloudinary.uploader.upload(uniqidPhoto);
    await restaurantModel.updateOne({token:req.params.token}, {photo: resultCloudinary.url})
  } else {
    // si l'utilisateur fait partie des talents :
    var uniqidPhoto = `/tmp/${uniqid()}${req.files.photo.name}`
    var resultCopy = await req.files.photo.mv(uniqidPhoto);
    var resultCloudinary = await cloudinary.uploader.upload(uniqidPhoto);
    await talentModel.updateOne({token:req.params.token}, {avatar:resultCloudinary.url})
    }
    fs.unlinkSync(uniqidPhoto)
    res.json({result: true, message: 'File uploaded!'} )
});

//Cette fonction permet de créer une salle de messagerie lorqu'un restaurant contacte un talent
router.post('/createChatRoom', async function(req,res,next){
  var expediteur = await restaurantModel.findOne(
    { token : req.body.expediteur }
 )
  var destinataire = await talentModel.findOne(
    {token : req.body.desti}
  )
    var chatRoomTocheck = await chatRoomModel.findOne({
      name : `chatRoomOf${req.body.expediteur}and${req.body.desti}`
    })
    //Si une salle de messagerie existe déja, on renvoie son ID
    if (chatRoomTocheck){
      res.json({result:`chat room déja existante entre ${req.body.expediteur} et ${req.body.desti} id : ${chatRoomTocheck.id}`, chatRoomId : chatRoomTocheck.id})
    //Si elle n'existe pas, on en crée une, on la sauvegarde et on renvoie également son ID
    }else{
      var newRoom = await new chatRoomModel({
        name : `chatRoomOf${req.body.expediteur}and${req.body.desti}`,
        expediteurName : expediteur.name,
        destinataireName : `${destinataire.firstName} ${destinataire.lastName}`
      })
      await newRoom.save()
    //On update les modeles restaurant et talents pour leur ajouter l'ID de la salle de messagerie en clés étrangère 
      await restaurantModel.updateOne({token : req.body.expediteur},{$addToSet:{chatRoom : newRoom.id}})
      await talentModel.updateOne({token : req.body.desti},{$addToSet:{chatRoom : newRoom.id}})
      res.json({result : ` création de chatRoomOf${req.body.expediteur}and${req.body.desti} id : ${newRoom.id}`, chatRoomId : newRoom.id})
    }
});

//Cette fonction permet de récuperer les anciens messages de la salle de messagerie stocké en base de données 
//Elle permet également de renvoyer au front toutes les informations de la personne à qui l'on s'adresse
router.post('/getOldMessage',async function(req,res,next){

  //On regarde d'abord si on est un restaurant et que l'on parle à un talent
  var talentToFind = await talentModel.findOne({token:req.body.token})
  if(talentToFind){
    let chatRoomId = req.body.chatRoomId
    var chatRoomToFind = await chatRoomModel.findById(chatRoomId)
    if(chatRoomToFind){
      console.log('chatroomtofind',chatRoomToFind.expediteurName)
      res.json({result : chatRoomToFind.message, restau : chatRoomToFind.expediteurName, talent : chatRoomToFind.destinataireName, card: talentToFind})
    } else {
      res.json({result : 'no old messages', restau : chatRoomToFind.expediteurName, talent : chatRoomToFind.destinataireName, card: talentToFind})
    }
  }
  //Sinon c'est que l'on est un talent et on recherche dans les restaurants
   else{
     var restauToFind = await restaurantModel.findOne({token:req.body.token})
     console.log(restauToFind)
     let chatRoomId = req.body.chatRoomId
     let chatRoomToFind = await chatRoomModel.findById(chatRoomId)
     if(chatRoomToFind){
       res.json({result:chatRoomToFind.message,restau : chatRoomToFind.expediteurName, talent : chatRoomToFind.destinataireName, card : restauToFind})
     }else{
       res.json({result : 'no old messages',restau : chatRoomToFind.expediteurName, talent : chatRoomToFind.destinataireName, card : restauToFind})
     }
   }
})

//Cette fonction permet de récuperer l'ensemble de ses salles de messagerie, que l'on soit talent ou restaurant
router.post('/getMyChatRoom', async function(req,res,next){
  var talentToFind = await talentModel.findOne({token: req.body.token}).populate('chatRoom').exec()
  if(talentToFind){
    res.json({result : talentToFind.chatRoom})
  } else {
    var restauToFind = await restaurantModel.findOne({token:req.body.token}).populate('chatRoom').exec()
    res.json({result : restauToFind.chatRoom})
  }
})

module.exports = router;
