import Color, {util} from "./color.js";
// More accurate color-difference formulae
// than the simple 1976 Euclidean distance in Lab

// CMC by the Color Measurement Committee of the
// Bradford Society of Dyeists and Colorsts, 1994.
// Uses LCH rather than Lab,
// with different weights for L, C and H differences
// A nice increase in accuracy for modest increase in complexity


Color.deltaEs["CMC"] = function (color, sample, {l = 2, c = 1}) {
	// Given this color as the reference
	// and a sample,
	// calculate deltaE CMC.

	// This implementation assumes the parametric
	// weighting factors l:c are 2:1
	//  which is typical for non-textile uses.

	let [L1, a1, b1] = color.lab;
	let C1 = color.chroma;
	let H1 = color.hue;
	let [L2, a2, b2] = sample.lab;
	let C2 = sample.chroma;
	// we don't need H2 as ΔH is calculated from Δa, Δb and ΔC
	// console.log({L1, a1, b1});
	// console.log({L2, a2, b2});

	// Lightness and Chroma differences
	// These are (color - sample), unlike deltaE2000
	let ΔL = L1 - L2;
	let ΔC = C1 - C2;
	// console.log({ΔL});
	// console.log({ΔC});

	let Δa = a1 - a2;
	let Δb = b1 - b2;
	// console.log({Δa});
	// console.log({Δb});

	// weighted Hue difference, less for larger Chroma difference
	const π = Math.PI;
	const d2r = π / 180;
	let H2 = (Δa ** 2) + (Δb ** 2) - (ΔC ** 2);
	// due to roundoff error it is possible that, for zero a and b,
	// ΔC > Δa + Δb is 0, resulting in attempting
	// to take the square root of a negative number

	// trying instead the equation from Industrial Color Physics
	// By Georg A. Klein

	// let ΔH = ((a1 * b2) - (a2 * b1)) / Math.sqrt(0.5 * ((C2 * C1) + (a2 * a1) + (b2 * b1)));
	// console.log({ΔH});
	// This gives the same result to 12 decimal places
	// except it sometimes NaNs when trying to root a negative number

	// let ΔH = Math.sqrt(H2); we never actually use the root, it gets squared again!!

	// positional corrections to the lack of uniformity of CIELAB
	// These are all trying to make JND ellipsoids more like spheres

	// SL Lightness crispening factor, depends entirely on L1 not L2
	let SL = 0.511;	// linear portion of the Y to L transfer function
	if (L1 >= 16) {	// cubic portion
		SL = (0.040975 * L1) / (1 + 0.01765 * L1);
	}
	// console.log({SL});

	// SC Chroma factor
	let SC = ((0.0638 * C1) / (1 + 0.0131 * C1)) + 0.638;
	// console.log({SC});

	// Cross term T for blue non-linearity
	let T;
	if ( Number.isNaN(H1)) {
		H1 = 0;
	}

	if (H1 >= 164 && H1 <= 345) {
		T = 0.56 + Math.abs(0.2 * Math.cos((H1 + 168) * d2r));
	} else {
		T = 0.36 + Math.abs(0.4 * Math.cos((H1 + 35) * d2r));
	}
	// console.log({T});

	// SH Hue factor also depends on C1,
	let C4 = Math.pow(C1, 4);
	let F = Math.sqrt(C4 / (C4 + 1900));
	let SH = SC * ((F * T) + 1 - F);
	// console.log({SH});

	// Finally calculate the deltaE, term by term as root sume of squares
	let dE = (ΔL / (l * SL)) ** 2;
	dE += (ΔC / (c * SC)) ** 2;
	dE += (H2 / (SH ** 2));
	// dE += (ΔH / SH)  ** 2;
	return Math.sqrt(dE);
	// Yay!!!
}