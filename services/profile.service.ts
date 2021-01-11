import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApplicationConfig } from '../../wms-config/services/application-config.service';
import { Profile } from '../model/profile';
import { UpdateProfile } from '../model/update-profile';
import { PasswordReset } from '../model/password-reset';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  constructor(private http: HttpClient, private appConfig: ApplicationConfig) {}

  public getProfile(): Promise<Profile> {
    const servicePath = this.appConfig.getApiSecurityUrl('/profile');
    return this.http.get<Profile>(servicePath).toPromise();
  }

  public updateProfile(profile: UpdateProfile): Promise<Profile> {
    const servicePath = this.appConfig.getApiSecurityUrl('/profile');
    return this.http.put<Profile>(servicePath, profile).toPromise();
  }

  public updatePassword(passwordReset: PasswordReset): Promise<any> {
    const servicePath = this.appConfig.getApiSecurityUrl('');
    return this.http
      .put<any>(`${servicePath}/profile/password`, passwordReset)
      .toPromise();
  }

  public forgotPassword(): Promise<any> {
    const servicePath = this.appConfig.getApiSecurityUrl('');
    return this.http
      .put(`${servicePath}/profile/password/reset`, {})
      .toPromise();
  }
}
