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

export interface Ringumlauf {
  barcode: string;
  chronology_i: string;
  chronology_j: string;
  description: string;
  enumeration_a: string;
  enumeration_b: string;
  expected_arrival_date: string;
  link: string;
  pid: string;
  receive_date: string;
  item_policy: {
    desc: string;
    value: string;
  };
}
