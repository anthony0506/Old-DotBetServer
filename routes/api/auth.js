const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const axios = require('axios');

const User = require('../../models/User');

// @route    GET api/auth
// @desc     Get user by token
// @access   Private
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST api/auth
// @desc     Authenticate user & get token
// @access   Public
router.post(
    '/',
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });

            if (!user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '5 days' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ status: "0000", token});
                }
            );

            // var options = {
            //     method: 'POST',
            //     url: process.env.AWC_HOST + "/wallet/login",
            //     headers: { 'content-type': 'application/x-www-form-urlencoded' },
            //     data: {
            //         cert: process.env.AWC_CERT,
            //         agentId: process.env.AWC_AGENT_ID,
            //         userId: user.name,
            //         isMobileLogin: 'false',
            //         externalURL: process.env.FRONTEND_URL,
            //         gameForbidden: { "JDB": { "FH": ["ALL"] } },
            //         gameType: 'SLOT',
            //         platform: 'RT',
            //         language: 'en',
            //         betLimit: JSON.stringify({
            //             "HORSEBOOK": {
            //                 "LIVE": {
            //                     "minorMaxbet": 5000,
            //                     "minorMinbet": 50,
            //                     "minorMaxBetSumPerHorse": 15000,
            //                     "maxbet": 5000,
            //                     "minbet": 50,
            //                     "maxBetSumPerHorse": 30000,
            //                     "fare": 50
            //                 }
            //             },
            //             "PP": {
            //                 "LIVE": {
            //                     "limitId": ['G1']
            //                 }
            //             },
            //             "SEXYBCRT": {
            //                 "LIVE": {
            //                     "limitId": [280901, 280903, 280904]
            //                 }
            //             },
            //             "SV388": {
            //                 "LIVE": {
            //                     "maxbet": 10000,
            //                     "minbet": 1,
            //                     "mindraw": 1,
            //                     "matchlimit": 20000,
            //                     "maxdraw": 4000
            //                 }
            //             },
            //             "VENUS": {
            //                 "LIVE": {
            //                     "limitId": [280902, 280903]
            //                 }
            //             }
            //         }),
            //         autoBetMode: '1'
            //     }
            // };

            // axios.request(options).then(function (response) {
            //     if (response.data.status == "0000") {
            //         const payload = {
            //             user: {
            //                 id: user.id
            //             }
            //         };

            //         jwt.sign(
            //             payload,
            //             process.env.JWT_SECRET,
            //             { expiresIn: '5 days' },
            //             (err, token) => {
            //                 if (err) throw err;
            //                 res.json({ status: "0000", token, login_url: response.data.url });
            //             }
            //         );
            //     } else {
            //         res.json({ status: response.data.status, desc: response.data.desc });
            //     }
            // }).catch(function (error) {
            //     console.error(error);
            // });

            // await axios.post(process.env.AWC_HOST + "/wallet/login", {
            //     cert: process.env.AWC_CERT,
            //     agentId: process.env.AWC_AGENT_ID,
            //     userId: user.name,
            //     isMobileLogin: 'false',
            //     externalURL: process.env.FRONTEND_URL,
            //     gameForbidden: {"JDB":{"FH":["ALL"]}},
            //     gameType: 'SLOT',
            //     platform: 'RT',
            //     language: 'en',
            //     betLimit: JSON.stringify({
            //         "SEXYBCRT": {
            //             "LIVE": {
            //                 "limitId": [280901, 280902, 280903, 280904, 280905]
            //             }
            //         },
            //         "VENUS": {
            //             "LIVE": {
            //                 "limitId": [280901, 280902, 280903, 280904, 280905]
            //             }
            //         },
            //         "SV388": {
            //             "LIVE": {
            //                 "maxbet": 10000,
            //                 "minbet": 1,
            //                 "mindraw": 1,
            //                 "matchlimit": 20000,
            //                 "maxdraw": 4000
            //             }
            //         }
            //     }),
            //     autoBetMode: '1'
            // })
            //     .then(async (response) => {
            //         console.log(response);
            //         if(response.data.status == "0000"){
            //             const payload = {
            //                 user: {
            //                     id: user.id
            //                 }
            //             };

            //             jwt.sign(
            //                 payload,
            //                 process.env.JWT_SECRET,
            //                 { expiresIn: '5 days' },
            //                 (err, token) => {
            //                     if (err) throw err;
            //                     res.json({ status: "0000", token, login_url: response.data.url });
            //                 }
            //             );
            //         }else{
            //             res.json({ status: response.data.status, desc: response.data.desc });
            //         }
            //     })
            //     .catch(function (error) {
            //         console.log(error);
            //     });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;