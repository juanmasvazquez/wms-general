import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { ProfileService } from '../../../services/profile.service';
import { AppModalService } from '../../../../modules/shared/services/app-modal.service';
import { AppErrorHandlerService } from '../../../../modules/commons/services/app-error-handler.service';
import { AuthService } from '../../../services/auth.service';
import { Profile } from '../../../model/profile';
import { UserNotification } from '../../../model/user-notification';
import { UserApplication } from '../../../model/user-application';
import { UpdateProfile } from '../../../model/update-profile';

@Component({
  selector: 'general-profile',
  templateUrl: './general-profile.component.html',
  styleUrls: ['./general-profile.component.scss'],
})
export class GeneralProfileComponent implements OnInit {
  public isProcessing = false;
  public profile: Profile;
  public generalProfileForm: FormGroup;
  public suffix = '';
  public isLoading = false;
  public initials: string = '';

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private modalService: AppModalService,
    private appModalService: AppModalService,
    private appErrorHandlerService: AppErrorHandlerService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.buildProfileForm();
    this.getUserProfile();
    this.initials = this.authService.getInitials();
  }

  private buildProfileForm() {
    this.generalProfileForm = this.fb.group({
      username: '',
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      docNumber: ['', Validators.required],
      email: ['', [Validators.required]],
    });
  }

  private getUserProfile() {
    this.profileService
      .getProfile()
      .then((res) => {
        this.setUserProfileInformation(res);
        this.isLoading = false;
      })
      .catch((error) => {
        this.isLoading = false;
      });
  }

  private setUserProfileInformation(profile: Profile) {
    this.username.setValue(profile.username);
    this.name.setValue(profile.firstName);
    this.lastname.setValue(profile.lastName);
    this.docNumber.setValue(profile.documentNumber);
    this.email.setValue(profile.email);
  }

  public saveGeneral() {
    if (this.isValidForm()) {
      this.modalService
        .showModalConfirmInfo('¿Desea modificar el perfil?')
        .then((result) => {
          if (result) {
            const userNotifications: UserNotification[] = [];
            const userApplication: UserApplication = {
              key: '',
              roles: [],
              userNotifications: userNotifications,
            };
            const userProfile: UpdateProfile = {
              firstName: this.name.value,
              lastName: this.lastname.value,
              documentNumber: this.docNumber.value,
              email: this.email.value,
              userApplication: userApplication,
            };
            this.profileService.updateProfile(userProfile).then(
              (_) => {
                this.modalService.showSuccessToast(
                  'Los datos se actualizaron correctamente'
                );
              },
              (error) => {
                if (this.appErrorHandlerService.isDuplicatedError(error)) {
                  this.appModalService.showErrorToast(error.error);
                } else {
                  this.appModalService.showErrorToast(
                    'Error al guardar Usuario'
                  );
                }
              }
            );
          }
        });
    }
  }

  public hasToDisplayError(control: FormControl) {
    if (undefined !== control) {
      return control.invalid && (control.dirty || control.touched);
    }
  }

  public isValidForm() {
    return this.generalProfileForm.valid;
  }

  public get username() {
    return this.generalProfileForm.get('username') as FormControl;
  }

  public get name(): FormControl {
    return this.generalProfileForm.get('name') as FormControl;
  }

  public get lastname(): FormControl {
    return this.generalProfileForm.get('lastname') as FormControl;
  }

  public get docNumber(): FormControl {
    return this.generalProfileForm.get('docNumber') as FormControl;
  }

  public get email(): FormControl {
    return this.generalProfileForm.get('email') as FormControl;
  }
}
