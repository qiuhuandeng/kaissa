(function () {
  var panel = document.getElementById('tab-visa');
  if (!panel) return;
  var nameNode = document.querySelector('.product-detail-cover-overlay strong');
  var name = nameNode ? nameNode.textContent : '';
  var profiles = {
    france: ['需提前办理', '法国', '申根旅游签证', '旅行社代办（包含在团费中）', 'v6 / 2026-06-20', '出发前21天', '需要录指纹', '法国、德国、瑞士、意大利等申根目的国'],
    japan: ['需提前办理', '日本', '日本个人旅游签证', '旅行社代办（单独收费）', 'v4 / 2026-06-08', '出发前14天', '无需面签，按领区审核', '日本'],
    singapore: ['电子签', '新加坡', '新加坡旅游电子签', '旅行社代办（包含在团费中）', 'v3 / 2026-05-26', '出发前10天', '无需本人到场', '新加坡'],
    none: ['不涉及出境签证', '-', '-', '无需办理', '-', '-', '无需本人到场', '-']
  };
  var profile = /日本/.test(name) ? profiles.japan : /新加坡/.test(name) ? profiles.singapore : /三亚|敦煌|北京故宫|丝路专列|国内/.test(name) ? profiles.none : profiles.france;
  var ids = ['productVisaPolicyView', 'productVisaCountryView', 'productVisaTypeView', 'productVisaMethodView', 'productVisaVersionView', 'productVisaDeadlineView', 'productVisaPresenceView', 'productVisaCoverageView'];
  ids.forEach(function (id, index) {
    var node = document.getElementById(id);
    if (node) node.textContent = profile[index];
  });
  var countryCell = document.getElementById('productVisaCountryCell');
  if (countryCell) countryCell.textContent = profile[1];
  var noVisa = profile === profiles.none;
  var table = document.getElementById('productVisaPlanTable');
  var material = document.getElementById('productVisaMaterialBlock');
  if (table) table.hidden = noVisa;
  if (material) material.hidden = noVisa;
})();
