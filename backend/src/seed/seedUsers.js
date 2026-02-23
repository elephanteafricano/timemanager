const bcrypt = require('bcrypt');
const { User } = require('../models');
const { USER_ROLES } = require('../config/roles');
const logger = require('../utils/logger');

const DEFAULT_SEED_USERS = [
  {
    username: 'manager1',
    email: 'manager1@example.com',
    password: 'manager1pass',
    first_name: 'Alice',
    last_name: 'Johnson',
    phone_number: '555-0001',
    role: USER_ROLES.MANAGER,
  },
  {
    username: 'manager2',
    email: 'manager2@example.com',
    password: 'manager2pass',
    first_name: 'Bob',
    last_name: 'Smith',
    phone_number: '555-0002',
    role: USER_ROLES.MANAGER,
  },
  {
    username: 'employee1',
    email: 'employee1@example.com',
    password: 'employee1pass',
    first_name: 'Charlie',
    last_name: 'Davis',
    phone_number: '555-0101',
    role: USER_ROLES.EMPLOYEE,
  },
  {
    username: 'employee2',
    email: 'employee2@example.com',
    password: 'employee2pass',
    first_name: 'Diana',
    last_name: 'Martinez',
    phone_number: '555-0102',
    role: USER_ROLES.EMPLOYEE,
  },
  {
    username: 'employee3',
    email: 'employee3@example.com',
    password: 'employee3pass',
    first_name: 'Ethan',
    last_name: 'Wilson',
    phone_number: '555-0103',
    role: USER_ROLES.EMPLOYEE,
  },
  {
    username: 'employee4',
    email: 'employee4@example.com',
    password: 'employee4pass',
    first_name: 'Fiona',
    last_name: 'Taylor',
    phone_number: '555-0104',
    role: USER_ROLES.EMPLOYEE,
  },
];

async function seedDefaultUsers() {
  if (process.env.NODE_ENV === 'test' || process.env.SEED_DEFAULT_USERS !== 'true') {
    return;
  }

  let createdCount = 0;

  for (const candidate of DEFAULT_SEED_USERS) {
    const existingUser = await User.findOne({ where: { email: candidate.email } });
    if (existingUser) {
      continue;
    }

    const password_hash = await bcrypt.hash(candidate.password, 10);
    await User.create({
      username: candidate.username,
      email: candidate.email,
      password_hash,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      phone_number: candidate.phone_number,
      role: candidate.role,
    });
    createdCount += 1;
  }

  logger.info({ createdCount }, 'Default users seed completed');
}

module.exports = { seedDefaultUsers };
