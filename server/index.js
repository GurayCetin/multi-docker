const keys = require('./keys');

//Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

//receive and respond to any http request coming or 
//going back react server/app
const app = express();
//cors(Cross-Origin Resource Sharing) allows us to make request 
//from one domain that react app is going to run in on completely 
//different domain or different port
app.use(cors());
//to parse incoming request from react app and turn the body of post request
//into a json value that our express API can work with easily
app.use(bodyParser.json());

//Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool ({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});

pgClient.on('error', () => console.log ('Lost PG connection'));

pgClient
    //'values' is name of table and number is index we submit
    //stores in single column
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    // if anything wrong in creaating tables, error will pop up
    .catch(err => console.log(err) );

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
//duplicate for publish purpose 
const redisPublisher = redisClient.duplicate();

//Express route handlers

app.get('/', (req, res) => {
    res.send('Hi');
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * from values');
    
    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    });
});

app.post('/values', async(req, res) => {
    const index = req.body.index;

    if (parseInt(index) > 40) {
        return res.status(422).send('Index too high');
    }

    redisClient.hset('values', index, 'Nothing yet!');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

    res.send({ working: true});
});

app.listen(5000, err => {
    console.log('Listening ');
});



