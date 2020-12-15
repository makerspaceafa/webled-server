const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const serialport = require('serialport');
const cv = require('opencv4nodejs');

// Config constants
// ------------------------------------------------------------------------------------------------

// O nome da port como aparece no Arduino IDE
// Ex Linux: "/dev/tty***"
// Ex Windows: "COM3"
// Leave as empty string to disable serial port communications
const arduinoPort = '';

// FPS do live stream
const FPS = 15;

// Definir video input device
// A fonte de video a ser usada é passada aqui
// As fontes de video do computador estão indexadas tipo 0, 1, 2 etc
// Quando o pc tem várias webcams é só ir incrementando até encontrarmos a certa.
const vCap = new cv.VideoCapture(0);

// IP addr onde o servidor está a ouvir requests
// Deixar em branco => default IPv6 [::] e na maior parte dos sistemas IPv4 0.0.0.0 também
// 0.0.0.0 to enforce IPv4
// Nota: idealmente o objetivo é ter as coisas a correr em IPv6 mas eu não percebo muito disso ¯\_(ツ)_/¯
const addr = '0.0.0.0';

// Porta onde o servidor está a ouvir requests
const port = 80;

// ------------------------------------------------------------------------------------------------


// Inicializar a comunicação com o Arduino via Serial
// ------------------------------------------------------------------------------------------------


let serial;

// Only run this part if arduinoPort is defined.
if(arduinoPort) {
    serial = new serialport(arduinoPort, {
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false
    });


    // This part is not actually required but helps debugging
    // Here we create functions to set as callbacks to specific events (explained below)
    function showPortOpen() {
        console.log('Serial port open. Data rate: ' + serial.baudRate);
    }

    function showPortClose() {
        console.log('Serial port closed.');
    }

    function showError(error) {
        console.log('Serial port error: ' + error);
    }

    // This is where the callbacks are set.
    // Callbacks are functions we pass as an argument to other functions/code.
    // These other functions are then expected to execute the code we passed, or "call it back".
    // Here we are basically saying "serial.on(some_event, call_this)".
    // So, for example, when the port triggers an 'open' event, showPortOpen() will be called.
    serial.on('open', showPortOpen);
    serial.on('close', showPortClose);
    serial.on('error', showError);
}
else console.log('Arduino port not defined, ignoring port commands.')

// ------------------------------------------------------------------------------------------------

// Inicializar a parte video
// ------------------------------------------------------------------------------------------------

vCap.set(cv.CAP_PROP_FRAME_WIDTH, 300);
vCap.set(cv.CAP_PROP_FRAME_HEIGHT, 300);

// Esta função leva 2 parâmetros na su aforma básica: um callback, e um numero de milissegundos.
// Aqui passamos uma função anónima (definida com () => {function body}) e 1000/FPS.
// Portanto a nossa função anónima vai ser corrida a cada 1000/FPS milissegundos.
// Ex: 15 frames per second dá que temos de atualizar a imagem cada 66.66ms.
setInterval(() => {
    // ler o video da webcam
    const frame = vCap.read();
    // convert frame to jpg image and encode it as a base64 string
    const image = cv.imencode(".jpg", frame).toString('base64');
    // send the encoded image to the client
    io.emit('image', image);
}, 1000 / FPS);

// todo: better video streaming possible?
// I have a slight feeling that encoding images as base64 might not be the best way to do live video streams.
// Can you debunk this or find a better way to do it?
// ------------------------------------------------------------------------------------------------


// Configuração website - express.js app
// ------------------------------------------------------------------------------------------------

// Configure static files folder
app.use(express.static('public'));

// routes
app.get('/:tag?', function(req, res) {

    let posto;
    // custom roles based on url path
    // change as you see fit
    switch (req.params.tag) {
        case 'a':
            posto = 'Sh@ Aspirante';
            break;
        case 'j':
            posto = 'Jéssica';
            break;
        case 'n':
            posto = 'Ninja';
            break;
        case 'c':
            posto = 'Sh@ Cadete';
            break;
        default:
            posto = 'Pessoa';
    }
    res.render('index.ejs', {'posto':posto});
});

// Setup sockets
// Aqui é onde recebemos os eventos do client side e emitimos eventos a partir do servidor.
io.sockets.on('connection', function(socket) {

    // Event username -> quando alguém entra
    socket.on('username', function(username) {
        if(username === "Jéssica") socket.username = 'Jéssica';
        else socket.username = username + ' ' + (Math.floor(Math.random() * 100) + 1);
        io.emit('is_online', '🔵 <i>' + socket.username + ' joined.</i>');
    });

    // Event disconnect -> quando alguém sai
    socket.on('disconnect', function() {
        io.emit('is_online', '🔴 <i>' + socket.username + ' left.</i>');
    })

    // Event chat_message -> quando envia uma mensagem a partir do client side.
    socket.on('chat_message', function(message) {

        // Emitimos essa mesma mensagem para todos os clientes
        io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message);

        // Caso a port esteja definida, emitimos a mensagem para o Adrduino
        if(arduinoPort) {
            // O Arduino só está programado para lidar A->Z e com terminadores CRLF (se não sabes o que são espreita o google!)
            // Por isso convertemos para lower case e acrenscentamos \r\n (CRLF)
            serial.write(message.toLowerCase() + '\r\n', (err) => {
                if (err) return console.log('Error on write: ', err.message);
            });
        }
        else {
            console.log(`\tArduino port not defined: skipping write "${message}".`)
        }
    });

});

// Iniciar o servidor
const server = http.listen(port, addr, function() {
    if(server.address().family === 'IPv6')
        console.log(`Listening IPv6 on [${server.address().address}]:${server.address().port}`);
    else
        console.log(`Listening on ${server.address().address}:${server.address().port}`);
});