
var Constants = {
    c: 299792458,
}

function sqr(x) {
    return x*x;
}

function waist_at_mirror(RoC1, RoC2, L, lambda0) {
    if (RoC1 == L || RoC2 == L) {
        w4 = L/(RoC1+RoC2-L);
    } else {
        w4 = (RoC2-L)/(RoC1-L) * L/(RoC1+RoC2-L);
    }
    return Math.pow(sqr(lambda0*RoC1/Math.PI) * w4, 0.25);
}

function to_sensible_units(val, unit) {
    var prefixes = {
        '-9': 'n',
        '-6': '&mu;',
        '-3': 'm',
        '0': '',
        '3': 'k',
        '6': 'M',
        '9': 'G',
    };

    exponent = Math.floor(Math.log10(val)/3)*3;
    if (exponent < -9) {
        exponent = -9;
    } else if (exponent > 9) {
        exponent = 9;
    }
    val = val / Math.pow(10, exponent);
    return [val.toFixed(3), prefixes[exponent] + unit];
}

class Cavity {
    constructor(R1, R2, L, RoC1, RoC2) {
        this.r1 = Math.sqrt(R1);
        this.r2 = Math.sqrt(R2);
        this.L = L;
        this.RoC1 = RoC1;
        this.RoC2 = RoC2;
    }

    get FSR() {
        return Constants.c / (2*this.L);
    }

    get T() {
        return 1.0 - this.R;
    }

    get R() {
        return sqr((this.r1 - this.r2) / (1-this.r1*this.r2));
    }

    get F() {
        return Math.PI * Math.sqrt(this.r1*this.r2)/(1-this.r1*this.r2);
    }

    get buildup() {
        return (1.0 - sqr(this.r1))/sqr(1-this.r1*this.r2);
    }

    get g1() {
        return (1-this.L / sqr(this.RoC1))
    }

    get g2() {
        return (1-this.L / sqr(this.RoC2))
    }

    get g1g2() {
        return this.g1*this.g2;
    }

    is_stable() {
        var g1g2 = this.g1g2;
        if (g1g2 < 0 || g1g2 > 1) {
            return false;
        }
        return true;
    }

    beamradius_at_M1(lambda0) {
        return waist_at_mirror(this.RoC1, this.RoC2, this.L, lambda0);
    }

    beamradius_at_M2(lambda0) {
        return waist_at_mirror(this.RoC2, this.RoC1, this.L, lambda0);
    }

    waist(lambda0) {
        if (this.RoC1 == this.L && this.RoC2 == this.L) {
            return Math.sqrt(lambda0*this.L/2/Math.PI);
        } else if (this.RoC1 == this.L || this.RoC2 == this.L) {
            console.log('RoC1 == L or RoC2 == L, but not both. Formula fails here :-(');
            return -1;
        }
        var N = this.L*(this.RoC1-this.L)*(this.RoC2-this.L)*(this.RoC1+this.RoC2-this.L);
        var D = sqr(this.RoC1+this.RoC2-2*this.L);

        return Math.pow(sqr(lambda0/Math.PI)*N/D, 0.25);
    }

    // THIS NEW WAY OF CALCULATING THE BEAM SIZES FAILS FOR
    // e.g. L=2m, RoC1=RoC2=1.5m, and also for the confocal case (R1,2=L)

    get q() {
        // Using eq. (57), Kogelnik & Li, 1966
        var B = 2*this.L*(1-this.L/this.RoC1);
        if (B == 0) {
            
        }
        var A = 1-2*this.L/this.RoC1;
        var D = 1+2*this.L*(2*this.L-this.RoC2-2*this.RoC1)/this.RoC1/this.RoC2;
        var re = (D-A)/(2*B);
        var im = -1/(2*B)*Math.sqrt(4-sqr(A+D));
        var iq = new Complex(re, im);
        return iq.invert();
    }

    w(lambda0, z) {
        var q = this.q;
        q.re += z;
        var iq = q.invert();
        if (iq.im > 0)
            iq.im = -iq.im;
        return Math.sqrt(-lambda0 / Math.PI / iq.im);
    }
    
    w0(lambda0) {
        return this.w(lambda0, -this.q.re);
    }
    
    w1(lambda0) {
        return this.w(lambda0, this.L);
    }

    w2(lambda0) {
        return this.w(lambda0, 0);
    }
}

function $(id)
{
    return document.getElementById(id);
}

function update()
{
    clear_results();
    cav = new Cavity(parseFloat($('cav_R1').value) / 100.0,
                     parseFloat($('cav_R2').value) / 100.0,
                     parseFloat($('cav_L').value),
                     parseFloat($('cav_RoC1').value),
                     parseFloat($('cav_RoC2').value));
    var lambda0 = parseFloat($('cav_lambda0').value) * 1e-9;
    
    log_result('FSR', to_sensible_units(cav.FSR, 'Hz'));
    log_result('Finesse', [cav.F.toFixed(1), '']);
    log_result('Power build-up', [cav.buildup.toFixed(1), '']);
    log_result('Reflected power', [(cav.R * 100).toFixed(3), '%']);
    log_result('Transmitted power', [(cav.T * 100).toFixed(3), '%']);
    var is_stable = cav.is_stable();
    log_result('g1*g2', [cav.g1g2.toFixed(4), ''])
    log_result('Cavity stable', [is_stable ? 'yes' : 'no', '']);
    if (is_stable) {
        log_result('Beam waist', to_sensible_units(cav.waist(lambda0), 'm'));
        log_result('Beam radius at M1', to_sensible_units(cav.beamradius_at_M1(lambda0), 'm'));
        log_result('Beam radius at M2', to_sensible_units(cav.beamradius_at_M2(lambda0), 'm'));
        log_result('w0', to_sensible_units(cav.w0(lambda0), 'm'));
        log_result('w1', to_sensible_units(cav.w1(lambda0), 'm'));
        log_result('w2', to_sensible_units(cav.w2(lambda0), 'm'));
    }
}

function log_result(desc, value)
{
    out = get_result_window();
    out.innerHTML += '<span class="desc">'+desc+':</span> '
        + '<span class="value">' + value[0] + '</span><span class="unit">'
        + value[1] + '</span><br />';
}

function clear_results()
{
    out = get_result_window();
    out.innerHTML = '';
}

function get_result_window()
{
    return $('results');
}
