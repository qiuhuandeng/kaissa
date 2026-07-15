(function () {
  var tabButton = document.querySelector('[data-tab="visa"]');
  var panel = document.getElementById('tab-visa');
  if (!tabButton || !panel) return;
  var params = new URLSearchParams(window.location.search);
  var type = params.get('type') || params.get('batchType') || 'outbound';
  var noVisa = /domestic|train|境内|专列/i.test(type);
  tabButton.hidden = noVisa;
  panel.hidden = noVisa;
})();
