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
      'Theme' : 'Tema',
      'Background' : 'Bakgrunn',
      'Desktop' : 'Skrivebord',
      'Background Type' : 'Bakgrunn type',
      'Image (Repeat)' : 'Bilde (Gjenta)',
      'Image (Centered)' : 'Bilde (Sentrert)',
      'Image (Fill)' : 'Bilde (Fyll)',
      'Image (Streched)' : 'Bilde (Strekk)',
      'Desktop Margin ({0}px)' : 'Skrivebord Margin ({0}px)',
      'Panel' : 'Panel',
      'Position' : 'Posisjon',
      'Ontop' : 'Topp',
      'Items' : 'Objekter',
      'Enable Animations' : 'Bruk animasjoner',
      'Language (requires restart)' : 'Språk (krever omstart)',
      'Enable Sounds' : 'Skru på lyder',
      'Enable Window Switcher' : 'Skru på Vindu-bytter',
      'Enable Hotkeys' : 'Skru på Hurtigtaster',
      'Enable Icon View' : 'Skru på Ikonvisning',
      'Remove shortcut' : 'Fjern snarvei',
      'General' : 'Generelt'
    },
    pl_PL : {
      'Theme' : 'Temat',
      'Background' : 'Tło',
      'Desktop' : 'Pulpit',
      'Background Type' : 'Typ Tła',
      'Image (Repeat)' : 'Powtarzający się',
      'Image (Centered)' : 'Wycentrowany',
      'Image (Fill)' : 'Wypełniony',
      'Image (Streched)' : 'Rozciągnięty',
      'Desktop Margin ({0}px)' : 'Margines Pulpitu ({0}px)',
      'Panel' : 'Panel',
      'Position' : 'Pozycja',
      'Ontop' : 'Na górze',
      'Items' : 'Obiekty',
      'Enable Animations' : 'Właczone Animacje',
      'Language (requires restart)' : 'Język (wymaga restart)',
      'Enable Sounds' : 'Włączone Dźwięki',
      'Enable Window Switcher' : 'Właczony Switcher Okien',
      'Enable Hotkeys' : 'Włączone Skróty Klawiaturowe',
      'Enable Icon View' : 'Właczony Widok Ikon',
      'Remove shortcut' : 'Usuwanie skrótu',
      'General' : 'Ogólne'
    },
    de_DE : {
      'Theme' : 'Thema',
      'Background' : 'Hintergrund',
      'Desktop' : 'Arbeitsoberflächen',
      'Background Type' : 'Hintergrundtyp',
      'Image (Repeat)' : 'Bild (Wiederholend)',
      'Image (Centered)' : 'Bild (Zentriert)',
      'Image (Fill)' : 'Bild (Ausgefüllt)',
      'Image (Streched)' : 'Bild (Gestreckt)',
      'Desktop Margin ({0}px)' : 'Arbeitsoberflächen Margin ({0}px)',
      'Panel' : 'Panel',
      'Position' : 'Position',
      'Ontop' : 'Vordergrund',
      'Items' : 'Items',
      'Enable Animations' : 'Animationen verwenden',
      'Language (requires restart)' : 'Sprache (benötigt Neustart)',
      'Enable Sounds' : 'Aktiviere Sounds',
      'Enable Window Switcher' : 'Aktiviere Fensterwechsler',
      'Enable Hotkeys' : 'Aktiviere Hotkeys',
      'Enable Icon View' : 'Aktiviere Icon-Ansicht',
      'General': 'General'
    },
    fr_FR : {
    },
    ru_RU : {
      'Theme' : 'Тема',
      'Background' : 'Фон',
      'Desktop' : 'Настройки',
      'Background Type' : 'Тип фона',
      'Image (Repeat)' : 'Изображение(повторяющееся)',
      'Image (Centered)' : 'Изображение(по центру)',
      'Image (Fill)' : 'Изображение(заполнить)',
      'Image (Streched)' : 'Изображение(растянуть)',
      'Desktop Margin ({0}px)' : 'Отсутуп рабочего стола ({0}px)',
      'Panel' : 'Панель',
      'Position' : 'Расположение',
      'Ontop' : 'Вверху',
      'Items' : 'Элементы',
      'Enable Animations' : 'Использовать анимацию',
      'TouchMenu' : 'Крупное меню',
      'Language (requires restart)' : 'Язык (необходим перезапуск)',
      'Enable Sounds' : 'Включить звук',
      'Enable Window Switcher' : 'Включить растягивание окон',
      'Enable Hotkeys' : 'Включить горячии клавиши',
      'Enable Icon View' : 'Включить ярлыки',
      'Icon View' : 'Ярлыки рабочего стола',
      'Invert Text Color' : 'Обратить цвет текста',
      'Autohide' : 'Автоматически скрывать',
      'Opacity' : 'Прозрачность',
      'General' : 'Основные',
      'Debug' : 'Отладка'
    },
    nl_NL : {
      'Theme' : 'Thema',
      'Background' : 'Achtergrond',
      'Desktop' : 'Buroblad',
      'Background Type' : 'Achtergrond soort',
      'Image (Repeat)' : 'Afbeelding (Herhalend)',
      'Image (Centered)' : 'Afbeelding (Gecentreerd)',
      'Image (Fill)' : 'Afbeelding (Passend)',
      'Image (Streched)' : 'Afbeelding (Gestreched)',
      'Desktop Margin ({0}px)' : 'Achtergrond kantlijn ({0}px)',
      'Panel' : 'Paneel',
      'Position' : 'Positie',
      'Ontop' : 'Voorgrond',
      'Items' : 'Items',
      'Enable Animations' : 'Animaties gebruiken',
      'Language (requires restart)' : 'Spraak (Herstarten)',
      'Enable Sounds' : 'Geluiden actief',
      'Enable Window Switcher' : 'Activeer venster wisselaar',
      'Enable Hotkeys' : 'Activeer hotkeys',
      'Enable Icon View' : 'Activeer Iconen-weergave',
      'General': 'Algemeen'
    },
    vi_VN : {
      'Theme' : 'Giao diện',
      'Background' : 'Ảnh nền',
      'Desktop' : 'Màn hình chính',
      'Background Type' : 'Kiểu nền',
      'Image (Repeat)' : 'Lặp lại',
      'Image (Centered)' : 'Căn giữa',
      'Image (Fill)' : 'Lấp đầy',
      'Image (Streched)' : 'Trải dài',
      'Desktop Margin ({0}px)' : 'Phần biên màn hình ({0}px)',
      'Panel' : 'Khung',
      'Position' : 'Vị trí',
      'Ontop' : 'Ở trên',
      'Items' : 'Các mục',
      'Enable Animations' : 'Bật hiệu ứng',
      'Language (requires restart)' : 'Ngôn ngữ (cần khởi động lại)',
      'Enable Sounds' : 'Bật âm thanh',
      'Enable Window Switcher' : 'Bật chuyển đổi cửa sổ',
      'Enable Hotkeys' : 'Bật phím nóng',
      'Enable Icon View' : 'Bật kiểu xem biểu tượng',
      'General': 'Tổng quát'
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
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings._ = _;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS);
