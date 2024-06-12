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

export interface Umlauf {
  barcode: string;
  description: string;
  expected_arrival_date: string;
  link: string;
  pid: string;
  receive_date: string;
  item_policy: {
    desc: string;
    value: string;
  };
}

export interface RingumlaufPdfData {
  senderInfo: any; // TODO
  receiveInfo: any; // TODO
  title: string;
  readDays: string;
  comment: string;
  barcode: string;
  interestedUsersInfo: any[];
}

export interface UserSettings {
  locationType: string;
  locationLibrary: string;
  locationCirculationDesk: string;
  itemPolicy: string;
}
