import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import {
  AlertService,
  CloudAppSettingsService,
  FormGroupUtil,
} from "@exlibris/exl-cloudapp-angular-lib";
import { UserSettings } from "../../../app.model";

@Component({
  selector: "app-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent implements OnInit {
  settingsForm: FormGroup;
  itemPolicy: string[] = ["STAR_SOMETHING", "STAR_2"];
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

      // set the settings defaults
      this.settingsForm = FormGroupUtil.toFormGroup(initialSettings);

      if (settings.itemPolicy && settings.itemPolicy.length > 0) {
        this.itemPolicy = settings.itemPolicy;
      }
    });
  }

  addItemPolicy(value: string) {
    this.itemPolicy.push(value.trim());
  }

  removeItemPolicy(value: string) {
    const index = this.itemPolicy.indexOf(value);
    if (index >= 0) {
      this.itemPolicy.splice(index, 1);
    }
  }

  save() {
    this.saving = true;

    const settingsToSave = {
      ...this.settingsForm.value,
      itemPolicy: this.itemPolicy,
    };

    this.settingsService.set(settingsToSave).subscribe(
      (_response) => {
        this.alert.success("Settings successfully saved.");
        this.settingsForm.markAsPristine();
      },
      (err) => {
        // TODO: handle error
        this.alert.error(err.message);
      },
      () => {
        this.saving = false;
      }
    );
  }
}
