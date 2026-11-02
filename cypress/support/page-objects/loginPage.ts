
import { BasePage, ElementChain } from './basePage';
 
export class LoginPage extends BasePage {
  protected readonly path = '/login';
 
  get emailInput(): ElementChain {
    return cy.get('input[name="email"]');
  }
 
  get passwordInput(): ElementChain {
    return cy.get('input[name="password"]');
  }
 
  get submitButton(): ElementChain {
    return cy.get('button[type="submit"]');
  }

  get registerLink(): ElementChain {
    return cy.get('a[href="/register"]');
  }
 
  typeEmail(email: string): this {
    this.emailInput.type(email);
    return this;
  }
 
  typePassword(password: string): this {
    // parseSpecialCharSequences: false so a password containing "{" is typed literally
    this.passwordInput.type(password, { parseSpecialCharSequences: false });
    return this;
  }
 
  submit(): void {
    this.submitButton.click();
  }
 
  login(email: string, password: string): void {
    this.typeEmail(email).typePassword(password).submit();
  }
}