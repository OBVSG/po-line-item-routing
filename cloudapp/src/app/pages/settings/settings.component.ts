import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import {
  AlertService,
  CloudAppSettingsService,
  FormGroupUtil,
} from "@exlibris/exl-cloudapp-angular-lib";
import { UserSettings } from "../../app.model";

@Component({
  selector: "app-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent implements OnInit {
  settingsForm: FormGroup;
  itemPolicy: string[] = ["STAR_EXAMPLE", "SU_EXAMPLE"];
  saving = false;

  constructor(
    private settingsService: CloudAppSettingsService,
    private alert: AlertService
  ) {}

  ngOnInit() {
    this.settingsService.get().subscribe((settings) => {
      const initialSettings = Object.assign(
        {
          sternumlauf: {
            locationType: "LIBRARY",
            locationLibrary: "MUS",
            locationCirculationDesk: "DEFAULT_CIRC_DESK",
          },
          information: {
            title: "",
            subtitle: "",
            address: "",
            phone: "",
            email: "",
            website: "",
            dvr: "",
          },
        },
        settings
      );

      // set the settings default values
      this.settingsForm = FormGroupUtil.toFormGroup(initialSettings);

      if (settings.itemPolicy && settings.itemPolicy.length > 0) {
        this.itemPolicy = settings.itemPolicy;
      }
    });
  }

  addItemPolicy(inputElement: HTMLInputElement) {
    this.itemPolicy.push(inputElement.value.trim());
    inputElement.value = "";
  }

  removeItemPolicy(value: string) {
    const index = this.itemPolicy.indexOf(value);
    if (index >= 0) {
      this.itemPolicy.splice(index, 1);
    }
  }

  save() {
    this.saving = true;

    const settingsToSave: UserSettings = {
      ...this.settingsForm.value,
      itemPolicy: this.itemPolicy,
    };

    this.settingsService.set(settingsToSave).subscribe(
      (_response) => {
        this.alert.success("Die Einstellungen wurden erfolgreich gespeichert");
        this.settingsForm.markAsPristine();
      },
      (error) => {
        console.log(error);
        this.alert.error("Die Einstellungen konnten nicht gespeichert werden");
      },
      () => {
        this.saving = false;
      }
    );
  }
}
