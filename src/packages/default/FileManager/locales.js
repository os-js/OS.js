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
(function(Application, Window, GUI, Utils, API, VFS) {
  // jscs:disable validateQuoteMarks
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    bg_BG : {
      'Show Sidebar' : 'покажи страничен бар',
      'Copying file...' : 'Копиране на файл...',
      "Copying <span>{0}</span> to <span>{1}</span>" : "Копиране <span>{0}</span> към <span>{1}</span>",
      "Refreshing..." : "Опресняване...",
      "Loading..." : "Зареждане...",
      "Create a new directory in <span>{0}</span>" : "Създаване на нова директория в <span>{0}</span>",
      "Rename <span>{0}</span>" : "преименуване на <span>{0}</span>",
      "Delete <span>{0}</span> ?" : "Изтриване на <span>{0}</span>?"
    },
    de_DE : {
      'Show Sidebar' : 'Seitenleiste anzeigen',
      'Copying file...' : 'Kopiere Datei...',
      "Copying <span>{0}</span> to <span>{1}</span>" : "Kopiere <span>{0}</span> nach <span>{1}</span>",
      "Refreshing..." : "Aktualisiere...",
      "Loading..." : "Lade...",
      "Create a new directory in <span>{0}</span>" : "Erstelle ein neues Verzeichnis in <span>{0}</span>",
      "Rename <span>{0}</span>" : "<span>{0}</span> umbenennen",
      "Delete <span>{0}</span> ?" : "<span>{0}</span> löschen?"
    },
    fr_FR : {
      'Show Sidebar' : 'Afficher la barre de côté',
      'Copying file...' : 'Copie de fichier...',
      "Copying <span>{0}</span> to <span>{1}</span>" : "Copie de <span>{0}</span> à <span>{1}</span>",
      "Refreshing..." : "Rafraichissement...",
      "Loading..." : "Chargement...",
      "Create a new file in <span>{0}</span>" : "Créer un nouveau fichier dans <span>{0}</span>",
      "Create a new directory in <span>{0}</span>" : "Créer un nouveau dossier dans <span>{0}</span>",
      "Rename <span>{0}</span>" : "Renommer <span>{0}</span>",
      "Delete <span>{0}</span> ?" : "Supprimer <span>{0}</span> ?"
    },
    it_IT : {
      'Show Sidebar' : 'Mostra barra laterale',
      'Copying file...' : 'Copiamento file...',
      "Copying <span>{0}</span> to <span>{1}</span>" : "Copia <span>{0}</span> in <span>{1}</span>",
      "Refreshing..." : "Ricarica...",
      "Loading..." : "Caricamento...",
      "Create a new file in <span>{0}</span>" : "Creazione nuovo file in <span>{0}</span>",
      "Create a new directory in <span>{0}</span>" : "Creazione nuova cartella in <span>{0}</span>",
      "Rename <span>{0}</span>" : "Rinomina <span>{0}</span>",
      "Delete <span>{0}</span> ?" : "Cancella <span>{0}</span> ?"
    },
    ko_KR : {
      'Show Sidebar' : '사이드바 보여주기',
      'Copying file...' : '파일 복사...',
      "Copying <span>{0}</span> to <span>{1}</span>" : "Копирование <span>{0}</span> в <span>{1}</span>",
      "Refreshing..." : "새로고치는 중...",
      "Loading..." : "기다려주세요...",
      "Create a new directory in <span>{0}</span>" : "<span>{0}</span>에 새 폴더 만들기",
      "Rename <span>{0}</span>" : "<span>{0}</span>의 이름 바꾸기",
      "Delete <span>{0}</span> ?" : "<span>{0}</span>을 삭제하시겠습니까?",
      'Selected {0} files, {1} dirs, {2}' : '{0} 개의 파일, {1} 개의 디렉토리가 선택됨, {2}',
      'Showing {0} files ({1} hidden), {2} dirs, {3}' : '{0} 개의 파일({1} 개의 숨긴 파일), {2} 개의 디렉토리가 존재, {3}'
    },
    nl_NL : {
      'Show Sidebar' : 'Zijbar tonen',
      'Copying file...' : 'Bestand kopieren...',
      "Copying <span>{0}</span> to <span>{1}</span>" : "Kopieer <span>{0}</span> naar <span>{1}</span>",
      "Refreshing..." : "Aktualiseren...",
      "Loading..." : "Laden...",
      "Create a new directory in <span>{0}</span>" : "Maak een neiuwe map in <span>{0}</span>",
      "Rename <span>{0}</span>" : "<span>{0}</span> hernoemen",
      "Delete <span>{0}</span> ?" : "<span>{0}</span> verwijderen?"
    },
    no_NO : {
      'Show Sidebar' : 'Vis Sidebar',
      'Copying file...' : 'Kopierer fil...',
      "Copying <span>{0}</span> to <span>{1}</span>" : "Kopierer <span>{0}</span> to <span>{1}</span>",
      "Refreshing..." : "Gjenoppfrisker...",
      "Loading..." : "Laster...",
      "Create a new file in <span>{0}</span>" : "Opprett ny fil i <span>{0}</span>",
      "Create a new directory in <span>{0}</span>" : "Opprett ny mappe i <span>{0}</span>",
      "Rename <span>{0}</span>" : "Navngi <span>{0}</span>",
      "Delete <span>{0}</span> ?" : "Slette <span>{0}</span> ?"
    },
    pl_PL : {
      'Show Sidebar' : 'Pokaż pasek',
      'Copying file...' : 'Kopiowanie pliku...',
      "Copying <span>{0}</span> to <span>{1}</span>" : "Kopiowanie <span>{0}</span> do <span>{1}</span>",
      "Refreshing..." : "Odświeżanie...",
      "Loading..." : "Ładowanie...",
      "Create a new file in <span>{0}</span>" : "Utwórz nowy plik w <span>{0}</span>",
      "Create a new directory in <span>{0}</span>" : "Utwórz nowy folder w <span>{0}</span>",
      "Rename <span>{0}</span>" : "Zmień nazwę <span>{0}</span>",
      "Delete <span>{0}</span> ?" : "Usunąć <span>{0}</span> ?"
    },
    ru_RU : {
      'Show Sidebar' : 'Отобразить боковую панель',
      'Copying file...' : 'Копирование файла...',
      "Copying <span>{0}</span> to <span>{1}</span>" : "Копирование <span>{0}</span> в <span>{1}</span>",
      "Refreshing..." : "Обновление...",
      "Loading..." : "Загрузка...",
      "Create a new directory in <span>{0}</span>" : "Создать новый каталог в <span>{0}</span>",
      "Rename <span>{0}</span>" : "Переименовать <span>{0}</span>",
      "Delete <span>{0}</span> ?" : "Удалить <span>{0}</span> ?"
    },
    sk_SK : {
      'Show Sidebar' : 'Ukáž bočnú lištu',
      'Copying file...' : 'Kopírujem súbor...',
      "Copying <span>{0}</span> to <span>{1}</span>" : "Kopírujem <span>{0}</span> do <span>{1}</span>",
      "Refreshing..." : "Obnovujem...",
      "Loading..." : "Nahrávam...",
      "Create a new file in <span>{0}</span>" : "Vytvor nový súbor v <span>{0}</span>",
      "Create a new directory in <span>{0}</span>" : "Vytvor nový adresár v <span>{0}</span>",
      "Rename <span>{0}</span>" : "Premenuj <span>{0}</span>",
      "Delete <span>{0}</span> ?" : "Zmazať <span>{0}</span> ?"
    },
    tr_TR : {
      'Show Sidebar' : 'Kenar çubuğunu göster',
      'Copying file...' : 'kopyalanıyor...',
      "Copying <span>{0}</span> to <span>{1}</span>" : "<span>{0}</span> dosyası  <span>{1}</span>e kopyalanıyor",
      "Refreshing..." : "yenileniyor...",
      "Loading..." : "yükleniyor...",
      "Create a new directory in <span>{0}</span>" : " <span>{0}</span> içinde yeni bir klasör aç",
      "Rename <span>{0}</span>" : "yeniden adlandır <span>{0}</span>",
      "Delete <span>{0}</span> ?" : "sil <span>{0}</span>?"
    },
    vi_VN : {
      'Show Sidebar' : 'Hiện Sidebar',
      'Copying file...' : 'Đang sao chép...',
      "Copying <span>{0}</span> to <span>{1}</span>" : "Đang chép <span>{0}</span> tới <span>{1}</span>",
      "Refreshing..." : "Đang làm mới...",
      "Loading..." : "Đang tải...",
      "Create a new file in <span>{0}</span>" : "Tạo một tập tin mới trong <span>{0}</span>",
      "Create a new directory in <span>{0}</span>" : "Tạo một thư mục mới trong <span>{0}</span>",
      "Rename <span>{0}</span>" : "Đổi tên <span>{0}</span>",
      "Delete <span>{0}</span> ?" : "Xóa <span>{0}</span>?"
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
  OSjs.Applications.ApplicationFileManager = OSjs.Applications.ApplicationFileManager || {};
  OSjs.Applications.ApplicationFileManager._ = _;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
