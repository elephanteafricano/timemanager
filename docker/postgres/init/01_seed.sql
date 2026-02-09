-- Seed initial users and teams on first DB initialization.
-- Uses pgcrypto to generate bcrypt hashes compatible with backend auth.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
    CREATE TYPE enum_users_role AS ENUM ('employee', 'manager');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(255),
  role enum_users_role NOT NULL DEFAULT 'employee',
  team_id INTEGER NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'users_team_id_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_team_id_fkey
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS clocks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id INTEGER NULL REFERENCES teams(id) ON DELETE SET NULL,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_record_rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT 'Default Schedule',
  team_id INTEGER NULL REFERENCES teams(id) ON DELETE SET NULL,
  work_start_time TIME NOT NULL DEFAULT '09:00',
  work_end_time TIME NOT NULL DEFAULT '17:00',
  start_grace_minutes INTEGER NOT NULL DEFAULT 15,
  end_grace_minutes INTEGER NOT NULL DEFAULT 15,
  standard_work_hours DECIMAL(4,2) NOT NULL DEFAULT 8,
  max_shift_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

WITH manager1 AS (
  INSERT INTO users (username, email, password_hash, first_name, last_name, phone_number, role, created_at, updated_at)
  VALUES ('manager1', 'manager1@example.com', crypt('manager1pass', gen_salt('bf', 10)), 'Alice', 'Johnson', '555-0001', 'manager'::enum_users_role, NOW(), NOW())
  RETURNING id
), manager2 AS (
  INSERT INTO users (username, email, password_hash, first_name, last_name, phone_number, role, created_at, updated_at)
  VALUES ('manager2', 'manager2@example.com', crypt('manager2pass', gen_salt('bf', 10)), 'Bob', 'Smith', '555-0002', 'manager'::enum_users_role, NOW(), NOW())
  RETURNING id
), team1 AS (
  INSERT INTO teams (name, description, manager_id, created_at, updated_at)
  SELECT 'Development Team', 'Frontend and Backend Development', manager1.id, NOW(), NOW()
  FROM manager1
  RETURNING id
), team2 AS (
  INSERT INTO teams (name, description, manager_id, created_at, updated_at)
  SELECT 'Design Team', 'UI/UX and Graphics Design', manager2.id, NOW(), NOW()
  FROM manager2
  RETURNING id
)
INSERT INTO users (username, email, password_hash, first_name, last_name, phone_number, role, team_id, created_at, updated_at)
SELECT 'employee1', 'employee1@example.com', crypt('employee1pass', gen_salt('bf', 10)), 'Charlie', 'Davis', '555-0101', 'employee'::enum_users_role, team1.id, NOW(), NOW()
FROM team1
UNION ALL
SELECT 'employee2', 'employee2@example.com', crypt('employee2pass', gen_salt('bf', 10)), 'Diana', 'Martinez', '555-0102', 'employee'::enum_users_role, team1.id, NOW(), NOW()
FROM team1
UNION ALL
SELECT 'employee3', 'employee3@example.com', crypt('employee3pass', gen_salt('bf', 10)), 'Ethan', 'Wilson', '555-0103', 'employee'::enum_users_role, team2.id, NOW(), NOW()
FROM team2
UNION ALL
SELECT 'employee4', 'employee4@example.com', crypt('employee4pass', gen_salt('bf', 10)), 'Fiona', 'Taylor', '555-0104', 'employee'::enum_users_role, team2.id, NOW(), NOW()
FROM team2;
