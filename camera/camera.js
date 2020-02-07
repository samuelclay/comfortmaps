const gpio = require('rpi-gpio');
const Raspistill = require('node-raspistill').Raspistill;
const camera = new Raspistill({
    verticalFlip: true,
    quality: 10,
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
                camera.takePhoto().then((photo) => {
                    console.log(['Photo', photo]);
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