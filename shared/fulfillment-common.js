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

  document.querySelectorAll("[data-open-document-edit]").forEach(function (button) {
    button.addEventListener("click", function () { openModal(document.getElementById("documentEditModal")); });
  });
  document.querySelectorAll("[data-open-document-remind]").forEach(function (button) {
    button.addEventListener("click", function () { openModal(document.getElementById("documentRemindModal")); });
  });
  document.querySelectorAll("[data-open-visa-update]").forEach(function (button) {
    button.addEventListener("click", function () { openModal(document.getElementById("visaUpdateModal")); });
  });
  document.querySelectorAll("[data-open-notice-send]").forEach(function (button) {
    button.addEventListener("click", function () { openModal(document.getElementById("noticeSendModal")); });
  });
  document.querySelectorAll("[data-open-return-close]").forEach(function (button) {
    button.addEventListener("click", function () { openModal(document.getElementById("returnCloseModal")); });
  });
  document.querySelectorAll("[data-close-modal]").forEach(function (button) {
    button.addEventListener("click", function () { closeModal(button.closest(".modal-overlay")); });
  });
  document.querySelectorAll(".modal-overlay").forEach(function (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal(modal);
    });
  });
  document.querySelectorAll("[id^='reset']").forEach(function (button) {
    button.addEventListener("click", function () {
      var panel = button.closest(".list-page-panel") || document;
      panel.querySelectorAll("input").forEach(function (input) { input.value = ""; });
      panel.querySelectorAll("select").forEach(function (select) { select.selectedIndex = 0; });
    });
  });
})();
