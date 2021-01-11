import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { Credential } from '../../wms-config/model/credential';
import { ApplicationConfig } from '../../wms-config/services/application-config.service';
import { environment } from '../../../environments/environment';
import { AppEventService } from '../../wms-config/services/app-event.service';
import { AppAuthorities } from '../../wms-config/model/app-authorities';
import {
  EventTopic,
  NotificationTopic,
} from '../../modules/commons/model/event-info';

export const USER_STATUS_RESET = 'RESET';
export const ERR_ACCESS_DENIED_ERROR = 'ERR_ACCESS_DENIED_ERROR';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private appConfig: ApplicationConfig,
    private router: Router,
    private eventService: AppEventService
  ) {
    this.isLoggedSubject.next(this.getAccessToken() != null);
  }

  private securitySuffix =
    '_' + environment.appName + '_' + environment.envName;

  public isLoggedSubject = new BehaviorSubject(null);
  private helper = new JwtHelperService();

  public login(username: string, password: string): Promise<Credential> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + btoa(this.getClientId() + ':' + this.getSecretClient()),
      }),
    };

    const servicePath =
      '/oauth/token?username=' +
      username +
      '&password=' +
      encodeURIComponent(password) +
      '&grant_type=password';
    return this.http
      .post<Credential>(
        this.appConfig.getApiSecurityUrl(servicePath),
        [],
        httpOptions
      )
      .toPromise();
  }

  public hasAnyPermissions(roles: string[]) {
    let hasPermission = false;
    const userRoles = this.getRoles();
    roles.forEach((role) => {
      if (userRoles.indexOf(role) !== -1) {
        hasPermission = true;
        return;
      }
    });
    return hasPermission;
  }

  public logout() {
    localStorage.removeItem('access_token' + this.securitySuffix);
    localStorage.removeItem('refresh_token' + this.securitySuffix);
    this.isLoggedSubject.next(false);
    this.eventService.disconnect();
    this.router.navigate(['/login']);
  }

  public refreshToken(): Observable<Credential> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + btoa(this.getClientId() + ':' + this.getSecretClient()),
      }),
    };

    const servicePath =
      '/oauth/token?grant_type=refresh_token&refresh_token=' +
      this.getRefreshToken();
    return this.http.post<Credential>(
      this.appConfig.getApiSecurityUrl(servicePath),
      [],
      httpOptions
    );
  }

  public getAccessToken(): string {
    return localStorage.getItem('access_token' + this.securitySuffix);
  }

  public getTopics(): string[] {
    const topics = [];

    if (this.isAdministrative()) {
      topics.push(NotificationTopic.NOTIFICATION_SELECTION_ITEMS_COMPLETE);
      topics.push(
        NotificationTopic.NOTIFICATION_IMPORT_INVENTORY_PROCESS_TOPIC
      );
      topics.push(
        NotificationTopic.NOTIFICATION_PLACED_INCOME_WORK_ORDER_TOPIC
      );
      topics.push(
        EventTopic.USER_EVENT_ADMINISTRATIVE_CHANGES_INCOME_WORK_ORDER
      );
      topics.push(EventTopic.EVENT_ADMINISTRATIVE_CHANGES_INCOME_WORK_ORDER);
      topics.push(EventTopic.EVENT_SELECTION_ITEMS_COMPLETE);
      topics.push(EventTopic.EVENT_SELECTION_ITEMS_EXECUTING);
      topics.push(EventTopic.EVENT_TRANSPORTATION_ASSIGNED_TOPIC);
      topics.push(EventTopic.EVENT_CHANGES_INCOME_WORK_ORDER);
      topics.push(EventTopic.EVENT_NEW_INTERNAL_MOVEMENT_ITEM_NOTIFICATIONS);
      topics.push(EventTopic.EVENT_NEW_UPDATE_QUANTITY_ITEM_NOTIFICATIONS);
    }
    if (this.isOperator()) {
      topics.push(
        NotificationTopic.USER_NOTIFICATION_NEW_INCOME_WORK_ORDER_TOPIC
      );
      topics.push(EventTopic.USER_EVENT_OPERATIVE_CHANGES_INCOME_WORK_ORDER);
      topics.push(EventTopic.EVENT_OPERATIVE_CHANGES_INCOME_WORK_ORDER);
    } else {
      topics.push(EventTopic.EVENT_CHANGES_INCOME_WORK_ORDER);
      topics.push(EventTopic.EVENT_NEW_INTERNAL_MOVEMENT_ITEM_NOTIFICATIONS);
      topics.push(EventTopic.EVENT_NEW_UPDATE_QUANTITY_ITEM_NOTIFICATIONS);
    }
    return topics;
  }

  public getRefreshToken(): string {
    return localStorage.getItem('refresh_token' + this.securitySuffix);
  }

  public isAuthenticated(): boolean {
    return this.getAccessToken() != null;
  }

  public getClientId(): string {
    return environment.clientId;
  }

  public getSecretClient(): string {
    return environment.secretClient;
  }

  public getUserStatus() {
    return localStorage.getItem('userStatus' + this.securitySuffix);
  }

  public getAvatar() {
    const avatar = localStorage.getItem('avatar' + this.securitySuffix);
    return avatar && avatar != null && avatar !== '' ? avatar : 'f';
  }

  public updateUserStatus(userStatus: string) {
    localStorage.setItem('userStatus' + this.securitySuffix, userStatus);
  }

  public getUsername() {
    return localStorage.getItem('username' + this.securitySuffix);
  }

  public getInitials() {
    return localStorage.getItem('initials' + this.securitySuffix);
  }

  public getFullName() {
    const fullName = localStorage.getItem('fullName' + this.securitySuffix);
    if (fullName === '') return this.getUsername();
    return fullName;
  }

  private updateUsername(userStatus: string) {
    localStorage.setItem('username' + this.securitySuffix, userStatus);
  }

  private updateInitials(initials: string) {
    localStorage.setItem('initials' + this.securitySuffix, initials);
  }

  public updateFullName(userStatus: string) {
    localStorage.setItem('fullName' + this.securitySuffix, userStatus);
  }

  public updateAvatar(avatar: string) {
    if (avatar) localStorage.setItem('avatar' + this.securitySuffix, avatar);
  }

  public getRoles() {
    const decodedToken = this.helper.decodeToken(this.getAccessToken());
    if (decodedToken == null) {
      return [];
    }
    return decodedToken.authorities ? decodedToken.authorities : [];
  }

  public saveCredential(credential: Credential) {
    localStorage.setItem(
      'access_token' + this.securitySuffix,
      credential.access_token
    );
    localStorage.setItem(
      'refresh_token' + this.securitySuffix,
      credential.refresh_token
    );
    const decodedToken = this.helper.decodeToken(credential.access_token);
    const username = decodedToken.user_name;
    const fullName = decodedToken.fullName;
    const avatar = decodedToken.avatar;
    const authorities = decodedToken.authorities;
    const initials = decodedToken.initials;

    this.updateUsername(username);
    this.updateFullName(fullName);
    this.updateUserStatus(credential.userStatus);
    this.updateAvatar(avatar);
    this.updateInitials(initials);
    this.isLoggedSubject.next(true);
  }

  public saveFakeCredential() {
    const cred = JSON.parse(
      '{"access_token":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiQVBQX1JFU09VUkNFUyJdLCJ1c2VyU3RhdHVzIjoiQUNUSVZFIiwidXNlcl9uYW1lIjoiMyIsInNjb3BlIjpbIkdFTkVSQUwiXSwiZnVsbE5hbWUiOiJBZG1pbiBBZG1pbiIsImF2YXRhciI6bnVsbCwiZXhwIjoxNTcyMzEzOTEwLCJhdXRob3JpdGllcyI6WyJWSV9EQVNIQk9BUkQiLCJWSV9JVEVNUyIsIlZJX1dBUkVIT1VTRVMiLCJWSV9VU0VSUyIsIlZJX0ZPUktMSUZUIiwiVklfT1JERVJTIiwiVklfUFJJT1JJVFkiLCJST0xFX0FETUlOIl0sImp0aSI6IjBlZWM2MWUwLTM3YmYtNGIwOS05NGZiLWRjOWU4OTgzNWQ0MyIsImNsaWVudF9pZCI6IkFVVEhFTlRJQ0FUT1JfQVBJIn0.GP-hyaNBE0h3eQH_aAY3NoppzkVnh7cmrEXEphYoGb4_KO3ONxpDtyQ1qUTul3W-L0Pjaak7z9KWjmCdFfHPuzZOyfWwPMSMZlyDZwr9c6irxtmJVXluYotZTYtyX-nak1a0rYItcZS56aKTNbZJ0J5BFbNv4vZd7oYi5mADYG5DAOQ-XkOnchmZihMSrHxX0H3J8rN9g-y04qmJn2ITOVM-9RNEDaJXIesELI-RACu1ySK93CE75M5Y6MSe76z_ePVQzFqKQMNE3dQ5_-DFx0JSwmEVbIK3zPRT3YkwJMXKxgKz12A0GmuH3JrfQlVqS9Vvy6dabvxplq1spF4Pow","token_type":"bearer","refresh_token":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiQVBQX1JFU09VUkNFUyJdLCJ1c2VyU3RhdHVzIjoiQUNUSVZFIiwidXNlcl9uYW1lIjoiMyIsInNjb3BlIjpbIkdFTkVSQUwiXSwiYXRpIjoiMGVlYzYxZTAtMzdiZi00YjA5LTk0ZmItZGM5ZTg5ODM1ZDQzIiwiZnVsbE5hbWUiOiJBZG1pbiBBZG1pbiIsImF2YXRhciI6bnVsbCwiZXhwIjoxNTcyODc1NTEwLCJhdXRob3JpdGllcyI6WyJWSV9EQVNIQk9BUkQiLCJWSV9JVEVNUyIsIlZJX1dBUkVIT1VTRVMiLCJWSV9VU0VSUyIsIlZJX0ZPUktMSUZUIiwiVklfT1JERVJTIiwiVklfUFJJT1JJVFkiLCJST0xFX0FETUlOIl0sImp0aSI6IjZkNGRkYWQ0LTQxYzQtNDE3Yi04N2U3LTZmMGM1YTU4ZjVhYSIsImNsaWVudF9pZCI6IkFVVEhFTlRJQ0FUT1JfQVBJIn0.Pr7tUK46N-hBrnozlQhOS84FM3LpWiF3NTtniJmixplQ8NgnSdqhKAeDAdwYwG0S7T3AxvfZC4-bXa6LFNi-g0ugs5yUJwvdUldO5-RvzXds6ouqKhqTrEh2s6BegmnJswds0hVnXt2hadkZ--JIWl5Dpi4Uydv5c3C8n8u4tRwUopGAf7NpAH66d0Tu3v68fCCjIqTJ2JlL0SHKYxcj1E3VxtPBGXDY-PxeHbnhwGyFOZbj6gFKGVeIu4h_BxPs9mWoac1m8bdetzNZ30XqJcVetG5e68MwXZQovjyxjFSIAu2TvhCunDYuZcuqasMGgwsNIkTjLCgVvINDD5kjtA","expires_in":43199,"scope":"GENERAL","userStatus":"ACTIVE","fullName":"Admin Admin","avatar":null,"jti":"0eec61e0-37bf-4b09-94fb-dc9e89835d43"}'
    );

    this.saveCredential(cred);
  }

  public updateCredential(credential: Credential) {
    localStorage.setItem(
      'access_token' + this.securitySuffix,
      credential.access_token
    );
    localStorage.setItem(
      'refresh_token' + this.securitySuffix,
      credential.refresh_token
    );
    const decodedToken = this.helper.decodeToken(credential.access_token);
    const username = decodedToken.user_name;
    const fullName = decodedToken.fullName;
    const avatar = decodedToken.avatar;
    const authorities = decodedToken.authorities;

    this.updateUsername(username);
    this.updateFullName(fullName);
    this.updateUserStatus(credential.userStatus);
    this.updateAvatar(avatar);
    this.eventService.reconnect(
      this.getAccessToken(),
      this.getUsername(),
      this.getTopics()
    );
  }

  public resetUserPassword(mail: string): Promise<any> {
    const servicePath = this.appConfig.getApiUserUrl('/password/reset');
    return this.http
      .put(servicePath, {
        email: mail,
      })
      .toPromise();
  }

  public getUserEmail(): string {
    return localStorage.getItem('email' + this.securitySuffix);
  }

  public isUserApp(credential: Credential): boolean {
    const decodedToken = this.helper.decodeToken(credential.access_token);
    return decodedToken.isUserApp;
  }

  public isOperator() {
    return this.hasAnyPermissions([AppAuthorities.SRV_OPERATOR]);
  }

  public isAdministrative() {
    return this.hasAnyPermissions([AppAuthorities.SRV_ADMINISTRATIVE]);
  }

  public getBayerOwnerCode() {
    return 'BAY';
  }

  public getDmOwnerCode() {
    return 'DM';
  }

  public getFounderBusinessUnitCode() {
    return 'FOUNDER';
  }

  public getSeedBusinessUnitCode() {
    return 'SEEDS';
  }

  public getNotificationInternalType() {
    return 'NOTIFICATION_INTERNAL_TYPE';
  }

  public getNotificationUpdateType() {
    return 'NOTIFICATION_UPDATE_TYPE';
  }

  public getIncomeWorkOrderInProcessStatus() {
    return 'IN_PROCESS';
  }
}
