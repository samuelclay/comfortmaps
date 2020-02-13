const gpio = require('rpi-gpio');
const sharp = require('sharp');
const fs = require('fs');
const uuidv1 = require('uuid/v1');
const { spawn } = require('child_process');
const BluetoothManager = require('./bluetooth-manager').BluetoothManager;
const WifiManager = require('./wifi-manager').WifiManager;

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
                    // '-w',   '488',
                    // '-h',   '366',
                    '-o',   '-'
                ]);

                process.stdin.pipe(child.stdin);
                this.photoData = [];
                child.stdout.on('data', (data) => {
                    console.log(['Photo data', data.length]);
                    this.photoData.push(data);
                });
                child.on('close', (code) => {
                    let photoRaw = Buffer.concat(this.photoData);
                    let photoUuid = uuidv1();
                    fs.writeFile("photos/"+photoUuid+".jpg", photoRaw, (err) => {
                        if (err) {
                            console.log(" ---> Error saving file", uuid, err);
                            return;
                        }
                        sharp(photoRaw).resize(488).toBuffer().then((photoThumb) => {
                            console.log(['Finished taking photo', code, photoRaw.length, photoThumb.length]);
                            bluetoothManager.sendPhoto(channel, photoThumb);
                            wifiManager.sendPhoto(channel, photoThumb);                        
                        });
                    });
                });
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
