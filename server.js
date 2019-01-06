const express = require('express');
// var amqp = require('amqplib/callback_api');
const bodyParser = require("body-parser");
const app = express();
const port = 8080;
const cors = require('cors');
const EventEmitter = require('events');
const cron = require('node-cron');

const QUEUE = 'hello_world';
// const WRONGQUEUE = 'second_time';
let eventEmitter = new EventEmitter();
//queue channel
let channel = null;

let fullDate = new Date();

app.use(bodyParser.json());
app.use(cors());


function init() {
    return require('amqplib').connect('amqp://user:bitnami@127.0.0.1')
        .then(conn => conn.createChannel())
        .then(ch => {
            channel = ch;

            schedulerTask.start();

            //this queue is a "Direct reply-to" read more at the docs
            //When some msg comes in, we "emit" (перенаправляем) a message to the proper "correlationId" listener и передаем все оставшиеся параметры
            ch.consume('amq.rabbitmq.reply-to', msg => eventEmitter.emit(msg.properties.correlationId, msg.content), {noAck: true});

            ch.consume('wrong_queue', msg => eventEmitter.emit(msg.properties.correlationId, msg.content), {noAck: true});
        });
}

app.post('/', cors(), (request, res) => {
        
    console.log(request.body);

    let corr = generateUuid();
    let msg = request.body.info;

    // при повторном срабатывании, обработчик удаляется -> срабатывает снова
    eventEmitter.once(corr, msg => {
        console.log(' [.] Got %s', msg);
        res.write(msg);
        res.end(null, 'binary');
    });

    //Checks if the queue exists, and create it if needed.
    channel.assertQueue(QUEUE)
        //Sent the buffered msg to the queue with the ID and the responseQueue
        .then(() => channel.sendToQueue(QUEUE, new Buffer.from(msg), {correlationId:corr, replyTo: 'amq.rabbitmq.reply-to'}));
});

const getDate = function(date){
    let day = date.getDate() < 10 ? '0' +  date.getDate() :  date.getDate();
    let month = (date.getMonth() + 1) < 10 ? `0${date.getMonth()+1}` :  date.getMonth()+1;
    let msq = `${date.getFullYear()}-${month}-${day}`;
    date.setDate(date.getDate() + 1);
    return msq;
}
 
const schedulerTask = cron.schedule('* * * * *', () => {   

    let corr = generateUuid();
    let msg = getDate(fullDate);
     console.log('lol2', msg);
     // при повторном срабатывании, обработчик удаляется -> срабатывает снова
    eventEmitter.on(corr, msg => {
        console.log(' [.] Got %s', msg);
    });

    channel.assertQueue(QUEUE)
        //Sent the buffered msg to the queue with the ID and the responseQueue
        .then(() => channel.sendToQueue(QUEUE, new Buffer.from(msg), {correlationId:corr, replyTo: 'amq.rabbitmq.reply-to'}));
});

function generateUuid() {
  return Math.random().toString() +
         Math.random().toString() +
         Math.random().toString();
}

init()
    .then(() => app.listen(port,'0.0.0.0', () => console.log(`server is listening on ${port}`)))
    .catch(err=>console.error('something bad happened', err));

module.exports.getDate = getDate;
