import { UserApplication } from './user-application';

export class Profile {
  username: string;
  firstName: string;
  lastName: string;
  initials?: string;
  documentNumber: string;
  email: string;
  userApplication?: UserApplication;
}
