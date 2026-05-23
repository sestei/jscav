# jsCav - a linear cavity calculator

jsCav is a simple calculator for linear optical cavities written in javascript, which allows it to run in any modern web browser (also on mobile devices!).

You can run it [directly from github](http://sestei.github.io/jscav)!


## What does this calculate?

This is a simple calculator for linear optical resonators (cavities), i.e. for an optical system that looks like this:

<img src="lincav.png" width="280" height="100" />

If this doesn't look familiar to you, you probably won't need this calculator.
You will need to provide some basic optical and geometric properties of the cavity:

* _Power reflectivity_ (or transmission) of the two mirrors,
* _Radii of curvature_ (RoC) of the mirrors,
* The _separation_ between the two mirrors (assumed to be air, with index of refraction = 1),
* The operating _wavelength_.

From these inputs, the calculator will do some heavy thinking and then come up with these results:

* the _FSR_ (free spectral range), i.e. the frequency separation between two successive cavity resonances,
* the _finesse_ and the spectral _linewidth_ of each resonance, given as FWHM (full width at half maximum) and cavity pole (half width at half maximum),
* the _power-buildup_ inside the cavity,
* the _transmitted_ and _reflected_ power on resonance, in percent of the incident power,
* the cavity _g-factor product_, this product must be between 0 and 1 for a stable cavity, i.e. a cavity that supports a TEM<sub>00</sub> fundamental mode.

The above results are always calculated, even if the cavity is unstable. This is done for convenience: one can quickly play around with e.g. the mirror reflectivities to find a suitable finesse value, without caring about suitable RoCs. Of course, to also see those values in an experiment one would first of all have to make the cavity stable.

For a stable cavity, the following additional parameters will be calculated:

* the _round-trip Gouy phase_, which is the additional phase accumulated by a Gaussian beam, compared to a plane wave,
* the _mode spacing_ (in frequency space) between successive higher-order mode orders, e.g. how far the TEM<sub>01</sub> is separated from the TEM<sub>00</sub> mode,
* the _beam waist_, the 1/e<sup>2</sup> radius of the fundamental mode at its smallest point,
* the _waist position_, relative to mirror M<sub>1</sub>, where positive values are towards M<sub>2</sub>,
* the _spot sizes_ (1/e<sup>2</sup> radius) of the fundamental mode on the two mirrors,
* a _mode spectrum_ showing the _resonance locations_ of higher-order modes up to the given order N=m+n.

Note that the calculation assumes that all modes of Nth order (TEM<sub>mn</sub> where m+n=N) are degenerate. This is usually a good approximation as long as there is rotational symmetry within the cavity, e.g. the mirrors are non-astigmatic. **The height and intensity of the resonances just serves to visually distinguish them and should not be mistaken for a representation of the actual mode content.**


## How does it look like?

Like this:

<img src="jscav.png" width="400" />


## What do I need to run it?

Just a relatively recent version of one of the standard web browsers with JavaScript enabled. Should run fine on your mobile phone, too.

You can run the calculator [directly from github](http://sestei.github.com/jscav). As the calculation runs entirely within the web browser on your computer, an active internet connection should not be necessary after you have loaded the page. Alternatively, you can simply copy all files to a directory of your choice and
then open the `index.html` in your favourite web browser.

## What if I get wrong results?
Whoops :-( Would you please [file a bug report](https://github.com/sestei/jscav/issues) detailing the parameters you used and what went wrong?

## License

This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.

----
2016-2026, S. Steinlechner
