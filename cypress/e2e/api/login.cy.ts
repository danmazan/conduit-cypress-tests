import users from '../../fixtures/users.json';
import { ApiLoginCredentials } from '../../support/commands/user-commands';

describe('Login - API', () => {
  it('logs in with username', () => {
    cy.apiLogin({
      email: users.poolUser1.username,
      password: users.poolUser1.password,
    }).then((response) => {
      cy.log('Response body:', JSON.stringify(response.body));
      expect(response.status).to.eq(422);
    });
  });
  it('logs in successfully with valid credentials', () => {
    cy.apiLogin({
      email: users.poolUser1.email,
      password: users.poolUser1.password,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.user).to.include({
        email: users.poolUser1.email,
        username: users.poolUser1.username,
      });
      expect(response.body.user).to.have.property('token').and.to.be.a('string');
    });
  });

  it('returns 401 when the password is incorrect', () => {
    cy.apiLogin({
      email: users.poolUser1.email,
      password: 'WrongPassword123!',
    }).then((response) => {
      cy.log('Response body:', JSON.stringify(response.body));
      expect(response.status).to.eq(401);
      expect(response.body.errors).to.include('Incorrect email address or password');
    });
  });

  it('returns 401 when the email is not registered', () => {
    cy.apiLogin({
      email: 'unregistered@example.com',
      password: 'AnyPassword123!',
    }).then((response) => {
      cy.log('Response body:', JSON.stringify(response.body));
      expect(response.status).to.eq(401);
      expect(response.body.errors).to.include('Incorrect email address or password');
    });
  });

  it('returns 422 when the email format is invalid', () => {
    cy.apiLogin({
      email: 'invalid-email-format',
      password: 'AnyPassword123!',
    }).then((response) => {
      expect(response.status).to.eq(422);
      const bodyErrors = response.body.errors?.body ?? [];
      expect(bodyErrors, 'validation errors array').to.be.an('array').that.is.not.empty;
      expect(
        bodyErrors.some((e: { dataPath?: string }) => e.dataPath?.includes('email')),
        'a validation error referencing the email field'
      ).to.be.true;
    });
  });

  (['email', 'password'] as const).forEach((missingField) => {
    it(`returns 422 when ${missingField} is missing`, () => {
      const credentials: Partial<ApiLoginCredentials> = {
        email: users.poolUser1.email,
        password: users.poolUser1.password,
      };
      delete credentials[missingField];

      cy.apiLogin(credentials as ApiLoginCredentials).then((response) => {
        expect(response.status).to.eq(422);
        const bodyErrors = response.body.errors?.body ?? [];
        expect(bodyErrors, 'validation errors array').to.be.an('array').that.is.not.empty;

        const matchingError = bodyErrors.find(
          (error) => error.params?.missingProperty === missingField
        );

        expect(matchingError, `validation error for missing ${missingField}`).to.exist;
        expect(matchingError?.message).to.eq(`should have required property '${missingField}'`);
      });
    });
  });
});
