import { Component, Input, OnInit } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";

import { InterestedUser } from "../main/main.model";

@Component({
  selector: "app-interested-users",
  templateUrl: "./interested-users.component.html",
  styleUrls: ["./interested-users.component.scss"],
})
export class InterestedUsersComponent implements OnInit {
  @Input() users: InterestedUser[];

  constructor() {}

  ngOnInit(): void {}

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.users, event.previousIndex, event.currentIndex);
  }
}
