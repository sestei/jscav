/***
jsCav - linear cavity calculator
2016, S. Steinlechner -- github.com/sestei/jscav

This work is licensed under the Creative Commons Attribution-NonCommercial-
ShareAlike 4.0 International License. To view a copy of this license, visit
http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative
Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/

$ = document.getElementById.bind(document);

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

function to_sensible_units(val, unit, decimals=3) {
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
    return [sign*val.toFixed(decimals), prefixes[exponent] + unit];
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

    get roundtrip_gouy_phase() {
        // using formula from LIGO-T1300189
        if (this.g1 < 0.0)
            return 2.0*Math.acos(-Math.sqrt(this.g1g2));
        else
            return 2.0*Math.acos(Math.sqrt(this.g1g2));
    }

    get mode_spacing() {
        return this.roundtrip_gouy_phase / (2*Math.PI)*this.FSR;
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

function mode_plot(FSR, spacing, finesse)
{
    function draw_axis() {
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#F8F8F2';
        ctx.fillStyle = '#F8F8F2';

        ctx.save();
        ctx.translate(10,h-2*yborder);

        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(w-20,0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w-20,0);
        ctx.lineTo(w-30,5);
        ctx.lineTo(w-25,0);
        ctx.lineTo(w-30,-4);
        ctx.fill()

        ctx.font = '14px Roboto Mono';
        ctx.textAlign = 'center';
        ctx.fillText('Higher-order mode spectrum', w/2, 20)
        //ctx.fillText('f', w-25,20);
        ctx.restore();
   }

    function draw_FSR() {
        ctx.beginPath();
        ctx.lineWidth = 0.3;
        ctx.strokeStyle = '#66D9EF';
        ctx.moveTo(0,0);
        ctx.lineTo(0,53);
        ctx.moveTo(100,0);
        ctx.lineTo(100,53);
        ctx.stroke();

        ctx.font = '2px Roboto Mono';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F8F8F2';
        ctx.fillText('0', 0, 56);
        strFSR = to_sensible_units(FSR, 'Hz', 0);
        ctx.fillText(strFSR[0] + '' + strFSR[1], 100, 56);
    }

    function draw_HOM() {
        var shift = spacing / FSR * 100;
        var pos = shift;
        var maxOrder = parseInt($('cav_max_order').value);
        var N = maxOrder + 1;
        ctx.font = '3px Roboto Mono';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F8F8F2';
        for (var i = 1; i <= maxOrder; i++) {
            var amp = (N - i) / N;
            ctx.beginPath();
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = 'rgba(166, 226, 46, '+(1.0-(i-1)/maxOrder)+')';
            ctx.moveTo(pos, 50);
            ctx.lineTo(pos, 50 * (1 - amp));
            ctx.stroke();
            ctx.fillText(i, pos, 50 * (1 - amp) - 2);
            pos += shift;
            pos %= 100;
        }
    }

    function draw_airy_peaks() {
        var hwhm = 50 / finesse; // half-width at half-maximum of the peaks, in x-axis units
        var shift = spacing / FSR * 100;
        var maxOrder = parseInt($('cav_max_order').value);
        var N = maxOrder + 1;
        var step = Math.max(0.02, hwhm / 20);

        function loren(x, x0, amp) {
            return amp / (1.0 + Math.pow((x - x0) / hwhm, 2));
        }

        // Unique peaks in [0, 100): TEM00 then HOMs with height-scaled amplitude
        var peaks = [{pos: 0, amp: 1.0, order: 0}];
        var p = (shift % 100 + 100) % 100;
        for (var i = 1; i <= maxOrder; i++) {
            peaks.push({pos: p, amp: (N - i) / N, order: i});
            p = (p + shift) % 100;
        }

        // Extended list with wrapped copies for correct edge contributions
        var allPeaks = [];
        peaks.forEach(function(pk) {
            allPeaks.push({pos: pk.pos,       amp: pk.amp, order: pk.order});
            allPeaks.push({pos: pk.pos - 100, amp: pk.amp, order: pk.order});
            allPeaks.push({pos: pk.pos + 100, amp: pk.amp, order: pk.order});
        });

        // Pre-compute sum across full range to find the normalisation factor
        var xs = [], rawSums = [];
        for (var x = 0; x <= 100; x += step) {
            var sum = 0;
            allPeaks.forEach(function(pk) { sum += loren(x, pk.pos, pk.amp); });
            xs.push(x);
            rawSums.push(sum);
        }
        var maxSum = Math.max.apply(null, rawSums);

        // Draw individual peaks (desaturated fill), opacity scales with mode order
        var margin = Math.max(20 * hwhm, 1);
        allPeaks.forEach(function(pk) {
            if (pk.pos + margin < 0 || pk.pos - margin > 100) return;
            var xStart = Math.max(0, pk.pos - margin);
            var xEnd   = Math.min(100, pk.pos + margin);
            if (xEnd <= xStart) return;

            var opacity = pk.order === 0
                ? 0.6
                : 0.6 * (1.0 - (pk.order - 1) / maxOrder);

            ctx.beginPath();
            ctx.moveTo(xStart, 50);
            for (var x = xStart; x <= xEnd; x += step) {
                ctx.lineTo(x, 50 - 50 * loren(x, pk.pos, pk.amp) / maxSum);
            }
            ctx.lineTo(xEnd, 50 - 50 * loren(xEnd, pk.pos, pk.amp) / maxSum);
            ctx.lineTo(xEnd, 50);
            ctx.closePath();
            ctx.fillStyle = 'rgba(166, 226, 46, ' + opacity.toFixed(3) + ')';
            ctx.fill();
            //ctx.stroke();
        });

        // Normalise sum using pre-computed values
        var ys = rawSums.map(function(s) { return 50 - 50 * s / maxSum; });

        // Fill under sum curve
        ctx.beginPath();
        ctx.moveTo(xs[0], 50);
        for (var k = 0; k < xs.length; k++) ctx.lineTo(xs[k], ys[k]);
        ctx.lineTo(xs[xs.length - 1], 50);
        ctx.closePath();
        ctx.fillStyle = 'rgba(166, 226, 46, 0.35)';
        ctx.fill();

        // Stroke top of sum curve
        ctx.beginPath();
        ctx.moveTo(xs[0], ys[0]);
        for (var k = 1; k < xs.length; k++) ctx.lineTo(xs[k], ys[k]);
        ctx.strokeStyle = '#A6E22E';
        ctx.lineWidth = 0.2;
        ctx.stroke();

        function peak_height_at_pos(x) {
            for (var k = 0; k < xs.length; k++) {
                if (xs[k] >= x) return ys[k];
            }
            return 1;
        }

        // Draw peak labels, only for peaks that are actually within the [0, 100] range
        ctx.font = '2px Roboto Mono';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F8F8F2';
        ctx.strokeStyle = '#F8F8F2';
        ctx.lineWidth = 0.2;
        allPeaks.forEach(function(pk) {
            if (pk.pos >= 0 && pk.pos <= 100) {
                ctx.fillText(pk.order, pk.pos, -4+pk.order);
                ctx.beginPath();
                ctx.moveTo(pk.pos, -3+pk.order);
                ctx.lineTo(pk.pos, peak_height_at_pos(pk.pos) - 2);
                ctx.stroke();
            }
        });
    }

    var container = get_result_window();
    var w = container.clientWidth - 24;
    var ratio = 0.5;
    var xborder = 30;
    var yborder = 20;
    var h = Math.round(w * ratio) + 4*yborder;
    // oversample for better rendering quality on high-DPI screens, but scale back to normal size with CSS
    container.innerHTML += '<canvas id="mode_spacing" width="'+(2*w)+'" height="'+(2*h)+'"></canvas>';
    var canvas = $('mode_spacing');
    canvas.style.width = w+'px';
    canvas.style.height = h+'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(2,2);
    ctx.translate(0.5, 0.5);
    draw_axis();
    ctx.translate(xborder,3*yborder);

    // scale things such that we always have 100 units on the x-axis,
    // independent of the actual size of the canvas
    var xscale = (w-2*xborder)/100;
    ctx.scale(xscale,xscale);
    draw_FSR();
    //if ($('cav_airy').checked)
    draw_airy_peaks();
    //else
    //    draw_HOM();
}

function calculateCavity()
{
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

    var is_stable = cav.is_stable();
    var FWHM = cav.FSR/cav.F;

    var html = '<table class="results-table"><tbody>';
    html += log_result('Cavity stable', [is_stable ? 'yes' : 'no', ''], is_stable ? '' : 'warn');
    html += log_result('FSR', to_sensible_units(cav.FSR, 'Hz'));
    html += log_result('Finesse', [cav.F.toFixed(1), '']);
    html += log_result('Linewidth (FWHM)', to_sensible_units(FWHM, 'Hz'));
    html += log_result('Cavity pole', to_sensible_units(FWHM/2.0, 'Hz'));
    html += log_result('Power build-up factor', [cav.buildup.toFixed(1), '']);
    html += log_result('Reflected power', [(cav.R * 100).toFixed(3), '%']);
    html += log_result('Transmitted power', [(cav.T * 100).toFixed(3), '%']);
    html += log_result('g1 &times; g2', [cav.g1g2.toFixed(4), '']);

    if (is_stable) {
        html += '<tr class="section-sep"><td colspan="3">Stable cavity</td></tr>';
        html += log_result('Roundtrip Gouy phase',
                           to_sensible_units(cav.roundtrip_gouy_phase*180.0/Math.PI, 'deg'));
        html += log_result('Mode spacing', to_sensible_units(cav.mode_spacing, 'Hz'));
        html += log_result('Mode spacing', [Math.abs(cav.mode_spacing*100.0 / cav.FSR).toFixed(2), '% of FSR']);
        html += log_result('Beam waist', to_sensible_units(cav.w0(lambda0), 'm'));
        html += log_result('Waist position from M1', to_sensible_units(cav.z0, 'm'));
        html += log_result('Beam radius at M1', to_sensible_units(cav.w1(lambda0), 'm'));
        html += log_result('Beam radius at M2', to_sensible_units(cav.w2(lambda0), 'm'));
    }
    html += '</tbody></table>';

    var out = get_result_window();
    out.innerHTML += html;

    if (is_stable)
        mode_plot(cav.FSR, cav.mode_spacing, cav.F);
}

function log_result(desc, value, rowClass)
{
    var cls = rowClass ? ' class="' + rowClass + '"' : '';
    return '<tr' + cls + '>'
        + '<td class="desc">' + desc + '</td>'
        + '<td class="value">' + value[0] + '</td>'
        + '<td class="unit">' + value[1] + '</td>'
        + '</tr>';
}

function get_result_window()
{
    return $('results');
}