class ImportStepper {
  constructor() {
    this.SERVER_URL = `${location.origin}/api/v1`;
    this._token = localStorage.getItem("token");
    this.user;
    this.currentStep;
    this.loader = new Loader();
    this.modalController = new ModalController();

    this.getUser();
  }

  async getUser() {
    this.loader.show();
    const res = await fetch(`${this.SERVER_URL}/import/userinfo`, {
      headers: { Authorization: this._token },
    }).then((res) => res.json());

    if (res.success) {
      this.user = res.data;
      $(".import-code").text(this.user.importCode);
      // this.listImports();
    } else {
      delete this._token;
      delete this.user;
    }

    this.currentStep = this._token == undefined ? 0 : 1;
    this.updateInterface();
    this.loader.hide();
  }

  async listImports() {
    const res = await fetch(`${this.SERVER_URL}/import/${this.user.id}/list`, {
      headers: { Authorization: this.user.importCode },
    }).then((res) => res.json());

    if (res.success === true && res.data?.imports?.length > 0) {
      res.data.imports.forEach((e) => {
        console.log(e);
        const created = new Date(e.timeCreated);
        $("#prev-imported").show();
        $("#prev-imported").append(
          `<b>${created.toLocaleDateString()}</b><br>`
        );
        $("#prev-imported").append(`- ${e.name}`);
      });
    }
  }

  async updateInterface() {
    // $(".step-current").removeClass("step-current");
    $($(".step-hidden")[this.currentStep]).addClass("step-current");

    if (this._token && this.user) {
      $("#auth-check button").addClass("red");
      $("#auth-check button").text("Log out");
      $("#authcode").text(`Logged in as ${this.user.displayName}`);
      $("#auth-check button").click(() => this.logout());
    }

    const hasFiles = document.getElementById("files").files.length > 0;
    $("#upload").prop("disabled", !hasFiles);
  }

  async nextStep() {
    this.loader.show();
    if (this.currentStep == 0) {
      await this.step1();
    } else if (this.currentStep == 1) {
      await this.step2();
      this.currentStep++;
    }
    this.updateInterface();
    this.loader.hide();
  }

  async step1() {
    if (!this._token || !this.user) {
      return new Promise((resolve, _) => {
        const loginWindow = window.open(
          `${this.SERVER_URL}/auth/redirect`,
          "_blank",
          "toolbar=yes,scrollbars=yes,resizable=yes,width=600,height=800"
        );

        loginWindow.onload = async () => {
          const url = loginWindow.location.href;
          const token = /#complete\?token=(?<token>ey.*)/.exec(url).groups
            .token;
          if (token !== undefined) {
            this._token = token;
            localStorage.setItem("token", this._token);
            await this.getUser();
            loginWindow.close();
            resolve();
          }
        };
      });
    }
  }

  async step2() {
    return new Promise(async (resolve, _) => {
      var form_data = new FormData();
      form_data.append("token", this._token);

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
        this.modalController.openModal(
          "Success",
          `${res.message} Please follow the instructions of the next step to download the data to your device.`
        );
      } else {
        this.modalController.openModal("Error", res.message);
      }
      resolve();
    });
  }

  async logout() {
    localStorage.removeItem("token");
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
      $(this).parent().remove();
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
  $(".next-step").click(() => importStepper.nextStep());
  $("#files").change(() => importStepper.updateInterface());
});
