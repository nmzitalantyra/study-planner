const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/app');
const { db, pgp } = require('../src/db');
const argon2 = require('argon2');

chai.use(chaiHttp);
const { expect } = chai;

// Close the shared database pool after all tests finish.
after(() => {
  pgp.end();
});

describe('Welcome route', () => {
  it('returns the default welcome message', async () => {
    const res = await chai.request(app).get('/welcome');
    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal({
      status: 'success',
      message: 'Welcome!',
    });
  });
});

// Add your registration tests below.
describe('POST /register', () => {
  const {randomUUID} = require('node:crypto');
  const username = `lab10_${randomUUID().slice(0, 8)}`;
  const testUser = {
    username,
    email: `${username}@example.com`,
    password: 'TestPassword123!',
  };

  async function removeTestUser() {
    await db.none('DELETE FROM users WHERE username = $1', [testUser.username]);
  }

  beforeEach(removeTestUser);
  afterEach(removeTestUser);

  it('creates exactly one user for valid input', async () => {
    // Act: submit the request through the actual registration route.
    const res = await chai.request(app).post('/register').send(testUser);

    // Assert: verify both the response and the saved record.
    expect(res).to.have.status(201);
    expect(res.body.message).to.equal('Registration successful');

    const rows = await db.any(
      'SELECT username, password_hash FROM users WHERE username = $1',
      [testUser.username]
    );
    expect(rows).to.have.lengthOf(1);
    expect(rows[0].username).to.equal(testUser.username);
    expect(rows[0].password_hash).not.to.equal(testUser.password);
    expect(await argon2.verify(rows[0].password_hash, testUser.password)).to.equal(
      true
    );
  });

  it('rejects a registration with no password and saves nothing', async () => {
    // Act: submit the same username without a password.
    const { password, ...noPassword } = testUser;
    const res = await chai.request(app).post('/register').send(noPassword);

    // Assert: the documented rejection response and zero matching database rows.
    expect(res).to.have.status(400);
    expect(res.body.message).to.equal('Invalid input');

    const rows = await db.any('SELECT 1 FROM users WHERE username = $1', [
      testUser.username,
    ]);
    expect(rows).to.have.lengthOf(0);
  });
});