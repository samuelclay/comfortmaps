const gpio = require('rpi-gpio');
const { spawn } = require('child_process');
const Raspistill = require('node-raspistill').Raspistill;
const BluetoothManager = require('./bluetooth-manager').BluetoothManager;
const WifiManager = require('./wifi-manager').WifiManager;
const camera = new Raspistill({
    verticalFlip: true,
    quality: 10,
    width: 320,
    height: 240
});

class ButtonWatch {    
    constructor() {
        this.buttons = [18, 23, 22, 17, 27];
        this.pressed = new Set();
        
        gpio.setMode(gpio.MODE_BCM);
        gpio.on('change', this.buttonChange.bind(this));

        this.buttons.forEach((button) => {
            gpio.setup(button, gpio.DIR_IN, gpio.EDGE_BOTH);
        });        

        console.log(' ---> Starting Comfort Maps', this.buttons);
    }
    
    buttonChange(channel, value) {
        const channelPressed = this.pressed.has(channel);
        // console.log(['Channel', channel, value]);
        
        if (value == 0) {
            if (!channelPressed) {
                this.pressed.add(channel);
                console.log(" ---> Pressed " + channel);
                const child = spawn('raspistill', [
                    '-q',   '10', 
                    '-t',   '1', 
                    '-rot', '180', 
                    '-w',   '488',
                    '-h',   '366',
                    '-o',   '-'
                ]);

                process.stdin.pipe(child.stdin);
                this.photoData = [];
                child.stdout.on('data', (data) => {
                    console.log(['Photo', data.length]);
                    this.photoData.push(data);
                });
                child.on('close', (code) => {
                    var photo = Buffer.concat(this.photoData);
                    console.log(['Finished taking photo', code, photo.length]);
                    bluetoothManager.sendPhoto(channel, photo);
                    wifiManager.sendPhoto(channel, photo);                    
                });
                
                // camera.takePhoto().then((photo) => {
                //     console.log(['Photo', photo]);
                //     bluetoothManager.sendPhoto(channel, photo);
                //     wifiManager.sendPhoto(channel, photo);
                // });
            }
        } else if (value == 1) {
            if (channelPressed) {
                this.pressed.delete(channel);
            }
        }
    }
    
}

var buttonWatch = new ButtonWatch();
var bluetoothManager = new BluetoothManager();
var wifiManager = new WifiManager();
