'use strict';
var DEBUG = 1,
    express = require('express'),
    app = express(),
    server = app.listen(1234),
    cdate = Date.now(),
    cpl = {},
    pcstate = {};

app.use(express.static('public'));

if(!DEBUG) {
    console = {};
    console.info = function(){};
    console.log = function(){};
    console.warn = function(){};
    console.error = function(){};
}
console.info('\nMSR test server running.')

var socket = require('socket.io', { rememberTransport: false, transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling'] }),
    io = socket(server);

io.of('/awa');
io.on('connection', newConnection);

function newConnection(socket) {
    let ipa = socket.handshake.address,
        sipa = ipa.substring(7),
        proom = 'Default';

    console.info('\n===\nNuevo cliente\nID: '+ socket.id + '\nIP: '+ sipa + '\n===')

    socket
    .on('drawing', mouseMsg)
    .on('clear', clearMsg)
    .on('joinRoom', function(roomN) {
        let room = roomN || 'Default'
        console.info('room: '+room+', id: '+socket.id);
        cpl = {'pid':socket.id,'date':cdate,'croom':room,'proom':proom}
        if (room != proom) {
            socket.leave(proom).join(room);
            socket.emit('message', cpl);
            socket.emit('restoreState', pcstate);
            clearMsg(true)
        } else {
            socket.emit('message', cpl);
        }
        proom = room;
    })
    .on('saveState', saveState);

    function saveState(data) {
        pcstate[data.room] = data;
        let datas = {
                'metai': pcstate[data.room],
                'date': cdate,
                'pid': socket.id,
                'IP': sipa
            }
        socket.emit('message', datas);
        console.info('save: ', datas)
    }

    function mouseMsg(data) {
        socket.to(proom).emit('drawing', data);
        console.info('\n===\nProcesando:\nID: ' + socket.id + '\nIP: ' + sipa + '\nRoom: ',socket.rooms, '\ndata:', data,'\n===');
    }

    function clearMsg(slf) {
        if(slf){
            return socket.emit('clear','self');
        }
        io.in(proom).emit('clear');
        console.info('Clear broadcasted')
    }
}