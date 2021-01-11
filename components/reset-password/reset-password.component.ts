import { Component, OnInit, Renderer2, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { AppModalService } from '../../../modules/wms-shared/services/app-modal.service';
import { AuthService } from '../../services/auth.service';
import { BsModalRef } from 'ngx-bootstrap';
import { ErrorResponse } from '../../../modules/commons/model/error-response';
import { AppErrorHandlerService } from '../../../modules/commons/services/app-error-handler.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  public bsModalRef: BsModalRef;
  public validationErrors = [];
  public suffix = '';
  public resetPasswordForm = this.formBuilder.group({
    mail: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
    private showModalService: AppModalService,
    private authService: AuthService,
    private errorHandlerService: AppErrorHandlerService,
    private renderer: Renderer2,
    private router: Router
  ) {
    this.renderer.addClass(document.body, 'd-flex');
    this.renderer.addClass(document.body, 'align-items-center');
    this.renderer.addClass(document.body, 'bg-auth');
    this.renderer.addClass(document.body, 'border-top');
    this.renderer.addClass(document.body, 'border-top-3');
    this.renderer.addClass(document.body, 'border-primary');
  }

  ngOnInit() {}

  public resetUserPassword() {
    const mail = this.mail.value;
    if (this.isValidForm()) {
      this.authService
        .resetUserPassword(mail)
        .then((_) => {
          this.showModalService.showSuccessToast(
            'Se ha enviado un mail a la casilla'
          );
          this.router.navigate(['login']);
        })
        .catch((error) => {
          const detailError = error as ErrorResponse;
          if (this.errorHandlerService.isValidationError(error)) {
            this.validationErrors = this.errorHandlerService.getErrors(
              detailError.validation.validations,
              detailError.validation.globalValidations
            );
          } else if (this.errorHandlerService.isNotFoundError(error)) {
            this.validationErrors = this.errorHandlerService.createError(
              'El Email ingresado no se encuentra registrado'
            );
          } else
            this.showModalService.showErrorToast(
              'Ha ocurrido un error al intentar restaurar!'
            );
        });
    }
  }

  public hasToDisplayError(control: AbstractControl) {
    return control.invalid && (control.dirty || control.touched);
  }

  public isValidForm() {
    return this.resetPasswordForm.valid;
  }

  get mail() {
    return this.resetPasswordForm.get('mail');
  }

  public cleanForm() {
    this.bsModalRef.hide();
    this.resetPasswordForm.reset();
    this.validationErrors = null;
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'd-flex');
    this.renderer.removeClass(document.body, 'align-items-center');
    this.renderer.removeClass(document.body, 'bg-auth');
    this.renderer.removeClass(document.body, 'border-top');
    this.renderer.removeClass(document.body, 'border-top-3');
    this.renderer.removeClass(document.body, 'border-primary');
  }
}
