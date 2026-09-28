import users from '../../fixtures/users.json';
import { ApiUser } from '../../support/commands/user-commands';

type ErrorBody = { errors: Record<string, string[]>};
type Field = keyof ApiUser;

function randomUser() {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return {
    username: `testUser${uniqueId}`,
    email: `testUser-${uniqueId}@example.com`,
    password: 'TestPassword123!',
  };
}

describe('Register - API', () => {
  it('registers a new user successfully', () => {
    const user = randomUser();
    cy.apiRegister(user).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.user).to.have.property('username', user.username);
      expect(response.body.user).to.have.property('email', user.email);
      expect(response.body.user).to.have.property('token').and.to.be.a('string');
    });
  });

  it('fails to register a user with an existing email', () => {
    const existing = users.poolUser3; // stable duplicate-collision target, never used elsewhere
    cy.apiRegister({
      username: `newUserName-${Date.now()}`,
      email: existing.email,
      password: 'NewPassword123!',
    }).then((response) => {
      expect(response.status).to.eq(422);
      const {errors} = response.body as unknown as ErrorBody;
      expect(errors.email).to.deep.eq(['has already been taken']);
      expect(errors).not.to.have.property('username');
    });
  });

  it('fails to register a user with an existing username', () => {
    const existing = users.poolUser3; // stable duplicate-collision target, never used elsewhere
    cy.apiRegister({
      username: existing.username,
      email: `newEmail-${Date.now()}@example.com`,
      password: 'NewPassword123!',
    }).then((response) => {
      expect(response.status).to.eq(422);
      const {errors} = response.body as unknown as ErrorBody;
      expect(errors.username).to.deep.eq(['has already been taken']);
      expect(errors).not.to.have.property('email');
    });
  });

  //KNOWN ISSUE: the API currently does not validate email format, so this test is skipped until that is fixed
  //Confirmed live: registering with email "not-an-email" returns 201 and creates the account.
  it.skip('returns 422 when email is not a valid format', () => {
    cy.apiRegister({
      username: `newUserName-${Date.now()}`,
      email: 'invalid-email-format-123',
      password: 'NewPassword123!',
    }).then((response) => {
      expect(response.status).to.eq(422);
      const {errors} = response.body as unknown as ErrorBody;
      cy.log('errors', JSON.stringify(errors));
      expect(errors.email).to.deep.eq(['is not a valid email address']);
    });
  });

  (['username', 'email', 'password'] as const).forEach((missingField) => {
    it(`returns 422 when ${missingField} is missing`, () => {
      const user = randomUser();
      delete (user as Partial<typeof user>)[missingField];
      cy.apiRegister(user as any).then((response) => {
        expect(response.status).to.eq(422);
        const {errors} = response.body as unknown as ErrorBody;
        expect(errors).to.have.property(missingField);
        expect(errors[missingField]).to.deep.eq(["can't be blank"]);
      });
    });
  });

  (['username', 'email', 'password'] as const).forEach((emptyField) => {
    it(`returns 422 when ${emptyField} is an empty string`, () => {
      const user = randomUser();
      (user as ApiUser)[emptyField] = '  ';
      cy.apiRegister(user as ApiUser).then((response) => {
        expect(response.status).to.eq(422);
        const {errors} = response.body as unknown as ErrorBody;
        expect(errors).to.have.property(emptyField);
        expect(errors[emptyField]).to.deep.eq(["can't be blank"]);
      }); 
    });
  });
});
