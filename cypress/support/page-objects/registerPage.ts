// cypress/support/page-objects/RegisterPage.ts

import type { ApiUser } from '../commands/user-commands';
import { BasePage, ElementChain } from './basePage';

export class RegisterPage extends BasePage {
  protected readonly path = '/register';

  get usernameInput(): ElementChain {
    return cy.get('input[name="username"]');
  }

  get emailInput(): ElementChain {
    return cy.get('input[name="email"]');
  }

  get passwordInput(): ElementChain {
    return cy.get('input[name="password"]');
  }

  get submitButton(): ElementChain {
    return cy.get('button[type="submit"]');
  }
  
  get loginLink(): ElementChain {
    return cy.get('a[href="/login"]');
  }

  typeUsername(username: string): this {
    this.usernameInput.type(username);
    return this;
  }

  typeEmail(email: string): this {
    this.emailInput.type(email);
    return this;
  }

  typePassword(password: string): this {
    this.passwordInput.type(password, { parseSpecialCharSequences: false });
    return this;
  }

  submit(): void {
    this.submitButton.click();
  }

  register(user: ApiUser): void {
    this.typeUsername(user.username).typeEmail(user.email).typePassword(user.password).submit();
  }
}