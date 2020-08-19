require('dotenv').config();
const passport = require('passport')
const BnetStrategy = require('passport-bnet').Strategy;
const db = require('../models')
const axios = require('axios').default
const BNET_ID = process.env.BNET_ID
const BNET_SECRET = process.env.BNET_SECRET

//passport serrialize's info to make it easier to login
passport.serializeUser((user, done) => {
    console.log("Serializer : ", user.id)
    done(null, user.id)
})

// deserializeUser takes the id and looks it up in db
passport.deserializeUser((id, done) => {
    db.user.findOne({
        where: {
            id: id
        },
        include: [{
                model: db.character,
                include: {
                    model: db.realm
                }
            }]
    })
        .then(user => {
            console.log("Deserializer : ", user.battletag)
            done(null, user)
        })
        .catch(done)
})

passport.use(new BnetStrategy({
        clientID: BNET_ID,
        clientSecret: BNET_SECRET,
        scope: ['wow.profile'],
        passReqToCallback: true,
        callbackURL: "https://anthonygregis.com/auth/bnet/callback"
    },
    (req, accessToken, refreshToken, profile, done) => {
        // console.log("User Profile:", profile)
        console.log(`Connecting battle.net user '${profile.battletag}' ('${profile.id}')`)
        db.user.findOrCreate({
            where: {
                id: profile.id,
                battletag: profile.battletag
            }
        })
            .then(([user, created]) => {
                if (created) {
                    user.accessToken = accessToken
                    console.log("New user created:", user.get().battletag)

                    // Retrieve Characters
                    axios.get(`https://us.api.blizzard.com/profile/user/wow?namespace=profile-us&locale=en_US&access_token=${accessToken}`)
                        .then(profileData => {
                            let wowAccounts = profileData.data.wow_accounts
                            wowAccounts.forEach(account => {
                                account.characters.forEach(character => {
                                    user.createCharacter({
                                        id: character.id,
                                        name: character.name,
                                        class: character.playable_class.name,
                                        race: character.playable_race.name,
                                        gender: character.gender.name,
                                        faction: character.faction.name,
                                        level: character.level
                                    })
                                        .then(newChar => {
                                            user.addCharacter(newChar)
                                            axios.get(`https://us.api.blizzard.com/data/wow/realm/${character.realm.slug}?namespace=dynamic-us&locale=en_US&access_token=${accessToken}`)
                                                .then(realmResults => {
                                                    db.realm.findOrCreate({
                                                        where: {
                                                            id: realmResults.data.id,
                                                            name: realmResults.data.name,
                                                            type: realmResults.data.type.name,
                                                            isTournament: realmResults.data.is_tournament,
                                                            slug: realmResults.data.slug
                                                        }
                                                    })
                                                        .then(([realm, created]) => {
                                                            if (created) {
                                                                console.log("New Realm Created:", realm.name)
                                                                axios.get(`${realmResults.data.connected_realm.href}&locale=en_US&access_token=${user.accessToken}`)
                                                                    .then(connRealmResults => {
                                                                        let connectedRealm = connRealmResults.data
                                                                        db.connectedRealm.findOrCreate({
                                                                            where: {
                                                                                id: connectedRealm.id,
                                                                                mythicLeaderboard: connectedRealm.mythic_leaderboards.href,
                                                                                auctionHouse: connectedRealm.auctions.href
                                                                            }
                                                                        })
                                                                            .then(([foundCRealm, created]) => {
                                                                                if (created) {
                                                                                    console.log("New Connected Realm Found, Generating Realms.")
                                                                                    connectedRealm.realms.forEach(realm => {
                                                                                        // console.log(realm)
                                                                                        db.realm.findOrCreate({
                                                                                            where: {
                                                                                                id: realm.id,
                                                                                                name: realm.name,
                                                                                                type: realm.type.name,
                                                                                                isTournament: realm.is_tournament,
                                                                                                slug: realm.slug
                                                                                            }
                                                                                        })
                                                                                            .then(([foundRealm, created]) => {
                                                                                                if (created) {
                                                                                                    console.log("New Realm found and created:", foundRealm.name)
                                                                                                }
                                                                                                foundRealm.setConnectedRealm(foundCRealm)
                                                                                            })
                                                                                            .catch(err => {
                                                                                                console.log("ERROR:", err)
                                                                                            })
                                                                                    })
                                                                                }
                                                                                realm.setConnectedRealm(foundCRealm)
                                                                            })
                                                                            .catch(err => {
                                                                                console.log("ERROR:", err)
                                                                            })
                                                                    })
                                                                    .catch(err => {
                                                                        console.log("ERROR:", err)
                                                                    })
                                                            }
                                                            newChar.setRealm(realm)
                                                        })
                                                        .catch(err => {
                                                            console.log("ERROR:", err)
                                                        })
                                                })
                                                .catch(err => {
                                                    console.log("ERROR:", err)
                                                })
                                        })
                                        .catch(err => {
                                            console.log("ERROR:", err)
                                        })
                                })
                            })
                        })
                        .catch(err => {
                            console.log(err)
                        })
                    console.log("Creations Finished, Returning User")
                    return done(null, user)
                } else {
                    console.log("Returning user:", user.get().battletag)
                    return done(null, user)
                }
            })
            .catch(err => {
                console.log("ERRRORRRR:", err)
                done(err, null)
            })
    })
)

module.exports = passport