import users from '../../fixtures/users.json';
import { ApiLoginCredentials, ApiUser } from '../../support/commands/user-commands';

type ErrorBody = { errors: Record<string, string[]>};
type Field = keyof ApiUser;

describe('Login - API', () => {
  it('logs in with username', () => {
    cy.apiLogin({
      email: users.poolUser1.username,
      password: users.poolUser1.password,
    }).then((response) => {
      expect(response.status).to.eq(403);
      const {errors} = response.body as unknown as ErrorBody;
      expect(errors['email or password']).to.deep.eq(['is invalid']);
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
      expect(response.status).to.eq(403);
      const {errors} = response.body as unknown as ErrorBody;
      expect(errors['email or password']).to.deep.eq(['is invalid']);
    });
  });

  it('returns 401 when the email is not registered', () => {
    cy.apiLogin({
      email: 'unregistered@example.com',
      password: 'AnyPassword123!',
    }).then((response) => {
      expect(response.status).to.eq(403);
      const {errors} = response.body as unknown as ErrorBody;
      expect(errors['email or password']).to.deep.eq(['is invalid']);
    });
  });

  it('returns 422 when the email format is invalid', () => {
    cy.apiLogin({
      email: 'invalid-email-format',
      password: 'AnyPassword123!',
    }).then((response) => {
      expect(response.status).to.eq(403);
      const {errors} = response.body as unknown as ErrorBody;
      expect(errors['email or password']).to.deep.eq(['is invalid']);
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
        const {errors} = response.body as unknown as ErrorBody;
        expect(errors).to.have.property(missingField);
        expect(errors[missingField]).to.deep.eq(["can't be blank"]);
      });
    });
  });
});
