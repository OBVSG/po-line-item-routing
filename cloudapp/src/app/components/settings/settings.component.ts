import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import {
  AlertService,
  CloudAppSettingsService,
  FormGroupUtil,
} from "@exlibris/exl-cloudapp-angular-lib";

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
            locationType: "LIBRARY",
            locationLibrary: "MUS",
            locationCirculationDesk: "DEFAULT_CIRC_DESK",
            itemPolicy: "STAR_SOMETHING",
          },
          settings
        )
      );
    });
  }

  save() {
    this.saving = true;
    this.settingsService.set(this.settingsForm.value).subscribe(
      (response) => {
        this.alert.success("Settings successfully saved.");
        this.settingsForm.markAsPristine();
      },
      (err) => this.alert.error(err.message),
      () => (this.saving = false)
    );
  }
}
