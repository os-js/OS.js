/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

/**
 * Convert HEX to RGB
 *
 * @param   {String}      hex     The hex string (with #)
 *
 * @return  {Object}              RGB in form of r, g, b
 */
export function convertToRGB(hex) {
  const rgb = parseInt(hex.replace('#', ''), 16);
  const val = {};
  val.r = (rgb & (255 << 16)) >> 16;
  val.g = (rgb & (255 << 8)) >> 8;
  val.b = (rgb & 255);
  return val;
}

/**
 * Convert RGB to HEX
 *
 * @param   {Number|Object}    r         Red value or RGB object
 * @param   {Number|undefined} [g]       Green value
 * @param   {Number|undefined} [b]       Blue value
 *
 * @return  {String}              Hex string (with #)
 */
export function convertToHEX(r, g, b) {
  if ( typeof r === 'object' ) {
    g = r.g;
    b = r.b;
    r = r.r;
  }

  if ( typeof r === 'undefined' || typeof g === 'undefined' || typeof b === 'undefined' ) {
    throw new Error('Invalid RGB supplied to convertToHEX()');
  }

  const hex = [
    parseInt(r, 10).toString( 16 ),
    parseInt(g, 10).toString( 16 ),
    parseInt(b, 10).toString( 16 )
  ];

  Object.keys(hex).forEach((i) => {
    if ( hex[i].length === 1 ) {
      hex[i] = '0' + hex[i];
    }
  });

  return '#' + hex.join('').toUpperCase();
}

/**
 * Ivert HEX color
 * @link http://stackoverflow.com/a/9601429/1236086
 *
 * @param   {String}      hex     Hex string (With #)
 *
 * @return  {String}              Inverted hex (With #)
 *
 */
export function invertHEX(hex) {
  let color = parseInt(hex.replace('#', ''), 16);
  color = 0xFFFFFF ^ color;
  color = color.toString(16);
  color = ('000000' + color).slice(-6);
  return '#' + color;
}
