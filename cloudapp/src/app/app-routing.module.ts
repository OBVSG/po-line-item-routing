import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HelpComponent } from "./pages/help/help.component";
import { MainComponent } from "./components/main/main.component";
import { SettingsComponent } from "./pages/settings/settings.component";

// App routes
const routes: Routes = [
  {
    path: "",
    component: MainComponent,
  },
  { path: "settings", component: SettingsComponent },
  { path: "help", component: HelpComponent },
];
@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
