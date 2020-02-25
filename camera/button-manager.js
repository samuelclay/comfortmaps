const gpio = require('rpi-gpio');
const fs = require('fs');
const { spawn } = require('child_process');


class ButtonManager {    
    constructor(camera) {
        this.camera = camera;
        this.buttons = [27, 17, 22, 23, 18];
        this.override = 4;
        this.ratings = [1, 2, 3, 4, 5];
        this.pressed = new Set();
        
        gpio.setMode(gpio.MODE_BCM);
        gpio.on('change', this.buttonChange.bind(this));
        gpio.setup(this.override, gpio.DIR_OUT, gpio.EDGE_NONE, (err) => {
            if (err) {
                console.log(" ---> GPIO error", err);
            }
            gpio.write(this.override, false);
        });
        this.buttons.forEach((button) => {
            gpio.setup(button, gpio.DIR_IN, gpio.EDGE_BOTH);
        });        

    }
    
    buttonToRating(channel) {
        let buttonIndex = this.buttons.indexOf(channel);
        let rating = this.ratings[buttonIndex];
        
        // console.log(['Button to rating', channel, buttonIndex, rating]);
        return rating;
    }
    
    buttonChange(channel, value) {
        const channelPressed = this.pressed.has(channel);
        // console.log(['Channel', channel, value]);
        
        if (value == 0) {
            if (!channelPressed) {
                this.pressed.add(channel);
                console.log(" ---> Pressed ", this.buttonToRating(channel));
                this.takePhoto(channel);
            }
        } else if (value == 1) {
            if (channelPressed) {
                this.pressed.delete(channel);
            }
        }
    }
    
    async takePhoto(channel) {
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
            // console.log(['Photo data', data.length]);
            this.photoData.push(data);
        });
        child.on('close', (code) => {
            let photoRaw = Buffer.concat(this.photoData);
            let photoId = this.camera.databaseManager.generateId();
            fs.mkdir('photos', { recursive: true }, (err) => {
                if (err) {
                    if (err.code !== "EEXIST") throw err;
                }
                fs.writeFile("photos/"+photoId+".jpg", photoRaw, async (err) => {
                    if (err) {
                        console.log(" ---> Error saving file", photoId, err);
                        return;
                    }
                    let snapshot = {
                        photoId: photoId,
                        rating: this.buttonToRating(channel)
                    };

                    await this.camera.databaseManager.recordSnapshot(snapshot);
                    this.camera.bluetoothManager.sendPhoto(snapshot);
                    this.camera.wifiManager.sendPhoto(snapshot);
                });
            });
        });
    }
    
}

exports.ButtonManager = ButtonManager;