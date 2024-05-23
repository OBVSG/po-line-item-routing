import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";

import { InterestedUser } from "../../app.model";

@Component({
  selector: "app-interested-users",
  templateUrl: "./interested-users.component.html",
  styleUrls: ["./interested-users.component.scss"],
})
export class InterestedUsersComponent implements OnInit, OnChanges {
  @Input() users: InterestedUser[];

  hasUnsavedChanges = false;
  private originalOrderHash: string;

  constructor() {}

  ngOnInit(): void {
    // Save the original order of the users
    this.setOriginalOrderHash();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If the users array changes, update the original order hash
    if (changes.users) {
      this.setOriginalOrderHash();
    }
  }

  drop(event: CdkDragDrop<InterestedUser[]>) {
    moveItemInArray(this.users, event.previousIndex, event.currentIndex);

    // check if the order has changed
    this.hasUnsavedChanges =
      this.originalOrderHash !== this.computeArrayHash(this.users);
  }

  private computeArrayHash(array: InterestedUser[]): string {
    return array.map((user) => user.primary_id).join("|"); // Simple hash by joining IDs
  }

  private setOriginalOrderHash() {
    // Save the original order of the users after the component is initialized or the users array changes from the parent
    this.originalOrderHash = this.computeArrayHash(this.users);
    this.hasUnsavedChanges = false;
  }
}
