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

export interface SternumlaufStartData {
  apiResult: any;
  selectedBarcode: Umlauf;
}

export interface RingumlaufPdfData {
  title: string;
  readDays: string;
  comment: string;
  barcode: string;
  interestedUsersInfo: any[];
}

export interface SternumlaufSettings {
  locationType: string;
  locationLibrary: string;
  locationCirculationDesk: string;
}
export interface InformationSettings {
  title: string;
  subtitle: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  dvr: string;
}

export interface UserSettings {
  itemPolicy: string[];
  sternumlauf: SternumlaufSettings;
  information: InformationSettings;
}

export class InternalAppError extends Error {
  internalError: boolean = true;

  constructor() {
    super();
  }
}
