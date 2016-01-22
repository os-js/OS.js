/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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
  // jscs:disable validateQuoteMarks
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    bg_BG : {
      'Theme' : 'Тема',
      'Background' : 'Фон',
      'Desktop' : 'Работен плот',
      'Background Type' : 'Тип на фон',
      'Image (Repeat)' : 'Изображение (повтарящо се)',
      'Image (Centered)' : 'Изображение (Центрирано)',
      'Image (Fill)' : 'Изображение (Запълващо)',
      'Image (Streched)' : 'Изображение (Разтеглено)',
      'Desktop Margin ({0}px)' : 'Размер на работен плот ({0}px)',
      'Panel' : 'Панел',
      'Position' : 'Позиция',
      'Ontop' : 'Най-отгоре',
      'Items' : 'Обекти',
      'Enable Animations' : 'Разреши анимации',
      'Language (requires restart)' : 'Език (нуждае се от рестарт)',
      'Enable Sounds' : 'Включи звуци',
      'Enable Window Switcher' : 'Включи превключване на прозорци',
      'Enable Hotkeys' : 'Включи горещи клавиши',
      'Enable Icon View' : 'Включи иконен-изглед',
      'General': 'Основен'
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
    es_ES : {
      'Theme' : 'Tema',
      'Background' : 'Fondo',
      'Desktop' : 'Escritorio',
      'Background Type' : 'Tipo de fondo',
      'Image (Repeat)' : 'Imagen (Repetir)',
      'Image (Centered)' : 'Imagen (Centrada)',
      'Image (Fill)' : 'Imagen (Estirar)',
      'Image (Streched)' : 'Imagen (Ajustar)',
      'Desktop Margin ({0}px)' : 'Margen del escritorio ({0}px)',
      'Panel' : 'Panel',
      'Position' : 'Posición',
      'Ontop' : 'Primer plano',
      'Items' : 'Elementos',
      'Enable Animations' : 'Habilitar animaciones',
      'Language (requires restart)' : 'Idioma (requiere reiniciar)',
      'Enable Sounds' : 'Activar sonidos',
      'Enable Window Switcher' : 'Activar el alternador de ventanas',
      'Enable Hotkeys' : 'Activar Hotkeys',
      'Enable Icon View' : 'Activar la vista de icono',
      'General': 'General'
    },
    fr_FR : {
      'Theme' : 'Thème',
      'Background' : 'Fond d\'écran',
      'Desktop' : 'Bureau',
      'Background Type' : 'Type de fond d\'écran',
      'Image (Repeat)' : 'Image (Répéter)',
      'Image (Centered)' : 'Image (Centrer)',
      'Image (Fill)' : 'Image (Remplir)',
      'Image (Streched)' : 'Image (Étiré)',
      'Desktop Margin ({0}px)' : 'Marge du bureau ({0}px)',
      'Panel' : 'Pannel',
      'Position' : 'Position',
      'Ontop' : 'Premier plan',
      'Items' : 'Objets',
      'Enable Animations' : 'Activer les animations',
      'Language (requires restart)' : 'Langue (redémarrage requis)',
      'Enable Sounds' : 'Activer les sons',
      'Enable Window Switcher' : 'Activer Window Switcher',
      'Enable Hotkeys' : 'Activer les raccourcis clavier',
      'Enable Icon View' : 'Activer l\'affichage des icônes sur le bureau',
      'Remove shortcut' : 'Supprimer le raccourci',
      'General' : 'Général'
    },
    it_IT : {
      'Theme' : 'Tema',
      'Background' : 'Sfondo',
      'Desktop' : 'Scrivania',
      'Background Type' : 'Tipo di sfondo',
      'Image (Repeat)' : 'Immagine (Ripeti)',
      'Image (Centered)' : 'Immagine (Centrata)',
      'Image (Fill)' : 'Immagine (Riempi)',
      'Image (Streched)' : 'Immagine (Distorci)',
      'Desktop Margin ({0}px)' : 'Margini Scrivania ({0}px)',
      'Panel' : 'Panello',
      'Position' : 'Posizione',
      'Ontop' : 'In primo piano',
      'Items' : 'Elementi',
      'Enable Animations' : 'Abilità animazioni',
      'Language (requires restart)' : 'Lingua (necessità riavvio)',
      'Enable Sounds' : 'Abilita Suoni',
      'Enable Window Switcher' : 'Abilita Cambia-Finestre',
      'Enable Hotkeys' : 'Abilita Scorciatoie da tastiera',
      'Enable Icon View' : 'Abilita Visualizzazione ad icona',
      'Remove shortcut' : 'Rimuovi scorciatoia',
      'General' : 'Generale'
    },
    ko_KR : {
      'Theme' : '테마',
      'Background' : '바탕화면',
      'Desktop' : '데스크탑',
      'Background Type' : '바탕화면 타입',
      'Image (Repeat)' : '이미지 (반복)',
      'Image (Centered)' : '이미지 (가운데)',
      'Image (Fill)' : '이미지 (채우기)',
      'Image (Streched)' : '이미지 (늘이기)',
      'Desktop Margin ({0}px)' : '데스크탑 여백 ({0}px)',
      'Panel' : '패널',
      'Position' : '위치',
      'Ontop' : '상단바 자리 차지',
      'Items' : '항목',
      'Enable Animations' : '애니메이션 효과 켜기',
      'Language (requires restart)' : '언어 (재시작 필요)',
      'Enable Sounds' : '사운드 켜기',
      'Enable Window Switcher' : '윈도우 전환 활성',
      'Enable Hotkeys' : '단축키 활성',
      'Enable Icon View' : '아이콘 보이기',
      'General': '일반'
    },
    nl_NL : {
      'Theme' : 'Thema',
      'Background' : 'Achtergrond',
      'Desktop' : 'Bureaublad',
      'Background Type' : 'Achtergrondtype',
      'Image (Repeat)' : 'Afbeelding (Herhalend)',
      'Image (Centered)' : 'Afbeelding (Gecentreerd)',
      'Image (Fill)' : 'Afbeelding (Passend)',
      'Image (Streched)' : 'Afbeelding (Uitrekken)',
      'Desktop Margin ({0}px)' : 'Achtergrondmarge ({0}px)',
      'Panel' : 'Paneel',
      'Position' : 'Positie',
      'Ontop' : 'Voorgrond',
      'Items' : 'Items',
      'Enable Animations' : 'Animaties gebruiken',
      'Language (requires restart)' : 'Spraak (Herstarten vereist)',
      'Enable Sounds' : 'Geluiden actief',
      'Enable Window Switcher' : 'Activeer venster wisselaar',
      'Enable Hotkeys' : 'Activeer hotkeys',
      'Enable Icon View' : 'Activeer Iconen-weergave',
      'General': 'Algemeen'
    },
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
      'Desktop Corner Snapping ({0}px)' : 'Przyciąganie do Narożników Pulpitu ({0}px)',
      'Window Snapping ({0}px)' : 'Przyciąganie do Okien ({0}px)',
      'Panel' : 'Panel',
      'Position' : 'Pozycja',
      'Ontop' : 'Na wierzchu',
      'Items' : 'Elementy',
      'Sounds' : 'Dźwięki',
      'Icons' : 'Ikony',
      'Enable Animations' : 'Włączone Animacje',
      'Language (requires restart)' : 'Język (zmiana wymaga restartu)',
      'Enable Sounds' : 'Włączone Dźwięki',
      'Enable TouchMenu' : 'Włączone Menu Dotykowe',
      'Enable Window Switcher' : 'Właczony Zmieniacz Okien',
      'Enable Hotkeys' : 'Włączone Skróty Klawiaturowe',
      'Enable Icon View' : 'Włączone Pokazywanie Ikon',
      'Remove shortcut' : 'Usuwanie skrótu',
      'General' : 'Ogólne',
      'Debug' : 'Debugowanie',
      'File View': 'Widok Plików',
      'Show Hidden Files': 'Pokazuj Ukryte Pliki',
      'Show File Extensions': 'Pokazuj Rozszerzenia Plików',
      'File View Options': 'Opcje Widoku Plików',
      'Panels' : 'Panele',
      'Invert Text Color' : 'Odwróć Kolor Tekstu',
      'Autohide' : 'Automatyczne ukrywanie',
      'Information' : 'Informacje',
      'Locales' : 'Tłumaczenia',
      'Icon View' : 'Widok Ikon',
      'Opacity' : 'Przeźroczystość',
      'Appearance' : 'Wygląd',
      'Packages' : 'Pakiety',
      'Installed Packages' : 'Zainstalowane Pakiety',
      'App Store' : 'Sklep App',
      'Name' : 'Nazwa',
      'Username' : 'Nazwa konta',
      'Groups' : 'Grupy',
      'User' : 'Użytkownik',
      'Version' : 'Wersja',
      'Author' : 'Autor',
      'Hide' : 'Ukryj',
      'Application' : 'Aplikacja',
      'Scope' : 'Zasięg',
      'Save' : 'Zachowaj',
      'Regenerate metadata' : 'Zregeneruj metadane',
      'Install from zip' : 'Zainstaluj z pliku zip',
      'Refresh' : 'Odśwież',
      'Install selected' : 'Zainstaluj wybrane'
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
    sk_SK : {
      'Theme' : 'Téma',
      'Background' : 'Pozadie',
      'Desktop' : 'Pracovná plocha',
      'Background Type' : 'Typ pozadia',
      'Image (Repeat)' : 'Dlaždice',
      'Image (Centered)' : 'Na stred',
      'Image (Fill)' : 'Vyplniť',
      'Image (Streched)' : 'Roztiahnutý',
      'Desktop Margin ({0}px)' : 'Hranice pracovnej plochy ({0}px)',
      'Panel' : 'Panel',
      'Position' : 'Pozícia',
      'Ontop' : 'Vždy na vrchu',
      'Items' : 'Položky',
      'Enable Animations' : 'Povoliť animácie',
      'Language (requires restart)' : 'Jazyk (vyžaduje reštart)',
      'Enable Sounds' : 'Povoliť zvuky',
      'Enable Window Switcher' : 'Povoliť Prepínač Okien',
      'Enable Hotkeys' : 'Klávesové skratky',
      'Enable Icon View' : 'Ikony na ploche',
      'Remove shortcut' : 'Odstrániť skratku',
      'General' : 'Všeobecné'
    },
    tr_TR : {
      'Theme' : 'Tema',
      'Background' : 'arkaplan',
      'Desktop' : 'masaüstü',
      'Background Type' : 'arkaplan türü',
      'Image (Repeat)' : 'resim (tekrarla)',
      'Image (Centered)' : 'resm(ortala)',
      'Image (Fill)' : 'resm (kapla/doldur)',
      'Image (Streched)' : 'resm (uzat)',
      'Desktop Margin ({0}px)' : 'masaüstü kenar ({0}px)',
      'Panel' : 'Panel',
      'Position' : 'pozisyon',
      'Ontop' : 'en üst',
      'Items' : 'nesneler',
      'Enable Animations' : 'animasyonlar etkin',
      'Language (requires restart)' : 'Dil(yeniden başlatma gerektirir)',
      'Enable Sounds' : 'Müzik etkin',
      'Enable Window Switcher' : 'Ekran(pencere) değiştirme etkin',
      'Enable Hotkeys' : 'kısayol tuşları etkin',
      'Enable Icon View' : 'icon görünümü etkin',
      'Remove shortcut' : 'kısayolları kaldır',
      'General' : 'genel'
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
      'Remove shortcut' : 'Xóa lối tắt',
      'General': 'Tổng quát',
      'File View': 'Quản lí tệp',
      'Show Hidden Files': 'Hiện tập tin ẩn',
      'Show File Extensions': 'Hiện đuôi tập tin',
      'File View Options': 'Cài đặt quản lí tệp',
      'Panels' : 'Khung',
      'Autohide' : 'Tự động ẩn',
      'Information' : 'Thông tin',
      'Icon View' : 'Biểu tượng'
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
