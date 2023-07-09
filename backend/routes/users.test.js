


"use strict";
process.env.NODE_ENV = "test";
const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../secret");
const { createToken } = require("../helper/tokens");
const User = require("../models/user");


const {
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u3Token
} = require("./_testCommon.js");

beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// == POST /users/register 
describe('POST /register', () => {
    it('works. no auth necessary', async () => {
        const newUser = { username:'user4', 
                      password:'password4', 
                      email:'user4@gmail.com'}
        const res = await request(app)
                    .post('/users/register')
                    .send(newUser);
        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({"token": expect.any(String)})
        const {username} = jwt.verify(res.body.token, SECRET_KEY);
        expect(username).toEqual('user4')

    }) 

    it('returns BadReq Error with missing field', async () => {
        const newUser = { username:'user4', 
                      password:'password4'}
        const res = await request(app)
                      .post('/users/register')
                      .send(newUser);
        expect(res.statusCode).toEqual(400)
    })

    it('returns BadReq Error with invalid data', async () => {
        const newUser = { username:'user4', 
                      password:'password4',
                      email:'this is not email'}
        const res = await request(app)
                      .post('/users/register')
                      .send(newUser);
        expect(res.statusCode).toEqual(400)
    })
})

// == POST /users/login 

describe('POST /users/login', () => {
    it('works with correct username and password', async () => {
        const user ={
            username: 'user1',
            password: 'password1'
        } 
        const res = await request(app)
                      .post('/users/login')
                      .send(user);
        expect(res.statusCode).toEqual(200)
        expect(res.body).toEqual({"token": expect.any(String)});
        const {username} = jwt.verify(res.body.token, SECRET_KEY);
        expect(username).toEqual('user1');
    }) 

    it('gives unauth error with non-existent user', async () => {
        const user ={
            username: 'user5',
            password: 'password1'
        } 
        const res = await request(app)
                      .post('/users/login')
                      .send(user);
        expect(res.statusCode).toEqual(401)
    }) 

    it('gives unauth error with wrong password', async () => {
        const user ={
            username: 'user1',
            password: 'password2'
        } 
        const res = await request(app)
                      .post('/users/login')
                      .send(user);
        expect(res.statusCode).toEqual(401)
    }) 

    it('gives BadReq error with missing data', async () => {
        const user ={
            username: 'user1'
        } 
        const res = await request(app)
                      .post('/users/login')
                      .send(user);
        expect(res.statusCode).toEqual(400)
    }) 
})

// == GET/users/[username]
describe('GET /users/:username', () => {
    it('get the user data for logged in user', async () => {
        const res = await request(app)
                    .get('/users/user1')
                    .set("authorization", `Bearer ${u1Token}`);
        expect(res.body).toEqual({user:{
            id: 1,
            username: 'user1',
            email:'user1@gmail.com',
            fav: [100, 300]
            }
          })
    }) 

    it('gives unauth with no token', async () => {
        const res = await request(app)
                    .get('/users/user1')
        expect(res.statusCode).toEqual(401);
    }) 

    it('gives unauth for accessing other users info', async () => {
        const res = await request(app)
                    .get('/users/user1')
                    .set("authorization", `Bearer ${u3Token}`);
        expect(res.statusCode).toEqual(401);
    })

    it('gives NotFound Error with non-existent user', async () => {
        const u5Token = createToken({username:'user5'})
        const res = await request(app)
                    .get('/users/user5')
                    .set("authorization", `Bearer ${u5Token}`);
        expect(res.statusCode).toEqual(404);
    })

})

// == PATCH /users/[username]
describe('PATCH /users/:username', () => {
    it('works with correct token and valid data format', async () => {
        const data ={
          email:"user1updated@gmail.com"
        } 
        const res = await request(app)
                    .patch('/users/user1')
                    .send(data)
                    .set("authorization", `Bearer ${u1Token}`)
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            user:{
                username:'user1',
                email:'user1updated@gmail.com'
            }
        })
    }) 

    it('returns unauth updating other users info', async () => {
        const data ={
          email:"user1updated@gmail.com"
        } 
        const res = await request(app)
                    .patch('/users/user1')
                    .send(data)
                    .set("authorization", `Bearer ${u3Token}`)
        expect(res.statusCode).toEqual(401);
    }) 

    it('returns unauth updating without token', async () => {
        const data ={
          email:"user1updated@gmail.com"
        } 
        const res = await request(app)
                    .patch('/users/user1')
                    .send(data);
        expect(res.statusCode).toEqual(401);
    }) 

    it('returns NotFound Error for non-existent user', async () => {
        const data ={
          email:"user1updated@gmail.com"
        } 
        const nopeToken = createToken({username: 'nope'})
        const res = await request(app)
                    .patch('/users/nope')
                    .send(data)
                    .set("authorization", `Bearer ${nopeToken}`)
        expect(res.statusCode).toEqual(404);
    }) 
})

// == DELETE /users/[username] => { deleted: username }
describe('DELETE /users/:username', () => {
    it('works with existing user with correct token', async () => {
        const res = await request(app)
                    .delete('/users/user1')
                    .set("authorization", `Bearer ${u1Token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            deleted: 'user1'
        });
    }) 

    it('returns unauth when deleting other user', async () => {
        const res = await request(app)
                    .delete('/users/user1')
                    .set("authorization", `Bearer ${u3Token}`);
        expect(res.statusCode).toEqual(401);
    })

    it('returns unauth when non-existent user', async () => {
        const res = await request(app)
                    .delete('/users/nope')
                    .set("authorization", `Bearer ${u3Token}`);
        expect(res.statusCode).toEqual(401);
    })
})

// //================================================//
// // ========== user's favorite pod route ==========//
// //================================================//

//  GET /users/[username]/fav-podcast => [{podcast1}, {podcast2},...]*/
describe('GET /users/:username/fav-podcast', () => {
    it('gets all fav podcasts of a user', async () => {
        const res = await request(app)
                    .get('/users/user1/fav-podcast')
                    .set("authorization", `Bearer ${u1Token}`);
        expect(res.body).toEqual({
            favPods:[
                {
                    id: 1,
                    userId: 1,
                    feedId: 100,
                    author: 'author1',
                    title: 'title1',
                    artworkUrl: 'artwork1.com'
                },
                {
                    id: 4,
                    userId: 1,
                    feedId: 300,
                    author: 'author3',
                    title: 'title3',
                    artworkUrl: 'artwork3.com'
                }
            ]
        })
    })

    it('returns unauth accessing other user favorites', async () => {
        const res = await request(app)
                    .get('/users/user1/fav-podcast')
                    .set("authorization", `Bearer ${u3Token}`);
        expect(res.statusCode).toEqual(401);
    }) 
    
    it('works even though user has no fav yet', async () => {
        const u10Token = createToken({username: 'user10'})
        const res = await request(app)
                    .get('/users/user10/fav-podcast')
                    .set("authorization", `Bearer ${u10Token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({favPods:[]});
    })  

    it('returns unauth with non-existent user', async () => {
        const res = await request(app)
                    .get('/users/nope/fav-podcast')
                    .set("authorization", `Bearer ${u3Token}`);
        expect(res.statusCode).toEqual(401);
    })    
})
// == POST /users/[username]/fav-podcast/[id] => { added: feedId }
describe('POST /users/:username/fav-podcast/:id', () => {
    it('adds favorite podcast', async () => {
        const podData ={
            feedId:1000,
            author: 'author1000',
            title:'title1000',
            artworkUrl: 'artwork1000.com'
        }
        const res = await request(app)
                    .post('/users/user3/fav-podcast/1000')
                    .send(podData)
                    .set("authorization", `Bearer ${u3Token}`);
        expect(res.body).toEqual({added: 1000})
    }) 

    it('unauth for adding to other users favorite podcast', async () => {
        const podData ={
            feedId:1000,
            author: 'author1000',
            title:'title1000',
            artworkUrl: 'artwork1000.com'
        }
        const res = await request(app)
                    .post('/users/user1/fav-podcast/1000')
                    .send(podData)
                    .set("authorization", `Bearer ${u3Token}`);
        expect(res.statusCode).toEqual(401);
    }) 

    it('BadReq Error if feedIds in podData and in params do not match', async () => {
        const podData ={
            feedId:1000,
            author: 'author1000',
            title:'title1000',
            artworkUrl: 'artwork1000.com'
        }
        const res = await request(app)
                    .post('/users/user3/fav-podcast/100')
                    .send(podData)
                    .set("authorization", `Bearer ${u3Token}`);
        expect(res.statusCode).toEqual(400);
    }) 

    it('BadReq Error if feedId is already in fav pods', async () => {
        const podData ={
            feedId:100,
            author: 'author1',
            title:'title1',
            artworkUrl: 'artwork1.com'
        }
        const res = await request(app)
                    .post('/users/user1/fav-podcast/100')
                    .send(podData)
                    .set("authorization", `Bearer ${u1Token}`);
        expect(res.statusCode).toEqual(400);
    }) 

    it('unauth for non-existent user', async () => {
        const podData ={
            feedId:100,
            author: 'author1',
            title:'title1',
            artworkUrl: 'artwork1.com'
        }
        const res = await request(app)
                    .post('/users/nope/fav-podcast/100')
                    .send(podData)
                    .set("authorization", `Bearer ${u1Token}`);
        expect(res.statusCode).toEqual(401);
    }) 
})

// == DELETE /users/[username]/fav-podcast/[id] => { deleted: feedId }
describe('DELETE /users/:username/fav-podcast/:id', () => {
    it('deletes a podcast from fav_pods', async () => {
        const res = await request(app)
                        .delete('/users/user1/fav-podcast/100')
                        .set("authorization", `Bearer ${u1Token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({deleted: 100})
    })
    
    it('unauth for deleting other users fav pods', async () => {
        const res = await request(app)
                        .delete('/users/user1/fav-podcast/100')
                        .set("authorization", `Bearer ${u3Token}`);
        expect(res.statusCode).toEqual(401);
    })

    it('NotFound Err for deleting non-existent fav podcast feedId', async () => {
        const res = await request(app)
                        .delete('/users/user1/fav-podcast/500')
                        .set("authorization", `Bearer ${u1Token}`);
        expect(res.statusCode).toEqual(404);
    })  
    
    it('unauth for non-existent user', async () => {
        const res = await request(app)
                        .delete('/users/nope/fav-podcast/100')
                        .set("authorization", `Bearer ${u1Token}`);
        expect(res.statusCode).toEqual(401);
    }) 
})

// ================================================//
// // ============ user's review route ==============//
// //================================================//

// /**== adding review comment and rating ==
// POST /[username, id] => { id, userId, feedId, comment, rating }
//   -id: review table's feed_id
//   -Authorization required: same user-as-:username
//  **/
// router.post('/:username/reviews/:feedid', userOnly, async (req, res,next) => {
//     try{
//         const feedId = req.params.feedid;
//         validateSchema(req.body, review);
//         const newReview = User.addReview({...req.body, feedId})
//         return res.status(201).json({newReview})
//     } catch (err){
//         return next(err)
//     }
// })

// /**== update review comment and rating ==
// PATCH /[username, id] => { id, user_id, feed_id, comment, rating }
//   -id: reviews table's id
//   -Authorization required: same user-as-:username
//  **/
//   router.patch('/:username/reviews/:id', userOnly, async (req, res,next) => {
//     try{
//         validateSchema(req.body, review);
//         let {username, reviewId } = req.params;
//         const review = await User.updateReview(username, reviewId, req.body);
//         review.username = username;
//         return res.json({review})
//     } catch (err){
//         return next(err)
//     }
// })

// /**== delete review comment and rating ==
// DELETE /[username, id] => { deleted: id }
//   -id: reviews table's id
//   -Authorization required: same user-as-:username
//  **/
//   router.delete('/:username/reviews/:id', userOnly, async (req, res,next) => {
//     try{
//         let {username, reviewId } = req.params;
//         const deletedId = await User.deletedReview(username, reviewId);
//         return res.json({deleted: deletedId})
//     } catch (err){
//         return next(err)
//     }
// })


// module.exports = router;