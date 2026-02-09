require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize } = require('../src/config/database');
const { User, Team } = require('../src/models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Create Manager 1
    const manager1 = await User.create({
      username: 'manager1',
      email: 'manager1@example.com',
      password_hash: await bcrypt.hash('manager1pass', 10),
      first_name: 'Alice',
      last_name: 'Johnson',
      phone_number: '555-0001',
      role: 'manager'
    });
    console.log('Created Manager 1: Alice Johnson');

    // Create Manager 2
    const manager2 = await User.create({
      username: 'manager2',
      email: 'manager2@example.com',
      password_hash: await bcrypt.hash('manager2pass', 10),
      first_name: 'Bob',
      last_name: 'Smith',
      phone_number: '555-0002',
      role: 'manager'
    });
    console.log('Created Manager 2: Bob Smith');

    // Create Team 1 (Manager 1's team)
    const team1 = await Team.create({
      name: 'Development Team',
      description: 'Frontend and Backend Development',
      manager_id: manager1.id
    });
    console.log(` Created Team 1: ${team1.name} (Manager: ${manager1.first_name})`);

    // Create Team 2 (Manager 2's team)
    const team2 = await Team.create({
      name: 'Design Team',
      description: 'UI/UX and Graphics Design',
      manager_id: manager2.id
    });
    console.log(` Created Team 2: ${team2.name} (Manager: ${manager2.first_name})`);

    // Create Employee 1 (Team 1)
    const employee1 = await User.create({
      username: 'employee1',
      email: 'employee1@example.com',
      password_hash: await bcrypt.hash('employee1pass', 10),
      first_name: 'Charlie',
      last_name: 'Davis',
      phone_number: '555-0101',
      role: 'employee',
      team_id: team1.id
    });
    console.log(` Created Employee 1: ${employee1.first_name} ${employee1.last_name} (Team: ${team1.name})`);

    // Create Employee 2 (Team 1)
    const employee2 = await User.create({
      username: 'employee2',
      email: 'employee2@example.com',
      password_hash: await bcrypt.hash('employee2pass', 10),
      first_name: 'Diana',
      last_name: 'Martinez',
      phone_number: '555-0102',
      role: 'employee',
      team_id: team1.id
    });
    console.log(` Created Employee 2: ${employee2.first_name} ${employee2.last_name} (Team: ${team1.name})`);

    // Create Employee 3 (Team 2)
    const employee3 = await User.create({
      username: 'employee3',
      email: 'employee3@example.com',
      password_hash: await bcrypt.hash('employee3pass', 10),
      first_name: 'Ethan',
      last_name: 'Wilson',
      phone_number: '555-0103',
      role: 'employee',
      team_id: team2.id
    });
    console.log(` Created Employee 3: ${employee3.first_name} ${employee3.last_name} (Team: ${team2.name})`);

    // Create Employee 4 (Team 2)
    const employee4 = await User.create({
      username: 'employee4',
      email: 'employee4@example.com',
      password_hash: await bcrypt.hash('employee4pass', 10),
      first_name: 'Fiona',
      last_name: 'Taylor',
      phone_number: '555-0104',
      role: 'employee',
      team_id: team2.id
    });
    console.log(` Created Employee 4: ${employee4.first_name} ${employee4.last_name} (Team: ${team2.name})`);

    console.log('\nDatabase seeded successfully!');
    console.log('\nSummary:');
    console.log(`   - 2 Managers: ${manager1.username}, ${manager2.username}`);
    console.log(`   - 4 Employees: employee1, employee2, employee3, employee4`);
    console.log(`   - 2 Teams: "${team1.name}", "${team2.name}"`);
    console.log('\nPasswords:');
    console.log('   - manager1: manager1pass');
    console.log('   - manager2: manager2pass');
    console.log('   - employee1: employee1pass');
    console.log('   - employee2: employee2pass');
    console.log('   - employee3: employee3pass');
    console.log('   - employee4: employee4pass');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
