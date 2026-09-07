import users from '../../fixtures/users.json';

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
      expect(response.status).to.eq(200);
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
      expect(response.status).to.eq(403);
      expect(response.body.errors).to.include('Email address taken');
    });
  });

  it('returns 422 when email is not a valid format', () => {
    cy.apiRegister({
      username: `newUserName-${Date.now()}`,
      email: 'invalid-email-format',
      password: 'NewPassword123!',
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

  (['username', 'email', 'password'] as const).forEach((missingField) => {
    it(`returns 422 when ${missingField} is missing`, () => {
      const user = randomUser();
      delete (user as Partial<typeof user>)[missingField];
      cy.apiRegister(user as any).then((response) => {
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
