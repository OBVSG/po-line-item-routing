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
  saving = false;

  constructor(
    private settingsService: CloudAppSettingsService,
    private alert: AlertService
  ) {}

  ngOnInit() {
    this.settingsService.get().subscribe((settings) => {
      this.settingsForm = FormGroupUtil.toFormGroup(
        Object.assign(
          {
            sternumlauf: {
              locationType: "LIBRARY",
              locationLibrary: "MUS",
              locationCirculationDesk: "DEFAULT_CIRC_DESK",
              itemPolicy: "STAR_SOMETHING",
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
          } as UserSettings,
          settings
        )
      );
    });
  }

  save() {
    this.saving = true;
    this.settingsService.set(this.settingsForm.value).subscribe(
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
