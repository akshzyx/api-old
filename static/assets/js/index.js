class ImportStepper {
  constructor() {
    this.SERVER_URL = "http://localhost:3000/v1";
    this._token = localStorage.getItem("token");
    this.currentStep = this._token == undefined ? 0 : 1;
    this.loader = new Loader();

    this.updateInterface();
  }

  async updateInterface() {
    $(".step-current").removeClass("step-current");
    $($(".step-hidden")[this.currentStep]).addClass("step-current");
  }

  async nextStep() {
    this.loader.show();
    if (this.currentStep == 0) await this.step1();
    else if (this.currentStep == 1) await this.step2();
    this.currentStep++;
    this.updateInterface();
    this.loader.hide();
  }

  async step1() {
    return new Promise((resolve, _) => {
      const loginWindow = window.open(
        `${this.SERVER_URL}/auth/redirect`,
        "_blank",
        "toolbar=yes,scrollbars=yes,resizable=yes,width=600,height=800"
      );

      loginWindow.onload = () => {
        const url = loginWindow.location.href;
        const token = /#complete\?token=(?<token>ey.*)/.exec(url).groups.token;
        if (token !== undefined) {
          this._token = token;
          localStorage.setItem("token", this._token);
          loginWindow.close();
          resolve();
        }
      };
    });
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

      if (typeof res == "object") {
        $("#streams-imported").text(res.message);
        $(".import-code").text(res.importCode);
        resolve();
      } else {
        alert(JSON.parse(res.responseText).message);
      }
    });
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

const importStepper = new ImportStepper();

$(document).ready(function () {
  $(".next-step").click(() => importStepper.nextStep());
});
