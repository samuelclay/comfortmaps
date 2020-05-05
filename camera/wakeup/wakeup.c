#include <wiringPi.h>

int main(void)
{
    // Red LED: Physical pin 18, BCM GPIO24, and WiringPi pin 5.
    // Wakeup LED: BCM GPIO4, and WiringPi pin 7.
    const int wakeup = 7;

    wiringPiSetup();

    pinMode(wakeup, OUTPUT);

    digitalWrite(wakeup, HIGH);

    return 0;
}