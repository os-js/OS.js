/*!
 * OS.js - JavaScript Operating System
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
(function(WindowManager, GUI, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
      'Killing this process will stop things from working!' : 'Dreping av denne prosessen vil få konsekvenser!',
      'Open settings' : 'Åpne instillinger',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Ditt panel har ingen objekter. Gå til instillinger for å nullstille eller modifisere manuelt\n(Denne feilen kan oppstå etter en oppdatering av OS.js)',
      'Create shortcut' : 'Lag snarvei',
      'Set as wallpaper' : 'Sett som bakgrunn',
      'An error occured while creating PanelItem: {0}' : 'En feil oppstod under lasting av PanelItem: {0}',
      'Show Icons' : 'Vis Ikoner',
      'Hide Icons' : 'Skjul Ikoner',

      'Development' : 'Utvikling',
      'Education' : 'Utdanning',
      'Games' : 'Spill',
      'Graphics' : 'Grafikk',
      'Network' : 'Nettverk',
      'Multimedia' : 'Multimedia',
      'Office' : 'Kontor',
      'System' : 'System',
      'Utilities' : 'Verktøy',
      'Other' : 'Andre'
    },
    pl_PL : {
      'Open settings' : 'Otwórz ustawienia',
      'Create shortcut' : 'Utwórz skrót',
      'Set as wallpaper' : 'Ustaw jako tapetę',
      'An error occured while creating PanelItem: {0}' : 'Błąd podczas tworzenia panelu: {0}',

      'Development' : 'Development',
      'Education' : 'Edukacja',
      'Games' : 'Gry',
      'Graphics' : 'Grafika',
      'Network' : 'Sieć',
      'Multimedia' : 'Multimedia',
      'Office' : 'Biuro',
      'System' : 'System',
      'Utilities' : 'Dodatki',
      'Other' : 'Inne'
    },
    de_DE : {
      'Killing this process will stop things from working!' : 'Das Beenden dieses Prozesses wird Konsequenzen haben!',
      'Open settings' : 'Einstellungen öffnen',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Ihr Panel enthält keine Items. Öffnen Sie die Einstellungen um die Panel-Einstellungen zurückzusetzen oder manuell zu ändern (Dieser Fehler kann nach einem Upgrade von OS.js entstehen)',
      'Create shortcut' : 'Verknüpfung erstellen',
      'Set as wallpaper' : 'Als Hintergrund verwenden',
      'An error occured while creating PanelItem: {0}' : 'Während des Erstellens eines Panel-Items ist folgender Fehler aufgetreten: {0}',

      'Development' : 'Entwicklung',
      'Education' : 'Bildung',
      'Games' : 'Spiele',
      'Graphics' : 'Grafik',
      'Network' : 'Netzwerk',
      'Multimedia' : 'Multimedia',
      'Office' : 'Büro',
      'System' : 'System',
      'Utilities' : 'Zubehör',
      'Other' : 'Andere'
    },
    es_ES : {
      'Killing this process will stop things from working!' : '¡Forzar la terminación de este proceso hará que las cosas dejen de funcionar!',
      'Open settings': 'Abrir preferencias',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Tu panel no tiene elementos. Restablece los valores por defecto en las preferencias, o modifícalo manualmente\n(Este error puede aparecer tras una actualización de OS.js)',
      'Create shortcut': 'Crear acceso directo',
      'Set as wallpaper' : 'Seleccionar como fondo de pantalla',
      'An error occured while creating PanelItem: {0}' : 'Se produjo un error al crear el PanelItem: {0}',

      'Development' : 'Desarrollo',
      'Education' : 'Educación',
      'Games' : 'Juegos',
      'Graphics' : 'Gráficos',
      'Network' : 'Red',
      'Multimedia' : 'Multimedia',
      'Office' : 'Ofimática',
      'System' : 'Sistema',
      'Utilities' : 'Herramientas',
      'Other' : 'Otros'
    },
    fr_FR : {
      // TODO
    },
    ru_RU : {
      'Killing this process will stop things from working!' : 'Завершение этого процесса остановит работу системы!',
      'Open settings': 'Открыть настройки',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'На вашей панели отсутствуют элементы. Откройте настройки для сброса панели к начальному состоянию или ручной настройки\n(Эта ошибка может произойти после обновления OS.js)',
      'Create shortcut': 'Создать ярлык',
      'Set as wallpaper' : 'Установить как обои',
      'An error occured while creating PanelItem: {0}' : 'Произошла обшибка при создании PanelItem: {0}',

      'Development' : 'Разработка',
      'Education' : 'Образование',
      'Games' : 'Игры',
      'Graphics' : 'Графика',
      'Network' : 'Интернет',
      'Multimedia' : 'Мультимедиа',
      'Office' : 'Офис',
      'System' : 'Система',
      'Utilities' : 'Утилиты',
      'Other' : 'Другое'
    },
    nl_NL : {
      'Killing this process will stop things from working!' : 'Het stoppen van dit proces zal er voor zorgen dat dingen niet meer werken!',
      'Open settings' : 'Instellingen openen',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Het paneel bevat geen items. Ga naar instellingen om te hertsellen naar de standaard of om handmatig te wijzigen (Deze fout kan het gevolg zijn van een update)',
      'Create shortcut' : 'Maak een link',
      'Set as wallpaper' : 'Als achtegrond gebruiken',
      'An error occured while creating PanelItem: {0}' : 'Er is een fout opgetreden tijdens het maken van een paneel item: {0}',

      'Development' : 'Ontwikkeling',
      'Education' : 'Educatie',
      'Games' : 'Spellem',
      'Graphics' : 'Grafisch',
      'Network' : 'Netwerk',
      'Multimedia' : 'Multimedia',
      'Office' : 'Kantoor',
      'System' : 'Systeem',
      'Utilities' : 'Toebehoor',
      'Other' : 'Overig'
    },
    vi_VN : {
      'Killing this process will stop things from working!' : 'Đóng quá trình này sẽ làm mọi thứ bị tắt!',
      'Open settings' : 'Mở cài đặt',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Bảng điều khiển của bạn không có mục nào. Vào cài đặt để thiết lập lại mặc định hoặc sửa đổi bằng tay\n(Lỗi này có thể xảy ra sau khi nâng cấp OS.js)',
      'Create shortcut' : 'Tạo lối tắt',
      'Set as wallpaper' : 'Đặt làm hình nền',
      'An error occured while creating PanelItem: {0}' : 'Có lỗi xảy ra trong khi tạo PanelItem: {0}',
      'Show Icons' : 'Hiện các biểu tượng',
      'Hide Icons' : 'Ẩn các biểu tượng',

      'Development' : 'Phát triển',
      'Education' : 'Giáo dục',
      'Games' : 'Trò chơi',
      'Graphics' : 'Đồ họa',
      'Network' : 'Mạng',
      'Multimedia' : 'Đa phương tiện',
      'Office' : 'Văn phòng',
      'System' : 'Hệ thống',
      'Utilities' : 'Tiện ích',
      'Other' : 'Khác'
    },
    
    tr_TR : {
      'Open settings' : 'Ayarları Aç',
      'Create shortcut' : 'Kısayol Oluştur',
      'Set as wallpaper' : 'Arkaplan olarak ayarla',
      'An error occured while creating PanelItem: {0}' : '{0} oluşturulurken bir hata meydana geldi',

      'Development' : 'Geliştirici',
      'Education' : 'Eğitim',
      'Games' : 'Oyunlar',
      'Graphics' : 'Grafikler',
      'Network' : 'Ağ',
      'Multimedia' : 'Multimedia',
      'Office' : 'Ofis',
      'System' : 'Sistem',
      'Utilities' : 'Yan Gereksinimler',
      'Other' : 'Diğer'
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

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM._                 = _;

})(OSjs.Core.WindowManager, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
