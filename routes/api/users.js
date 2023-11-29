const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const normalize = require('normalize-url');
const axios = require('axios');

const User = require('../../models/User');

// @route    POST api/users
// @desc     Register user
// @access   Public
router.post(
    '/',
    // check('name', 'Name is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
        'password',
        'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });

            if (user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'User already exists' }] });
            }

            const avatar = normalize(
                gravatar.url(email, {
                    s: '200',
                    r: 'pg',
                    d: 'mm'
                }),
                { forceHttps: true }
            );

            user = new User({
                name: email.split("@")[0],
                email,
                avatar,
                password
            });

            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            var options = {
                method: 'POST',
                url: process.env.AWC_HOST + "/wallet/createMember",
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                data: {
                    cert: process.env.AWC_CERT,
                    agentId: process.env.AWC_AGENT_ID,
                    userId: user.name,
                    currency: 'THB',
                    betLimit: JSON.stringify({
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
                        },
                        "PP": {
                            "LIVE": {
                                "limitId": ['G1']
                            }
                        },
                        "SEXYBCRT": {
                            "LIVE": {
                                "limitId": [280901, 280903, 280904]
                            }
                        },
                        "SV388": {
                            "LIVE": {
                                "maxbet": 10000,
                                "minbet": 1,
                                "mindraw": 1,
                                "matchlimit": 20000,
                                "maxdraw": 4000
                            }
                        },
                        "VENUS": {
                            "LIVE": {
                                "limitId": [280902, 280903]
                            }
                        }
                    }),
                    language: 'en',
                    userName: user.name
                }
            };

            axios.request(options).then(async (response) => {
                console.log(response);
                if (response.data.status == "0000") {
                    await user.save();
                    const payload = {
                        user: {
                            id: user.id
                        }
                    };

                    res.json({ status: "0000" , desc: response.data.desc});
                    
                } else {
                    res.json({ status: response.data.status, desc: response.data.desc });
                }
            }).catch(function (error) {
                console.error(error);
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;