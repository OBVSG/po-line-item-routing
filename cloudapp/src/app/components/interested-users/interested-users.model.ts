export interface InterestedUser {
  email: string;
  primary_id: string;
  notify_receiving_activation: boolean;
  hold_item: boolean;
  notify_renewal: boolean;
  notify_cancel: boolean;
  first_name: string;
  last_name: string;
}
