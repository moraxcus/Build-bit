
/*===========================================================================
  Pins
    Neopixel            P12
 
  Motor
    Servo_S1            IIC_Channel 3
    Servo_S2            IIC_Channel 4
    Servo_S3            IIC_Channel 5
    LeftMotor_A         IIC_Channel 12
    LeftMotor_B         IIC_Channel 13
    RightMotor_A        IIC_Channel 14
    RightMotor_B        IIC_Channel 15

    Stepper motor suggested Model: 28BYJ-48
===========================================================================*/

/**
 * Build:bit blocks
 */
//% weight=100 color=#FF4C26 icon="\uf0fb" block="Build:Bit"
namespace BuildBit {

    const PCA9685_ADD = 0x40
    const MODE1 = 0x00
    const MODE2 = 0x01
    const SUBADR1 = 0x02
    const SUBADR2 = 0x03
    const SUBADR3 = 0x04

    const LED0_ON_L = 0x06
    const LED0_ON_H = 0x07
    const LED0_OFF_L = 0x08
    const LED0_OFF_H = 0x09

    const ALL_LED_ON_L = 0xFA
    const ALL_LED_ON_H = 0xFB
    const ALL_LED_OFF_L = 0xFC
    const ALL_LED_OFF_H = 0xFD

    const PRESCALE = 0xFE

    const STP_CHA_L = 2047
    const STP_CHA_H = 4095

    const STP_CHB_L = 1
    const STP_CHB_H = 2047

    const STP_CHC_L = 1023
    const STP_CHC_H = 3071

    const STP_CHD_L = 3071
    const STP_CHD_H = 1023

    let initialized = false
    let BBStrip: neopixel.Strip;


    //===========================================================================
    //  Motor
    //===========================================================================

    export enum enSteppers {
        B1 = 0x1,
        B2 = 0x2
    }
    export enum enPos {
        //% blockId="forward" block="Forward"
        forward = 1,
        //% blockId="reverse" block="Reverse"
        reverse = 2
    }

    export enum enPos2 {
        //% blockId="forward" block="Forward"
        forward = 1,
        //% blockId="reverse" block="Reverse"
        reverse = 2,
        //% blockId="left" block="Turn Left"
        turn_left = 3,
        //% blockId="right" block="Turn Right"
        turn_right = 4,
        //% blockId="rot-left" block="Rotate Left"
        rot_left = 5,
        //% blockId="rot-right" block="Rotate Right"
        rot_right = 6
    }

    export enum enTurns {
        //% blockId="T1B4" block="1/4"
        T1B4 = 90,
        //% blockId="T1B2" block="1/2"
        T1B2 = 180,
        //% blockId="T1B0" block="1"
        T1B0 = 360,
        //% blockId="T2B0" block="2"
        T2B0 = 720,
        //% blockId="T3B0" block="3"
        T3B0 = 1080,
        //% blockId="T4B0" block="4"
        T4B0 = 1440,
        //% blockId="T5B0" block="5"
        T5B0 = 1800
    }

    export enum enServo {

        S1 = 0,
        S2,
        S3,
        S4,
        S5,
        S6,
        S7,
        S8
    }
    export enum enMotors {
        M1 = 8,
        M2 = 10,
        M3 = 12,
        M4 = 14
    }

    function i2cwrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2ccmd(addr: number, value: number) {
        let buf = pins.createBuffer(1)
        buf[0] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cread(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function initPCA9685(): void {
        i2cwrite(PCA9685_ADD, MODE1, 0x00)
        setFreq(50);
        initialized = true
    }

    function setFreq(freq: number): void {
        // Constrain the frequency
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval; //Math.Floor(prescaleval + 0.5);
        let oldmode = i2cread(PCA9685_ADD, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cwrite(PCA9685_ADD, MODE1, newmode); // go to sleep
        i2cwrite(PCA9685_ADD, PRESCALE, prescale); // set the prescaler
        i2cwrite(PCA9685_ADD, MODE1, oldmode);
        control.waitMicros(5000);
        i2cwrite(PCA9685_ADD, MODE1, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15)
            return;
        if (!initialized) {
            initPCA9685();
        }
        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADD, buf);
    }

    function setStepper(index: number, dir: boolean): void {
        if (index == enSteppers.B1) {
            if (dir) {
                setPwm(11, STP_CHA_L, STP_CHA_H);
                setPwm(9, STP_CHB_L, STP_CHB_H);
                setPwm(10, STP_CHC_L, STP_CHC_H);
                setPwm(8, STP_CHD_L, STP_CHD_H);
            } else {
                setPwm(8, STP_CHA_L, STP_CHA_H);
                setPwm(10, STP_CHB_L, STP_CHB_H);
                setPwm(9, STP_CHC_L, STP_CHC_H);
                setPwm(11, STP_CHD_L, STP_CHD_H);
            }
        } else {
            if (dir) {
                setPwm(12, STP_CHA_L, STP_CHA_H);
                setPwm(14, STP_CHB_L, STP_CHB_H);
                setPwm(13, STP_CHC_L, STP_CHC_H);
                setPwm(15, STP_CHD_L, STP_CHD_H);
            } else {
                setPwm(15, STP_CHA_L, STP_CHA_H);
                setPwm(13, STP_CHB_L, STP_CHB_H);
                setPwm(14, STP_CHC_L, STP_CHC_H);
                setPwm(12, STP_CHD_L, STP_CHD_H);
            }
        }
    }

    function stopMotor(index: number) {
        setPwm(index, 0, 0);
        setPwm(index + 1, 0, 0);
    }



    //===========================================================================
    //  LED
    //===========================================================================

    /**
     * *****************************************************************
     * @param index
     */
    //% subcategory=LED
    //% blockId=SuperBit_RGB_Program 
    //% block="RGB_Program"
    //% weight=99
    //% blockGap=10
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function RGB_Program(): neopixel.Strip {

        if (!BBStrip) {
            BBStrip = neopixel.create(DigitalPin.P12, 4, NeoPixelMode.RGB);
        }
        return BBStrip;
    }

    //===========================================================================
    //  Motor - Servo
    //===========================================================================

    //% subcategory=Motor
    //% blockId=Build-Bit-Servo 
    //% block="Servo |%num| to value |%value|°"
    //% weight=97
    //% blockGap=10
    //% num.min=1 num.max=4 value.min=0 value.max=180
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=20
    export function Servo(num: enServo, value: number): void {

        // 50hz: 20,000 us
        let us = (value * 1800 / 180 + 600); // 0.6 ~ 2.4
        let pwm = us * 4096 / 20000;
        setPwm(num, 0, pwm);

    }

    /*
    //% blockId=SuperBit_Servo2 block="Servo(270°)|num %num|value %value"
    //% weight=96
    //% blockGap=10
    //% num.min=1 num.max=4 value.min=0 value.max=270
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=20
    export function Servo2(num: enServo, value: number): void {

        // 50hz: 20,000 us
        let newvalue = Math.map(value, 0, 270, 0, 180);
        let us = (newvalue * 1800 / 180 + 600); // 0.6 ~ 2.4
        let pwm = us * 4096 / 20000;
        setPwm(num, 0, pwm);

    }

    //% blockId=SuperBit_Servo3 block="Servo(360°)|num %num|pos %pos|value %value"
    //% weight=96
    //% blockGap=10
    //% num.min=1 num.max=4 value.min=0 value.max=90
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=20
    export function Servo3(num: enServo, pos: enPos, value: number): void {

        // 50hz: 20,000 us

        if (pos == enPos.stop) {
            let us = (86 * 1800 / 180 + 600); // 0.6 ~ 2.4
            let pwm = us * 4096 / 20000;
            setPwm(num, 0, pwm);
        }
        else if (pos == enPos.forward) { //0-90 -> 90 - 0
            let us = ((90 - value) * 1800 / 180 + 600); // 0.6 ~ 2.4
            let pwm = us * 4096 / 20000;
            setPwm(num, 0, pwm);
        }
        else if (pos == enPos.reverse) { //0-90 -> 90 -180
            let us = ((90 + value) * 1800 / 180 + 600); // 0.6 ~ 2.4
            let pwm = us * 4096 / 20000;
            setPwm(num, 0, pwm);
        }
    }
    */

    //===========================================================================
    //  Motor
    //===========================================================================

    //% subcategory=Motor
    //% blockId=SuperBit_MotorStopAll 
    //% block="Motor Stop All"
    //% weight=
    //% blockGap=50
    export function MotorStopAll(): void {
        if (!initialized) {
            initPCA9685()
        }

        stopMotor(enMotors.M1);
        stopMotor(enMotors.M2);
        stopMotor(enMotors.M3);
        stopMotor(enMotors.M4);

    }

    //% subcategory=Motor
    //% blockId=Build-Bit-MotorRun 
    //% block="Motor |%index| run |%dir| at speed |%speed"
    //% weight=
    //% speed.min=0 speed.max=100
    export function MotorRun(index: enMotors, dir: enPos, speed: number): void {
        if (!initialized) {
            initPCA9685()
        }

        speed = Math.clamp(0, 100, speed)
        speed = Math.abs(4095 * (speed / 100))

        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= 350) {
            speed = 350
        }

        let a = index
        let b = index + 1

        if (a > 10) {
            if (dir == 1) {
                setPwm(a, 0, speed)
                setPwm(b, 0, 0)
            } else if (dir == 2) {
                setPwm(a, 0, 0)
                setPwm(b, 0, speed)
            }
            else {
                setPwm(a, 0, 0)
                setPwm(b, 0, 0)
            }
        }
        else {
            if (dir == 1) {
                setPwm(b, 0, speed)
                setPwm(a, 0, 0)
            } else if (dir == 2) {
                setPwm(b, 0, 0)
                setPwm(a, 0, speed)
            }
            else {
                setPwm(a, 0, 0)
                setPwm(b, 0, 0)
            }
        }

    }


    //% subcategory=Motor
    //% blockId=Build-Bit-MotorRunDual
    //% block="Motor |%index1| and |%index2| run |%dir| at speed |%speed|"
    //% weight=
    //% blockGap=10
    //% speed.min=0 speed.max=100
    export function MotorRunDual(index1: enMotors, index2: enMotors, dir: enPos, speed: number): void {
        if (!initialized) {
            initPCA9685()
        }

        speed = Math.clamp(0, 100, speed)
        speed = Math.abs(4095 * (speed / 100))

        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= 350) {
            speed = 350
        }

        let a = index1
        let b = index1 + 1
        let c = index2
        let d = index2 + 1

        if (a > 10) {
            if (dir == 1) {
                setPwm(a, 0, speed)
                setPwm(b, 0, 0)
            } else if (dir == 2) {
                setPwm(a, 0, 0)
                setPwm(b, 0, speed)
            }
            else {
                setPwm(a, 0, 0)
                setPwm(b, 0, 0)
            }
        }
        else {
            if (dir == 1) {
                setPwm(b, 0, speed)
                setPwm(a, 0, 0)
            } else if (dir == 2) {
                setPwm(b, 0, 0)
                setPwm(a, 0, speed)
            }
            else {
                setPwm(a, 0, 0)
                setPwm(b, 0, 0)
            }
        }

        if (c > 10) {
            if (dir == 1) {
                setPwm(c, 0, speed)
                setPwm(d, 0, 0)
            } else if (dir == 2) {
                setPwm(c, 0, 0)
                setPwm(d, 0, speed)
            }
            else {
                setPwm(c, 0, 0)
                setPwm(d, 0, 0)
            }
        }
        else {
            if (dir == 1) {
                setPwm(d, 0, speed)
                setPwm(c, 0, 0)
            } else if (dir == 2) {
                setPwm(d, 0, 0)
                setPwm(c, 0, speed)
            }
            else {
                setPwm(c, 0, 0)
                setPwm(d, 0, 0)
            }
        }
    }


    //% subcategory=Motor
    //% blockId=Build-Bit-StepperDegree
    //% block="Stepper Motor |%index| turn |%degree|°"
    //% weight=
    //% blockGap=10
    export function StepperDegree(index: enSteppers, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        setStepper(index, degree > 0);
        degree = Math.abs(degree);
        basic.pause(10240 * degree / 360);
        MotorStopAll()
    }

    //% subcategory=Motor
    //% blockId=Build-Bit-StepperTurn
    //% block="Stepper Motor |%index| turn |%turn| circle"
    //% weight=
    //% blockGap=10
    export function StepperTurn(index: enSteppers, turn: enTurns): void {
        let degree = turn;
        StepperDegree(index, degree);
    }

    //% subcategory=Motor
    //% blockId=Build-Bit_StepperDual
    //% block="Dual Stepper Motor B1 |%degree1|° and B2 |%degree2|°"
    //% weight=88
    //% blockGap=10
    export function StepperDual(degree1: number, degree2: number): void {
        if (!initialized) {
            initPCA9685()
        }
        setStepper(1, degree1 > 0);
        setStepper(2, degree2 > 0);
        degree1 = Math.abs(degree1);
        degree2 = Math.abs(degree2);
        basic.pause(10240 * Math.min(degree1, degree2) / 360);
        if (degree1 > degree2) {
            stopMotor(enMotors.M3);
            stopMotor(enMotors.M4);
            basic.pause(10240 * (degree1 - degree2) / 360);
        } else {
            stopMotor(enMotors.M1);
            stopMotor(enMotors.M2);
            basic.pause(10240 * (degree2 - degree1) / 360);
        }

        MotorStopAll()
    }

    /*
    //% blockId=SuperBit_PWMOFF 
    //% block="PWM OFF|%index"
    //% weight=87
    export function PWMOFF(index: number): void {
        setPwm(index, 0, 0);
    }
    */

}
