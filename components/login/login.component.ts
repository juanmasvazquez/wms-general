import { Component, OnInit, Renderer2, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { AuthService, USER_STATUS_RESET } from '../../services/auth.service';
import {
  trigger,
  transition,
  animate,
  keyframes,
  style,
} from '@angular/animations';
import { environment } from '../../../../environments/environment';
import { NavigationService } from '../../../wms-config/services/navigation.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';

@Component({
  selector: 'app-login',
  animations: [
    trigger('header', [
      transition(':enter', [
        animate(
          '1.5s ease-in',
          keyframes([
            style({ opacity: 0, transform: 'translateY(-15%)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(0)', offset: 1 }),
          ])
        ),
      ]),
    ]),
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  public bsModalRef: BsModalRef;

  public loginForm = this.formBuilder.group({
    username: '',
    password: '',
  });

  public suffix = '';
  public appVersion = '';
  public errorMsg = '';
  public isProcessing = false;
  public validationErrors = [];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private navigationService: NavigationService,
    private modalService: BsModalService,
    private renderer: Renderer2
  ) {
    this.renderer.addClass(document.body, 'align-items-center');
    this.renderer.addClass(document.body, 'bg-auth');
    this.renderer.addClass(document.body, 'border-top');
    this.renderer.addClass(document.body, 'border-top-3');
    this.renderer.addClass(document.body, 'border-primary');
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.navigationService.navigateToHome();
    }
    this.appVersion =
      environment.appVersion + '   [' + environment.envName + ']';

    this.loginForm.controls.username.valueChanges.subscribe((value) => {
      if (value) {
        const parsedValue = ('' + value).toLowerCase();
        this.loginForm.controls.username.setValue(parsedValue, {
          emitEvent: false,
        });
      }
    });
  }

  public login() {
    if (this.isProcessing) return false;

    const username = this.loginForm.controls.username.value;
    const password = this.loginForm.controls.password.value;

    this.errorMsg = '';
    this.authService
      .login(username, password)
      .then((credential) => {
        if (this.authService.isUserApp(credential)) {
          this.authService.saveCredential(credential);
          this.isProcessing = false;
          this.navigationService.navigateToHome();
        } else {
          this.errorMsg = 'Usuario no autorizado';
          this.isProcessing = false;
        }
      })
      .catch((errorDetail) => {
        if (errorDetail.error && errorDetail.error.error_description) {
          this.errorMsg = errorDetail.error.error_description;
        }
        this.isProcessing = false;
      });
  }

  public openResetPasswordModal() {
    this.bsModalRef = this.modalService.show(ResetPasswordComponent);
    this.bsModalRef.content.bsModalRef = this.bsModalRef;
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'align-items-center');
    this.renderer.removeClass(document.body, 'bg-auth');
    this.renderer.removeClass(document.body, 'border-top');
    this.renderer.removeClass(document.body, 'border-top-3');
    this.renderer.removeClass(document.body, 'border-primary');
  }
}
