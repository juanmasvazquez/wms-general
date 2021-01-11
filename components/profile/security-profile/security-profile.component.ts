import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
  AbstractControl,
} from '@angular/forms';
import { AppModalService } from '../../../../wms-fe-modules/shared/services/app-modal.service';
import { ProfileService } from '../../../services/profile.service';
import { AuthService } from '../../../services/auth.service';
import { PasswordReset } from '../../../model/password-reset';

function passwordValidator(formControl: AbstractControl) {
  if (!formControl.parent) return null;

  const currentPassword = formControl.parent.get('currentPassword');
  const confirmedCurrentPassword = formControl.parent.get(
    'confirmedCurrentPassword'
  );

  return currentPassword &&
    confirmedCurrentPassword &&
    currentPassword.value !== confirmedCurrentPassword.value
    ? { invalidPassword: true }
    : null;
}

function passwordComposition(formControl: AbstractControl) {
  if (!formControl.parent) return null;

  const spCharRegExp = new RegExp(/(?=.*[!@#\$%\^&\*])/);
  const numbersRegEp = new RegExp(/^[\w!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/);

  const currentPassword = formControl.parent.get('currentPassword');

  if (!spCharRegExp.test(currentPassword.value)) {
    return { noSpecialCharacter: true };
  }

  if (!numbersRegEp.test(currentPassword.value)) {
    return { noNumbers: true };
  }

  return null;
}

@Component({
  selector: 'security-profile',
  templateUrl: './security-profile.component.html',
  styleUrls: ['./security-profile.component.scss'],
})
export class SecurityProfileComponent implements OnInit {
  public securityProfileForm: FormGroup;
  public username = '';
  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private modalService: AppModalService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.buildSecurityForm();
  }

  private buildSecurityForm() {
    this.securityProfileForm = this.fb.group({
      currentPassword: [
        '',
        [Validators.required, Validators.minLength(8), passwordComposition],
      ],
      confirmedCurrentPassword: ['', [Validators.required, passwordValidator]],
    });
  }

  public updatePassword() {
    if (this.isValidForm()) {
      this.modalService
        .showModalConfirmInfo('¿Desea actualizar la contraseña?')
        .then((result) => {
          if (result) {
            const username = this.authService.getUsername();
            const passwordReset: PasswordReset = {
              password: this.currentPassword.value,
              email: this.authService.getUsername(),
            };
            this.profileService.updatePassword(passwordReset).then(
              (_) => {
                this.cleanPasswordFields();
                this.modalService.showSuccessToast(
                  'Se ha modificado la contraseña con exito'
                );
              },
              (error) => {
                this.modalService.showErrorToast(
                  'Ha ocurrido un error al modificar contraseña'
                );
              }
            );
          }
        });
    }
  }

  public forgotPassword() {
    this.modalService
      .showModalConfirmInfo('Se enviara un mail a la casilla')
      .then((result) => {
        if (result) {
          this.profileService.forgotPassword().then((_) => {
            this.modalService.showSuccessToast(
              'Se ha enviado un mail a su casilla'
            );
          });
        }
      });
  }

  private cleanPasswordFields() {
    this.currentPassword.setValue('');
    this.confirmedCurrentPassword.setValue('');

    this.currentPassword.markAsPristine();
    this.confirmedCurrentPassword.markAsPristine();

    this.currentPassword.markAsUntouched();
    this.confirmedCurrentPassword.markAsUntouched();
  }

  public hasToDisplayError(control: FormControl) {
    if (undefined !== control) {
      return control.invalid && (control.dirty || control.touched);
    }
  }

  public isValidForm() {
    return this.securityProfileForm.valid;
  }

  public get currentPassword(): FormControl {
    return this.securityProfileForm.get('currentPassword') as FormControl;
  }

  public get confirmedCurrentPassword(): FormControl {
    return this.securityProfileForm.get(
      'confirmedCurrentPassword'
    ) as FormControl;
  }
}
