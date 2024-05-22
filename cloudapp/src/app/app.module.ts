import { NgModule, LOCALE_ID } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import localeDeAt from "@angular/common/locales/de-AT";
import { HttpClientModule } from "@angular/common/http";
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
import { AppRoutingModule } from "./app-routing.module";
import { MainComponent } from "./components/main/main.component";
import { InterestedUsersComponent } from "./components/interested-users/interested-users.component";
import { RingumlaufComponent } from "./components/ringumlauf/ringumlauf.component";

registerLocaleData(localeDeAt);

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    InterestedUsersComponent,
    RingumlaufComponent,
  ],
  imports: [
    MaterialModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    AlertModule,
    FormsModule,
    ReactiveFormsModule,
    CloudAppTranslateModule.forRoot(),
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: "standard" },
    },
    { provide: LOCALE_ID, useValue: "de-AT" },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
