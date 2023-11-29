const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const axios = require('axios');
const multer = require("multer");
const path = require("path");
const fs = require('fs');

const User = require('../../models/User');
const Game = require('../../models/Game');

const upload = multer({
    dest: "upload/"
    // you might also want to set some limits: https://github.com/expressjs/multer#limits
});

// @route    POST api/game
// @desc     Save a new Game
// @access   Private
router.post('/', [upload.single("file")], async (req, res) => {
    try {
        console.log(req.file.path);
        const tempPath = req.file.path;
        // const tempPath = path.join(__dirname, "../../" + req.file.path);
        const targetPath = path.join(__dirname, "../../public/images/" + req.file.originalname);
        fs.rename(tempPath, targetPath, async (err) => {
            if (err){
                console.log(err);
                return res.status(500).contentType("text/plain").end("Oops! Something went wrong!");
            }
            const { gameCode, gameType, platform, gameName } = req.body;
            let game = new Game({
                gameCode,
                gameType,
                gameName,
                platform,
                img: req.file.originalname,
            });
            game.save()
                .then(res=>{
                    console.log(res);
                })
                .catch((err)=>{
                    console.log(err);
                })
            res.json({ status: "0000", game});
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/game
// @desc     Get game list
// @access   Public
router.get('/', async (req, res) => {
    try {
        let games = await Game.find();
        res.json({ status: "0000", games});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/game/:gameType/:platform
// @desc     Get game list by gameType and platform
// @access   Public
router.get('/filter/:gameType/:platform', async (req, res) => {
    try {
        const games = await Game.find({gameType: req.params.gameType, platform: req.params.platform});
        res.json({status: "0000", games});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/game/play
// @desc     Get session_url by game_code
// @access   Private
router.get('/play/:id', auth, async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        const user = await User.findById(req.user.id).select('-password');
        let betLimit = {};
        let hall = null;
        let autoBetMode = null;
        let enableTable = null;
        let tid = null;

        if(game.platform == "SEXYBCRT"){
            hall = "SEXY";
            autoBetMode = "1";
            enableTable = "true";
            switch (game.gameName.toLowerCase().replace(/\s/g, "")) {
                case "baccarrtclassic":
                    tid = "1";
                    break;
                case "baccaratinsurance":
                    tid = "21";
                    break;
                case "dragontiger":
                    tid = "31";
                    break;
                case "roulette":
                    tid = "31";
                    break;
                case "rbsicbo":
                    tid = "56";
                    break;
                case "thaihi-lo":
                    tid = "121";
                    break;
                case "thaifishprawncrab":
                    tid = "126";
                    break;
                case "extraandarbahar":
                    tid = "101";
                    break;
                case "extrasicbo":
                    tid = "131";
                    break;
                case "teenpatti2020":
                    tid = "81";
                    break;
                case "sedie":
                    tid = "151";
                    break;
                default:
                    break;
            }
        }

        if(game.platform == "VENUS"){
            autoBetMode = "1";
            enableTable = "true";
            switch (game.gameName.toLowerCase().replace(/\s/g, "")) {
                case "baccaratspeedy":
                    tid = "1";
                    break;
                case "baccarrtclassic":
                    tid = "2";
                    break;
                case "baccaratinsurance":
                    tid = "21";
                    break;
                case "dragontiger":
                    tid = "31";
                    break;
                case "sicbo":
                    tid = "51";
                    break;
                case "fishPrawncrab":
                    tid = "61";
                    break;
                case "roulette":
                    tid = "71";
                    break;
                default:
                    break;
            }
        }

        if(game.platform == "PT" || game.platform == "PP"){
            enableTable = "true";
        }

        if (game.platform == "HORSEBOOK") {
            game.gameType = "LIVE"
            betLimit = {
                "HORSEBOOK": {
                    "LIVE": {
                        "minorMaxbet": 5000,
                        "minorMinbet": 50,
                        "minorMaxBetSumPerHorse": 15000,
                        "maxbet": 5000,
                        "minbet": 50,
                        "maxBetSumPerHorse": 30000,
                        "fare": 50
                    }
                }
            }
        }

        if (game.gameType == "LIVE") {
            if (game.platform == "PP") {
                betLimit = {
                    "PP": {
                        "LIVE": {
                            "limitId": ['G1']
                        }
                    }
                }
            }
            if (game.platform == "SEXYBCRT") {
                betLimit = {
                    "SEXYBCRT": {
                        "LIVE": {
                            "limitId": [280901, 280903, 280904]
                        }
                    }
                }
            }
            if (game.platform == "SV388") {
                betLimit = {
                    "SV388": {
                        "LIVE": {
                            "maxbet": 10000,
                            "minbet": 1,
                            "mindraw": 1,
                            "matchlimit": 20000,
                            "maxdraw": 4000
                        }
                    }
                }
            }
            if (game.platform == "VENUS") {
                betLimit = {
                    "VENUS": {
                        "LIVE": {
                            "limitId": [280902, 280903]
                        }
                    }
                }
            }
        }
        var options = {
            method: 'POST',
            url: process.env.AWC_HOST + "/wallet/doLoginAndLaunchGame",
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            data: {
                cert: process.env.AWC_CERT,
                agentId: process.env.AWC_AGENT_ID,
                userId: user.name,
                gameCode: game.gameCode,
                gameType: game.gameType,
                platform: game.platform,
                isMobileLogin: 'false',
                externalURL: process.env.FRONTEND_URL,
                language: 'en',
                hall,
                betLimit: JSON.stringify(betLimit),
                autoBetMode,
                enableTable,
                tid
            }
        };

        console.log(options.data);

        axios.request(options).then(function (response) {
            if (response.data.status == "0000") {
                res.json({ status: "0000", session_url: response.data.url });
            } else {
                res.json({ status: response.data.status, desc: response.data.desc });
            }
        }).catch(function (error) {
            console.error(error);
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST api/game/play
// @desc     Get session_url by game_code
// @access   Private
router.post('/play', auth, async (req, res) => {
    try {
        const { gameCode, gameType, platform, hall, tid } = req.body;
        const user = await User.findById(req.user.id).select('-password');
        const betLimit = {};
        if (gameType == "LIVE") {
            if (platform == "HORSEBOOK") {
                betLimit = {
                    "HORSEBOOK": {
                        "LIVE": {
                            "minorMaxbet": 5000,
                            "minorMinbet": 50,
                            "minorMaxBetSumPerHorse": 15000,
                            "maxbet": 5000,
                            "minbet": 50,
                            "maxBetSumPerHorse": 30000,
                            "fare": 50
                        }
                    }
                }
            }
            if (platform == "PP") {
                betLimit = {
                    "PP": {
                        "LIVE": {
                            "limitId": ['G1']
                        }
                    }
                }
            }
            if (platform == "SEXYBCRT") {
                betLimit = {
                    "SEXYBCRT": {
                        "LIVE": {
                            "limitId": [280901, 280903, 280904]
                        }
                    }
                }
            }
            if (platform == "SV388") {
                betLimit = {
                    "SV388": {
                        "LIVE": {
                            "maxbet": 10000,
                            "minbet": 1,
                            "mindraw": 1,
                            "matchlimit": 20000,
                            "maxdraw": 4000
                        }
                    }
                }
            }
            if (platform == "VENUS") {
                betLimit = {
                    "VENUS": {
                        "LIVE": {
                            "limitId": [280902, 280903]
                        }
                    }
                }
            }
        }
        var options = {
            method: 'POST',
            url: process.env.AWC_HOST + "/wallet/doLoginAndLaunchGame",
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            data: {
                cert: process.env.AWC_CERT,
                agentId: process.env.AWC_AGENT_ID,
                userId: user.name,
                gameCode,
                gameType,
                platform,
                isMobileLogin: 'false',
                externalURL: process.env.FRONTEND_URL,
                language: 'en',
                hall: hall,
                betLimit: JSON.stringify(betLimit),
                autoBetMode: '1',
                enableTable: 'true',
                tid
            }
        };

        console.log(options.data);

        axios.request(options).then(function (response) {
            if (response.data.status == "0000") {
                res.json({ status: "0000", session_url: response.data.url });
            } else {
                res.json({ status: response.data.status, desc: response.data.desc });
            }
        }).catch(function (error) {
            console.error(error);
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;