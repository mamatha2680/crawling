var express = require('express');
var router = express.Router();
const request = require('request');
const cheerio = require('cheerio');
/* GET home page. */

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var db_conn;
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/crawl', function (req, res, next) {

  const URL = req.body.url;

  request(URL, function (err, response, body) {
    if (err) {
      console.log(err, "error occured while hitting URL");
    }
    else {
      var $ = cheerio.load(body);

      var output_json = { title: "", img: [], description: "" };
      var OG_output_json = {};
      output_json.title = $("title").text();
      output_json.img.push($('img').attr('src'));

      $("img").each(function (i, image) {


        if (output_json.img.indexOf($(image).attr('src')) == -1 && $(image).attr('src')) output_json.img.push($(image).attr('src'));

      });

      output_json.description = $('h1').html() ? $('h1').html() : $('h2').html()
      var meta = $('meta')
      var keys = Object.keys(meta)

      keys.forEach(function (key) {
        if (meta[key].attribs
          && meta[key].attribs.property
        ) {
          OG_output_json[meta[key].attribs.property] = meta[key].attribs.content;

        }
      });

      var ToBeSend = { "crawleddata": output_json, "OG_crawleddata": OG_output_json }
      if (!db_conn) {
        MongoClient.connect(url, function (err, db) {
          if (err) throw err;
          db_conn = db.db("CrawlingDB");
          update();

        });
      } else {
        update();
      }
      function update() {
        db_conn.collection("CrawledData").update({ _id: req.body.url }, { $set: { Data: ToBeSend } }, { upsert: true }, function (err, resp) {
          if (err) throw err;
          else {
            res.send(ToBeSend);

          }
          // db.close();
        });
      }

    }
  });
});
router.get('/getCrawledList', function (req, res, next) {
  if (!db_conn) {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      db_conn = db.db("CrawlingDB");
      getlist();

    });
  } else {
    getlist();
  }
  function getlist() {
    db_conn.collection("CrawledData").find({}).toArray( function (err, resp) {
      if (err) throw err;
      else {
        res.send(resp);

      }
      // db.close();
    });
  }
});
module.exports = router;
