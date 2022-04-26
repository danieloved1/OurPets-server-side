const config = require('./config');
const User = require('./user');
require('dotenv').config();
var express = require('express');
const bodyParser = require("body-parser");
const session = require('express-session');
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
var sql = require("mssql");
const bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
const https = require("https");
const { response } = require('express');
const { get } = require('http');
const cors = require('cors');
const saltRounds = 10;


var app = express();



app.use(express.static("public"));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
var jsonParser = bodyParser.json();

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'html');

//config was here and moved to config.js



const connection = new sql.connect(config, function (err) {

    if (err) {
        console.log(err);
    } else {
        console.log("Sucssess connect to mssql ");
    }
});


const deserializeQuery = 'SELECT * FROM [dbo].[UserName] WHERE [UserID] =';
const strategyQuery = 'SELECT [UserID], [Email], [Password], [IsRecieved] FROM [dbo].[UserName] WHERE [Email] = @usernameParam';

// User was here and moved to user.js



// serialize sessions
passport.serializeUser((user, done) => {
    done(null, user.userID);
});

passport.deserializeUser((id, done) => {
    //console.log(id);
    const request = new sql.Request(connection);
    request.query(`${deserializeQuery} ${id}`, (err, recordset) => {
        console.log(recordset);
        done(err, recordset);
    });
});


// use local strategy
passport.use(new LocalStrategy(
    (username, password, done) => {
        const ps = new sql.PreparedStatement(connection);
        ps.input('usernameParam', sql.NVarChar);
        ps.prepare(strategyQuery, (err) => {
            // catch prepare error
            if (err) {
                return done(err);
            }

            ps.execute({
                usernameParam: username,
            }, (err, recordset) => {
                if (err) {
                    return done(err);
                }

                ps.unprepare((err) => {
                    // catch unprepare error
                    if (err) {
                        return done(err);
                    }
                });

                // user does not exist
                if (recordset.length <= 0) {
                    //console.log("Invalid username or password");
                    return done(null, false, { message: 'Invalid username or password.' });
                }
                else {

                    // compare input to hashed password in database
                    const hashPassword = recordset.recordset[0].Password;

                    bcrypt.compare(password, hashPassword, function (err, result) {
                        if (err) { throw (err); }
                        else {
                            console.log("Sucssess login.");
                            return done(result, { message: 'Sucssess login.' });
                        }
                    });

                }
            });
        });
    }));


const sendemail = email => {

    const sqlRequest = new sql.Request();
    selectUserId = "exec selectUserId @Email = '" + email + "'";

    sqlRequest.query(selectUserId, function (err, data) {
        const UserID = data.recordset[0].UserID;

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ourppetapp@gmail.com',
                pass: process.env.GMAIL_PASSWORD
            }
        });

        var mailOptions = {
            from: 'ourppetapp@gmail.com',
            to: email,
            subject: 'Sending Email using Node.js',
            text: 'That was easy!',
            html: 'enter the link to coniform the email-<a href="http://localhost:3001/validate/' + UserID + '">click</a>'
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

    });

};

app.route("/validate/:id")// done after /sendemail

    .get(function (req, res) {
        
        const val = "exec vaildemail @Userid='" + req.params.id + "'"

        const sqlRequest = new sql.Request();

        sqlRequest.query(val, function (err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("the email valid");
                res.send("the email valid");
            }
        });
    });



app.get("/", function (req, res) {
    // res.sendFile(__dirname + '/index.html');
})

app.get("/login", function (req, res) {
    //res.render("login");
    // res.sendFile(__dirname + "/login.html");
});

app.get("/register", function (req, res) {
    // res.render("register");
});

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        //res.render("secrets");
        res.sendFile(__dirname + "/secrets.html");
    } else {
        res.redirect("/login");
    }
});

app.get("/Vets", function (req, res) {

    let vetArray;
    const sqlRequest = new sql.Request();
    const selectAllVets = "exec SelectAllProfessionsById @userid = '" + 10 + "'";
    sqlRequest.query(selectAllVets, function (err, data) {

        if (err) {
            console.log(err);
        } else {
            vetArray = data.recordset;

            res.json({
                "vetArray": vetArray
            })
        }

    })
});

app.get("/DogWalker", function (req, res) {

    let dogWalkerArray;
    const sqlRequest = new sql.Request();
    const selectAlldogWalker = "exec SelectAllProfessionsById @userid = '" + 11 + "'";
    sqlRequest.query(selectAlldogWalker, function (err, data) {

        if (err) {
            console.log(err);
        } else {
            dogWalkerArray = data.recordset;

            res.json({
                "dogWalkerArray": dogWalkerArray
            })
        }

    })
});

app.get("/Barbers", function (req, res) {

    let barberArray;
    const sqlRequest = new sql.Request();
    const selectAllVets = "exec SelectAllProfessionsById @userid = '" + 12 + "'";
    sqlRequest.query(selectAllVets, function (err, data) {

        if (err) {
            console.log(err);
        } else {
            barberArray = data.recordset;

            res.json({
                "barberArray": barberArray
            })
        }

    })
});

app.get("/Trainers", function (req, res) {

    let trainersArray;
    const sqlRequest = new sql.Request();
    const selectAlltrainers = "exec SelectAllProfessionsById @userid = '" + 13 + "'";
    sqlRequest.query(selectAlltrainers, function (err, data) {

        if (err) {
            console.log(err);
        } else {
            trainersArray = data.recordset;

            res.json({
                "trainersArray": trainersArray
            })
        }

    })
});

app.get("/logout", function (req, res) {
    req.logOut();
    res.redirect("/");
});



app.route("/Register")

    .post(jsonParser, function (req, res) {

        let pass = JSON.stringify(req.body.password).replaceAll('"', '');

        bcrypt.hash(pass, saltRounds, function (err, hash) {
            const sqlRequest = new sql.Request();

            let isReceived = JSON.stringify(req.body.profession) === 14 ? false : true;
            let Email = JSON.stringify(req.body.email).replaceAll('"', '');
            let Name = JSON.stringify(req.body.firstName).replaceAll('"', '');
            let LastName = JSON.stringify(req.body.lastName).replaceAll('"', '');
            let ProfessionID = parseInt(JSON.stringify(req.body.profession));

            checkemail = "exec SelectoneUser @Email = '" + Email + "'";
            sqlRequest.query(checkemail, function (err, data) {

                if (data.rowsAffected[0]) {
                    res.send("email exist redirect register page");
                    console.log("email exist redirect register page");
                }
                else {
                    const CreateUser = "EXEC CreateUser @Name = '" + Name + "',@LastName = '" + LastName + "',@Email = '" + Email + "',@Password = '" + hash + "',@IsRecived = '" + isReceived + "',@ProfessionID = '" + ProfessionID + "';"

                    sqlRequest.query(CreateUser, function (err, data) {
                        if (err) {
                            console.log(err);
                        } else {
                            sendemail(Email);
                        }
                    });
                }

            });
        });

    });


app.route("/login")

    .post(jsonParser, function (req, res) {

        var user = {
            email: JSON.stringify(req.body.email).replaceAll('"', ''),
            password: JSON.stringify(req.body.password).replaceAll('"', '')
        }

        const sqlRequest = new sql.Request();

        SelectLoginUser = "exec SelectLoginUser @Email = '" + user.email + "';"
          
        sqlRequest.query(SelectLoginUser, function (err, data) {
            
            if(data.recordset[0]!=undefined){

            let hash=data.recordset[0].Password
            if (data.recordset[0].confirmEmail != -1 ) {
                
                const userAfterQuery = data.recordset[0];

                bcrypt.compare(user.password, hash, function (err, result) {
                    if (result) {
                        console.log(userAfterQuery);
                        res.send(
                            userAfterQuery
                        );
                    }
                    else {
                        console.log("Invalid password!");
                    }
                });
            } else {
                res.send("confirm email first.");
            }
        }
        else{
            res.send("user do not exist.");
        }
        });

    });




app.route("/updatepassword")

    .post(jsonParser, function (req, res) {
        sql.connect(config, function (err) {

            if (err) {
                console.log(err);
            }
            let pass;
            let confirmPassword;
            if (JSON.stringify(req.body.password) && JSON.stringify(req.body.confirmPassword)) {
                pass = JSON.stringify(req.body.password).replaceAll('"', '');
                confirmPassword = JSON.stringify(req.body.confirmPassword).replaceAll('"', '');
            }

            bcrypt.hash(pass, saltRounds, function (err, hash) {

                var user = {
                    email: JSON.stringify(req.body.email).replaceAll('"', ''),
                    password: hash,
                    firstName: JSON.stringify(req.body.firstName).replaceAll('"', ''),
                    lastName: JSON.stringify(req.body.lastName).replaceAll('"', '')
                }
                console.log(user);

                const UpdatePassword = "EXEC UpdatePassword @Email = '" + user.email + "', @NewPassword = '" + user.password + "';"
                const UpdateLastName = "EXEC UpdateLastName @Email = '" + user.email + "', @LastName = '" + user.lastName + "';"
                const UpdateFirstName = "EXEC UpdateFirstName @Email = '" + user.email + "', @Name = '" + user.firstName + "';"

                const sqlRequest = new sql.Request();

                if (user.password && confirmPassword) {
                    bcrypt.compare(confirmPassword, hash, function (err, result) {
                        if (result) {
                            console.log("It matches!");

                            sqlRequest.query(UpdatePassword, function (err, data) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    // res.send("seccessful UpdatePassword");
                                    res.json({
                                        "data": data
                                    })
                                }
                            });
                        }
                        else {
                            console.log("Invalid password!");
                        }
                    });
                }
                if (user.firstName) {
                    sqlRequest.query(UpdateFirstName, function (err, data) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("seccessful UpdateFirstName");
                        }
                    });
                }
                if (user.lastName) {
                    sqlRequest.query(UpdateLastName, function (err, data) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("seccessful UpdateLastName");
                        }
                    });
                }
            });

        });
    });





app.route("/deleteuser")

    .post(function (req, res) {
        sql.connect(config, function (err) {

            if (err) {
                console.log(err);
            }

            const userID = req.body.userID;
            const Email = req.body.Email;
            const Password = req.body.Password;
            const DeleteUser = "EXEC DeleteUser @userID = '" + userID + "', @Email = '" + Email + "'  ,@Password = '" + Password + "';"
            const sqlRequest = new sql.Request();

            sqlRequest.query(DeleteUser, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("seccessful DeleteUser");
                    res.send("seccessful DeleteUser");
                    //res.redirect("/");
                }
            });
        });

    });


app.route("/user/service")
    .post(jsonParser, (req, res) => {
        sql.connect(config, function (err) {
            if (err) {
                console.log(err);
            }
            const ServiceName = JSON.stringify(req.body.EnteredTitle).replaceAll('"', '');
            const ServicePrice = JSON.stringify(req.body.EnteredAmount).replaceAll('"', '');
            const UserID = JSON.stringify(req.body.UserID).replaceAll('"', '');
            const CreateService = "EXEC CreateService @ServiceName = '" + ServiceName + "', @ServicePrice = '" + ServicePrice + "', @UserID = '" + UserID + "';"
            const sqlRequest = new sql.Request();

            sqlRequest.query(CreateService, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("seccessful CreateService");
                    res.send("seccessful CreateService");
                }
            });
        });
    })


    .get((req, res) => {

    })

    .put(function (req, res) {

    })


    .patch(function (req, res) {

    })



app.route("/user/serviceID")
    .post(jsonParser, function (req, res) {
        sql.connect(config, function (err) {

            if (err) {
                console.log(err);
            }

            const ServiceID = JSON.stringify(req.body.ID)
            const DeleteServiceByServiceId = "EXEC DeleteServiceByServiceId @ServiceID = '" + ServiceID + "';"
            const sqlRequest = new sql.Request();

            sqlRequest.query(DeleteServiceByServiceId, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("seccessful DeleteServiceByServiceId");
                    res.send("seccessful DeleteServiceByServiceId");
                }
            });
        });
    });



app.route("/GetUserService")

    .post(jsonParser, function (req, res) {

        const UserID = parseInt(JSON.stringify(req.body.UserID).replaceAll('"', ''));
        let serviceArr;
        const sqlRequest = new sql.Request();
        const SelectAllUserServices = "EXEC SelectAllUserServices @UserID = '" + UserID + "';"
        sqlRequest.query(SelectAllUserServices, function (err, data) {

            if (err) {
                console.log(err);
            } else {
                serviceArr = data.recordset;
                res.json(
                    serviceArr
                )
            }

        })
    });

app.get("/GetService", function (req, res) {

    let serviceArr;
    const sqlRequest = new sql.Request();
    const selectAllServices = "EXEC SelectAllService";
    sqlRequest.query(selectAllServices, function (err, data) {

        if (err) {
            console.log(err);
        } else {
            serviceArr = data.recordset;

            res.json({
                "serviceArr": serviceArr
            })
        }

    })
});

// app.post("/UpdateNameOfService", function (req, res) {
//     sql.connect(config, function (err) {

//         if (err) {
//             console.log(err);
//         }

//         const ServiceID = req.body.ServiceID;
//         const ServiceName = req.body.ServiceName;
//         const UpdateNameOfService = "EXEC UpdateNameOfService @ServiceID =" + ServiceID + ", @ServiceName = '" + ServiceName + "';"
//         const sqlRequest = new sql.Request();

//         sqlRequest.query(UpdateNameOfService, function (err, data) {
//             if (err) {
//                 console.log(err);
//             } else {
//                 console.log("seccessful UpdateNameOfService");
//                 res.send("seccessful UpdateNameOfService");
//             }
//         });
//     });

// });



// app.post("/UpdateNameOfPrice", function (req, res) {
//     sql.connect(config, function (err) {

//         if (err) {
//             console.log(err);
//         }

//         const ServiceID = req.body.ServiceID;
//         const ServicePrice = req.body.ServicePrice;
//         const UpdateNameOfService = "EXEC UpdateNameOfPrice @ServiceID =" + ServiceID + ", @ServicePrice = " + ServicePrice + ";"
//         const sqlRequest = new sql.Request();

//         sqlRequest.query(UpdateNameOfService, function (err, data) {
//             if (err) {
//                 console.log(err);
//             } else {
//                 console.log("seccessful UpdateNameOfPrice");
//                 res.send("seccessful UpdateNameOfPrice");
//             }
//         });
//     });

// });


app.route("/CreatePet")
    .post(jsonParser, (req, res) => {

        sql.connect(config, function (err) {

            if (err) {
                console.log(err);
            }
            const Type = JSON.stringify(req.body.EnteredType).replaceAll('"', '');
            const Name = JSON.stringify(req.body.EnteredName).replaceAll('"', '');
            const UserID = JSON.stringify(req.body.UserID);

            const CreatePet = "EXEC CreatePet @UserID = '" + UserID + "', @Type = '" + Type + "', @Name = '" + Name + "';"
            const sqlRequest = new sql.Request();

            sqlRequest.query(CreatePet, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("successful CreatePet");
                    res.send("successful CreatePet");
                }
            });
        });

    });

app.route("/GetUserPets")
    .post(jsonParser, function (req, res) {

        const UserID = JSON.stringify(req.body.UserID).replaceAll('"', '');
        let petsArr;
        const sqlRequest = new sql.Request();
        const GetUserPets = "EXEC GetUserPets @UserID = '" + UserID + "';"
        sqlRequest.query(GetUserPets, function (err, data) {

            if (err) {
                console.log(err);
            } else {
                petsArr = data.recordset;
                res.json(
                    petsArr
                )
            }
        })
    });

app.route("/DeletePet")
    .post(jsonParser, function (req, res) {
        sql.connect(config, function (err) {

            if (err) {
                console.log(err);
            }

            const PetsID = parseInt(req.body.ID)
            const DeletePetbyID = "EXEC DeletePetbyID @PetsID = '" + PetsID + "';"
            const sqlRequest = new sql.Request();

            sqlRequest.query(DeletePetbyID, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("seccessful DeletePetbyID");
                    res.send("seccessful DeletePetbyID");
                }
            });
        });
    });
app.post("/DeleteTypeName", function (req, res) {
    sql.connect(config, function (err) {

        if (err) {
            console.log(err);
        }

        const TypeID = req.body.TypeID;

        const DeleteTypeName = "EXEC DeleteTypeName @TypeID = '" + TypeID + "';"
        const sqlRequest = new sql.Request();

        sqlRequest.query(DeleteTypeName, function (err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("successful DeleteTypeName");
                res.send("successful DeleteTypeName");
            }
        });
    });

});

app.post("/UpdateTypeName", function (req, res) {
    sql.connect(config, function (err) {

        if (err) {
            console.log(err);
        }

        const TypeID = req.body.TypeID;
        const TypeName = req.body.TypeName;

        const UpdateTypeName = "EXEC UpdateTypeName @TypeID = " + TypeID + ", @TypeName = '" + TypeName + "';"
        const sqlRequest = new sql.Request();

        sqlRequest.query(UpdateTypeName, function (err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("successful UpdateTypeName");
                res.send("successful UpdateTypeName");
            }
        });
    });

});


app.post("/CreateRanking", jsonParser, function (req, res) {

    sql.connect(config, function (err) {

        if (err) {
            console.log(err);
        }
        const RankProfession = parseInt(JSON.stringify(req.body.score));
        const UserID = parseInt(JSON.stringify(req.body.UserId));
        const RankComment = JSON.stringify(req.body.context);

        const CreateRanking = "EXEC CreateRanking @RankProfession = " + RankProfession + ", @UserID  = " + UserID + ", @RankComment = '" + RankComment + "';"
        const sqlRequest = new sql.Request();

        sqlRequest.query(CreateRanking, function (err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("successful CreateRanking");
                res.send("successful CreateRanking");
            }
        });
    });

});

app.get("/GetRanking", function (req, res) {

    let rankingArr;
    const sqlRequest = new sql.Request();
    const selectAllRanking = "EXEC SelectAllRanking";
    sqlRequest.query(selectAllRanking, function (err, data) {

        if (err) {
            console.log(err);
        } else {
            rankingArr = data.recordset;

            res.json({
                "rankingArr": rankingArr
            })
        }

    })
});

app.post("/DeletePet", function (req, res) {
    sql.connect(config, function (err) {

        if (err) {
            console.log(err);
        }

        const PetsID = req.body.PetsID;
        const DeletePet = "EXEC DeletePet @PetsID = " + PetsID + ";"
        const sqlRequest = new sql.Request();

        sqlRequest.query(DeletePet, function (err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("successful DeletePet");
                res.send("successful DeletePet");
            }
        });
    });

});


app.post("/UpdatePet", function (req, res) {
    sql.connect(config, function (err) {

        if (err) {
            console.log(err);
        }

        const PetsID = req.body.PetsID;
        const TypeID = req.body.TypeID;
        const Name = req.body.Name;
        const UpdatePet = "EXEC UpdatePet  @PetsID = " + PetsID + " ,@TypeID = " + TypeID + ", @Name = '" + Name + "';"
        const sqlRequest = new sql.Request();

        sqlRequest.query(UpdatePet, function (err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("successful UpdatePet");
                res.send("successful UpdatePet");
            }
        });
    });

});

app.listen(3001, function () {
    console.log("Server started on port 3001");
});
