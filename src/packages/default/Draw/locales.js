/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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
(function(Application, Window, GUI, Dialogs, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
      'Toggle tools toolbar' : 'Svitsj verktøylinje',
      'Toggle layers toolbar' : 'Svitsj lag-verktøylinje',
      'Layer' : 'Lag',
      'Effect' : 'Effekt',
      'Flip Horizontally' : 'Flipp Horisontalt',
      'Flip Vertically' : 'Flipp Vertikalt',
      'Foreground' : 'Forgrunn',
      'Bakgrunn' : 'Bakgrunn',
      'Foreground (Fill) Color' : 'Forgrunn (Fyll) Farge',
      'Background (Stroke) Color' : 'Bakgrunn (Strøk) Farge',
      'Line Join' : 'Linje Knytting',
      'Line Width' : 'Linje Bredde',
      'Toggle Stroke' : 'Svitsj strøk',
      'Enable stroke' : 'Skru på strøk',
      'Round' : 'Rund',
      'Miter' : 'Skjev',
      'Bevel' : 'Kantet',
      'Stroked' : 'Strøk På',
      'No stroke' : 'Strøk Av',

      'Pointer' : 'Peker',
      'Move active layer' : 'Flytt aktivt lag',

      'Picker' : 'Plukker',
      'LMB: set fg color, RMB: set gb color' : 'LMB: sett bg farge, RMB: sett fg farge',

      'Pencil' : 'Penn',
      'LMB/RMB: Draw with fg/bg color' : 'LMB/RMB: Tegn med fg/bg farge',
      'Path' : 'Sti',

      'Square/Rectangle' : 'Firkant/Rektangel',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw rectangle' : 'LMB/RMB: Tegn med fg/bg farge, SHIFT: Tegn rektangel',

      'Circle/Ellipse' : 'Sirkel/Ellipse',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw ellipse' : 'LMB/RMB: Tegn med fg/bg farge, SHIFT: Tegn ellipse',

      'Blur' : 'Klatte (Blur)',
      'Noise' : 'Støy',
      'Invert colors' : 'Inverter farger',
      'Grayscale' : 'Gråskala',
      'Sharpen' : 'Skarpgjør',
      'Simple Blur' : 'Simpel Klatte (Blur)',

      'Radius' : 'Radius',
      'Iterations' : 'Itereringer'
    },
    pl_PL : {
      'Toggle tools toolbar' : 'Przełącz Pasek narzędzi',
      'Toggle layers toolbar' : 'Przełącz Pasek warstw',
      'Layer' : 'Warstwy',
      'Effect' : 'Efekty',
      'Flip Horizontally' : 'Przerzuć w poziomie',
      'Flip Vertically' : 'Przerzuć w pionie',
      'Foreground' : 'Pierwszy plan',
      'Bakgrunn' : 'Bakgrunn',

      'Pointer' : 'Wskaźnik',
      'Move active layer' : 'Przenieś aktywne warstwy',

      'Picker' : 'Wybór',
      'LMB: set fg color, RMB: set gb color' : 'LMB: Wstaw kolor bg, RMB: ustaw kolor fg',

      'Pencil' : 'Ołówek',
      'LMB/RMB: Draw with fg/bg color' : 'Maluj w kolorze fg/bg',
      'Path' : 'Ścieżka',

      'Square/Rectangle' : 'Kwadratowe / prostokątne',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw rectangle' : 'LMB/RMB: Maluj w kolorze fb/bg, SHIFT: Narysuj prostokąt',

      'Circle/Ellipse' : 'Koło / Elipsa',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw ellipse' : 'LMB/RMB: Maluj w kolorze fb/bg, SHIFT: Narysuj elipse',

      'Blur' : 'Blur',
      'Noise' : 'Szum',
      'Invert colors' : 'Odwróc kolory',
      'Grayscale' : 'Skala szaroścu',
      'Sharpen' : 'Zaostrzone',
      'Simple Blur' : 'Łatwy Blur',

      'Radius' : 'Promień',
      'Iterations' : 'Powtórzenia'
    },
    de_DE : {
      'Toggle tools toolbar' : 'Tools Toolbar',
      'Toggle layers toolbar' : 'Ebenen Toolbar',
      'Layer' : 'Ebene',
      'Effect' : 'Effekt',
      'Flip Horizontally' : 'Horizontal spiegeln',
      'Flip Vertically' : 'Vertikal spiegeln',
      'Foreground' : 'Vordergrund',
      'Bakgrunn' : 'Hintergrund',
      'Foreground (Fill) Color' : 'Vordergrund (Füll-) Farbe',
      'Background (Stroke) Color' : 'Hintergrund (Streich-) Farbe',
      'Line Join' : 'Linienverbindung',
      'Line Width' : 'Linienbreite',
      'Toggle Stroke' : 'Streichen',
      'Enable stroke' : 'Streichen aktivieren',
      'Round' : 'Runde',
      'Miter' : 'Live',
      'Bevel' : 'Schräge',
      'Stroked' : 'Gestrichen',
      'No stroke' : 'Nicht gestrichen',

      'Pointer' : 'Zeiger',
      'Move active layer' : 'Bewege aktive Ebene',

      'Picker' : 'Wähler',
      'LMB: set fg color, RMB: set gb color' : 'LMB: wähle Vordergrundfarbe, RMB: wähle Hintergrundfarbe',

      'Pencil' : 'Stift',
      'LMB/RMB: Draw with fg/bg color' : 'LMB/RMB: Zeichnen mit fg/bg Farbe',
      'Path' : 'Pfad',
        
      'Square/Rectangle' : 'Quadrat/Rechteck',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw rectangle' : 'LMB/RMB: Zeichnen mit fb/bg Farbe, SHIFT: Rechteck zeichnen',
        
      'Circle/Ellipse' : 'Kreis/Ellipse',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw ellipse' : 'LMB/RMB: Zeichnen mit fb/bg Farbe, SHIFT: Ellipse zeichnen',
      
      'Blur' : 'Weichzeichner (Blur)',
      'Noise' : 'Rauschen',
      'Invert colors' : 'Farben invertieren',
      'Grayscale' : 'Graustufen',
      'Sharpen' : 'Schärfen',
      'Simple Blur' : 'Einfacher Weichzeichner (Blur)',

      'Radius' : 'Radius',
      'Iterations' : 'Iterationen'
    },
    fr_FR : {
    },
    ru_RU : {
      'Toggle tools toolbar' : 'Панель инструментов',
      'Toggle layers toolbar' : 'Панель слоев',
      'Layer' : 'Слой',
      'Effect' : 'Эффекты',
      'Flip Horizontally' : 'Отразить горизонтально',
      'Flip Vertically' : 'Отразить вертикально',
      'Foreground' : 'Передний план',
      'Bakgrunn' : 'Фон',
      'Foreground (Fill) Color' : 'Передний план (Заливка) цвет',
      'Background (Stroke) Color' : 'Фоновый (Обводка) цвет',
      'Line Join' : 'Замкнутая линия',
      'Line Width' : 'Ширина линии',
      'Toggle Stroke' : 'Вкл/выкл обводку',
      'Enable stroke' : 'Включить обводку',
      'Round' : 'Закругленный',
      'Miter' : 'Прямой',
      'Bevel' : 'Скошенный',
      'Stroked' : 'С обводкой',
      'No stroke' : 'Без обводки',

      'Pointer' : 'Указатель',
      'Move active layer' : 'Перемещает активный слой',

      'Picker' : 'Пипетка',
      'LMB: set fg color, RMB: set gb color' : 'ЛКМ: устананавливает первичный цвет, ПКМ: устанавливает вторичный(фоновый) цвет',

      'Pencil' : 'Карандаш',
      'LMB/RMB: Draw with fg/bg color' : 'ЛКМ/ПКМ: Рисует первичным/вторичным цветом',
      'Path' : 'Прямая',

      'Square/Rectangle' : 'Квадрат/Прямоугольник',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw rectangle' : 'ЛКМ/ПКМ: рисует первичным/вторичным цветом квадрат, SHIFT: нарисовать прямоуголник',

      'Circle/Ellipse' : 'Круг/Эллипс',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw ellipse' : 'ЛКМ/ПКМ: рисует первичным/вторичным цветом круг, SHIFT: нарисовать эллипс',

      'Blur' : 'Размытие (Blur)',
      'Noise' : 'Шум',
      'Invert colors' : 'Инвертировать цвета',
      'Grayscale' : 'Обесцветить',
      'Sharpen' : 'Сточить',
      'Simple Blur' : 'Простое размытие (Blur)',

      'Radius' : 'Радиус',
      'Iterations' : 'Итерации'
    },
  	nl_NL : {
      'Toggle tools toolbar' : 'Toolbar gereedschappen',
      'Toggle layers toolbar' : 'Toolbar lagen',
      'Layer' : 'Laag',
      'Effect' : 'Effekten',
      'Flip Horizontally' : 'Horizontaal spiegelen',
      'Flip Vertically' : 'Vertikaal spiegelen',
      'Foreground' : 'Voorgrond',
      'Bakgrunn' : 'Achtergrond',
      'Foreground (Fill) Color' : 'Voorgrond (vul) kleur',
      'Background (Stroke) Color' : 'Achtergrond (penseel-) kleur',
      'Line Join' : 'Lijnverbinding',
      'Line Width' : 'Lijnbreedte',
      'Toggle Stroke' : 'Penseel streek',
      'Enable stroke' : 'Penseel aktiveren',
      'Round' : 'Rond',
      'Miter' : 'Live',
      'Bevel' : 'Schuin',
      'Stroked' : 'Gestreken',
      'No stroke' : 'Geen penseel streken',

      'Pointer' : 'Aanwijzer',
      'Move active layer' : 'Verplaats de aktieve laag',

      'Picker' : 'Kiezer',
      'LMB: set fg color, RMB: set gb color' : 'LMB: Kies voorgrond-kleur, RMB: Kies achtergrondkleur',

      'Pencil' : 'Penseel',
      'LMB/RMB: Draw with fg/bg color' : 'LMB/RMB: Teken met voor- en achtergrondkleur',
      'Path' : 'Pfad',
        
      'Square/Rectangle' : 'Vierkant/rechthoek',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw rectangle' : 'LMB/RMB: Teken met voor- en achtergrondkleur, SHIFT: Rechnthoek tekenen',
        
      'Circle/Ellipse' : 'Cirkel/elipse',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw ellipse' : 'LMB/RMB: Teken met voor- en achtergrondkleur, SHIFT: Elipse tekenen',
      
      'Blur' : 'Vager maken (Blur)',
      'Noise' : 'Ruis',
      'Invert colors' : 'Kleuren inverteren',
      'Grayscale' : 'Grijstinten',
      'Sharpen' : 'Scherper',
      'Simple Blur' : 'Eenvoudig vager maken (Blur)',

      'Radius' : 'Radius',
      'Iterations' : 'Doorgangen'
    }

  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return API.__.apply(this, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationDraw = OSjs.Applications.ApplicationDraw || {};
  OSjs.Applications.ApplicationDraw._ = _;

})(OSjs.Helpers.DefaultApplication, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS);
