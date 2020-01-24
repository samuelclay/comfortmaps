#!/usr/bin/python3

import RPi.GPIO as GPIO # Import Raspberry Pi GPIO library

class ButtonWatch:
    BUTTONS = [18, 23, 22, 17, 27]
    pressed = set()
    
    def __init__(self):
        GPIO.setwarnings(True)
        GPIO.setmode(GPIO.BCM) # Use physical pin numbering
    
        for button in self.BUTTONS:
            GPIO.setup(button, GPIO.IN, pull_up_down=GPIO.PUD_UP)

    def loop(self):
        for button in self.BUTTONS:
            if GPIO.input(button) == GPIO.LOW:
                if button not in self.pressed:
                    self.pressed.add(button)
                    print(f" ---> Button pressed: {button}")
            else:
                if button in self.pressed:
                    self.pressed.remove(button)

if __name__ == "__main__":
    button_watch = ButtonWatch()
    while True:
        button_watch.loop()