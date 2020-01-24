var gpio = require('rpi-gpio');


class ButtonWatch {
    const buttons = [18, 23, 22, 17, 27];
    var pressed = new Set();
    
    constructor() {
        gpio.on('change', this.buttonChange);

        this.buttons.forEach((button) => {
            console.log(['Setting up', button]);
            gpio.setup(button, gpio.DIR_IN, gpio.EDGE_BOTH);
        });        
    }
    
    buttonChange(channel, value) {
        const channelPressed = this.pressed.has(channel);
        console.log(['Channel', channel, value]);
        
        if (value == 0) {
            if (!channelPressed) {
                this.pressed.add(channel);
                console.log("Pressed " + channel);
            }
        } else if (value == 1) {
            if (channelPressed) {
                this.pressed.delete(channel);
            }
        }
    }
    
}

var buttonWatch = new ButtonWatch();