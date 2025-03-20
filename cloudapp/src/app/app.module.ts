import { NgModule, LOCALE_ID } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import localeDeAt from "@angular/common/locales/de-AT";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from "@angular/material/form-field";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  MaterialModule,
  CloudAppTranslateModule,
  AlertModule,
} from "@exlibris/exl-cloudapp-angular-lib";

import { AppComponent } from "./app.component";
import { MainComponent } from "./components/main/main.component";
import { InterestedUsersComponent } from "./components/interested-users/interested-users.component";
import { RingumlaufComponent } from "./components/ringumlauf/ringumlauf.component";
import { LoadingSpinnerComponent } from "./components/shared/loading-spinner/loading-spinner.component";
import { RingumlaufPdfComponent } from "./components/ringumlauf/ringumlauf-pdf/ringumlauf-pdf.component";
import { SternumlaufComponent } from "./components/sternumlauf/sternumlauf.component";
import { AlertComponent } from "./components/shared/alert/alert.component";
import { SternumlaufStartComponent } from "./components/sternumlauf/sternumlauf-start/sternumlauf-start.component";
import { HelpComponent } from "./pages/help/help.component";
import { SettingsComponent } from "./pages/settings/settings.component";
import { AppRoutingModule } from "./app-routing.module";

// Register locale data
registerLocaleData(localeDeAt);

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    InterestedUsersComponent,
    RingumlaufComponent,
    LoadingSpinnerComponent,
    RingumlaufPdfComponent,
    SternumlaufStartComponent,
    SternumlaufComponent,
    SettingsComponent,
    HelpComponent,
    AlertComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    MaterialModule,
    BrowserModule,
    BrowserAnimationsModule,
    AlertModule,
    FormsModule,
    ReactiveFormsModule,
    CloudAppTranslateModule.forRoot(),
    AppRoutingModule,
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: "fill" },
    },
    { provide: LOCALE_ID, useValue: "de-AT" },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
