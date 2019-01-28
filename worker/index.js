const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  //when redis connection failed, try to reconnect in every 1000 ms
  retry_strategy: () => 1000
});
const sub = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

//new value is showed up in redis going to calculate new fibonacci
//value and insert that into hash of values, message is index value 
sub.on('message', (channel, message) => {
    redisClient.hset('values', message, fib(parseInt(message)));
});
//for inserted new value to attempt to get & calculate
sub.subscribe('insert');
