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
      'Toggle tools toolbar' : 'Бар с инструменти',
      'Toggle layers toolbar' : 'Бар с слоеве',
      'Layer' : 'Слой',
      'Effect' : 'Ефект',
      'Flip Horizontally' : 'Обърни хоризонтално',
      'Flip Vertically' : 'Обърни вертикално',
      'Foreground' : 'Преден фон',
      'Bakgrunn' : 'Заден фон',
      'Foreground (Fill) Color' : 'Преден фон (Запълни) цвят',
      'Background (Stroke) Color' : 'Заден фон цвят',
      'Line join' : 'Съединяване на линии',
      'Line width' : 'Широчина на линия',
      'Toggle Stroke' : 'Превключване на удър',
      'Enable stroke' : 'Включи удър',
      'Round' : 'Кръгъл',
      'Miter' : 'Митра',
      'Bevel' : 'Откос',
      'Stroked' : 'Ударен',
      'No stroke' : 'Без удър',

      'Pointer' : 'Стрелка',
      'Move active layer' : 'Премести активен слой',

      'Picker' : 'берач',
      'LMB: Pick foreground-, RMB: Pick background color' : 'LMB: изберете цвят за преден план, RMB: изберете цвят за фон',

      'Pencil' : 'Молив',
      'LMB/RMB: Draw with fg/bg color' : 'LMB/RMB: рисувай с fg/bg цвят',
      'Path' : 'Път',

      'Square/Rectangle' : 'Квадрат/Правоъгъкник',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw rectangle' : 'LMB/RMB: рисувай с fb/bg цвят, SHIFT: нарисувай правоъгълник',

      'Circle/Ellipse' : 'Кръг/Елипса',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw ellipse' : 'LMB/RMB: рисувай с fb/bg цвят, SHIFT: нарисувай елипса',

      'Blur' : 'Замъгли',
      'Noise' : 'Шум',
      'Invert colors' : 'Инвертирай цветове',
      'Grayscale' : 'Черно-бяло',
      'Sharpen' : 'Острота',
      'Simple Blur' : 'Опростено замъгляване',

      'Radius' : 'Радиус',
      'Iterations' : 'Повторения'
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
      'Line join' : 'Linienverbindung',
      'Line width' : 'Linienbreite',
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
      'LMB: Pick foreground-, RMB: Pick background color' : 'LMB: wähle Vordergrundfarbe, RMB: wähle Hintergrundfarbe',

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
    es_ES : {
      'Toggle tools toolbar' : 'Mostrar/ocultar la barra de herramientas de utilidades',
      'Toggle layers toolbar' : 'Mostrar/ocultar la barra de herramientas de capas',
      'Layer' : 'Capa',
      'Effect' : 'Efecto',
      'Flip Horizontally' : 'Girar horizontalmente',
      'Flip Vertically' : 'Girar verticalmente',
      'Foreground' : 'Primer plano',
      'Bakgrunn' : 'Fondo',
      'Foreground (Fill) Color' : 'Color de primer plano (relleno)',
      'Background (Stroke) Color' : 'Color de de fondo (contorno)',
      'Line join' : 'Terminación de línea',
      'Line width' : 'Ancho de línea',
      'Toggle Stroke' : 'Activar/Desactivar trazado',
      'Enable stroke' : 'Activar trazado',
      'Round' : 'Curvo',
      'Miter' : 'En ángulo',
      'Bevel' : 'Biselado',
      'Stroked' : 'Trazado',
      'No stroke' : 'Sin trazado',

      'Pointer' : 'Puntero',
      'Move active layer' : 'Mover la capa activa',

      'Picker' : 'Selector',
      'LMB: Pick foreground-, RMB: Pick background color' : 'LMB: Establecer el color de primer plano, RMB: Establecer el color de fondo',

      'Pencil' : 'Lápiz',
      'LMB/RMB: Draw with fg/bg color' : 'LMB/RMB: Dibujar con el color de fondo/de primer plano',
      'Path' : 'Ruta',

      'Square/Rectangle' : 'Cuadrado/Rectángulo',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw rectangle' : 'LMB/RMB: Zeichnen mit fb/bg Farbe, SHIFT: Rechteck zeichnen',

      'Circle/Ellipse' : 'Kreis/Ellipse',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw ellipse' : 'LMB/RMB: Dibujar con el color de fondo/de primer plano, SHIFT: Dibujar una elipse',

      'Blur' : 'Desenfoque',
      'Noise' : 'Ruido',
      'Invert colors' : 'Invertir colores',
      'Grayscale' : 'Escala de grises',
      'Sharpen' : 'Afilar',
      'Simple Blur' : 'Desenfoque simple',

      'Radius' : 'Radio',
      'Iterations' : 'Iteraciones'
    },
    fr_FR : {
      'Toggle tools toolbar' : 'Afficher la barre d\'outils',
      'Toggle layers toolbar' : 'Afficher la barre des calques',
      'Layer' : 'Calque',
      'Effect' : 'Effet',
      'Flip Horizontally' : 'Pivoter horizontalement',
      'Flip Vertically' : 'Pivoter verticalement',
      'Foreground' : 'Avant-plan',
      'Background' : 'Arrière-plan',
      'Foreground (Fill) Color' : 'Couleur de l\'avant-plan (remplissage)',
      'Background (Stroke) Color' : 'Couleur de l\'arrière-plan (trait)',
      'Line join' : 'Jointure',
      'Line width' : 'Taille de la ligne',
      'Toggle Stroke' : 'Afficher les traits',
      'Enable stroke' : 'Activer les traits',
      'Round' : 'Arrondi',
      'Miter' : 'Pointu',
      'Bevel' : 'Biseauté',
      'Stroked' : 'Barré',
      'No stroke' : 'Non barré',

      'Pointer' : 'Pointeur',
      'Move active layer' : 'Déplacer le calque actif',

      'Picker' : 'Sélecteur',
      'LMB: Pick foreground-, RMB: Pick background color' : 'Clic gauche: sélectionne la couleur de l\'avant-plan, clic droit: sélectionne la couleur de l\'arrière-plan',

      'Pencil' : 'Pinceau',
      'LMB: Use foreground-, RMB: Use background color' : 'Clic gauche: utilise la couleur d\'avant-plan, clic droit : utilise la couleur d\'arrière-plan',
      'Path' : 'Chemin',

      'Square/Rectangle' : 'Carré/Rectangle',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle rectangle/square mode' : 'Clic gauche: utilise la couleur d\'avant-plan, clic droit: utilise la couleur d\'arrière-plan, SHIFT: affiche le mode rectangle',

      'Circle/Ellipse' : 'Cercle/Ellipse',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle circle/ellipse mode' : 'Clic gauche: utilise la couleur d\'avant-plan, clic droit: utilise la couleur d\'arrière-plan, SHIFT: affiche le mode ellipse',

      'LMB: Fill with foreground-, RMB: Fill with background color': 'Clic gauche: remplir avec la couleur d\'avant-plan, clic droit: remplir avec la couleur d\'arrière-plan',
      'Set foreground color': 'Définir la couleur d\'avant-plan',
      'Set background color': 'Définir la couleur d\'arrière-plan',

      'Blur' : 'Flou',
      'Noise' : 'Bruit',
      'Invert colors' : 'Inverser les couleurs',
      'Grayscale' : 'Niveau de gris',
      'Sharpen' : 'Netteté',
      'Simple Blur' : 'Flou simple',

      'Radius' : 'Rayon',
      'Iterations' : 'Itérations'
    },
    it_IT : {
      'Toggle tools toolbar' : 'Mostra la barra strumenti',
      'Toggle layers toolbar' : 'Mostra la barra dei livelli',
      'Layer' : 'Livello',
      'Effect' : 'Effetto',
      'Flip Horizontally' : 'Specchia orizzontalmente',
      'Flip Vertically' : 'Specchia verticalmente',
      'Foreground' : 'Primopiano',
      'Background' : 'Sfondo',
      'Foreground (Fill) Color' : 'Colore in primopiano (Riempimento)',
      'Background (Stroke) Color' : 'Colore di sfondo (Tracciato)',
      'Line join' : 'Congiungi linea',
      'Line width' : 'Lunghezza linea',
      'Toggle Stroke' : 'Mostra tracciato',
      'Enable stroke' : 'Abilita tracciato',
      'Round' : 'Arrotonda',
      'Miter' : 'Miter',
      'Bevel' : 'Smussatura',
      'Stroked' : 'Tracciato',
      'No stroke' : 'Nessun tracciato',

      'Pointer' : 'Puntatore',
      'Move active layer' : 'Sposta livello attivo',

      'Picker' : 'Selettore',
      'LMB: Pick foreground-, RMB: Pick background color' : 'LMB: Imposta colore primopiano, RMB: Imposta colore di sfondo',

      'Pencil' : 'Matita',
      'LMB/RMB: Draw with fg/bg color' : 'LMB/RMB: Disegna con colori fg/bg',
      'Path' : 'Percorso',

      'Square/Rectangle' : 'Quadrato/Rettangolo',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw rectangle' : 'LMB/RMB: Disegna con colori di fg/bg, SHIFT: Disegna rettangolo',

      'Circle/Ellipse' : 'Cerchio/Ellisse',
      'LMB/RMB: Draw with fg/bg color, SHIFT: Draw ellipse' : 'LMB/RMB: Disegna con colori di fg/bg, SHIFT: Disegna ellisse',

      'Blur' : 'Sfoca',
      'Noise' : 'Disturbo',
      'Invert colors' : 'Inverti colori',
      'Grayscale' : 'Scala di grigi',
      'Sharpen' : 'Intensifica',
      'Simple Blur' : 'Sfocatura leggera',

      'Radius' : 'Raggio',
      'Iterations' : 'Ripetizioni'
    },
    ko_KR : {
      'Toggle tools toolbar' : '도구 툴바 켜기/끄기',
      'Toggle layers toolbar' : '레이어 툴바 켜기/끄기',
      'Layer' : '레이어',
      'Effect' : '효과',
      'Flip Horizontally' : '수평으로 뒤집기',
      'Flip Vertically' : '수직으로 뒤집기',
      'Foreground' : '전경',
      'Background' : '배경',
      'Foreground (Fill) Color' : '전경색(채우기)',
      'Background (Stroke) Color' : '배경색(칠하기)',
      'Line join' : '선 종류',
      'Line width' : '선 굵기',
      'Toggle Stroke' : '선 활성화',
      'Enable stroke' : '선 그리기',
      'Round' : '둥글게',
      'Miter' : '기울이기',
      'Bevel' : '비스듬히',
      'Stroked' : '선 보이기',
      'No stroke' : '선없음',

      'Pointer' : '포인터',
      'Move active layer' : '활성 레이어 옮기기',

      'Picker' : '색상 추출',
      'LMB: Pick foreground-, RMB: Pick background color' : '왼쪽 마우스 버튼: 전경색, 오른쪽 마우스 버튼 : 배경색',

      'Pencil' : '연필',
      'LMB: Use foreground-, RMB: Use background color' : '왼쪽 마우스/오른쪽 마우스 버튼 전경/배경색 그리기',
      'Path' : '경로',

      'Square/Rectangle' : '정사각형/직사각형',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle rectangle/square mode' : '왼쪽/오른쪽 마우스 버튼 전경/배경색 그리기, SHIFT: 직사각형 그리기',

      'Circle/Ellipse' : '원/타원',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle circle/ellipse mode' : '왼쪽/오른쪽 마우스 버튼 전경/배경색 그리기, SHIFT: 타원 그리기',

      'Blur' : '블러',
      'Noise' : '노이즈',
      'Invert colors' : '반전',
      'Grayscale' : '흑백',
      'Sharpen' : '샤픈',
      'Simple Blur' : '약한 블러',

      'Radius' : '반경',
      'Iterations' : '반복',

      'LMB: Fill with foreground-, RMB: Fill with background color': '왼쪽 마우스/오른쪽 마우스 버튼 전경/배경색 칠하기',
      'Set {0} color': '{0}색을 선택'
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
      'Line join' : 'Lijnverbinding',
      'Line width' : 'Lijnbreedte',
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
      'LMB: Pick foreground-, RMB: Pick background color' : 'LMB: Kies voorgrond-kleur, RMB: Kies achtergrondkleur',

      'Pencil' : 'Penseel',
      'LMB: Use foreground-, RMB: Use background color' : 'LMB/RMB: Teken met voor- en achtergrondkleur',
      'Path' : 'Pfad',

      'Square/Rectangle' : 'Vierkant/rechthoek',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle rectangle/square mode' : 'LMB/RMB: Teken met voor- en achtergrondkleur, SHIFT: Rechnthoek tekenen',

      'Circle/Ellipse' : 'Cirkel/elipse',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle circle/ellipse mode' : 'LMB/RMB: Teken met voor- en achtergrondkleur, SHIFT: Elipse tekenen',

      'Blur' : 'Vager maken (Blur)',
      'Noise' : 'Ruis',
      'Invert colors' : 'Kleuren inverteren',
      'Grayscale' : 'Grijstinten',
      'Sharpen' : 'Scherper',
      'Simple Blur' : 'Eenvoudig vager maken (Blur)',

      'Radius' : 'Radius',
      'Iterations' : 'Doorgangen'
    },
    no_NO : {
      'Toggle tools toolbar' : 'Svitsj verktøylinje',
      'Toggle layers toolbar' : 'Svitsj lag-verktøylinje',
      'Layer' : 'Lag',
      'Effect' : 'Effekt',
      'Flip Horizontally' : 'Flipp Horisontalt',
      'Flip Vertically' : 'Flipp Vertikalt',
      'Foreground' : 'Forgrunn',
      'Background' : 'Bakgrunn',
      'Foreground (Fill) Color' : 'Forgrunn (Fyll) Farge',
      'Background (Stroke) Color' : 'Bakgrunn (Strøk) Farge',
      'Line join' : 'Linje Knytting',
      'Line width' : 'Linje Bredde',
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
      'LMB: Pick foreground-, RMB: Pick background color' : 'LMB: sett bg farge, RMB: sett fg farge',

      'Pencil' : 'Penn',
      'LMB: Use foreground-, RMB: Use background color' : 'LMB/RMB: Tegn med fg/bg farge',
      'Path' : 'Sti',

      'Square/Rectangle' : 'Firkant/Rektangel',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle rectangle/square mode' : 'LMB/RMB: Tegn med fg/bg farge, SHIFT: Tegn rektangel',

      'Circle/Ellipse' : 'Sirkel/Ellipse',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle circle/ellipse mode' : 'LMB/RMB: Tegn med fg/bg farge, SHIFT: Tegn ellipse',

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
      'Bakgrunn' : 'Tło',
      'Foreground (Fill) Color' : 'Kolor pierwszoplanowy (Wypełnienie)',
      'Background (Stroke) Color' : 'Kolor tła (Wycinanie)',
      'Line join' : 'Rodzaj lini',
      'Line width' : 'Grubość',
      'Toggle Stroke' : 'Włącz/wyłącz obramowanie',
      'Enable stroke' : 'Włącz obramowanie',
      'Round' : 'Zwykłe',
      'Miter' : 'Paski',
      'Bevel' : 'Kątownik',
      'Stroked' : 'Obranowanie',
      'No stroke' : 'Bez obramowania',

      'Pointer' : 'Wskaźnik',
      'Move active layer' : 'Przenieś aktywne warstwy',

      'Picker' : 'Wybór',
      'LMB: Pick foreground-, RMB: Pick background color' : 'LMB: Wstaw kolor bg, RMB: ustaw kolor fg',

      'Pencil' : 'Ołówek',
      'LMB: Use foreground-, RMB: Use background color' : 'Maluj w kolorze fg/bg',
      'Path' : 'Ścieżka',

      'Square/Rectangle' : 'Kwadratowe / prostokątne',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle rectangle/square mode' : 'LMB/RMB: Maluj w kolorze fb/bg, SHIFT: Narysuj prostokąt',

      'Circle/Ellipse' : 'Koło / Elipsa',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle circle/ellipse mode' : 'LMB/RMB: Maluj w kolorze fb/bg, SHIFT: Narysuj elipse',

      'Blur' : 'Blur',
      'Noise' : 'Szum',
      'Invert colors' : 'Odwróc kolory',
      'Grayscale' : 'Skala szaroścu',
      'Sharpen' : 'Zaostrzone',
      'Simple Blur' : 'Łatwy Blur',

      'Radius' : 'Promień',
      'Iterations' : 'Powtórzenia'
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
      'Line join' : 'Замкнутая линия',
      'Line width' : 'Ширина линии',
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
      'LMB: Pick foreground-, RMB: Pick background color' : 'ЛКМ: устананавливает первичный цвет, ПКМ: устанавливает вторичный(фоновый) цвет',

      'Pencil' : 'Карандаш',
      'LMB: Use foreground-, RMB: Use background color' : 'ЛКМ/ПКМ: Рисует первичным/вторичным цветом',
      'Path' : 'Прямая',

      'Square/Rectangle' : 'Квадрат/Прямоугольник',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle rectangle/square mode' : 'ЛКМ/ПКМ: рисует первичным/вторичным цветом квадрат, SHIFT: нарисовать прямоуголник',

      'Circle/Ellipse' : 'Круг/Эллипс',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle circle/ellipse mode' : 'ЛКМ/ПКМ: рисует первичным/вторичным цветом круг, SHIFT: нарисовать эллипс',

      'Blur' : 'Размытие (Blur)',
      'Noise' : 'Шум',
      'Invert colors' : 'Инвертировать цвета',
      'Grayscale' : 'Обесцветить',
      'Sharpen' : 'Сточить',
      'Simple Blur' : 'Простое размытие (Blur)',

      'Radius' : 'Радиус',
      'Iterations' : 'Итерации'
    },
    sk_SK : {
      'Toggle tools toolbar' : 'Zobraz panel nástrojov',
      'Toggle layers toolbar' : 'Zobraz vrstvy',
      'Layer' : 'Vrstvy',
      'Effect' : 'Efekty',
      'Flip Horizontally' : 'Transformuj horizontálne',
      'Flip Vertically' : 'Transformuj vertikálne',
      'Foreground' : 'Popredie',
      'Bakgrunn' : 'Pozadie',
      'Line join' : 'Typ čiary',
      'Line width' : 'Šírka čiary',
      'Toggle Stroke' : 'Zapnúť orámovanie',
      'Enable stroke' : 'Orámovanie',
      'Round' : 'Okrúhly',
      'Miter' : 'Naklonený',
      'Bevel' : 'Šikmý',
      'Stroked' : 'Orámovaný',
      'No stroke' : 'Bez orámovania',

      'Pointer' : 'Ukazovateľ',
      'Move active layer' : 'Presuň aktívnu vrstvu',

      'Picker' : 'Kurzor',
      'LMB: Pick foreground-, RMB: Pick background color' : 'LMB: nastav farbu pozadia, RMB: nastav farbu popredia',

      'Pencil' : 'Ceruzka',
      'LMB: Use foreground-, RMB: Use background color' : 'Maľuj farbou fg/bg',
      'Path' : 'Cesta',

      'Square/Rectangle' : 'Štvorec / Obdĺžnik',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle rectangle/square mode' : 'LMB/RMB: Maľuj farbou fb/bg, SHIFT: Obdĺžnik',

      'Circle/Ellipse' : 'Kruh / Elipsa',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle circle/ellipse mode' : 'LMB/RMB: Maľuj farbou fb/bg, SHIFT: Elipsa',

      'Blur' : 'Rozmazať',
      'Noise' : 'Šum',
      'Invert colors' : 'Invertovať farby',
      'Grayscale' : 'Odtiene šedej',
      'Sharpen' : 'Zostriť',
      'Simple Blur' : 'Jednoduchý Blur',

      'Radius' : 'Rádius',
      'Iterations' : 'Iterácie'
    },
    tr_TR : {
      'Toggle tools toolbar' : 'araç çubugu değiştirme araçları',  //yanlış olabilir
      'Toggle layers toolbar' : 'Araç çubugu katmanı değiştirme',
      'Layer' : 'Katman',
      'Effect' : 'efekt',
      'Flip Horizontally' : 'Yatay çevir',
      'Flip Vertically' : 'Dikey çevir',
      'Foreground' : 'Önplana al',
      'Background' : 'Arkaplana al',
      'Foreground (Fill) Color' : 'Önplan rengi',
      'Background (Stroke) Color' : 'Arkaplan rengi',
      'Line join' : 'Çizgi bitişimi',
      'Line width' : 'Çizgi genişliği',
      'Toggle Stroke' : 'vuruşu değiştir',  //eklenecek
      'Enable stroke' : 'vuruş aktif',  //eklenecek
      'Round' : 'yuvarlamak',
      'Miter' : 'gönye',
      'Bevel' : 'eğmek',
      'Stroked' : 'Stroked',
      'No stroke' : 'No stroke',

      'Pointer' : 'işaretçi',
      'Move active layer' : 'hareket eden katman',

      'Picker' : 'toplayıcı',
      'LMB: Pick foreground-, RMB: Pick background color' : 'LMB: fg rengi ayarla, RMB: gb rengi ayarla',

      'Pencil' : 'kalem',
      'LMB: Use foreground-, RMB: Use background color' : 'LMB/RMB:fg/bg rengi ile çiz',
      'Path' : 'yol',

      'Square/Rectangle' : 'kare/üçgen',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle rectangle/square mode' : 'LMB/RMB: fg/bg renkleri ile çiz , SHIFT: üçgen çiz',

      'Circle/Ellipse' : 'dair/elips',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle circle/ellipse mode' : 'LMB/RMB: fb/bg ile çiz , SHIFT: elips çiz',

      'Blur' : 'Bulanık',
      'Noise' : 'gürültü',
      'Invert colors' : 'renkleri tersine çevir',
      'Grayscale' : 'gri ton',
      'Sharpen' : 'keskinleştirmek',
      'Simple Blur' : 'sade Bulanık',

      'Radius' : 'yarıçap',
      'Iterations' : 'yineleme'
    },
    vi_VN : {
      'Toggle tools toolbar' : 'Công cụ bật tắt thanh công cụ',
      'Toggle layers toolbar' : 'Bật tắt cửa sổ layer',
      'Layer' : 'Lớp',
      'Effect' : 'Hiệu ứng',
      'Flip Horizontally' : 'Lật ngang',
      'Flip Vertically' : 'Lật theo chiều dọc',
      'Foreground' : 'Nền trước',
      'Background' : 'Nền dưới',
      'Foreground (Fill) Color' : 'Màu nền trước',
      'Background (Stroke) Color' : 'Màu nền dưới',
      'Line join' : 'Ghép đoạn thằng',
      'Line width' : 'Độ rộng dòng',
      'Toggle Stroke' : 'Bật tắt nét',
      'Enable stroke' : 'Bật nét',
      'Round' : 'Tròn',
      'Miter' : 'Góc',
      'Bevel' : 'Góc xiên',
      'Stroked' : 'Vuốt',
      'No stroke' : 'Không vuốt',

      'Pointer' : 'Con trỏ',
      'Move active layer' : 'Di chuyển layer đang chọn',

      'Picker' : 'Bảng chọn',
      'LMB: Pick foreground-, RMB: Pick background color' : 'LMB: chọn màu fg, RMB: chọn màu gb',

      'Pencil' : 'Bút chì',
      'LMB: Use foreground-, RMB: Use background color' : 'LMB/RMB: vẽ với màu fg/bg',
      'Path' : 'Đường',

      'Square/Rectangle' : 'Firkant/Rektangel',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle rectangle/square mode' : 'LMB/RMB: Tegn med fg/bg farge, SHIFT: Tegn rektangel',

      'Circle/Ellipse' : 'Vuông / chữ nhật',
      'LMB: Use foreground-, RMB: Use background color. SHIFT: Toggle circle/ellipse mode' : 'LMB/RMB: vẽ với màu fg/bg, SHIFT: Vẽ ê-líp',

      'Blur' : 'Làm mờ',
      'Noise' : 'Làm nhiễu',
      'Invert colors' : 'Nghịch đảo màu',
      'Grayscale' : 'Độ xám',
      'Sharpen' : 'Làm sắc nét',
      'Simple Blur' : 'Làm mờ đơn giản',

      'Radius' : 'Bán kính',
      'Iterations' : 'Lặp đi lặp lại'
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
