require('dotenv').config()
const db = require('./models')
const axios = require('axios')
var exec = require('exec')
const BNET_ID = process.env.BNET_ID
const BNET_SECRET = process.env.BNET_SECRET

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
    getToken(async access_token => {
        const connectedRealms = await db.connectedRealm.findAll()

        let conRealmIterable = {
            [Symbol.asyncIterator]() {
                return {
                    i: 0,
                    next() {
                        if (this.i < connectedRealms.length) {
                            return Promise.resolve({ value: this.i++, done: false });
                        }
        
                        return Promise.resolve({ done: true });
                    }
                };
            }
        };
        
        await (async function() {
            for await (let num of conRealmIterable) {
        
                try {
                    
                    let auctionHouse = connectedRealms[num].auctionHouse
                    let results = await axios.get(`${auctionHouse}&access_token=${access_token}`)
                    let status = results.status
                    let statusMessage = results.statusText
                    let averageOfItems = {}

                    if(status === 200) {
                        let asyncIterable = {
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
                        
                        await (async function() {
                            for await (let numResult of asyncIterable) {
                                
                                if (results.data.auctions[numResult] == null) { return }
                        
                                try {
                                    // Filter data down to averages of each item
                        
                                    let itemId = results.data.auctions[numResult].item.id
                                    let unitListingPrice = (results.data.auctions[numResult].buyout || results.data.auctions[numResult].unit_price) / results.data.auctions[numResult].quantity
                                    let listingQuantity = results.data.auctions[numResult].quantity
                        
                        
                                    if(averageOfItems[itemId]) {
                                        averageOfItems[itemId].listingCount += 1
                                        averageOfItems[itemId].unitListingPrice += unitListingPrice
                                        averageOfItems[itemId].quantity += listingQuantity
                                    } else {
                                        averageOfItems[itemId] = {}
                                        averageOfItems[itemId].listingCount = 1
                                        averageOfItems[itemId].unitListingPrice = unitListingPrice
                                        averageOfItems[itemId].quantity = listingQuantity
                                    }
                        
                                    // If the execution reaches this line, the transaction has been committed successfully
                                    // `result` is whatever was returned from the transaction callback (the `user`, in this case)
                        
                                } catch (error) {
                                    console.log("ERROR:", error)
                                    // If the execution reaches this line, an error occurred.
                                    // The transaction has already been rolled back automatically by Sequelize!
                        
                                }
                            }
                            return true
                        })()
                        
                        const seqIterable = {
                            [Symbol.asyncIterator]() {
                                return {
                                    i: 0,
                                    next() {
                                        if (this.i < Object.keys(averageOfItems).length) {
                                            return Promise.resolve({ value: this.i++, done: false });
                                        }
                        
                                        return Promise.resolve({ done: true });
                                    }
                                };
                            }
                        };
                        
                        await (async function() {
                            for await (let numSeq of seqIterable) {
                        
                                try {
                                    // Filter data down to averages of each item
                        
                                    let itemId = Object.keys(averageOfItems)[numSeq]
                        
                                    let averageOfItem = averageOfItems[itemId].unitListingPrice / averageOfItems[itemId].listingCount
                                    let quantityOfItem = averageOfItems[itemId].quantity
                        
                                    const result = await db.sequelize.transaction(async (t) => {
                        
                                        const item = await db.item.findOrCreate({
                                            where: {
                                                id: parseInt(itemId)
                                            },
                                            transaction: t
                                        })
                        
                                        const pricingData = await db.pricingData.create({
                                            unitPrice: averageOfItem,
                                            quantity: quantityOfItem,
                                            itemId: parseInt(itemId),
                                        }, { transaction: t })
                        
                                        pricingData.setConnectedRealm(connectedRealms[num].get().id)
                        
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
                            return true
                        })()
                    } else {
                        console.log("Auction House Fetch Failed:", statusMessage)
                    }
        
                    // If the execution reaches this line, the transaction has been committed successfully
                    // `result` is whatever was returned from the transaction callback (the `user`, in this case)
        
                } catch (error) {
                    console.log("ERROR:", error)
                    // If the execution reaches this line, an error occurred.
                    // The transaction has already been rolled back automatically by Sequelize!
        
                }
            }
            console.log("Done with all realms")
            return true
        })()
        
    })
}

console.log("Done")

auctionMethod()

// var nextDate = new Date();
// if (nextDate.getMinutes() === 0) { // You can check for seconds here too
//     auctionMethod()
// } else {
//     nextDate.setHours(nextDate.getHours() + 1);
//     nextDate.setMinutes(0);
//     nextDate.setSeconds(0);// I wouldn't do milliseconds too ;)

//     var difference = nextDate - new Date();
//     setTimeout(auctionMethod, difference);
// }