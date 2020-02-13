const gpio = require('rpi-gpio');
const sharp = require('sharp');
const fs = require('fs');
const { spawn } = require('child_process');


class ButtonManager {    
    constructor(camera) {
        this.camera = camera;
        this.buttons = [18, 23, 22, 17, 27];
        this.ratings = [1, 2, 3, 4, 5];
        this.pressed = new Set();
        
        gpio.setMode(gpio.MODE_BCM);
        gpio.on('change', this.buttonChange.bind(this));

        this.buttons.forEach((button) => {
            gpio.setup(button, gpio.DIR_IN, gpio.EDGE_BOTH);
        });        

    }
    
    buttonToRating(channel) {
        let buttonIndex = this.buttons.indexOf(channel);
        let rating = this.ratings[buttonIndex];
        
        return rating;
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
                    let photoId = this.camera.databaseManager.generateId();
                    fs.writeFile("photos/"+photoId+".jpg", photoRaw, (err) => {
                        if (err) {
                            console.log(" ---> Error saving file", photoId, err);
                            return;
                        }
                        sharp(photoRaw).resize(488).toBuffer().then((photoThumb) => {
                            console.log(['Finished taking photo', code, photoRaw.length, photoThumb.length]);
                            let snapshot = this.camera.databaseManager.recordSnapshot({
                                photoId: photoId,
                                rating: this.buttonToRating(channel)
                            });
                            this.camera.bluetoothManager.sendPhoto(snapshot, photoThumb);
                            this.camera.wifiManager.sendPhoto(snapshot, photoRaw);                        
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

exports.ButtonManager = ButtonManager;