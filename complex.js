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
}
