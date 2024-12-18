const { createClient } = require('redis');

async function connectToRedis() {
    const client = createClient({
        password: '27d6cFXH387L5IedmncHMU1yEdwkghzB',
        socket: {
            host: 'redis-18204.c264.ap-south-1-1.ec2.redns.redis-cloud.com',
            port: 18204
        }
    });

    client.on('error', (err) => {
        console.error('Redis client error', err);
    });


    return client;
}

module.exports = connectToRedis;

