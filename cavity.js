/***
jsCav - linear cavity calculator
2016, S. Steinlechner -- github.com/sestei/jscav

This work is licensed under the Creative Commons Attribution-NonCommercial-
ShareAlike 4.0 International License. To view a copy of this license, visit
http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative
Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/

var Constants = {
    c: 299792458,
}

function sqr(x) {
    return x*x;
}

function checkR(R) {
    if (R < 0.0)
        return 0.0;
    else if (R > 100.0)
        return 100.0;
    return R;
}

function R2T(percent) {
    return (100.0-checkR(percent))*10000.0;
}

function T2R(ppm) {
    return checkR(100.0-ppm/10000.0);
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

    var sign = 1;
    if (val < 0) {
        sign = -1;
        val *= -1.0;
    }
    exponent = Math.floor(Math.log10(val)/3)*3;
    if (exponent < -9) {
        exponent = -9;
    } else if (exponent > 9) {
        exponent = 9;
    }
    val = val / Math.pow(10, exponent);
    return [sign*val.toFixed(3), prefixes[exponent] + unit];
}

function isPlane(RoC) {
    if (RoC == 0.0)
        return Infinity;
    else
        return RoC;
}

class Cavity {
    constructor(R1, R2, L, RoC1, RoC2) {
        this.r1 = Math.sqrt(R1);
        this.r2 = Math.sqrt(R2);
        this.L = L;
        this.RoC1 = isPlane(RoC1);
        this.RoC2 = isPlane(RoC2);
        this._q = null;
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
        return (1-this.L / this.RoC1)
    }

    get g2() {
        return (1-this.L / this.RoC2)
    }

    get g1g2() {
        return this.g1*this.g2;
    }

    get mode_spacing() {
        // using formula from LIGO-T1300189
        var zeta;
        if (this.g1 < 0.0)
            zeta = 2.0*Math.acos(-Math.sqrt(this.g1g2));
        else
            zeta = 2.0*Math.acos(Math.sqrt(this.g1g2));

        return zeta/(2*Math.PI)*this.FSR;
    }

    is_confocal() {
        return (this.L == this.RoC1) && (this.L == this.RoC2);
    }

    is_stable() {
        var g1g2 = this.g1g2;
        if (g1g2 == 0 && this.is_confocal()) {
            return true;
        }
        if (g1g2 <= 0 || g1g2 >= 1) {
            return false;
        }
        return true;
    }

    get q() {
        if (this._q)
            return this._q.clone();

        if (this.is_confocal()) {
            return new Complex(-this.L/2, this.L/2);
        }
        // Using eq. (57), Kogelnik & Li, 1966
        var B = 2*this.L*(1-this.L/this.RoC2);
        var A = 1-2*this.L/this.RoC2;
        var D = 1+2*this.L*(2*this.L/this.RoC1/this.RoC2 - 1/this.RoC2 - 2/this.RoC1);
        var re = (D-A)/(2*B);
        var im = -1/(2*B)*Math.sqrt(4-sqr(A+D));
        var iq = new Complex(re, im);
        this._q = iq.invert();
        return this._q;
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
        return this.w(lambda0, 0);
    }

    w2(lambda0) {
        return this.w(lambda0, this.L);
    }

    get z0() {
        return -this.q.re;
    }
}

function mode_plot(FSR, spacing)
{
    function draw_axis() {
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#F8F8F2';
        ctx.fillStyle = '#F8F8F2';
        ctx.beginPath();
        ctx.moveTo(10,h-40);
        ctx.lineTo(w-11,h-40);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w-10,h-40);
        ctx.lineTo(w-25,h-35);
        ctx.lineTo(w-20,h-40);
        ctx.lineTo(w-25,h-45);
        ctx.fill()

        ctx.font = '12px Roboto Mono';
        ctx.textAlign = 'center';
        ctx.fillText('Higher-order mode spectrum', w/2, h-20)    
    }

    function draw_FSR() {
        ctx.beginPath();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#66D9EF';
        ctx.moveTo(0,0);
        ctx.lineTo(0,50);
        ctx.moveTo(100,0);
        ctx.lineTo(100,50);
        ctx.stroke();

        ctx.font = '4px Roboto Mono';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F8F8F2';
        ctx.fillText('0', 0, -2);
        ctx.fillText('0', 100, -2);
    }
    
    function draw_HOM() {
        var shift = spacing / FSR * 100;
        var pos = shift;
        var N = 20;
        ctx.font = '4px Roboto Mono';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F8F8F2';
        for (var i=1; i<=N; i++) {
            ctx.beginPath();
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = 'rgba(166, 226, 46, '+(1.0-(i-1)/N)+')';
            ctx.moveTo(pos, 50);
            ctx.lineTo(pos, 50*i/(N+1));
            ctx.stroke();
            ctx.fillText(i, pos, 50*i/(N+1)-2);
            pos += shift;
            pos %= 100;
        }
    }
    var w = 350, h = 220;
    var window = get_result_window();
    window.innerHTML += '<canvas id="mode_spacing" width="'+(w*2)+'" height="'+(h*2)+'"></canvas>';
    var canvas = $('mode_spacing');
    canvas.style.width = w+'px';
    canvas.style.height = h+'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(2,2);
    ctx.translate(0.5, 0.5);

    draw_axis();
    ctx.translate(20,40);
    //ctx.scale((w-70)/100,-1*(h-100)/100);
    ctx.scale((w-60)/100,(w-70)/100);
    draw_FSR();
    draw_HOM();    
}

function $(id)
{
    return document.getElementById(id);
}

function update()
{
    clear_results();
    
    var R1, R2;
    if ($('cav_RT1_R').checked)
        R1 = checkR($('cav_R1').value);
    else
        R1 = T2R($('cav_T1').value);
    if ($('cav_RT2_R').checked)
        R2 = checkR($('cav_R2').value);
    else
        R2 = T2R($('cav_T2').value);

    var cav = new Cavity(R1 / 100.0,
                     R2 / 100.0,
                     parseFloat($('cav_L').value),
                     parseFloat($('cav_RoC1').value),
                     parseFloat($('cav_RoC2').value));
    var lambda0 = parseFloat($('cav_lambda0').value) * 1e-9;
    
    log_result('FSR', to_sensible_units(cav.FSR, 'Hz'));
    log_result('Finesse', [cav.F.toFixed(1), '']);
    var FWHM = cav.FSR/cav.F;
    log_result('Linewidth (FWHM)', to_sensible_units(FWHM, 'Hz'));
    log_result('Cavity pole', to_sensible_units(FWHM/2.0, 'Hz'));
    log_result('Power build-up factor', [cav.buildup.toFixed(1), '']);
    log_result('Reflected power', [(cav.R * 100).toFixed(3), '%']);
    log_result('Transmitted power', [(cav.T * 100).toFixed(3), '%']);
    var is_stable = cav.is_stable();
    log_result('g1*g2', [cav.g1g2.toFixed(4), ''])
    log_result('Cavity stable', [is_stable ? 'yes' : 'no', '']);
    if (is_stable) {
        log_result('Mode spacing', to_sensible_units(cav.mode_spacing, 'Hz'));
        log_result('Beam waist', to_sensible_units(cav.w0(lambda0), 'm'));
        log_result('Waist position from M1', to_sensible_units(cav.z0, 'm'));
        log_result('Beam radius at M1', to_sensible_units(cav.w1(lambda0), 'm'));
        log_result('Beam radius at M2', to_sensible_units(cav.w2(lambda0), 'm'));

        mode_plot(cav.FSR, cav.mode_spacing);
    }
}

function log_result(desc, value)
{
    var out = get_result_window();
    out.innerHTML += '<span class="desc">'+desc+':</span> '
        + '<span class="value">' + value[0] + '</span><span class="unit">'
        + value[1] + '</span><br />';
}

function clear_results()
{
    var out = get_result_window();
    out.innerHTML = '';
}

function get_result_window()
{
    return $('results');
}
