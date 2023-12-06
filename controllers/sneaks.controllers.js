const Sneaker = require('../models/Sneaker');
const stockXScraper = require('../scrapers/stockx-scraper');
const flightClubScraper = require('../scrapers/flightclub-scraper');
const goatScraper = require('../scrapers/goat-scraper');
const stadiumGoodsScraper = require('../scrapers/stadiumgoods-scraper');

module.exports = class Sneaks {
    /* findOne (shoeID, callback) {
     Sneaker.findOne({
       styleID: shoeID
     }, function (err, shoe) {
       if (err) {
         console.log(err);
         callback(err, null);
       }
       callback(null, shoe)
     });
   };*/

  /*exports.create = async function (req, res) {
    if (!req.params) {
      return res.status(400).send({
        message: "Shoe parameters can not be empty"
      });
    }
    getProducts(req.params.shoe, function (error, products) {
      if (error) {

        console.log(error)
        res.send("Product Not Found");
      } else {
        res.json(products);
      }
    });
  };*/
  async getProducts(keyword, count = 40, callback) {

    var stockXProducts = await new Promise((resolve, reject) => {
      stockXScraper.getProductsAndInfo(keyword, count, async function (error, products) {
        if (error) {
          reject(error)
        }
        await Promise.all((products ?? []).map(async function (shoe) {
          var fcLink = new Promise(function (resolve, reject) {
            flightClubScraper.getLink(shoe, function () {
              resolve();
            });
          });

          var sgLink = new Promise(function (resolve, reject) {
            stadiumGoodsScraper.getLink(shoe, function () {
              resolve();
            });
          });

          var gLink = new Promise(function (resolve, reject) {
            goatScraper.getLink(shoe, function () {
              resolve();
            });
          });

          return Promise.all([fcLink, sgLink, gLink]);
        }));
        resolve(products);
      });
    });

    var goatProducts = await new Promise((resolve, reject) => {
      goatScraper.getProductsAndInfo(keyword, count, async function (error, products) {
        if (error) {
          reject(error)
        }
        await Promise.all((products ?? []).map(async function (shoe) {
          var fcLink = new Promise(function (resolve, reject) {
            flightClubScraper.getLink(shoe, function () {
              resolve();
            });
          });

          var sgLink = new Promise(function (resolve, reject) {
            stadiumGoodsScraper.getLink(shoe, function () {
              resolve();
            });
          });

          return Promise.all([fcLink, sgLink]);
        }));
        resolve(products);
      });
    });

    var products = stockXProducts.concat(goatProducts.filter(function (gItem) {
      return !stockXProducts.find(function (sItem) {
        return gItem.styleID === sItem.styleID
      })
    }));

    callback(null, products);

  }

  getProductPrices(shoeID, callback) {
    const getPrices = (shoe) => {
      var cbCounter = 0;
      stockXScraper.getPrices(shoe, function () {
        cbCounter++;
        if (cbCounter == 5) {
          callback(null, shoe)
        }
      });
      stadiumGoodsScraper.getPrices(shoe, function () {
        cbCounter++;
        if (cbCounter == 5) {
          callback(null, shoe)
        }

      });
      flightClubScraper.getPrices(shoe, function () {
        cbCounter++;
        if (cbCounter == 5) {
          callback(null, shoe)
        }

      });
      goatScraper.getPrices(shoe, function () {
        cbCounter++;
        if (cbCounter == 5) {
          callback(null, shoe)
        }
      });
      goatScraper.getPictures(shoe, function () {
        cbCounter++;
        if (cbCounter == 5) {
          callback(null, shoe)
        }
      });
    }

    getProducts(shoeID, 1, function (error, products) {
      if (error || products[0].styleID.toLowerCase() != shoeID.toLowerCase()) {
        console.log(new Error("No Products Found"));
        callback(new Error("No Products Found"), null);
        return;
      }
      getPrices(products[0]);
    });
  };

  /*findAll(callback) {
    Sneaker.find()
      .then(sneaks => {
        callback(null, sneaks);
      }).catch(err => {
        callback(err, null)
      });
  };*/

  getMostPopular(count, callback) {
    getProducts("", count, function (error, products) {
      if (error) {
        callback(error, null);
      } else {
        callback(null, products)
      }
    });
  };
}


var getProducts = function (keyword, count = 40, callback) {
  var productCounter = 0;
  stockXScraper.getProductsAndInfo(keyword, count, function (error, products) {
    if (error) {
      callback(error, null)
    }
    products.forEach(function (shoe) {
      var cbCounter = 0;
      flightClubScraper.getLink(shoe, function () {
        if (++cbCounter == 3) {
          //if all shoes links have been parsed then return
          if (productCounter++ + 1 == products.length) {
            callback(null, products);
          }
        }
      });

      stadiumGoodsScraper.getLink(shoe, function () {
        if (++cbCounter == 3) {
          //if all shoes links have been parsed then return
          if (productCounter++ + 1 == products.length) {
            callback(null, products);
          }

        }
      });

      goatScraper.getLink(shoe, function () {
        if (++cbCounter == 3) {
          //if all shoes links have been parsed then return
          if (productCounter++ + 1 == products.length) {
            callback(null, products);
          }
        }
      });
    });
  });
}
