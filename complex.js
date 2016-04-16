/***
jsCav - linear cavity calculator
2016, S. Steinlechner -- github.com/sestei/jscav

This work is licensed under the Creative Commons Attribution-NonCommercial-
ShareAlike 4.0 International License. To view a copy of this license, visit
http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative
Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/

class Complex {
    constructor(re, im) {
        this.re = re;
        this.im = im;
    }

    add(other) {
        this.re += other.re;
        this.im += other.im;
    }

    sub(other) {
        this.re -= other.re;
        this.im -= other.im;
    }

    invert() {
        var m = this.mag()
        return new Complex(this.re/m, -this.im/m);
    }

    mag() {
        return this.re*this.re + this.im*this.im;
    }

    clone() {
        return new Complex(this.re, this.im);
    }
}
