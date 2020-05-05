#include <wiringPi.h>
#include <time.h>
#include <unistd.h>

int main(void)
{
    // Red LED: Physical pin 18, BCM GPIO24, and WiringPi pin 5.
    // Wakeup LED: BCM GPIO4, and WiringPi pin 7.
    const int wakeup = 7;

    wiringPiSetup();
    pinMode(wakeup, OUTPUT);


    time_t start, end;
    double elapsed;  // seconds
    start = time(NULL);
    int terminate = 1;
    while (terminate) {
      end = time(NULL);
      elapsed = difftime(end, start);
      if (elapsed >= 90.0 /* seconds */)
        terminate = 0;
      else  // No need to sleep when 90.0 seconds elapsed.
        sleep(1);

      digitalWrite(wakeup, HIGH);

    }
    
    return 0;
}