(function() {
  window.OSjs = window.OSjs || {};
  OSjs.Themes = window.OSjs.Themes || {};
  OSjs.Themes.material = {
    init: function() {},
    destroy: function() {},
    event: function(e) {
      if ( e.target && e.target.nodeName.toLowerCase() === 'button' ) {
        var parent = e.target;
        if ( parseFloat(window.getComputedStyle(parent).getPropertyValue('opacity')) > 0 ) {
          var drop;
          var maxWidthHeight = Math.max(parent.clientWidth, parent.clientHeight);
          var drops = Array.prototype.slice.call(parent.childNodes).filter(function(e) {
            return (e.className === 'drop animate');
          });
          var freeDrops = drops.slice().filter(function(e) {
            // .drop opacity is 1 when it's hidden... css animations
            return parseFloat(window.getComputedStyle(e).getPropertyValue('opacity')) === 1;
          });
          if ( drops.length === 0 || freeDrops.length === 0 ) {
            drop = document.createElement('b');
            drop.className = 'drop';
            drop.style.width = maxWidthHeight + 'px';
            drop.style.height = maxWidthHeight + 'px';
            drop = parent.appendChild(drop);
          } else {
            drop = freeDrops[0];
            drop.className = 'drop';
          }
          var rect = parent.getBoundingClientRect();
          drop.style.top = (e.pageY - rect.top - maxWidthHeight / 2) + 'px';
          drop.style.left = (e.pageX - rect.left - maxWidthHeight / 2) + 'px';
          drop.className = 'drop animate';
        }
      }
    }
  };
})();
