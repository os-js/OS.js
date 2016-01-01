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
(function(Application, Window, GUI, Dialogs, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
      'Playlist' : 'Spilleliste',
      'Playback aborted' : 'Avspilling avbrutt',
      'Network or communication error' : 'Nettverks- eller kommunikasjonsfeil',
      'Decoding failed. Corruption or unsupported media' : 'Dekoding feilet. Korrupt eller ustøttet media',
      'Media source not supported' : 'Media-kilde ikke støttet',
      'Failed to play file' : 'Klarte ikke spille av fil',
      'Artist' : 'Artist',
      'Album' : 'Album',
      'Track' : 'Låt',
      'Time' : 'Tid',
      'Media information query failed' : 'Media-informasjon forespursel feil',
      'seek unavailable in format' : 'spoling utilgjenglig i format',
      'The audio type is not supported: {0}' : 'Denne lyd-typen er ikke støttet: {0}',
    },
    pl_PL : {
      'Playlist' : 'Playlista',
      'Playback aborted' : 'Odtwarzanie Przerwane',
      'Network or communication error' : 'Błąd Sieci lub Komunikacji',
      'Decoding failed. Corruption or unsupported media' : 'Dekodowanie nie powiodło się. Uszkodzony lub nieobsługiwany plik',
      'Media source not supported' : 'Plik nie jest wspierany',
      'Failed to play file' : 'Nie można odtworzyć pliku',
      'Artist' : 'Artysta',
      'Album' : 'Album',
      'Track' : 'Ścieżka',
      'Time' : 'Czas',
      'Media information query failed' : 'Brak informacji',
      'seek unavailable in format' : 'Przewijanie nie jest obsługiwane w tym formacie',
      'The audio type is not supported: {0}' : 'Ten typ audio nie jest obsługiwany: {0}',
    },
    de_DE : {
      'Playlist' : 'Wiedergabeliste',
      'Playback aborted' : 'Wiedergabe abgebrochen',
      'Network or communication error' : 'Netzwerk Kommunikationsfehler',
      'Decoding failed. Corruption or unsupported media' : 'Dekodierung gescheitert. Fehlerhafte oder nicht unterstützte Datei',
      'Media source not supported' : 'Medienquelle nicht unterstützt',
      'Failed to play file' : 'Wiedergabe der Datei gescheitert',
      'Artist' : 'Künstler',
      'Album' : 'Album',
      'Track' : 'Titel',
      'Time' : 'Zeit',
      'Media information query failed' : 'Media Informationssuche gescheitert',
      'seek unavailable in format' : 'Spulen im Format nicht verfügbar',
      'The audio type is not supported: {0}' : 'Der Audio-Typ {0} ist nicht unterstützt',
    },
    es_ES : {
      'Playlist' : 'Lista de reproducción',
      'Playback aborted' : 'Playback anulado',
      'Network or communication error' : 'Error de red o de comunicación',
      'Decoding failed. Corruption or unsupported media' : 'Fallo en el desentrelazado. Medio corrupto o no soportado',
      'Media source not supported' : 'Medio no soportado',
      'Failed to play file' : 'Error reproduciendo archivo',
      'Artist' : 'Artista',
      'Album' : 'Album',
      'Track' : 'Pista',
      'Time' : 'Tiempo',
      'Media information query failed' : 'Error recupersqndo información del medio',
      'seek unavailable in format' : 'búsqueda no disponible en este formato',
      'The audio type is not supported: {0}' : 'El tipo de audio no está soportado: {0}',
    },
    fr_FR : {
    },
    ru_RU : {
      'Playlist' : 'Список воспроизведения',
      'Playback aborted' : 'Воспроизведение прервано',
      'Network or communication error' : 'Ошибка соединения',
      'Decoding failed. Corruption or unsupported media' : 'Не удалось декодировать файл. Файл поврежден или данынй формат не поддерживается',
      'Media source not supported' : 'Медиа этого типа не поддерживается',
      'Failed to play file' : 'Ошибка воспроизведения',
      'Artist' : 'Артист',
      'Album' : 'Альбом',
      'Track' : 'Трек',
      'Time' : 'Время',
      'Media information query failed' : 'Ошибка в запросе медиа-информации',
      'seek unavailable in format' : 'Перемотка недоступна в этом формате',
      'The audio type is not supported: {0}' : 'Тип аудио не поддерживается: {0}'
    },
    nl_NL : {
      'Playlist' : 'Afspeel lijst',
      'Playback aborted' : 'Spelen onderbroken',
      'Network or communication error' : 'Netwerk communicatie fout',
      'Decoding failed. Corruption or unsupported media' : 'Dekoderen lukt niet: bestandstype wordt niet ondersteund',
      'Media source not supported' : 'Media bron wordt niet ondersteund',
      'Failed to play file' : 'Afspelen lukt niet',
      'Artist' : 'Artiest',
      'Album' : 'Album',
      'Track' : 'Naam',
      'Time' : 'Tijd',
      'Media information query failed' : 'Zoeken naar media is niet gelukt',
      'seek unavailable in format' : 'Voor/acteruit spoelen is niet beschikbaar in dit formaat',
      'The audio type is not supported: {0}' : 'Audio type {0} wordt niet ondersteund',
    },
    vi_VN : {
      'Playlist' : 'Danh sách phát',
      'Playback aborted' : 'Phát lại bị hủy',
      'Network or communication error' : 'Mạng lưới hoặc thông tin liên lạc bị lỗi',
      'Decoding failed. Corruption or unsupported media' : 'Giải mã thất bại. Phương tiện truyền thông bị hỏng hoặc không được hỗ trợ',
      'Media source not supported' : 'Nguồn phương tiện không được hỗ trợ',
      'Failed to play file' : 'Không thể chơi tập tin',
      'Artist' : 'Ca sĩ',
      'Album' : 'Album',
      'Track' : 'Bài hát',
      'Time' : 'Thời gian',
      'Media information query failed' : 'Truy vấn phương tiện thông tin thất bại',
      'seek unavailable in format' : 'không tua được trong định dạng này',
      'The audio type is not supported: {0}' : 'Loại âm thanh {0} không được hỗ trợ',
    },
        tr_TR : {

      'Playlist' : 'Oynatma listesi',
      'Playback aborted' : 'kayıt çalma/dinleme durduruldu',
      'Network or communication error' : 'ağ veya iletişim hatası',
      'Decoding failed. Corruption or unsupported media' : 'çözümleme hatası. Bozuk veya çalışmıyor.',
      'Media source not supported' : 'medya kaynağı bulunamadı',
      'Failed to play file' : 'Oynatma hatası',
      'Artist' : 'Artist',
      'Album' : 'Album',
      'Track' : 'Parça',
      'Time' : 'zaman',
      'Media information query failed' : 'medya bilgisini elde etmede hata oluştu',
      'seek unavailable in format' : 'bu formatta ileri saramazsınız',
      'The audio type is not supported: {0}' : 'Bu format desteklenmiyor: {0}',
    }
  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return OSjs.API.__.apply(this, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationMusicPlayer = OSjs.Applications.ApplicationMusicPlayer || {};
  OSjs.Applications.ApplicationMusicPlayer._ = _;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.VFS);
