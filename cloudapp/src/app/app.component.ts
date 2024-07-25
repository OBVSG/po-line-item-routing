import { Component } from "@angular/core";
import { InitService } from "@exlibris/exl-cloudapp-angular-lib";

@Component({
  selector: "app-root",
  template: "<cloudapp-alert></cloudapp-alert><router-outlet></router-outlet>",
})
export class AppComponent {
  // do not remove this constructor, it is required for the CloudApp translation service
  constructor(private initService: InitService) {}
}
