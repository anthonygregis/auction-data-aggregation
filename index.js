require('dotenv').config()
const express = require('express')
const app = express()
const db = require('./models')
const axios = require('axios')
var exec = require('exec')
const BNET_ID = process.env.BNET_ID
const BNET_SECRET = process.env.BNET_SECRET

//Start Express
app.get('/', (req, res) => {
    res.send("You thought")
})

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`🎧 You're listening to the smooth sounds of port ${port} 🎧`)
});

const getToken = (cb) => {
    exec(`curl -u ${BNET_ID}:${BNET_SECRET} -d grant_type=client_credentials https://us.battle.net/oauth/token`
        , (error, result, metadata) => {
            results = JSON.parse(result)
            cb(results.access_token)
        });
}

const itemInfo = () => {
    console.log("Running auction house grabbing")
    getToken(access_token => {
        db.item.findAll({
            where: {
                media: null
            }
        })
            .then(items => {
                const asyncIterable = {
                    [Symbol.asyncIterator]() {
                        return {
                            i: 0,
                            next() {
                                if (this.i < items.length) {
                                    return Promise.resolve({value: this.i++, done: false});
                                }

                                return Promise.resolve({done: true});
                            }
                        };
                    }
                };

                (async function () {
                    for await (let num of asyncIterable) {
                        try {
                            let results = await axios.get(`https://us.api.blizzard.com/data/wow/item/${items[num].id}?namespace=static-us&locale=en_US&access_token=${access_token}`)
                            let itemMedia = await axios.get(`https://us.api.blizzard.com/data/wow/media/item/${items[num].id}?namespace=static-us&locale=en_US&access_token=${access_token}`)
                            if (results.status === 200) {

                                const result = await db.sequelize.transaction(async (t) => {

                                    const item = await db.item.update({
                                        name: results.data.name,
                                        quality: results.data.quality.name,
                                        level: results.data.level,
                                        media: itemMedia.data.assets[0].value,
                                        itemClass: results.data.item_class.name,
                                        itemSubclass: results.data.item_subclass.name,
                                        inventoryType: results.data.inventory_type.name,
                                        vendorPurchase: results.data.purchase_price,
                                        vendorSell: results.data.sell_price,
                                        maxCount: results.data.max_count,
                                        isEquippable: results.data.is_equippable,
                                        isStackable: results.data.is_stackable,
                                        purchaseQuantity: results.data.purchase_quantity
                                    },
                                    {
                                        where: {
                                            id: items[num].id
                                        },
                                        transaction: t
                                    })

                                    return true
                                })
                            }

                            // If the execution reaches this line, the transaction has been committed successfully
                            // `result` is whatever was returned from the transaction callback (the `user`, in this case)

                        } catch (error) {
                            console.log("ERROR:", error)
                            // If the execution reaches this line, an error occurred.
                            // The transaction has already been rolled back automatically by Sequelize!

                        }
                    }
                })()
                console.log(items.length)
            })
    })
}

const auctionMethod = () => {
    console.log("Running auction house grabbing")
    getToken(access_token => {
        db.connectedRealm.findAll()
            .then(connRealm => {

                let auctionHouse = connRealm[0].auctionHouse
                axios.get(`${auctionHouse}&access_token=${access_token}`)
                    .then((results) => {
                        status = results.status
                        statusMessage = results.statusText
                        if(status === 200) {
                            const asyncIterable = {
                                [Symbol.asyncIterator]() {
                                    return {
                                        i: 0,
                                        next() {
                                            if (this.i < results.data.auctions.length) {
                                                return Promise.resolve({ value: this.i++, done: false });
                                            }

                                            return Promise.resolve({ done: true });
                                        }
                                    };
                                }
                            };

                            (async function() {
                                for await (let num of asyncIterable) {
                                    try {

                                        const result = await db.sequelize.transaction(async (t) => {

                                            const item = await db.item.findOrCreate({
                                                where: {
                                                    id: results.data.auctions[num].item.id
                                                },
                                                transaction: t
                                            })

                                            const pricingData = await db.pricingData.create({
                                                unitPrice: results.data.auctions[num].unit_price || results.data.auctions[num].buyout,
                                                quantity: results.data.auctions[num].quantity,
                                                itemId: results.data.auctions[num].item.id,
                                            }, { transaction: t })

                                            pricingData.setConnectedRealm(connRealm[0].get().id)

                                            return true

                                        });

                                        // If the execution reaches this line, the transaction has been committed successfully
                                        // `result` is whatever was returned from the transaction callback (the `user`, in this case)

                                    } catch (error) {
                                        console.log("ERROR:", error)
                                        // If the execution reaches this line, an error occurred.
                                        // The transaction has already been rolled back automatically by Sequelize!

                                    }
                                }
                            })()
                            console.log(results.data.auctions.length)
                        } else {
                            console.log("Auction House Fetch Failed:", statusMessage)
                        }
                        // setInterval(testAuctionMethod, 1 * 60 * 60 * 1000)
                    })
                    .catch(err => {
                        console.log("ERROR:", err)
                    })
            })
            .catch(err => {
                console.log(err)
            })
    })
}

// auctionMethod()

module.exports = server;