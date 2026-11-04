import "@testing-library/jest-dom";

// jsdom no implementa showModal/close: simulamos únicamente esa API del navegador.
// El formulario, sus estados y los eventos siguen siendo los componentes reales.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};
