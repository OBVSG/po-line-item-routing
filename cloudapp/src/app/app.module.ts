import { NgModule, LOCALE_ID } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import localeDeAt from "@angular/common/locales/de-AT";
import { HttpClientModule } from "@angular/common/http";
import { BrowserModule } from "@angular/platform-browser";
import { Routes, RouterModule } from "@angular/router";
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
import { RingumlaufPdfComponent } from "./components/ringumlauf-pdf/ringumlauf-pdf.component";

// App routes
const routes: Routes = [{ path: "", component: MainComponent }];

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
  ],
  imports: [
    MaterialModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AlertModule,
    FormsModule,
    ReactiveFormsModule,
    CloudAppTranslateModule.forRoot(),
    RouterModule.forRoot(routes, { useHash: true }),
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: "standard" },
    },
    { provide: LOCALE_ID, useValue: "de-AT" },
  ],
  bootstrap: [AppComponent],
  entryComponents: [RingumlaufPdfComponent],
})
export class AppModule {}
