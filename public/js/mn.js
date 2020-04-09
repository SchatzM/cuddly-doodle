'use strict';
var DEBUG = 1,
    socket,
    cnf= {
        canvas: {
            h:400,
            w:400,
            line:{
                cm:'RGB',
                c:'#ff6b81',
                w:4
            },
            saveState:{
                f:'image/png',
                q:'.3'
            }
        },
        tools:{}
    },
    cpl = {},
    frng,
    huehue = 0,
    count = true,
    xc = 0,
    yc = 0,
    pxc,
    pyc,
    pxs,
    pys,
    cW,
    cH,
    croomN,
    pcstate;

function setup() {
    if(!DEBUG) {
        console = {};
        console.info = function(){};
        console.log = function(){};
        console.warn = function(){}
    }
    socket = io.connect('10.0.10.69:1234')
    .on('connect', () => {
        console.info('Conectado.');
        joinRoom('awa')
        cnf.tools['cpik'] = createColorPicker(cnf.canvas.line.c);
        cnf.tools['cpik'].parent('toolbox')
    })
    .on('connect_error', (error) => {
        console.error(error)
    })
    .on('drawing',newDrawing)
    .on('clear',clearing)
    .on('message', (data) => {
        let room = croomN || 'Default',
            sta = data['metai'];
        cpl = data;
        if(sta){
            console.log('savedState:', room);
            console.log(data);
            console.log('%c   ', 'font-size:335px; color:transparent;'+
            'background:url('+data.metai.state+') no-repeat;',
            '\nid: '+data.pid+'\ndate: '+cpl.date);
        } else {
            console.log('salas:', data);
        }
        
    })
    .on('restoreState', (data) => {
        let salas = data,
            croomNIf = salas[croomN];
        
        if(croomNIf){
            console.info('ies',croomNIf)
            restoreCState(croomNIf.state)
        } else {
            console.info('nou')
        }
        console.log('restore: ', salas);
    });

    // Canvas setup
    let canvas = createCanvas(cnf.canvas.w, cnf.canvas.h);
    
    canvas.class('MSR-coop-draw');
    canvas.parent('elcanvas');

    cH = cnf.canvas.h;
    cW = cnf.canvas.w;

    $('#clearButton').click(function(){
        socket.emit('clear')
        clear()
    });

    $('#roomJoinName input[type="text"]').bind('enterKey',function(e){
        joinRoom($(this).val())
    }).keyup(function(e){
        if(e.keyCode == 13) {
            $(this).trigger("enterKey");
        }
    });
    // $('.MSR-coop-draw').mouseup(function(){
    //     regSaveState()
    //     console.info('mouseup')
    // });
}

function saveCanvasState(r) {
    let canvas = document.getElementsByClassName('MSR-coop-draw')[0],
        dataUrl = canvas.toDataURL(cnf.canvas.saveState.f, cnf.canvas.saveState.q);

    pcstate = dataUrl;
}
function regSaveState() {
    saveCanvasState();
    let roomN = croomN || 'Default',
        data = {
            'state':pcstate,
            'room': roomN
        }
    socket.emit('saveState', data)
}

function restoreCState(imag){
    loadImage(imag, img => {
        image(img, 0, 0);
      });
}

function joinRoom(room) {
    croomN = room;
    socket.emit('joinRoom',croomN);
}

function windowResized() {
    cH = cnf.canvas.h;
    cW = cnf.canvas.w;
    //resizeCanvas(cW,cH,true);
    console.warn('\ncanvas resized:\nw: ' + cW + '\nh: '+ cH)
  }

function mousePressed() {
    xc = mouseX;
    yc = mouseY;
    pxc = mouseX;
    pyc = mouseY;
}

function mouseReleased() {
    //console.warn('release!');
    // if(!frng){
    //     let roomN = croomN || 'Default',
    //     data = {
    //         'state':pcstate,
    //         'room': roomN
    //     }
    // socket.emit('saveState', data)
    // }
    regSaveState()
}

function newDrawing(data) {
    console.info('Recibiendo:\nX: ' + data.x + '\nY: '+ data.y + '\nPX: ' + data.px + '\nPY: '+ data.py+'\nc: '+data.c);
    let clr = data.c['levels'] || cnf.canvas.line.c;
    // if (count) {
    //     huehue++;
    //     if (huehue >= 256){
    //         count = false;
    //         // console.warn('c: '+count)
    //     }
    // } else {
    //     huehue--;
    //     if (huehue <= 0){
    //         count = true;
    //         // console.warn('c: '+count)
    //     }
    // }
    // if(((pxs - data.x) > 100 || (pxs - data.x) < 0) && ((pys - data.y)> 100 || (pys - data.y)<0)){
    //     pxs = data.x;
    //     pys = data.y
    // }
    colorMode(cnf.canvas.line.cm);
    strokeWeight(cnf.canvas.line.w);
    stroke(clr);
    line(data.x,data.y,data.px,data.py);
}

function clearing(msg) {
    let mess = msg || 'Clear room';
    console.warn('canvas clear received. '+mess);
    clear();
}

function mouseDragged() {
    if ((mouseX <= cW) && (mouseY <= cH) && (mouseX >= 0) && (mouseY >= 0)){
        console.info('Dibujando:\nX: ' + mouseX + '\nY: '+ mouseY);
        colorMode(cnf.canvas.line.cm);
        stroke(cnf.tools['cpik'].color());
        strokeWeight(cnf.canvas.line.w);
        line(mouseX,mouseY,pxc,pyc);
        let data = {
            x: mouseX,
            y: mouseY,
            px: pxc,
            py: pyc,
            c:cnf.tools['cpik'].color(),
            r: croomN
        }
        socket.emit('drawing', data)
        // console.warn(huehue);
        frng = false;
    } else {
        frng = true;
        console.warn('Fuera de rango')
    }
    pxc = mouseX;
    pyc = mouseY;
}