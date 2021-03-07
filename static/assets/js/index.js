class ImportStepper {
  constructor() {
    this.SERVER_URL = `${location.origin}/api/v1`;
    this._code = localStorage.getItem("code");
    this.user;
    this.currentStep;
    this.loader = new Loader();
    this.modalController = new ModalController();

    this.getUser(this._code);
  }

  async getUser(code) {
    this.loader.show();
    let res;
    if (code) {
      res = await fetch(`${this.SERVER_URL}/import/code`, {
        method: "post",
        body: new URLSearchParams(`code=${code.toUpperCase()}`),
      }).then((res) => res.json());

      if (res.success) {
        this._code = code;
        localStorage.setItem("code", this._code);
        this.user = res.data;
        $("#import-code input[type='text'")
          .val(this._code)
          .prop("readonly", true);
      } else {
        delete this._code;
        delete this.user;
      }
    }

    this.currentStep = this._code == undefined ? 0 : 1;
    this.updateInterface();
    this.loader.hide();

    return res;
  }

  async updateInterface() {
    $($(".step-hidden")[this.currentStep]).addClass("step-current");

    if (this._code && this.user) {
      $("#import-code button").addClass("red");
      $("#import-code button").text("Log out");
      $("#authcode").text(`Logged in as ${this.user.displayName}`);
      $("#import-code button").click(() => this.logout());
    }

    const hasFiles = document.getElementById("files").files.length > 0;
    $("#upload").prop("disabled", !hasFiles);
  }

  async nextStep(e) {
    if (e && e.preventDefault) e.preventDefault();
    this.loader.show();
    if (this.currentStep == 0) {
      await this.step1();
    } else if (this.currentStep == 1) {
      await this.step2();
    }
    this.updateInterface();
    this.loader.hide();
  }

  async step1() {
    const code = $("#import-code input[type='text']").val();
    if (code && code.length == 6) {
      const res = await this.getUser(code);
      if (res.success) {
      } else if (res.message == "no user found") {
        this.modalController.openModal("Invalid code", "Please try try again");
      } else {
        this.modalController.openModal("Error", res.message);
      }
    }
  }

  async step2() {
    return new Promise(async (resolve, _) => {
      var form_data = new FormData();
      form_data.append("code", this._code);

      var totalfiles = document.getElementById("files").files.length;
      for (var index = 0; index < totalfiles; index++) {
        form_data.append(
          "files",
          document.getElementById("files").files[index]
        );
      }

      const res = await fetch(`${this.SERVER_URL}/import/upload`, {
        method: "post",
        body: form_data,
      }).then((res) => res.json());

      if (res.success) {
        $("#streams-imported").text(res.message);
        $(".import-code").text(res.importCode);
        $("#upload-files button").prop("disabled", true);
        this.modalController.openModal(
          "Success",
          `${res.message} Please follow the instructions of the next step to download the data to your device.`
        );
        this.currentStep++;
      } else {
        this.modalController.openModal("Error", res.message);
      }
      resolve();
    });
  }

  async logout() {
    localStorage.removeItem("code");
    location.reload();
  }
}

class Loader {
  show() {
    $("#overlay").show();
  }

  hide() {
    $("#overlay").hide();
  }
}

class ModalController {
  constructor() {
    this.template = $("#modal-template").html();
  }

  openModal(title, body) {
    var modal = $(this.template);

    modal.find(".title").text(title);
    modal.find(".body").text(body);

    modal.find("span.close").on("click", function () {
      $(this).parent().parent().remove();
    });

    modal.on("click", function (e) {
      if (e.target == this) {
        $(this).remove();
      }
    });

    $("body").append(modal);
    modal.show();
  }
}

const importStepper = new ImportStepper();

$(document).ready(function () {
  $("#files").change(() => importStepper.updateInterface());

  if (location.hash == "#guide") {
    $("#page-title").text("Import Guide");
    $(".guide-hide").hide();
  }
});
