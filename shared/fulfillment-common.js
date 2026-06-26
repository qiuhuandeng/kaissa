(function () {
  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }

  function bindOnce(node, key, eventName, handler) {
    if (!node || node.dataset[key] === "true") return;
    node.dataset[key] = "true";
    node.addEventListener(eventName, handler);
  }

  function initFulfillmentCommon(root) {
    var scope = root || document;

    scope.querySelectorAll("[data-open-document-edit]").forEach(function (button) {
      bindOnce(button, "fulfillmentOpenReady", "click", function () { openModal(document.getElementById("documentEditModal")); });
    });
    scope.querySelectorAll("[data-open-document-remind]").forEach(function (button) {
      bindOnce(button, "fulfillmentOpenReady", "click", function () { openModal(document.getElementById("documentRemindModal")); });
    });
    scope.querySelectorAll("[data-open-visa-update]").forEach(function (button) {
      bindOnce(button, "fulfillmentOpenReady", "click", function () { openModal(document.getElementById("visaUpdateModal")); });
    });
    scope.querySelectorAll("[data-open-notice-send]").forEach(function (button) {
      bindOnce(button, "fulfillmentOpenReady", "click", function () { openModal(document.getElementById("noticeSendModal")); });
    });
    scope.querySelectorAll("[data-open-return-close]").forEach(function (button) {
      bindOnce(button, "fulfillmentOpenReady", "click", function () { openModal(document.getElementById("returnCloseModal")); });
    });
    scope.querySelectorAll("[data-close-modal]").forEach(function (button) {
      bindOnce(button, "fulfillmentCloseReady", "click", function () { closeModal(button.closest(".modal-overlay")); });
    });
    scope.querySelectorAll(".modal-overlay").forEach(function (modal) {
      bindOnce(modal, "fulfillmentOverlayReady", "click", function (event) {
        if (event.target === modal) closeModal(modal);
      });
    });
    scope.querySelectorAll("[id^='reset']").forEach(function (button) {
      bindOnce(button, "fulfillmentResetReady", "click", function () {
        var panel = button.closest(".list-page-panel") || document;
        panel.querySelectorAll("input").forEach(function (input) { input.value = ""; });
        panel.querySelectorAll("select").forEach(function (select) { select.selectedIndex = 0; });
      });
    });
  }

  window.caesarInitFulfillmentCommon = initFulfillmentCommon;
  initFulfillmentCommon(document);
})();
